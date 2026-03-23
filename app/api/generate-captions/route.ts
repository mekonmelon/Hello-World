import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolveCurrentProfileId } from "@/lib/profile-id";

type PresignedUrlResponse = {
  presignedUrl?: string;
  cdnUrl?: string;
};

type RegisterImageResponse = {
  imageId?: string;
};

type InsertedCaptionRow = Record<string, unknown>;

const API_BASE = "https://api.almostcrackd.ai";
const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

const DEFAULT_CAPTIONS_TABLE = "captions";
const DEFAULT_CAPTION_TEXT_COLUMN = "content";
const DEFAULT_CAPTION_IMAGE_ID_COLUMN = "image_id";
const DEFAULT_CAPTION_PROFILE_ID_COLUMN = "profile_id";
const DEFAULT_CAPTION_PUBLIC_COLUMN = "is_public";

function buildHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function validateSupabaseAccessToken(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { valid: false, error: "Missing Supabase environment variables.", status: 500 };
  }

  const response = await fetch(new URL("/auth/v1/user", supabaseUrl), {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return { valid: false, error: "Session expired. Please sign in again.", status: 401 };
  }

  return { valid: true as const };
}

function normalizeGeneratedCaptions(payload: unknown): string[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (item && typeof item === "object") {
          const content = "content" in item && typeof item.content === "string" ? item.content : null;
          const caption = "caption" in item && typeof item.caption === "string" ? item.caption : null;
          return (content ?? caption ?? "").trim();
        }

        return "";
      })
      .filter(Boolean);
  }

  if (
    payload &&
    typeof payload === "object" &&
    "captions" in payload
  ) {
    return normalizeGeneratedCaptions(payload.captions);
  }

  return [];
}

async function insertGeneratedCaptions(params: {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
  imageId: string;
  profileId: string;
  captionTexts: string[];
}) {
  const captionsTable = process.env.CAPTIONS_TABLE ?? DEFAULT_CAPTIONS_TABLE;
  const captionTextColumn = process.env.CAPTIONS_TEXT_COLUMN ?? DEFAULT_CAPTION_TEXT_COLUMN;
  const captionImageIdColumn =
    process.env.CAPTIONS_IMAGE_ID_COLUMN ?? DEFAULT_CAPTION_IMAGE_ID_COLUMN;
  const captionProfileIdColumn =
    process.env.CAPTIONS_PROFILE_ID_COLUMN ??
    process.env.CAPTIONS_AUTHOR_ID_COLUMN ??
    DEFAULT_CAPTION_PROFILE_ID_COLUMN;
  const captionPublicColumn =
    process.env.CAPTIONS_PUBLIC_COLUMN ?? DEFAULT_CAPTION_PUBLIC_COLUMN;

  const rows = params.captionTexts.map((captionText) => ({
    [captionTextColumn]: captionText,
    [captionImageIdColumn]: params.imageId,
    [captionProfileIdColumn]: params.profileId,
    [captionPublicColumn]: false,
    created_by_user_id: params.profileId,
    modified_by_user_id: params.profileId,
  }));

  const endpoint = new URL(`/rest/v1/${captionsTable}`, params.supabaseUrl);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: params.anonKey,
      Authorization: `Bearer ${params.accessToken}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(rows),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    return {
      ok: false as const,
      error: `Step 5 failed: caption insert failed (${response.status}): ${details}`,
    };
  }

  return {
    ok: true as const,
    rows: (await response.json()) as InsertedCaptionRow[],
  };
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const tokenValidation = await validateSupabaseAccessToken(accessToken);
  if (!tokenValidation.valid) {
    return NextResponse.json({ error: tokenValidation.error }, { status: tokenValidation.status });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Missing Supabase environment variables." }, { status: 500 });
  }

  const currentProfileId = await resolveCurrentProfileId({
    supabaseUrl,
    anonKey,
    accessToken,
  });

  if (!currentProfileId) {
    return NextResponse.json(
      { error: "Could not resolve signed-in user's public.profiles.id." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file." }, { status: 400 });
  }

  if (!SUPPORTED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${file.type || "unknown"}` },
      { status: 400 },
    );
  }

  try {
    const step1 = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
      method: "POST",
      headers: buildHeaders(accessToken),
      body: JSON.stringify({ contentType: file.type }),
      cache: "no-store",
    });

    if (!step1.ok) {
      const message = await step1.text();
      return NextResponse.json(
        { error: `Step 1 failed: ${message || "could not generate presigned URL"}` },
        { status: step1.status },
      );
    }

    const { presignedUrl, cdnUrl } = (await step1.json()) as PresignedUrlResponse;
    if (!presignedUrl || !cdnUrl) {
      return NextResponse.json({ error: "Step 1 failed: missing presignedUrl/cdnUrl." }, { status: 502 });
    }

    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: await file.arrayBuffer(),
      cache: "no-store",
    });

    if (!uploadResponse.ok) {
      const message = await uploadResponse.text();
      return NextResponse.json(
        { error: `Step 2 failed: ${message || "could not upload file bytes"}` },
        { status: uploadResponse.status },
      );
    }

    const step3 = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
      method: "POST",
      headers: buildHeaders(accessToken),
      body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
      cache: "no-store",
    });

    if (!step3.ok) {
      const message = await step3.text();
      return NextResponse.json(
        { error: `Step 3 failed: ${message || "could not register image URL"}` },
        { status: step3.status },
      );
    }

    const { imageId } = (await step3.json()) as RegisterImageResponse;
    if (!imageId) {
      return NextResponse.json({ error: "Step 3 failed: missing imageId." }, { status: 502 });
    }

    const step4 = await fetch(`${API_BASE}/pipeline/generate-captions`, {
      method: "POST",
      headers: buildHeaders(accessToken),
      body: JSON.stringify({ imageId }),
      cache: "no-store",
    });

    if (!step4.ok) {
      const message = await step4.text();
      return NextResponse.json(
        { error: `Step 4 failed: ${message || "could not generate captions"}` },
        { status: step4.status },
      );
    }

    const generatedPayload = (await step4.json()) as unknown;
    const captionTexts = normalizeGeneratedCaptions(generatedPayload);

    if (captionTexts.length === 0) {
      return NextResponse.json(
        { error: "Step 4 failed: no caption text was returned by the generation pipeline." },
        { status: 502 },
      );
    }

    const insertResult = await insertGeneratedCaptions({
      supabaseUrl,
      anonKey,
      accessToken,
      imageId,
      profileId: currentProfileId,
      captionTexts,
    });

    if (!insertResult.ok) {
      return NextResponse.json({ error: insertResult.error }, { status: 400 });
    }

    return NextResponse.json({
      imageId,
      captions: insertResult.rows,
      generatedCaptions: captionTexts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
