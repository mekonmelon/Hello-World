# Week 4 - Captions + Images + Voting

This version does exactly what you asked:
- pulls captions/images from Supabase
- shows one image+caption at a time
- lets logged-in users upvote (`+1`) or downvote (`-1`)
- writes votes into `caption_votes`

## Why your deploy was failing

Your Vercel log error:

`Module not found: Can't resolve '@/utils/supabase/server'`

means your code referenced a file path that doesn't exist in this repo. The app now uses local files under `lib/` and no longer depends on `@/utils/supabase/server`.

---

## Exact environment variables to set

Based on your screenshots, these are the values you should use in **Vercel Project Settings → Environment Variables** and in local `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
NEXT_PUBLIC_SITE_URL=https://YOUR-VERCEL-URL.vercel.app

CAPTIONS_TABLE=captions
CAPTIONS_ID_COLUMN=id
CAPTIONS_TEXT_COLUMN=content
CAPTIONS_PUBLIC_COLUMN=is_public
CAPTIONS_IMAGE_ID_COLUMN=image_id
IMAGES_TABLE=images
IMAGES_ID_COLUMN=uuid
IMAGES_URL_COLUMN=url
CAPTIONS_LIMIT=25

CAPTION_VOTES_TABLE=caption_votes
CAPTION_VOTES_CAPTION_ID_COLUMN=caption_id
CAPTION_VOTES_VOTE_COLUMN=vote_value
CAPTION_VOTES_USER_ID_COLUMN=profile_id
```

If your captions table directly stores URL text, also set:

```env
CAPTIONS_IMAGE_URL_COLUMN=image_url
```

(If not, leave it as-is and image lookup will use `image_id -> images.uuid -> images.url`.)

---

## Local run checklist

1. Copy template:

```bash
cp .env.example .env.local
```

2. Fill real values.
3. Start app:

```bash
npm install
npm run dev
```

4. Open `http://localhost:3000`.
5. Click **Go to protected page (Week 4 form)**.
6. Sign in.
7. Click **Upvote (+1)** or **Downvote (-1)**.
8. Verify row inserted in `caption_votes` (`vote_value`, `profile_id`, `caption_id`).

---

## If vote insert fails

Check these first:
- `CAPTION_VOTES_VOTE_COLUMN=vote_value` (your table uses `vote_value`, not `vote`)
- `CAPTION_VOTES_USER_ID_COLUMN=profile_id`
- RLS policy allows authenticated inserts
- `caption_id` type matches (uuid in your screenshots)

---

## Deploy checklist

1. Push code.
2. In Vercel, set the same env vars for Production/Preview.
3. Redeploy.
4. Test one vote on deployed app.
