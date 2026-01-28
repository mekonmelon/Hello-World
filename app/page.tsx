export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <main className="flex w-full max-w-3xl flex-col gap-8 rounded-3xl border border-white/10 bg-slate-900/60 p-10 shadow-2xl backdrop-blur">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-sky-300">
            Hello World
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Your Next.js app is ready for deployment.
          </h1>
        </header>
        <p className="text-lg text-slate-200">
          This lightweight starter confirms the project is running. Update this
          message or customize the layout to match your assignment needs.
        </p>
        <section className="grid gap-4 text-base text-slate-200 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-semibold text-white">Step 1</h2>
            <p className="mt-2 text-sm text-slate-300">
              Push your changes to GitHub.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-semibold text-white">Step 2</h2>
            <p className="mt-2 text-sm text-slate-300">
              Import the repository in Vercel.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-semibold text-white">Step 3</h2>
            <p className="mt-2 text-sm text-slate-300">
              Share the deployed URL.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
