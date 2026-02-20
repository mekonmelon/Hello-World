import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/auth";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.redirect(
      new URL("/auth/error?reason=missing-env", getBaseUrl()),
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/error?reason=missing-code", getBaseUrl()),
    );
  }

  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get("sb-code-verifier")?.value;

  if (!codeVerifier) {
    return NextResponse.redirect(
      new URL("/auth/error?reason=missing-verifier", getBaseUrl()),
    );
  }

  const tokenUrl = new URL("/auth/v1/token?grant_type=pkce", supabaseUrl);

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
    },
    body: JSON.stringify({
      auth_code: code,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    return NextResponse.redirect(
      new URL("/auth/error?reason=token-exchange", getBaseUrl()),
    );
  }

  const tokenData = (await response.json()) as TokenResponse;

  cookieStore.set("sb-access-token", tokenData.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: tokenData.expires_in,
    path: "/",
  });

  cookieStore.set("sb-refresh-token", tokenData.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  cookieStore.delete("sb-code-verifier");

  return NextResponse.redirect(new URL("/protected", getBaseUrl()));
}
