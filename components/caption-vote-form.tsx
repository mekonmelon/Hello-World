"use client";

import { useState } from "react";

type ApiResponse = {
  row?: Record<string, unknown> | null;
  error?: string;
};

export function CaptionVoteForm() {
  const [captionId, setCaptionId] = useState("");
  const [score, setScore] = useState("1");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/caption-votes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ captionId, score }),
    });

    const result = (await response.json()) as ApiResponse;

    if (!response.ok) {
      setStatus("error");
      setMessage(result.error ?? "Could not submit vote.");
      return;
    }

    setStatus("success");
    setMessage(`Vote inserted: ${JSON.stringify(result.row)}`);
    setCaptionId("");
    setScore("1");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold text-white">Rate a caption</h2>
      <p className="text-sm text-slate-300">
        This inserts a row into <code>caption_votes</code> using your signed-in session.
      </p>

      <label className="block text-sm text-slate-200">
        Caption ID
        <input
          type="text"
          min={1}
          value={captionId}
          onChange={(event) => setCaptionId(event.target.value)}
          className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white"
          placeholder="Example: 42"
          required
        />
      </label>

      <label className="block text-sm text-slate-200">
        Score (1-5)
        <input
          type="number"
          min={1}
          max={5}
          step={1}
          value={score}
          onChange={(event) => setScore(event.target.value)}
          className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white"
          required
        />
      </label>

      <button
        type="submit"
        disabled={status === "saving"}
        className="inline-flex items-center justify-center rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-300 disabled:opacity-60"
      >
        {status === "saving" ? "Saving..." : "Submit vote"}
      </button>

      {message ? (
        <p
          className={`text-sm ${status === "error" ? "text-rose-300" : "text-emerald-300"}`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
