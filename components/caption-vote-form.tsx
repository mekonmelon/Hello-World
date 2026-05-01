"use client";

import { useEffect, useRef, useState } from "react";
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

async function fetchRandomCaption(excludeCaptionIds: string[] = []) {
  const params = new URLSearchParams();
  excludeCaptionIds.forEach((id) => {
    if (id) params.append("exclude", id);
  });

  const url = params.toString() ? `/api/captions/random?${params.toString()}` : "/api/captions/random";

  const response = await fetch(url, {
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
  const [recentCaptions, setRecentCaptions] = useState<CaptionCard[]>([]);
  const seenCaptionIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    async function loadInitialCaption() {
      try {
        const caption = await fetchRandomCaption([...seenCaptionIdsRef.current]);

        if (!isMounted) {
          return;
        }

        setCurrentCaption(caption);
        rememberCaption(caption);
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

  function rememberCaption(caption: CaptionCard | null) {
    if (!caption) {
      return;
    }
    seenCaptionIdsRef.current.add(caption.id);

    setRecentCaptions((current) => {
      const withoutDuplicate = current.filter((item) => item.id !== caption.id);
      return [caption, ...withoutDuplicate].slice(0, 5);
    });
  }

  async function loadNextRandomCaption(previousCaptionId?: string) {
    setStatus("loading");

    try {
      const excludedIds = new Set(seenCaptionIdsRef.current);
      if (previousCaptionId) excludedIds.add(previousCaptionId);

      let caption: CaptionCard | null = null;

      for (let attempt = 0; attempt < 12; attempt += 1) {
        const candidate = await fetchRandomCaption([...excludedIds]);
        if (!candidate) {
          break;
        }

        if (!excludedIds.has(candidate.id)) {
          caption = candidate;
          break;
        }

        excludedIds.add(candidate.id);
      }

      if (!caption) {
        setStatus("idle");
        setMessage("Vote saved. No unseen captions are available right now.");
        return;
      }

      setCurrentCaption(caption);
      rememberCaption(caption);
      setStatus("idle");
      setMessage("");
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

    const votedCaptionId = currentCaption.id;
    setStatus("success");
    setMessage(`Vote saved. Loading another caption...`);
    await loadNextRandomCaption(votedCaptionId);
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
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
          Caption ID: {currentCaption.id}
        </span>
        {status === "loading" ? (
          <span className="rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-sky-200">
            Loading next caption...
          </span>
        ) : null}
      </div>

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

      {recentCaptions.length > 1 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">Recent caption feed</h3>
            <span className="text-xs text-slate-400">Unseen captions loaded from Supabase</span>
          </div>
          <div className="mt-3 grid gap-2">
            {recentCaptions.slice(0, 4).map((caption) => (
              <div key={caption.id} className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2">
                <div className="flex min-w-0 items-center gap-3">
                  {caption.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={caption.imageUrl} alt="Recent caption" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg border border-dashed border-white/20 bg-slate-900" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-100">{caption.text}</p>
                    <p className="truncate text-[11px] text-slate-400">ID: {caption.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-rose-300" : "text-emerald-200"}`}>{message}</p>
      ) : null}
    </section>
  );
}
