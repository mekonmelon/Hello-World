"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type CaptionRecord = {
  id?: string | number;
  content?: string;
  caption?: string;
  imageUrl?: string;
  url?: string;
  [key: string]: unknown;
};

type GenerateCaptionsResponse = {
  imageId?: string;
  captions?: CaptionRecord[];
  generatedCaptions?: string[];
  error?: string;
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const surfaceClass =
  "rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_20px_80px_-30px_rgba(56,189,248,0.55)] backdrop-blur-xl";
const voteButtonClass =
  "rounded-full px-5 py-2.5 text-sm font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-60";

function captionText(caption: CaptionRecord) {
  if (typeof caption.content === "string") return caption.content;
  if (typeof caption.caption === "string") return caption.caption;
  return JSON.stringify(caption);
}

function captionImageUrl(caption: CaptionRecord, fallbackUrl: string | null) {
  if (typeof caption.imageUrl === "string") return caption.imageUrl;
  if (typeof caption.url === "string") return caption.url;
  return fallbackUrl ?? "";
}

type Props = {
  canVote?: boolean;
};

export default function ImageCaptionGenerator({ canVote = false }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [imageId, setImageId] = useState<string | null>(null);
  const [generatedCaptions, setGeneratedCaptions] = useState<CaptionRecord[]>([]);
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(0);
  const [voteStatus, setVoteStatus] = useState<"idle" | "saving" | "error">("idle");
  const [voteMessage, setVoteMessage] = useState<string>("");
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const previewUrl = useMemo(() => (selectedFile ? URL.createObjectURL(selectedFile) : null), [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const hasCompletedVoting = generatedCaptions.length > 0 && currentCaptionIndex >= generatedCaptions.length;
  const currentCaption = generatedCaptions[currentCaptionIndex] ?? null;

  function setSelectedImage(file: File | null) {
    setSelectedFile(file);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    setSelectedImage(file);
  }

  function resetGenerator() {
    setSelectedFile(null);
    setStatus("idle");
    setMessage("");
    setImageId(null);
    setGeneratedCaptions([]);
    setCurrentCaptionIndex(0);
    setVoteStatus("idle");
    setVoteMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function submitVote(captionId: string | number | undefined, vote: 1 | -1) {
    if (!canVote) {
      setVoteStatus("error");
      setVoteMessage("You must sign in to vote on captions.");
      return;
    }

    if (!captionId) {
      setVoteStatus("error");
      setVoteMessage("This generated caption has no ID yet, so it cannot be voted on.");
      return;
    }

    setVoteStatus("saving");
    setVoteMessage("");

    const response = await fetch("/api/caption-votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ captionId: String(captionId), vote }),
    });

    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setVoteStatus("error");
      setVoteMessage(result.error ?? "Could not submit vote.");
      return;
    }

    setVoteStatus("idle");
    setVoteMessage("");
    setCurrentCaptionIndex((previousIndex) => previousIndex + 1);
  }

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
    setGeneratedCaptions([]);
    setCurrentCaptionIndex(0);
    setVoteStatus("idle");
    setVoteMessage("");

    const formData = new FormData();
    formData.append("image", selectedFile);

    const response = await fetch("/api/generate-captions", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const payload = (await response.json().catch(() => ({ error: "The server returned an unreadable response." }))) as GenerateCaptionsResponse;

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error ?? `Failed to generate captions (HTTP ${response.status}).`);
      return;
    }

    setStatus("success");
    setMessage(
      Array.isArray(payload.captions) && payload.captions.length > 0
        ? "Captions generated and saved successfully."
        : "Caption generation completed, but no caption rows were returned.",
    );
    setImageId(payload.imageId ?? null);
    setGeneratedCaptions(Array.isArray(payload.captions) ? payload.captions : []);
    setCurrentCaptionIndex(0);
  }

  return (
    <section className={`${surfaceClass} space-y-5`}>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-white">Image Caption Generator</h2>
        <p className="text-sm text-slate-300">Upload your image and generate caption candidates in seconds.</p>
      </div>

      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <label
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          onDragEnter={() => setIsDragActive(true)}
          onDragLeave={() => setIsDragActive(false)}
          className={`group block cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition duration-300 ${
            isDragActive
              ? "border-sky-300 bg-sky-400/15 shadow-[0_0_40px_-18px_rgba(56,189,248,0.95)]"
              : "border-white/25 bg-slate-900/40 hover:border-sky-300/70 hover:bg-sky-400/10"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
            className="hidden"
          />
          <p className="text-base font-medium text-white">Drag & drop an image here</p>
          <p className="mt-1 text-sm text-slate-300">or click to browse (JPEG, PNG, WEBP, GIF)</p>
          {selectedFile ? <p className="mt-3 text-xs text-sky-200">Selected: {selectedFile.name}</p> : null}
        </label>

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-sky-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_32px_-14px_rgba(56,189,248,1)] transition duration-300 hover:-translate-y-0.5 hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Generating..." : "Generate Captions"}
        </button>
      </form>

      {previewUrl ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-200">Uploaded image preview</h3>
              <p className="mt-1 text-xs text-slate-300">
                This confirms the uploaded image is available in the app before and after caption generation.
              </p>
            </div>
            {imageId ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Image ID: {imageId}</span> : null}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Selected image preview"
            className="mx-auto mt-4 max-h-[360px] w-full max-w-md rounded-2xl border border-white/20 object-contain shadow-lg shadow-sky-900/30"
          />
        </div>
      ) : null}

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-rose-300" : "text-emerald-200"}`}>{message}</p>
      ) : null}


      {hasCompletedVoting ? (
        <div className="rounded-2xl border border-emerald-300/35 bg-emerald-400/10 p-4 backdrop-blur">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-200">All done</h3>
          <p className="mt-1 text-sm text-emerald-100">You voted on all captions!</p>
          <button
            type="button"
            onClick={resetGenerator}
            className="mt-3 rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            Upload a new image
          </button>
        </div>
      ) : currentCaption ? (
        <article className="space-y-4 rounded-2xl border border-sky-300/30 bg-slate-900/65 p-5 shadow-[0_0_45px_-28px_rgba(56,189,248,1)] backdrop-blur">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-200">Generated Caption Card</h3>
            <p className="text-xs text-slate-300">
              {currentCaptionIndex + 1} / {generatedCaptions.length}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">Current caption to rate</p>
            <p className="mt-2 text-base leading-7 text-slate-100">{captionText(currentCaption)}</p>
            {currentCaption.id ? (
              <p className="mt-3 truncate text-xs text-slate-400">Caption ID: {String(currentCaption.id)}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void submitVote(currentCaption.id, 1);
              }}
              disabled={voteStatus === "saving" || !currentCaption.id || !canVote}
              className={`${voteButtonClass} bg-emerald-400 text-slate-950 shadow-[0_0_24px_-12px_rgba(52,211,153,1)] hover:-translate-y-0.5 hover:bg-emerald-300`}
            >
              Upvote (+1)
            </button>
            <button
              type="button"
              onClick={() => {
                void submitVote(currentCaption.id, -1);
              }}
              disabled={voteStatus === "saving" || !currentCaption.id || !canVote}
              className={`${voteButtonClass} bg-rose-400 text-slate-950 shadow-[0_0_24px_-12px_rgba(251,113,133,1)] hover:-translate-y-0.5 hover:bg-rose-300`}
            >
              Downvote (-1)
            </button>
          </div>

          {!canVote ? <p className="text-xs text-amber-300">Sign in is required to vote on generated captions.</p> : null}

          {!currentCaption.id ? (
            <p className="text-xs text-amber-300">This caption record is missing an ID, so voting is disabled for this item.</p>
          ) : null}
        </article>
      ) : null}

      {generatedCaptions.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-200">Generated captions</h3>
              <p className="mt-1 text-xs text-slate-300">
                Previewing a few generated captions. Open the full list only when you want to inspect every saved row.
              </p>
            </div>
            <span className="rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
              {generatedCaptions.length} captions
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {generatedCaptions.slice(0, 3).map((caption, index) => {
              const isCurrent = index === currentCaptionIndex && !hasCompletedVoting;

              return (
                <article
                  key={String(caption.id ?? index)}
                  className={`rounded-xl border p-3 ${
                    isCurrent ? "border-sky-300/50 bg-sky-400/10" : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-slate-950/60 px-2 py-0.5 text-[11px] text-slate-300">
                      Caption {index + 1}
                    </span>
                    {isCurrent ? (
                      <span className="rounded-full border border-sky-300/30 bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-200">
                        Currently rating
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-100">{captionText(caption)}</p>
                </article>
              );
            })}
          </div>

          {generatedCaptions.length > 3 ? (
            <details className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-sky-200">
                Click to see all {generatedCaptions.length} captions
              </summary>
              <div className="mt-3 grid gap-2">
                {generatedCaptions.map((caption, index) => {
                  const isCurrent = index === currentCaptionIndex && !hasCompletedVoting;

                  return (
                    <article key={String(caption.id ?? index)} className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-slate-950/60 px-2 py-0.5 text-[11px] text-slate-300">
                          Caption {index + 1}
                        </span>
                        {caption.id ? (
                          <span className="max-w-full truncate rounded-full border border-white/10 bg-slate-950/60 px-2 py-0.5 text-[11px] text-slate-400">
                            ID: {String(caption.id)}
                          </span>
                        ) : null}
                        {isCurrent ? (
                          <span className="rounded-full border border-sky-300/30 bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-200">
                            Currently rating
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-100">{captionText(caption)}</p>
                    </article>
                  );
                })}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      {voteStatus === "error" && voteMessage ? <p className="text-sm text-rose-300">{voteMessage}</p> : null}
    </section>
  );
}
