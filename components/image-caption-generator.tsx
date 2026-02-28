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
  error?: string;
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const surfaceClass =
  "rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_20px_80px_-30px_rgba(56,189,248,0.55)] backdrop-blur-xl";
const voteButtonClass =
  "rounded-full px-5 py-2.5 text-sm font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-60";

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

    const payload = (await response.json()) as GenerateCaptionsResponse;

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error ?? "Failed to generate captions.");
      return;
    }

    setStatus("success");
    setMessage("Captions generated successfully.");
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

      {previewUrl && !hasCompletedVoting ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Selected image preview"
          className="mx-auto max-h-[400px] w-full max-w-md rounded-2xl border border-white/20 object-contain shadow-lg shadow-sky-900/30"
        />
      ) : null}

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-rose-300" : "text-emerald-200"}`}>{message}</p>
      ) : null}

      {imageId ? <p className="text-xs text-slate-300">imageId: {imageId}</p> : null}

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
        <article className="space-y-4 rounded-2xl border border-white/15 bg-slate-900/55 p-5 shadow-inner shadow-sky-950/30 backdrop-blur">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-200">Generated Caption Card</h3>
            <p className="text-xs text-slate-300">
              {currentCaptionIndex + 1} / {generatedCaptions.length}
            </p>
          </div>

          {(typeof currentCaption.imageUrl === "string"
            ? currentCaption.imageUrl
            : typeof currentCaption.url === "string"
              ? currentCaption.url
              : previewUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                typeof currentCaption.imageUrl === "string"
                  ? currentCaption.imageUrl
                  : typeof currentCaption.url === "string"
                    ? currentCaption.url
                    : previewUrl ?? ""
              }
              alt="Generated caption image"
              className="mx-auto max-h-[400px] w-full max-w-md rounded-xl border border-white/20 object-contain shadow-md shadow-black/40"
            />
          ) : null}

          <p className="rounded-xl border border-white/10 bg-slate-950/80 p-4 text-slate-100">
            {typeof currentCaption.content === "string"
              ? currentCaption.content
              : typeof currentCaption.caption === "string"
                ? currentCaption.caption
                : JSON.stringify(currentCaption)}
          </p>

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

      {voteStatus === "error" && voteMessage ? <p className="text-sm text-rose-300">{voteMessage}</p> : null}
    </section>
  );
}
