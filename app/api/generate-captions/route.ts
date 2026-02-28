import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type PresignedUrlResponse = {
  presignedUrl?: string;
  cdnUrl?: string;
};

type RegisterImageResponse = {
  imageId?: string;
};

const API_BASE = "https://api.almostcrackd.ai";
const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

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

    const captions = (await step4.json()) as unknown;

    return NextResponse.json({ imageId, captions });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
