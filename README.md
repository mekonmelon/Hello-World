# Assignment 3 - Auth Week (Supabase + Google OAuth)

This project builds on Assignments 1 and 2 by adding **Google OAuth** through Supabase and a **protected route**.

## What the finished app should do

- Use Google OAuth via Supabase (no client secret required).
- Protect a route (`/protected`) so only signed-in users see the gated UI.
- Redirect back to `/auth/callback` after login.
- Deploy and work on Vercel.

---

## 1) Configure Supabase Auth (Google OAuth)

1. In Supabase, go to **Authentication → Providers → Google**.
2. Paste the **Client ID** your instructor provided.
3. If your course requires "no client secret", leave it blank; if Supabase requires one for your project settings, use your Google OAuth web client secret.
4. Leave **Skip nonce checks** OFF unless your instructor explicitly says to enable it.
5. Save the provider settings.

### Important callback detail (this is the common confusion)

There are **two callback URLs** in this flow:

- **Google → Supabase callback**: this must be the Supabase callback URL shown in the provider screen, usually:
  - `https://<your-project-ref>.supabase.co/auth/v1/callback`
- **Supabase → your app callback**: this app uses:
  - `/auth/callback`

In **Google Cloud Console**, add these as authorized redirect URIs:

- `https://<your-project-ref>.supabase.co/auth/v1/callback`
- `http://localhost:3000/auth/callback` (for local testing of direct app redirects)
- `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback` (for deployed app redirects)

---

## 2) Add environment variables

Copy `.env.example` → `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

These are required for both local dev and Vercel.

---

## 3) Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and click **Sign in with Google**.

---

## 4) Verify the protected route

After signing in you should land on:

```
/protected
```

This page should show your email and a **Sign out** button.

---

## Troubleshooting: "Parsing ecmascript source code failed" on `app/page.tsx`

If localhost shows an error like `Unexpected token` in `app/page.tsx` (often near the last line), it usually means there is a merge artifact or extra brace in your local file.

1. Open `app/page.tsx` and remove any conflict markers:
   - `<<<<<<<`
   - `=======`
   - `>>>>>>>`
2. Make sure the file ends with exactly one closing `}` for the component.
3. If you want to reset to this repo's working version, run:

```bash
git checkout -- app/page.tsx
```

4. Restart the dev server:

```bash
npm run dev
```

## Troubleshooting: `Could not find the table ...` / `PGRST205`

If you see an error like `Could not find the table 'public.countries'`, your app is pointing at a table that does not exist in your Supabase project.

Fix:

1. In Supabase table editor, confirm an existing table name (for example `images` or `communities`).
2. In `.env.local`, set:

```env
SUPABASE_TABLE=images
```

3. Restart dev server:

```bash
npm run dev
```

4. If deployed on Vercel, add/update `SUPABASE_TABLE` in Vercel environment variables and redeploy.

## 5) Deploy to Vercel

1. Push to GitHub.
2. Import in Vercel.
3. Add the same env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`).
4. Redeploy.

---

## Project structure

- `app/auth/login/route.ts` → starts OAuth (PKCE) and redirects to Google.
- `app/auth/callback/route.ts` → exchanges the code for tokens and sets cookies.
- `app/auth/logout/route.ts` → clears cookies.
- `app/protected/page.tsx` → gated UI that checks Supabase session.
- `lib/auth.ts` → small helpers for PKCE + URL building.

---

## Assignment submission

Submit your deployed Vercel URL in the “Submissions” section.
