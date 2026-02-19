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
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Use the fetch API to exchange the code for a session
    // This handles the verifier and PKCE flow correctly
    const tokenUrl = `${supabaseUrl}/auth/v1/token?grant_type=pkce`;
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get("sb-code-verifier")?.value;

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ auth_code: code, code_verifier: codeVerifier }),
    });

    if (res.ok) {
      const tokenData = await res.json();
      const redirectResponse = NextResponse.redirect(`${origin}/protected`);

      // Set the cookies directly on the redirect response
      redirectResponse.cookies.set("sb-access-token", tokenData.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
      redirectResponse.cookies.set("sb-refresh-token", tokenData.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });

      return redirectResponse;
    }
  }

  // If anything fails, return to home or an error page
  return NextResponse.redirect(`${origin}/auth/error?reason=token-exchange`);
}
