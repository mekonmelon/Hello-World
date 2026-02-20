import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type VotePayload = {
  captionId: string;
  vote: string;
};

const DEFAULT_TABLE = "caption_votes";
const DEFAULT_CAPTION_COLUMN = "caption_id";
const DEFAULT_VOTE_COLUMN = "vote";

type ParsedPayload = {
  captionId: string | number;
  vote: 1 | -1;
};

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return { supabaseUrl, anonKey };
}

function parseVotePayload(payload: VotePayload): ParsedPayload | { error: string } {
  const rawCaptionId = (payload.captionId ?? "").trim();
  const rawVote = Number(payload.vote);

  if (!rawCaptionId) {
    return { error: "Caption ID is required." };
  }

  if (rawVote !== 1 && rawVote !== -1) {
    return { error: "Vote must be 1 (upvote) or -1 (downvote)." };
  }

  const numericCaptionId = Number(rawCaptionId);
  const captionId = Number.isInteger(numericCaptionId)
    ? numericCaptionId
    : rawCaptionId;

  return {
    captionId,
    vote: rawVote,
  };
}

async function getAuthenticatedUserId(params: {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
}) {
  const response = await fetch(new URL("/auth/v1/user", params.supabaseUrl), {
    headers: {
      apikey: params.anonKey,
      Authorization: `Bearer ${params.accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as { id?: string };
  return user.id ?? null;
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
    const voteColumn =
      process.env.CAPTION_VOTES_VOTE_COLUMN ??
      process.env.CAPTION_VOTES_SCORE_COLUMN ??
      DEFAULT_VOTE_COLUMN;
    const userIdColumn = process.env.CAPTION_VOTES_USER_ID_COLUMN;

    const row: Record<string, string | number> = {
      [captionColumn]: parsed.captionId,
      [voteColumn]: parsed.vote,
    };

    if (userIdColumn) {
      const userId = await getAuthenticatedUserId({
        supabaseUrl,
        anonKey,
        accessToken,
      });

      if (!userId) {
        return NextResponse.json(
          { error: "Could not resolve signed-in user for vote insert." },
          { status: 401 },
        );
      }

      row[userIdColumn] = userId;
    }

    const endpoint = new URL(`/rest/v1/${tableName}`, supabaseUrl);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify([row]),
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
