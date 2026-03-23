import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolveCurrentProfileId } from "@/lib/profile-id";

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

async function findExistingVote(params: {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
  tableName: string;
  captionColumn: string;
  userIdColumn?: string;
  captionId: string | number;
  profileId: string;
}) {
  if (!params.userIdColumn) {
    return null;
  }

  const endpoint = new URL(`/rest/v1/${params.tableName}`, params.supabaseUrl);
  endpoint.searchParams.set("select", "id");
  endpoint.searchParams.set(params.captionColumn, `eq.${String(params.captionId)}`);
  endpoint.searchParams.set(params.userIdColumn, `eq.${params.profileId}`);
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: {
      apikey: params.anonKey,
      Authorization: `Bearer ${params.accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Vote lookup failed (${response.status}): ${details}`);
  }

  const rows = (await response.json()) as Array<{ id?: string | number }>;
  const id = rows[0]?.id;
  return id === undefined || id === null ? null : String(id);
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
    const profileId = await resolveCurrentProfileId({
      supabaseUrl,
      anonKey,
      accessToken,
    });

    if (!profileId) {
      return NextResponse.json(
        { error: "Could not resolve signed-in user's profiles.id." },
        { status: 401 },
      );
    }

    const existingVoteId = await findExistingVote({
      supabaseUrl,
      anonKey,
      accessToken,
      tableName,
      captionColumn,
      userIdColumn,
      captionId: parsed.captionId,
      profileId,
    });

    const row: Record<string, string | number> = {
      [captionColumn]: parsed.captionId,
      [voteColumn]: parsed.vote,
      modified_by_user_id: profileId,
    };

    if (userIdColumn) {
      row[userIdColumn] = profileId;
    }

    if (existingVoteId) {
      const updateEndpoint = new URL(`/rest/v1/${tableName}`, supabaseUrl);
      updateEndpoint.searchParams.set("id", `eq.${existingVoteId}`);

      const updateResponse = await fetch(updateEndpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(row),
      });

      if (!updateResponse.ok) {
        const details = await updateResponse.text();
        return NextResponse.json(
          {
            error: `Update failed (${updateResponse.status}): ${details}`,
          },
          { status: 400 },
        );
      }

      const rows = (await updateResponse.json()) as Array<Record<string, unknown>>;
      return NextResponse.json({ row: rows[0] ?? null }, { status: 200 });
    }

    row.created_by_user_id = profileId;

    const insertEndpoint = new URL(`/rest/v1/${tableName}`, supabaseUrl);
    const insertResponse = await fetch(insertEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify([row]),
    });

    if (!insertResponse.ok) {
      const details = await insertResponse.text();
      return NextResponse.json(
        {
          error: `Insert failed (${insertResponse.status}): ${details}`,
        },
        { status: 400 },
      );
    }

    const rows = (await insertResponse.json()) as Array<Record<string, unknown>>;

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
