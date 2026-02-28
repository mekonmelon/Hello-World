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
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "success" | "error">(
    "loading",
  );
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
      return;
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
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">
        Loading a random caption...
      </div>
    );
  }

  if (!currentCaption) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">
        No captions found. Set the captions/images env vars and verify data exists.
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold text-white">Rate this caption</h2>
      <p className="text-sm text-slate-300">This card is randomly selected from your Supabase dataset.</p>

      {currentCaption.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentCaption.imageUrl}
          alt="Caption candidate"
          className="w-full rounded-xl border border-white/10 object-cover"
        />
      ) : (
        <div className="rounded-xl border border-dashed border-white/20 p-6 text-sm text-slate-400">
          No image URL was found for this caption.
        </div>
      )}

      <p className="rounded-lg bg-slate-900/80 p-4 text-slate-100">{currentCaption.text}</p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void submitVote(1)}
          disabled={status === "saving" || status === "loading"}
          className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
        >
          Upvote (+1)
        </button>
        <button
          type="button"
          onClick={() => void submitVote(-1)}
          disabled={status === "saving" || status === "loading"}
          className="rounded-full bg-rose-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-rose-300 disabled:opacity-60"
        >
          Downvote (-1)
        </button>
      </div>

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-rose-300" : "text-emerald-300"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
