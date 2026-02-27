"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type CaptionItem = string | number | boolean | Record<string, unknown> | null;

type GenerateCaptionsResponse = {
  imageId?: string;
  captions?: CaptionItem[];
  error?: string;
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export default function ImageCaptionGenerator() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [imageId, setImageId] = useState<string | null>(null);
  const [captions, setCaptions] = useState<CaptionItem[]>([]);

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setStatus("error");
      setMessage("Please choose an image file first.");
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      setStatus("error");
      setMessage("Unsupported file type. Please upload JPEG, PNG, WEBP, or GIF.");
      return;
    }

    setStatus("loading");
    setMessage("Uploading image and generating captions...");
    setImageId(null);
    setCaptions([]);

    const formData = new FormData();
    formData.append("image", selectedFile);

    const response = await fetch("/api/generate-captions", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as GenerateCaptionsResponse;

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error ?? "Failed to generate captions.");
      return;
    }

    setStatus("success");
    setMessage("Captions generated successfully.");
    setImageId(payload.imageId ?? null);
    setCaptions(Array.isArray(payload.captions) ? payload.captions : []);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold text-white">Image Caption Generator</h2>
      <p className="text-sm text-slate-300">Upload an image to generate captions through the REST pipeline.</p>

      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          className="block w-full rounded-lg border border-white/20 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Generating..." : "Generate Captions"}
        </button>
      </form>

      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Selected image preview"
          className="max-h-80 w-full rounded-xl border border-white/10 object-contain"
        />
      ) : null}

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-rose-300" : "text-emerald-300"}`}>
          {message}
        </p>
      ) : null}

      {imageId ? <p className="text-xs text-slate-300">imageId: {imageId}</p> : null}

      {captions.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-200">Captions</h3>
          <ul className="list-disc space-y-1 pl-5 text-slate-200">
            {captions.map((caption, index) => (
              <li key={`${index}-${typeof caption === "string" ? caption : "caption"}`}>
                {typeof caption === "string" ? caption : JSON.stringify(caption)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
