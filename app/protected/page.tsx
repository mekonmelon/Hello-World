import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server"; // ADD THIS LINE
import CaptionVoteForm from "@/components/caption-vote-form";

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
  
  // 1. ADD THIS LINE TO DEFINE SUPABASE
  const supabase = await createClient(); 

  // 2. Now 'supabase' is defined and can be used here
  const { data: captions } = await supabase
    .from('captions')
    .select(`
      id,
      caption_text,
      images (image_url)
    `)
    .limit(1)
    .single(); 

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/60 p-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">Assignment 4</p>
          <h1 className="text-4xl font-semibold">Mutating Data</h1>
        </header>

        {email ? (
          <div className="space-y-5 text-slate-200">
            <p>You are signed in as <span className="font-semibold text-white">{email}</span>.</p>
            
            <section id="rate-caption">
              {captions ? (
                <CaptionVoteForm caption={captions} />
              ) : (
                <p>Loading caption...</p>
              )}
            </section>

            <a className="inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors" href="/auth/logout">Sign out</a>
          </div>
        ) : (
          <div className="space-y-3 text-slate-200">
            <p>{error ?? "You must sign in to view this page."}</p>
            <a className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400 transition-colors" href="/auth/login">Sign in with Google</a>
          </div>
        )}
      </main>
    </div>
  );
}
