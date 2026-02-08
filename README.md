# Assignment 2 - Connecting Next.js to Supabase

This project extends Assignment 1 by reading rows from an existing Supabase table and rendering them in a list/table UI.

## What the finished app should do

- Uses your existing Next.js app from Assignment 1.
- Reads Supabase connection values from environment variables (no hardcoded keys).
- Fetches rows from a pre-existing table.
- Renders those rows in a table on the home page.
- Deploys successfully on Vercel with the same env vars configured.

## 1) Configure environment variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Then fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_TABLE=countries
SUPABASE_SELECT=*
SUPABASE_LIMIT=20
```

Notes:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required.
- `SUPABASE_TABLE`, `SUPABASE_SELECT`, and `SUPABASE_LIMIT` are optional helpers for this assignment.
- If your anon key was posted publicly (for example in a screenshot), rotate it in Supabase.

## 2) Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

You should see:
- A **Supabase Data Viewer** heading.
- A table with rows from the configured table.
- Helpful empty/error states if config or permissions are wrong.

## 3) If data does not show

Check these common issues:

1. Table name mismatch (`SUPABASE_TABLE`).
2. Row Level Security policy blocks reads for anon users.
3. Missing env vars or typo in `.env.local`.
4. Empty table (no rows yet).

## 4) Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project into Vercel.
3. In Vercel project settings, add the same environment variables from `.env.local`.
4. Redeploy.
5. Open the deployed URL in an incognito window and confirm rows render.

## 5) Submit

Submit your deployed Vercel URL in your class submissions area.

---

## Implementation overview

- `lib/supabase.ts` builds a REST request to Supabase using env vars and fetches rows.
- `app/page.tsx` is an async server component that loads rows and renders them in a dynamic table.
- `.env.example` documents required and optional configuration.
