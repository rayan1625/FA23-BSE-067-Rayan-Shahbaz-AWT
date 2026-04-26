# Deploy AdFlow Pro (production)

This app is **Next.js 14**. Host it on **Vercel** under your own account.

## Your Vercel dashboard

Use this team / project space (sign in with GitHub or email if asked):

**[https://vercel.com/rayan-shahbaz-projects-6abbf6f8](https://vercel.com/rayan-shahbaz-projects-6abbf6f8)**

All steps below assume you are logged in and, when importing a repo, the new project is created **in this Vercel scope** (same account/team as that URL).

---

## Deploy from the dashboard (recommended)

1. **Push code to GitHub**  
   Commit `03-AdFlow-Pro-AI` (or your whole monorepo) so Vercel can see it.

2. **Open your Vercel space**  
   Go to: [vercel.com/rayan-shahbaz-projects-6abbf6f8](https://vercel.com/rayan-shahbaz-projects-6abbf6f8)

3. **Add a project**  
   Click **Add New…** → **Project** → **Import** your GitHub repository.

4. **Monorepo: set root directory**  
   If the repo root is `Rayan-Shahbaz-fa23bcs-030-A--web` (parent folder), set:
   - **Root Directory:** `03-AdFlow-Pro-AI`  
   - Expand *“Root Directory”* in the import screen and edit it before the first deploy.

5. **Framework**  
   Vercel should detect **Next.js**. Leave default **Build Command** (`npm run build`) and **Output** as-is.

6. **Environment variables** (before or after first deploy)  
   In **Project → Settings → Environment Variables**, add for **Production** (and Preview if you want):

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

7. **Deploy**  
   Click **Deploy**. When it finishes, open the **`.vercel.app`** URL Vercel shows.

8. **If the first build failed**  
   Fix errors (often ESLint during `npm run build`), push again, or hit **Redeploy** in Vercel.

---

## Deploy with the CLI (same Vercel account)

From the **`03-AdFlow-Pro-AI`** folder:

```bash
npm i -g vercel
vercel login
```

When linking, pick the **scope** that matches **Rayan Shahbaz’s projects** / your team so the project appears under [that dashboard](https://vercel.com/rayan-shahbaz-projects-6abbf6f8).

```bash
cd path/to/03-AdFlow-Pro-AI
vercel link    # follow prompts; choose correct team & project (or create new)
vercel --prod
```

---

## Single-repo vs monorepo

| Your Git setup | What to set on Vercel |
|----------------|------------------------|
| GitHub repo = **only** `03-AdFlow-Pro-AI` | Root Directory = `.` / leave default |
| GitHub repo = **whole** `Rayan-Shahbaz-fa23bcs-030-A--web` | Root Directory = **`03-AdFlow-Pro-AI`** |

---

## Build check on your PC

```bash
cd 03-AdFlow-Pro-AI
npm run build
```

Resolve any failures before expecting Vercel to pass.

---

## Security

- Do **not** commit `.env.local`.
- Put secrets only in **Vercel → Project → Environment Variables**.

---

## Optional: Netlify

Next.js is simplest on Vercel. Netlify needs extra Next.js integration; prefer Vercel for this repo.
