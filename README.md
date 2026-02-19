# Assignment 4 - Mutating Data (caption_votes)

This project now extends Assignment 3 by letting authenticated users **insert votes** into a Supabase table.

## What is implemented

- Google OAuth login flow via Supabase (from Assignment 3).
- Protected route at `/protected`.
- Vote form on `/protected` that POSTs to `/api/caption-votes`.
- API route that inserts a row into `caption_votes` (or a configured table).

---

## Step-by-step: how to complete Week 4

## 1) Keep your Assignment 3 auth working

You still need these env vars:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

If you deploy on Vercel, set `NEXT_PUBLIC_SITE_URL` to your production URL.

## 2) Configure mutation table/columns (important)

By default, this app inserts into:

- table: `caption_votes`
- caption id column: `caption_id`
- score column: `vote`

If your schema uses different names, add these optional env vars:

```env
CAPTION_VOTES_TABLE=caption_votes
CAPTION_VOTES_CAPTION_ID_COLUMN=caption_id
CAPTION_VOTES_SCORE_COLUMN=vote
```

## 3) Start the dev server

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 4) Submit a vote

1. Click **Go to protected page**.
2. If prompted, sign in with Google.
3. In **Rate a caption** form:
   - enter a caption ID (e.g., `42`)
   - enter score 1-5
4. Click **Submit vote**.

You should see a success message showing the inserted row.

## 5) Verify in Supabase

Open Supabase Table Editor and check `caption_votes` for a new row.

If insert fails, most likely causes:

- table/column names do not match your schema
- RLS policy does not allow authenticated insert
- score/caption_id validation fails

## 6) Deploy to Vercel and submit

1. Push to GitHub.
2. Redeploy in Vercel.
3. Add/update all env vars in Vercel.
4. Test one vote on deployed site.
5. Submit your deployed Vercel URL.

---

## Routes added/used

- `GET /auth/login` → starts OAuth
- `GET /auth/callback` → handles token exchange
- `GET /auth/logout` → clears auth cookies
- `GET /protected` → gated page with vote form
- `POST /api/caption-votes` → inserts vote row into Supabase
