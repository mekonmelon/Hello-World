import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  getBaseUrl,
  getSupabaseAuthUrl,
} from "@/lib/auth";

export async function GET() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const redirectTo = `${getBaseUrl()}/auth/callback`;

  const authUrl = getSupabaseAuthUrl({
    provider: "google",
    redirectTo,
    codeChallenge,
  });

  const cookieStore = await cookies();
  cookieStore.set("sb-code-verifier", codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });

  return NextResponse.redirect(authUrl);
}
