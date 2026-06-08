"use client";

import { useRef, useState } from "react";
import { Camera, ImageUp, Loader2, Sparkles, X } from "lucide-react";
import { useTracker } from "@/lib/store";
import type { ParseResponse } from "@/lib/types";

// Downscale large photos in-browser so we stay under the API body limit.
async function fileToDataUrl(file: File, maxDim = 1024): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    if (scale === 1 && dataUrl.length < 1_500_000) return dataUrl;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return dataUrl;
  }
}

export default function VisionLogger({
  onParsed,
}: {
  onParsed: (res: ParseResponse) => void;
}) {
  const { learnedCorrections } = useTracker();
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setPreview(await fileToDataUrl(file));
  };

  const analyze = async () => {
    if (!preview || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/log-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: preview,
          note: note.trim(),
          corrections: learnedCorrections(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      onParsed(data as ParseResponse);
      setPreview(null);
      setNote("");
    } catch (e: any) {
      setError(e?.message || "Failed to analyze photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!preview ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => fileInput.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
            dragging
              ? "border-belly-400 bg-belly-50"
              : "border-slate-200 bg-slate-50/60 hover:border-belly-300 hover:bg-belly-50/40"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <ImageUp className="h-6 w-6 text-belly-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Drag &amp; drop a food photo
          </p>
          <p className="text-xs text-slate-400">or click to browse · JPG/PNG</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              cameraInput.current?.click();
            }}
            className="btn-soft mt-1"
          >
            <Camera className="h-4 w-4" /> Take a photo
          </button>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Meal preview" className="max-h-64 w-full object-cover" />
            <button
              onClick={() => setPreview(null)}
              className="absolute right-2 top-2 rounded-full bg-slate-900/60 p-1.5 text-white transition hover:bg-slate-900/80"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional: add context (e.g. 'large plate, no oil')"
            className="input mt-3"
            maxLength={200}
          />
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      {preview && (
        <div className="mt-3 flex justify-end">
          <button onClick={analyze} disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing photo…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Analyze photo
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
