import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("sb-access-token");
  cookieStore.delete("sb-refresh-token");
  cookieStore.delete("sb-code-verifier");

  return NextResponse.redirect(new URL("/", getBaseUrl()));
}
