"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

type Props = {
  canVote?: boolean;
};

export default function ImageCaptionGenerator({ canVote = false }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [imageId, setImageId] = useState<string | null>(null);
  const [generatedCaptions, setGeneratedCaptions] = useState<CaptionRecord[]>([]);
  const [voteStatus, setVoteStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [voteMessage, setVoteMessage] = useState<string>("");

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
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ captionId: String(captionId), vote }),
    });

    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setVoteStatus("error");
      setVoteMessage(result.error ?? "Could not submit vote.");
      return;
    }

    setVoteStatus("success");
    setVoteMessage(`Vote saved for caption ${captionId}.`);
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

      {generatedCaptions.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-200">Generated captions</h3>

          {generatedCaptions.map((caption, index) => {
            const captionText =
              typeof caption.content === "string"
                ? caption.content
                : typeof caption.caption === "string"
                  ? caption.caption
                  : JSON.stringify(caption);
            const cardImageUrl =
              typeof caption.imageUrl === "string"
                ? caption.imageUrl
                : typeof caption.url === "string"
                  ? caption.url
                  : previewUrl;

            return (
              <article
                key={caption.id ? String(caption.id) : `generated-caption-${index}`}
                className="space-y-3 rounded-xl border border-white/10 bg-slate-900/70 p-4"
              >
                {cardImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cardImageUrl}
                    alt="Generated caption image"
                    className="w-full rounded-lg border border-white/10 object-contain"
                  />
                ) : null}

                <p className="rounded-lg bg-slate-950/70 p-3 text-slate-100">{captionText}</p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void submitVote(caption.id, 1)}
                    disabled={voteStatus === "saving" || !caption.id || !canVote}
                    className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
                  >
                    Upvote (+1)
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitVote(caption.id, -1)}
                    disabled={voteStatus === "saving" || !caption.id || !canVote}
                    className="rounded-full bg-rose-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-rose-300 disabled:opacity-60"
                  >
                    Downvote (-1)
                  </button>
                </div>


                {!canVote ? (
                  <p className="text-xs text-amber-300">Sign in is required to vote on generated captions.</p>
                ) : null}

                {!caption.id ? (
                  <p className="text-xs text-amber-300">
                    This caption record is missing an ID, so voting is disabled for this item.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}

      {voteMessage ? (
        <p className={`text-sm ${voteStatus === "error" ? "text-rose-300" : "text-emerald-300"}`}>
          {voteMessage}
        </p>
      ) : null}
    </section>
  );
}
