import Link from "next/link";

import { fetchSupabaseRows, type SupabaseRow } from "@/lib/supabase";

type PageData = {
  rows: SupabaseRow[];
  tableName: string;
  errorMessage: string | null;
};

function getColumnNames(rows: SupabaseRow[]): string[] {
  return Array.from(
    rows.reduce<Set<string>>((columnSet, row) => {
      for (const key of Object.keys(row)) {
        columnSet.add(key);
      }

      return columnSet;
    }, new Set<string>()),
  );
}

function renderCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

async function getPageData(): Promise<PageData> {
  try {
    const { rows, tableName } = await fetchSupabaseRows();

    return {
      rows,
      tableName,
      errorMessage: null,
    };
  } catch (error) {
    return {
      rows: [],
      tableName: process.env.SUPABASE_TABLE ?? "unknown",
      errorMessage:
        error instanceof Error
          ? error.message
          : "Unknown error while loading data.",
    };
  }
}

export default async function Home() {
  const { rows, tableName, errorMessage } = await getPageData();
  const columns = getColumnNames(rows);

  if (errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <main className="w-full max-w-2xl rounded-xl border border-rose-400/40 bg-rose-500/10 p-8">
          <h1 className="text-3xl font-semibold text-rose-200">Configuration Error</h1>
          <p className="mt-4 text-rose-100">{errorMessage}</p>
          <p className="mt-2 text-sm text-rose-100/80">
            Add your Supabase values to <code>.env.local</code> and restart the dev
            server.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl border border-white/10 bg-slate-900/60 p-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            Assignment 3
          </p>
          <h1 className="text-4xl font-semibold">Auth Week: Protected Route</h1>
          <p className="text-slate-300">
            Use Google OAuth through Supabase to unlock the gated page.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold text-white">Step 1</h2>
            <p className="mt-2 text-sm text-slate-300">
              Configure Google OAuth + Supabase.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold text-white">Step 2</h2>
            <p className="mt-2 text-sm text-slate-300">
              Sign in to view the protected route.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold text-white">Step 3</h2>
            <p className="mt-2 text-sm text-slate-300">
              Submit your deployed Vercel URL.
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            className="inline-flex items-center justify-center rounded-full bg-sky-400 px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-300"
            href="/auth/login"
          >
            Sign in with Google
          </a>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            href="/protected"
          >
            Go to protected page
          </Link>
        </div>
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            Assignment 2
          </p>
          <h1 className="text-4xl font-semibold">Supabase Data Viewer</h1>
          <p className="text-slate-300">
            Showing up to {rows.length} row(s) from the <code>{tableName}</code>{" "}
            table.
          </p>
        </header>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-slate-200">
            No rows were returned. Check that <code>SUPABASE_TABLE</code> points to a
            table with data and that your RLS policy allows reads.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5 text-left text-sm uppercase tracking-wide text-slate-300">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm text-slate-100">
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-white/[0.03]">
                    {columns.map((column) => (
                      <td key={`${rowIndex}-${column}`} className="px-4 py-3 align-top">
                        {renderCellValue(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
