# Publishing your Trip Guides site (no coding required)

Goal: get a live web address you can share — like a Squarespace site, except free
and yours. You'll do this once. After that, any change you save updates the live
site automatically within a minute or two.

The path: **GitHub** both stores your files **and** builds + serves the website,
using **GitHub Pages**. It's free, and you never touch a command line.

> This site is published with **GitHub Pages** (Part B). The repository already
> includes the build recipe (`.github/workflows/deploy.yml`), so once you switch
> Pages on, every change you commit rebuilds and redeploys automatically.

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
Name it **`Trip-Guides`**, leave it **Public**, and **tick "Add a README file"** so
the upload button is visible on the next page. Leave .gitignore/license as "None".
Click **Create repository**.

> **Important — the name must match one setting.** GitHub Pages serves the site at
> `your-username.github.io/REPO-NAME/`, and that path has to match the `base` line
> in `astro.config.mjs` (currently `base: '/Trip-Guides'`). If you name the repo
> something other than `Trip-Guides`, open `astro.config.mjs` and change `base` to
> `'/your-repo-name'` to match, or the links and images will 404.

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

## Part B — Publish with GitHub Pages  ✅

No second account needed — GitHub itself builds and hosts the site. The build
recipe is already in the repo (`.github/workflows/deploy.yml`); you just switch
Pages on once.

**B1.** On your repository page, click the **Settings** tab (top of the repo, far
right).

**B2.** In the left sidebar, click **Pages** (under "Code and automation").

**B3.** Under **Build and deployment → Source**, change the dropdown from "Deploy
from a branch" to **GitHub Actions**. That's the only setting to change — there's
nothing to save separately; the choice takes effect immediately.

**B4.** Click the **Actions** tab (top of the repo). You'll see a workflow named
**"Deploy to GitHub Pages"** running (it starts on every push to `main`, and
switching Pages on triggers one). The first run takes ~1–3 minutes (it also
converts your photos to fast WebP images). Wait for the green check.

**B5.** Back in **Settings → Pages**, your live link appears at the top:
`https://your-username.github.io/Trip-Guides/`. Open it — that's your site.

After this, every change you commit on `main` rebuilds and redeploys automatically.

### If a build fails (open the Actions tab → click the red run)

- **Node version error** (`Astro requires Node >= …`): the workflow already pins
  Node 22 in `.github/workflows/deploy.yml`. If you see this, confirm that file is
  present and unedited.
- **The log names a content file** (e.g. `korea.json`): the built-in checker caught
  a typo or missing field — fix that file on GitHub and commit; the rebuild is
  automatic.
- **Pages shows a 404 after a successful build:** the `base` in `astro.config.mjs`
  must match your repo name (`/Trip-Guides`). See the note under A2.
- **A photo didn't load but the site deployed:** the safety net worked — that one
  photo fell back to the plain version; everything else is fine.

### Custom domain (optional)

In **Settings → Pages → Custom domain**, add your domain and follow the DNS
prompts. Until DNS settles, the `github.io` link works immediately. (With a custom
domain at the root, you'd also set `base: '/'` in `astro.config.mjs`.)

---

## Part C — Changing the site later

1. On GitHub, open the guide file (e.g. `src/content/guides/japan.json`), click the
   **pencil** icon, edit, and **Commit changes**.
2. Your host rebuilds automatically — refresh in a minute or two.

**Safety net:** if an edit breaks the build, your **live site stays on the last
working version**; the deploy log shows what to fix. To add a whole new destination,
see "How to add a new destination" in `README.md`.
