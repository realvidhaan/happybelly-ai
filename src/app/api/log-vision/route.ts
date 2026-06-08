import { NextResponse } from "next/server";
import { analyzeImage } from "@/lib/groq";
import type { Correction } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accepts a base64 data URL so the client can capture/upload without multipart.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const image: string = (body?.image ?? "").toString();
    const note: string = (body?.note ?? "").toString().slice(0, 500);
    const corrections: Correction[] = Array.isArray(body?.corrections)
      ? body.corrections
      : [];

    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Expected an image data URL (data:image/...;base64,...)." },
        { status: 400 }
      );
    }
    // ~8MB base64 ceiling to stay within serverless body limits.
    if (image.length > 8_000_000) {
      return NextResponse.json(
        { error: "Image is too large. Please use one under ~5MB." },
        { status: 413 }
      );
    }

    const result = await analyzeImage(image, note, corrections);

    if (result.items.length === 0) {
      return NextResponse.json(
        { error: "Couldn't recognize any food in that photo. Try a clearer shot." },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    const msg = err?.message || "Failed to analyze photo.";
    const status = /GROQ_API_KEY/.test(msg) ? 500 : 502;
    console.error("[log-vision]", msg);
    return NextResponse.json({ error: msg }, { status });
  }
}
