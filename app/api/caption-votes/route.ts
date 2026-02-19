import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type VotePayload = {
  captionId: string;
  score: string;
};

const DEFAULT_TABLE = "caption_votes";
const DEFAULT_CAPTION_COLUMN = "caption_id";
const DEFAULT_SCORE_COLUMN = "vote";

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return { supabaseUrl, anonKey };
}

function parseVotePayload(payload: VotePayload) {
  const captionId = Number(payload.captionId);
  const score = Number(payload.score);

  if (!Number.isInteger(captionId) || captionId <= 0) {
    return { error: "Caption ID must be a positive integer." };
  }

  if (!Number.isFinite(score) || score < 1 || score > 5) {
    return { error: "Score must be a number between 1 and 5." };
  }

  return { captionId, score };
}

export async function POST(request: Request) {
  try {
    const { supabaseUrl, anonKey } = getSupabaseEnv();
    const body = (await request.json()) as VotePayload;
    const parsed = parseVotePayload(body);

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "You must sign in first." }, { status: 401 });
    }

    const tableName = process.env.CAPTION_VOTES_TABLE ?? DEFAULT_TABLE;
    const captionColumn =
      process.env.CAPTION_VOTES_CAPTION_ID_COLUMN ?? DEFAULT_CAPTION_COLUMN;
    const scoreColumn = process.env.CAPTION_VOTES_SCORE_COLUMN ?? DEFAULT_SCORE_COLUMN;

    const endpoint = new URL(`/rest/v1/${tableName}`, supabaseUrl);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify([
        {
          [captionColumn]: parsed.captionId,
          [scoreColumn]: parsed.score,
        },
      ]),
    });

    if (!response.ok) {
      const details = await response.text();
      return NextResponse.json(
        {
          error: `Insert failed (${response.status}): ${details}`,
        },
        { status: 400 },
      );
    }

    const rows = (await response.json()) as Array<Record<string, unknown>>;

    return NextResponse.json({ row: rows[0] ?? null }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error.",
      },
      { status: 500 },
    );
  }
}
