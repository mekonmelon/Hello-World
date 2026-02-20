# Week 4 - Captions + Images + Voting

This app now supports:
- Google-authenticated users
- showing **one caption/image at a time** from Supabase
- submitting **upvote (+1)** or **downvote (-1)** into `caption_votes`

## 1) Why your deploy failed

Your Vercel log showed:

`Can't resolve '@/utils/supabase/server'`

That file/module does not exist in this repo. The app now uses existing local helpers and direct Supabase REST calls, so no `@/utils/supabase/server` import is needed.

## 2) Environment variables

Copy:

```bash
cp .env.example .env.local
```

Then set real values for:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

Optional schema mapping vars are in `.env.example` for captions/images/votes.

## 3) Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, then click **Go to protected page (Week 4 form)**.

## 4) Vote flow

1. Sign in.
2. You will see one caption card at a time with image (if found).
3. Click **Upvote (+1)** or **Downvote (-1)**.
4. App inserts a row into `caption_votes`.

## 5) Supabase checks if inserts fail

- `caption_votes` table/column names match env vars.
- If your table requires `user_id`, set `CAPTION_VOTES_USER_ID_COLUMN=user_id`.
- RLS policy allows authenticated insert.

## 6) Deploy

Set the same env vars in Vercel Project Settings, redeploy, then test one vote on production.
