import { getBaseUrl } from "@/lib/auth";

type Props = {
  searchParams: { reason?: string };
};

const reasonMap: Record<string, string> = {
  "missing-env": "Supabase environment variables are missing.",
  "missing-code": "The OAuth provider did not return a code.",
  "missing-verifier": "The PKCE verifier cookie is missing or expired.",
  "token-exchange": "Supabase could not exchange the auth code for a session.",
};

export default function AuthErrorPage({ searchParams }: Props) {
  const message = searchParams.reason
    ? reasonMap[searchParams.reason] ?? "Unknown authentication error."
    : "Unknown authentication error.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <main className="w-full max-w-2xl rounded-2xl border border-rose-400/40 bg-rose-500/10 p-8">
        <h1 className="text-3xl font-semibold text-rose-200">Authentication Error</h1>
        <p className="mt-4 text-rose-100">{message}</p>
        <p className="mt-2 text-sm text-rose-100/80">
          Go back to <a className="underline" href={getBaseUrl()}>home</a> and try signing in again.
        </p>
      </main>
    </div>
  );
}
