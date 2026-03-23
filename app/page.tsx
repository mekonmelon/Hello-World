import Link from "next/link";

const steps = [
  {
    number: "01",
    icon: "✦",
    title: "Sign in to the studio",
    description: "Open the protected page to unlock the authenticated upload and voting workflow.",
  },
  {
    number: "02",
    icon: "⬆",
    title: "Upload + generate",
    description: "Send an image through the REST pipeline: presigned URL, upload, register, then generate captions.",
  },
  {
    number: "03",
    icon: "♥",
    title: "Vote on the winners",
    description: "Review caption candidates, vote on quality, and validate the inserts flowing through the app.",
  },
] as const;

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-12 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-violet-500/12 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 rounded-[2rem] border border-white/10 bg-slate-900/55 p-6 shadow-[0_30px_120px_-50px_rgba(56,189,248,0.7)] backdrop-blur-xl sm:p-10 lg:p-12">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
              <span className="h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.95)]" />
              Punchline Lab
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                REST API Calls: Image Upload + Captions
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Upload an image, run the full caption pipeline with presigned URLs and generation calls,
                then vote on the funniest outcomes in a polished creative workflow.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_36px_-14px_rgba(56,189,248,0.95)] transition duration-300 hover:-translate-y-0.5 hover:bg-sky-300"
                href="/protected#generate-caption"
              >
                Go to protected page (Week 5 flow)
              </Link>
            </div>

            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                Presigned upload
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                Caption generation
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                Community voting
              </div>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/95 to-sky-950/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent" />
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                  Creative pipeline launchpad
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  A premium intro to the Humor Project flow: upload an image, process it through the
                  REST pipeline, and shape the final feed with votes.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-4">
                  <p className="text-sm font-semibold text-white">Upload</p>
                  <p className="mt-1 text-sm text-slate-300">Direct image handoff via presigned URL.</p>
                </div>
                <div className="rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4">
                  <p className="text-sm font-semibold text-white">Process</p>
                  <p className="mt-1 text-sm text-slate-300">Register the image and generate candidate captions.</p>
                </div>
                <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/10 p-4">
                  <p className="text-sm font-semibold text-white">Curate</p>
                  <p className="mt-1 text-sm text-slate-300">Vote on the strongest lines and refine the feed.</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">3-step overview</p>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">From image upload to punchline voting.</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="group rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_70px_-40px_rgba(56,189,248,0.75)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-sky-300/30 hover:bg-white/7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-lg text-sky-200 shadow-[0_0_24px_-12px_rgba(56,189,248,1)]">
                    {step.icon}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Step {step.number}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{step.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
