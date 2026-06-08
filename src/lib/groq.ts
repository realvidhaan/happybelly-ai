import "server-only";
import Groq from "groq-sdk";
import type { Correction, ParsedItem, ParseResponse } from "./types";
import { correctionsToPromptLines } from "./corrections";

const TEXT_MODEL = process.env.GROQ_TEXT_MODEL || "llama-3.3-70b-versatile";
const VISION_MODEL =
  process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

let _client: Groq | null = null;
function client(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _client;
}

const BASE_RULES = `You are HappyBelly AI, a meticulous nutrition estimation engine.
Break the described meal into INDIVIDUAL food items. For each item, estimate a
realistic portion weight in grams and its macros using standard nutrition data.

Rules:
- Respond with a SINGLE JSON object. No prose, no markdown, no code fences.
- Shape: {"mealTitle": string, "items": [{"name": string, "grams": number, "calories": number, "protein": number, "carbs": number, "fats": number, "confidence": number}]}
- All nutrient values are NUMBERS only (no units, no ranges). calories in kcal; protein/carbs/fats in grams; confidence between 0 and 1.
- Split combos into parts (e.g. "chicken sandwich" → bread, chicken, condiments) when reasonable.
- If a quantity is unspecified, assume ONE typical serving and reflect lower confidence.
- Keep "mealTitle" short and human (e.g. "Breakfast", "Post-workout snack").
- Macros should roughly reconcile with calories (4/4/9 kcal per g of protein/carb/fat).`;

function withCorrections(corrections: Correction[] | undefined): string {
  if (!corrections || corrections.length === 0) return BASE_RULES;
  const lines = correctionsToPromptLines(corrections);
  if (!lines) return BASE_RULES;
  return `${BASE_RULES}

LEARNED USER PREFERENCES (apply these — they reflect how THIS user eats and which brands they buy):
${lines}`;
}

// Robustly pull a JSON object out of a model response, tolerating code fences or
// stray text in case a model ignores JSON mode.
function extractJson(content: string): any {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      /* fall through */
    }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error("Model did not return valid JSON.");
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeItems(raw: any): ParsedItem[] {
  const arr: any[] = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw)
      ? raw
      : [];
  return arr
    .map((it) => ({
      name: String(it?.name ?? "Food item").slice(0, 80),
      grams: Math.max(0, num(it?.grams)),
      calories: Math.max(0, Math.round(num(it?.calories))),
      protein: Math.max(0, num(it?.protein)),
      carbs: Math.max(0, num(it?.carbs)),
      fats: Math.max(0, num(it?.fats)),
      confidence: Math.min(1, Math.max(0, num(it?.confidence, 0.6))),
    }))
    .filter((it) => it.name && (it.calories > 0 || it.grams > 0));
}

export async function analyzeText(
  description: string,
  corrections?: Correction[]
): Promise<ParseResponse> {
  const completion = await client().chat.completions.create({
    model: TEXT_MODEL,
    temperature: 0.3,
    max_tokens: 1500,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: withCorrections(corrections) },
      {
        role: "user",
        content: `Estimate the nutrition for this meal and return JSON:\n\n"${description}"`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const parsed = extractJson(content);
  return {
    mealTitle: String(parsed?.mealTitle || "Logged meal").slice(0, 60),
    items: normalizeItems(parsed),
    model: TEXT_MODEL,
  };
}

export async function analyzeImage(
  imageDataUrl: string,
  note?: string,
  corrections?: Correction[]
): Promise<ParseResponse> {
  const userText =
    `Identify every food in this photo. Estimate each item's serving size/volume ` +
    `visually, then its weight in grams and macros. Return JSON only.` +
    (note ? `\n\nUser note: ${note}` : "");

  // Some vision models reject response_format; try JSON mode first, then retry plain.
  const baseArgs = {
    model: VISION_MODEL,
    temperature: 0.3,
    max_tokens: 1500,
    messages: [
      { role: "system" as const, content: withCorrections(corrections) },
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: userText },
          { type: "image_url" as const, image_url: { url: imageDataUrl } },
        ],
      },
    ],
  };

  let content = "";
  try {
    const completion = await client().chat.completions.create({
      ...baseArgs,
      response_format: { type: "json_object" },
    } as any);
    content = completion.choices[0]?.message?.content ?? "";
  } catch {
    const completion = await client().chat.completions.create(baseArgs as any);
    content = completion.choices[0]?.message?.content ?? "";
  }

  const parsed = extractJson(content);
  return {
    mealTitle: String(parsed?.mealTitle || "Photo meal").slice(0, 60),
    items: normalizeItems(parsed),
    model: VISION_MODEL,
  };
}
