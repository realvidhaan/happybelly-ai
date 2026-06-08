import { NextResponse } from "next/server";
import { analyzeText } from "@/lib/groq";
import type { Correction } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const description: string = (body?.text ?? "").toString().trim();
    const corrections: Correction[] = Array.isArray(body?.corrections)
      ? body.corrections
      : [];

    if (!description) {
      return NextResponse.json(
        { error: "Please describe what you ate." },
        { status: 400 }
      );
    }
    if (description.length > 2000) {
      return NextResponse.json(
        { error: "That description is too long (2000 char max)." },
        { status: 400 }
      );
    }

    const result = await analyzeText(description, corrections);

    if (result.items.length === 0) {
      return NextResponse.json(
        { error: "Couldn't identify any foods. Try being more specific." },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    const msg = err?.message || "Failed to analyze meal.";
    const status = /GROQ_API_KEY/.test(msg) ? 500 : 502;
    console.error("[log-text]", msg);
    return NextResponse.json({ error: msg }, { status });
  }
}
