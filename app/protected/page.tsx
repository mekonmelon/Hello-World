import { cookies } from "next/headers";
import CaptionVoteForm from "@/components/caption-vote-form";
import ImageCaptionGenerator from "@/components/image-caption-generator";

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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-12 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-900/55 p-6 shadow-[0_30px_100px_-40px_rgba(14,165,233,0.65)] backdrop-blur-xl sm:p-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Create Captions. Shape the Feed.</h1>
          <p className="max-w-2xl text-slate-300">
            Generate caption ideas from your images, then keep the community feed sharp by voting on the best lines.
          </p>
        </header>

        {email ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <section id="generate-caption" className="xl:col-span-1">
              <ImageCaptionGenerator canVote={Boolean(email)} />
            </section>

            <section id="rate-caption" className="xl:col-span-1">
              <CaptionVoteForm />
            </section>
          </div>
        ) : (
          <div className="space-y-3 rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl">
            <p>{error ?? "You must sign in to upload images, generate captions, and vote."}</p>
            <a
              className="inline-flex w-fit items-center justify-center rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-900 transition duration-300 hover:-translate-y-0.5 hover:bg-sky-300"
              href="/auth/login"
            >
              Sign in with Google to continue
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
