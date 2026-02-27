"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type GenerateResponse = {
  imageId?: string;
  captions?: Array<{ id?: string; content?: string; [key: string]: unknown }>;
  raw?: unknown;
  error?: string;
};

const SUPPORTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];

export default function ImageCaptionGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setStatus("error");
      setMessage("Please choose an image first.");
      return;
    }

    if (!SUPPORTED_TYPES.includes(file.type)) {
      setStatus("error");
      setMessage(`Unsupported file type: ${file.type || "unknown"}`);
      return;
    }

    const body = new FormData();
    body.append("image", file);

    setStatus("loading");
    setMessage("Uploading image and generating captions...");
    setResult(null);

    const response = await fetch("/api/generate-captions", {
      method: "POST",
      body,
    });

    const payload = (await response.json()) as GenerateResponse;

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error ?? "Failed to generate captions.");
      return;
    }

    setStatus("success");
    setMessage("Caption generation complete.");
    setResult(payload);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold text-white">Upload image + generate captions</h2>
      <p className="text-sm text-slate-300">
        Supports jpeg, jpg, png, webp, gif, and heic. This runs all 4 API steps for you.
      </p>

      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full rounded-lg border border-white/20 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Generating..." : "Generate caption"}
        </button>
      </form>

      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Selected upload preview"
          className="max-h-80 w-full rounded-xl border border-white/10 object-contain"
        />
      ) : null}

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-rose-300" : "text-emerald-300"}`}>
          {message}
        </p>
      ) : null}

      {result?.captions?.length ? (
        <div className="space-y-2">
          <h3 className="font-semibold text-white">Generated captions</h3>
          <ul className="list-disc space-y-1 pl-5 text-slate-200">
            {result.captions.map((caption, index) => (
              <li key={caption.id ?? `${index}-${String(caption.content ?? "caption")}`}>
                {caption.content ?? JSON.stringify(caption)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result?.imageId ? <p className="text-xs text-slate-400">Image ID: {result.imageId}</p> : null}
    </section>
  );
}
