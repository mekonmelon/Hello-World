"use client";

import { useState } from "react";
import type { CaptionCard } from "@/lib/caption-feed";

type ApiResponse = {
  row?: Record<string, unknown> | null;
  error?: string;
};

type Props = {
  captions: CaptionCard[];
};

export default function CaptionVoteForm({ captions }: Props) {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const current = captions[index] ?? null;

  async function submitVote(vote: 1 | -1) {
    if (!current) {
      return;
    }

    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/caption-votes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ captionId: current.id, vote: String(vote) }),
    });

    const result = (await response.json()) as ApiResponse;

    if (!response.ok) {
      setStatus("error");
      setMessage(result.error ?? "Could not submit vote.");
      return;
    }

    setStatus("success");
    setMessage(`Vote saved for caption ${current.id}.`);

    if (captions.length > 1) {
      setIndex((prev) => (prev + 1) % captions.length);
    }
  }

  if (!current) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">
        No captions found. Set the captions/images env vars and verify data exists.
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold text-white">Rate this caption</h2>
      <p className="text-sm text-slate-300">
        Caption {index + 1} of {captions.length}
      </p>

      {current.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current.imageUrl}
          alt="Caption candidate"
          className="w-full rounded-xl border border-white/10 object-cover"
        />
      ) : (
        <div className="rounded-xl border border-dashed border-white/20 p-6 text-sm text-slate-400">
          No image URL was found for this caption.
        </div>
      )}

      <p className="rounded-lg bg-slate-900/80 p-4 text-slate-100">{current.text}</p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void submitVote(1)}
          disabled={status === "saving"}
          className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
        >
          Upvote (+1)
        </button>
        <button
          type="button"
          onClick={() => void submitVote(-1)}
          disabled={status === "saving"}
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
