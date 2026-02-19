import Link from "next/link";

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl border border-white/10 bg-slate-900/60 p-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            Week 4 Assignment
          </p>
          <h1 className="text-4xl font-semibold">Mutating Data: Caption Votes</h1>
          <p className="text-slate-300">
            This week extends authentication by adding write access. Signed-in users
            can submit ratings that insert new rows into <code>caption_votes</code>.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold text-white">Step 1</h2>
            <p className="mt-2 text-sm text-slate-300">
              Open the protected page and sign in if needed.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold text-white">Step 2</h2>
            <p className="mt-2 text-sm text-slate-300">
              Fill out the <code>Rate a caption</code> form.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold text-white">Step 3</h2>
            <p className="mt-2 text-sm text-slate-300">
              Verify your new row appears in Supabase.
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            href="/protected#rate-caption"
          >
            Go to protected page (Week 4 form)
          </Link>
        </div>
      </main>
    </div>
  );
}
