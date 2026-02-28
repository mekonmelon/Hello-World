import { cookies } from "next/headers";
import CaptionVoteForm from "@/components/caption-vote-form";
import ImageCaptionGenerator from "@/components/image-caption-generator";
import { fetchCaptionCards } from "@/lib/caption-feed";

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
  const captions = email
    ? await fetchCaptionCards().catch((err) => {
        console.error("SUPABASE ERROR:", err);
        return [];
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/60 p-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            Assignment 5
          </p>
          <h1 className="text-4xl font-semibold">Upload Images, Generate Captions, Then Vote</h1>
          <p className="text-slate-300">
            Complete the new image upload + caption generation flow first, then use the existing
            caption voting UI below.
          </p>
        </header>

        {email ? (
          <div className="space-y-6 text-slate-200">
            <p>
              You are signed in as <span className="font-semibold text-white">{email}</span>.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href="#generate-caption"
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm transition hover:bg-white/10"
              >
                <p className="font-semibold text-white">Step 1: Upload image + generate captions</p>
                <p className="mt-1 text-slate-300">Use the new generator to run the REST pipeline.</p>
              </a>
              <a
                href="#rate-caption"
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm transition hover:bg-white/10"
              >
                <p className="font-semibold text-white">Step 2: Vote on caption quality</p>
                <p className="mt-1 text-slate-300">Continue with your existing caption voting workflow.</p>
              </a>
            </div>

            <section id="generate-caption" className="space-y-2">
              <ImageCaptionGenerator canVote={Boolean(email)} />
            </section>

            <section id="rate-caption" className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">Caption voting</h2>
              <p className="text-sm text-slate-300">
                After generating captions, you can still vote on one caption at a time.
              </p>
              <CaptionVoteForm captions={captions} />
            </section>

            <a
              className="inline-flex w-fit items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              href="/auth/logout"
            >
              Sign out
            </a>
          </div>
        ) : (
          <div className="space-y-3 text-slate-200">
            <p>{error ?? "You must sign in to upload images, generate captions, and vote."}</p>
            <a
              className="inline-flex w-fit items-center justify-center rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-300"
              href="/auth/login"
            >
              Sign in with Google to start uploading
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
