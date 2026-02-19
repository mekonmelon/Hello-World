import { cookies } from "next/headers";
import { CaptionVoteForm } from "@/components/caption-vote-form";

async function getUserEmail() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { email: null, error: "Missing Supabase environment variables." };
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return { email: null, error: "Not signed in." };
  }

  const response = await fetch(new URL("/auth/v1/user", supabaseUrl), {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return { email: null, error: "Session expired. Please sign in again." };
  }

  const data = (await response.json()) as { email?: string };
  return { email: data.email ?? null, error: null };
}

export default async function ProtectedPage() {
  const { email, error } = await getUserEmail();

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/60 p-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            Assignment 4
          </p>
          <h1 className="text-4xl font-semibold">Mutating Data</h1>
        </header>

        {email ? (
          <div className="space-y-5 text-slate-200">
            <p>
              You are signed in as <span className="font-semibold text-white">{email}</span>.
            </p>
            <p>Submit votes below to insert rows into your caption_votes table.</p>
            <CaptionVoteForm />
            <a
              className="inline-flex w-fit items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              href="/auth/logout"
            >
              Sign out
            </a>
          </div>
        ) : (
          <div className="space-y-3 text-slate-200">
            <p>{error ?? "You must sign in to view this page."}</p>
            <a
              className="inline-flex w-fit items-center justify-center rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-300"
              href="/auth/login"
            >
              Sign in with Google
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
