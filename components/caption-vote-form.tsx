"use client";

import { useEffect, useState } from "react";
import type { CaptionCard } from "@/lib/caption-feed";

type ApiResponse = {
  row?: Record<string, unknown> | null;
  error?: string;
};

type RandomCaptionResponse = {
  caption?: CaptionCard | null;
  error?: string;
};

const surfaceClass =
  "rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_20px_80px_-30px_rgba(56,189,248,0.55)] backdrop-blur-xl";
const voteButtonClass =
  "rounded-full px-5 py-2.5 text-sm font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-60";

async function fetchRandomCaption() {
  const response = await fetch("/api/captions/random", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  });

  const result = (await response.json()) as RandomCaptionResponse;

  if (!response.ok) {
    throw new Error(result.error ?? "Could not load a caption.");
  }

  return result.caption ?? null;
}

export default function CaptionVoteForm() {
  const [currentCaption, setCurrentCaption] = useState<CaptionCard | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInitialCaption() {
      try {
        const caption = await fetchRandomCaption();

        if (!isMounted) {
          return;
        }

        setCurrentCaption(caption);
        setStatus("idle");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Could not load a caption.");
      }
    }

    void loadInitialCaption();

    return () => {
      isMounted = false;
    };
  }, []);

  async function loadNextRandomCaption() {
    setStatus("loading");
    setMessage("");

    try {
      const caption = await fetchRandomCaption();
      setCurrentCaption(caption);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not load a caption.");
    }
  }

  async function submitVote(vote: 1 | -1) {
    if (!currentCaption) {
      return (
        <div className={surfaceClass}>
          <p>No captions found. Set the captions/images env vars and verify data exists.</p>
          {/* Reveal the hidden error! */}
          {message && (
            <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs font-mono text-rose-200">
              System Error: {message}
            </div>
          )}
        </div>
      );
    }

    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/caption-votes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ captionId: currentCaption.id, vote: String(vote) }),
    });

    const result = (await response.json()) as ApiResponse;

    if (!response.ok) {
      setStatus("error");
      setMessage(result.error ?? "Could not submit vote.");
      return;
    }

    setStatus("success");
    setMessage(`Vote saved for caption ${currentCaption.id}.`);
    await loadNextRandomCaption();
  }

  if (status === "loading" && !currentCaption) {
    return <div className={surfaceClass}>Loading a random caption...</div>;
  }

  if (!currentCaption) {
    return (
      <div className={surfaceClass}>
        No captions found. Set the captions/images env vars and verify data exists.
      </div>
    );
  }

  return (
    <section className={`${surfaceClass} space-y-4`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Community Caption Voting</h2>
        <span className="rounded-full border border-sky-300/40 bg-sky-400/10 px-3 py-1 text-xs text-sky-200">
          Live random card
        </span>
      </div>

      <p className="text-sm text-slate-300">Each vote loads a new random caption from the community pool.</p>

      {currentCaption.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentCaption.imageUrl}
          alt="Caption candidate"
          className="w-full rounded-2xl border border-white/20 object-cover shadow-lg shadow-black/35"
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-white/25 bg-slate-900/45 p-6 text-sm text-slate-300">
          No image URL was found for this caption.
        </div>
      )}

      <p className="rounded-xl border border-white/10 bg-slate-950/80 p-4 text-slate-100">{currentCaption.text}</p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void submitVote(1)}
          disabled={status === "saving" || status === "loading"}
          className={`${voteButtonClass} bg-emerald-400 text-slate-950 shadow-[0_0_24px_-12px_rgba(52,211,153,1)] hover:-translate-y-0.5 hover:bg-emerald-300`}
        >
          Upvote (+1)
        </button>
        <button
          type="button"
          onClick={() => void submitVote(-1)}
          disabled={status === "saving" || status === "loading"}
          className={`${voteButtonClass} bg-rose-400 text-slate-950 shadow-[0_0_24px_-12px_rgba(251,113,133,1)] hover:-translate-y-0.5 hover:bg-rose-300`}
        >
          Downvote (-1)
        </button>
      </div>

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-rose-300" : "text-emerald-200"}`}>{message}</p>
      ) : null}
    </section>
  );
}
