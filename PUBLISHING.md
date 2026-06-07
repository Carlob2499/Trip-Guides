# Publishing your Trip Guides site (no coding required)

Goal: get a live web address you can share — like a Squarespace site, except free
and yours. You'll do this once. After that, any change you save updates the live
site automatically within a minute or two.

The path: **GitHub** stores your files → a **host** builds them into a website and
serves it. Both have free plans, and you never touch a command line.

> Steps verified against the current dashboards (mid-2026). **Use Netlify (Part B).**
> Cloudflare now funnels static sites through its "Workers" flow, which tries to add
> a server piece this site doesn't need and fails — see Part B-ALT if you must use
> Cloudflare.

---

## Before you start

Unzip `trip-guides-site.zip`. You'll see a folder with `src`, `package.json`,
`astro.config.mjs`, `README.md`, and this file. That folder's **contents** are what
you upload — not the zip, and not a `node_modules` folder (there isn't one, which is
correct).

---

## Part A — Put the files on GitHub

**A1.** Make a free account at github.com → Sign up. (If it asks for two-factor
sign-in, set it up with an authenticator app.)

**A2.** Click the **+** at top-right → **New repository** (or go to github.com/new).
Name it `trip-guides`, leave it **Public**, and **tick "Add a README file"** so the
upload button is visible on the next page. Leave .gitignore/license as "None". Click
**Create repository**.

**A3.** On the repo page, click **Add file → Upload files**. Open your unzipped
folder, select **everything inside it**, and drag it onto the upload area (the folder
structure is preserved). Scroll down and click **Commit changes**. Your `README.md`
replaces the placeholder — that's expected.
- *Folder drag does nothing?* Use Chrome/Edge, or click **choose your files**.
- *"Yowza, that's a lot of files"?* You included `node_modules` by mistake — it's not
  in the zip, so just upload the zip's contents (~19 files).

**A4.** Confirm the repo lists `src`, `package.json`, `astro.config.mjs`. If
`package.json` is missing, re-upload it.

---

## Part B — Publish with Netlify  ✅ recommended

**B1.** Create a free account at netlify.com.

**B2.** In your Netlify dashboard, click **Add new project → Import an existing
project**.

**B3.** Choose **GitHub** and follow the prompts to authorize Netlify. When asked,
grant access to your `trip-guides` repository.

**B4.** Pick `trip-guides`. Netlify auto-detects Astro and pre-fills the settings:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
Leave them as detected (these are correct). No adapter or extra setup is needed —
this is a static site.

**B5.** Click **Deploy** (or **Publish**). The first build takes ~1–3 minutes (it
also converts your photos to fast WebP images). You'll get a live link like
`https://yourname.netlify.app`. Open it — that's your site.

After this, every change you commit on GitHub rebuilds the site automatically.

### If a Netlify build fails (open the deploy log)

- **Node version error:** in the site's **Site configuration → Build & deploy →
  Environment**, add an environment variable **`NODE_VERSION`** = `22`, then
  **Trigger deploy → Deploy site**.
- **The log names a content file** (e.g. `korea.json`): the built-in checker caught a
  typo or missing field — fix that file on GitHub and commit.
- **A photo didn't load but the site deployed:** the safety net worked — that one
  photo fell back to the plain version; everything else is fine.

### Custom domain (optional)

In Netlify: **Domain management → Add a domain**. Until DNS settles, use the
`netlify.app` link — it works immediately.

---

## Part B-ALT — Publish with Cloudflare (only if you specifically want it)

Cloudflare's dashboard now pushes the **Workers** path, which auto-runs
`astro add cloudflare` and breaks static sites. The included **`wrangler.jsonc`**
file prevents that — make sure it's in your GitHub repo (it's in the zip; if you
uploaded before this version, add it via **Add file → Create new file**, name it
`wrangler.jsonc`, paste the contents, commit).

Then: dashboard → **Workers & Pages → Create application → Pages tab → Connect to
Git** → pick `trip-guides` → set **Framework preset: Astro**, **Build command:**
`npm run build`, **Build output directory:** `dist` → **Save and Deploy**. If a
previous broken Workers project exists for this repo, delete it first
(**its Settings → Delete project**).

---

## Part C — Changing the site later

1. On GitHub, open the guide file (e.g. `src/content/guides/japan.json`), click the
   **pencil** icon, edit, and **Commit changes**.
2. Your host rebuilds automatically — refresh in a minute or two.

**Safety net:** if an edit breaks the build, your **live site stays on the last
working version**; the deploy log shows what to fix. To add a whole new destination,
see "How to add a new destination" in `README.md`.
