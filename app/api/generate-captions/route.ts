import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type PresignedUrlResponse = {
  presignedUrl: string;
  cdnUrl: string;
};

type RegisterImageResponse = {
  imageId: string;
};

const API_BASE = "https://api.almostcrackd.ai";
const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
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

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
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

    const captionsPayload = (await step4.json()) as unknown;

    const captions = Array.isArray(captionsPayload)
      ? captionsPayload.filter((item): item is Record<string, unknown> => Boolean(item))
      : [];

    return NextResponse.json({ imageId, captions, raw: captionsPayload });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
