# Publishing your Trip Guides site (no coding required)

Goal: get a live web address you can share — like a Squarespace site, except free
and yours. You'll do this once. After that, any change you save updates the live
site automatically within a minute or two.

The path: **GitHub** stores your files → **Cloudflare Pages** builds them into a
website and serves it. Both have free plans. You never touch a command line.

> These steps match the GitHub and Cloudflare dashboards as of mid-2026. Cloudflare
> in particular now leads with "Workers" — the static-site path you want is tucked
> behind a **Pages** tab, called out below.

---

## Before you start

Unzip `trip-guides-site.zip`. You should see a folder containing `src`,
`package.json`, `astro.config.mjs`, `README.md`, and this file. That folder's
**contents** are what you'll upload — not the zip, and not a `node_modules`
folder (there isn't one in the zip, which is correct).

---

## Part A — Put the files on GitHub

**A1. Make a free GitHub account.** Go to github.com → Sign up.
- *If email verification stalls:* check spam; you can resend from the prompt.
- *If it asks to set up two-factor (2FA):* do it — an authenticator app is fine.

**A2. Create the repository.** Click the **+** at the top-right → **New repository**
(or go to github.com/new).
- Repository name: `trip-guides` (or anything).
- Visibility: **Public** is simplest. Private also works (Cloudflare can read it
  after you grant access in Part B).
- **Do tick "Add a README file."** This gives you a normal repository page with the
  upload button visible, instead of a bare "quick setup" screen that's easy to get
  lost on. (Your upload in A3 will replace this placeholder README with the real
  one — that's expected.)
- Leave the .gitignore and license options as "None".
- Click **Create repository**.

**A3. Upload your files.** On the repo page, click the **Add file** dropdown (just
above the file list, near the green **Code** button) → **Upload files**.
- Open your unzipped folder, select **everything inside it** (the `src` folder,
  `package.json`, `astro.config.mjs`, etc.), and **drag it onto the upload area**.
  Dragging the whole folder preserves the structure automatically.
- Scroll down, keep "Commit directly to the main branch," and click the green
  **Commit changes**.
- *If dragging a folder does nothing:* use Chrome or Edge (Safari can be flaky), or
  click **choose your files** and pick the files instead. A free app called
  **GitHub Desktop** is another no-terminal option.
- *If you see "Yowza, that's a lot of files" or it stops past 100 files:* that only
  happens if a `node_modules` folder got included. The browser upload allows up to
  100 files / 25 MB each; your project is ~18 files, so just make sure you uploaded
  the zip's contents (which contain no `node_modules`).
- *If you only see a "quick setup" page full of `git` commands:* the repo was made
  empty. Either recreate it with "Add a README file" ticked, or click the small
  **"uploading an existing file"** link in that page's text.

**A4. Sanity check.** Your repo should list `src`, `package.json`,
`astro.config.mjs`, `README.md`. If `package.json` is missing, the build in
Part B will fail — re-upload it.

---

## Part B — Build & publish with Cloudflare Pages

**B1. Make a free Cloudflare account** at dash.cloudflare.com → Sign up. No credit
card needed.

**B2. Open Workers & Pages.** In the left sidebar of the dashboard, click
**Workers & Pages** — in the newer layout it sits under a **Compute** heading.

**B3. Start a project the *Pages* way.** Click **Create application** (or **Create**).
The page now leads with **Workers** options — ignore those. Find the **Pages** tab/
heading and choose **Connect to Git**. (Avoid the Workers "Import a repository"
option; for a static site like this one it can try to add a server piece you don't
need.)

**B4. Connect GitHub.** You'll be prompted to sign in with your Git provider so
Cloudflare can deploy your project; both public and private repos are supported.
When GitHub asks which repositories, choose **Only select repositories** and pick
`trip-guides`.
- *If your repo isn't listed:* click **Add account** / **Configure the GitHub app**
  and grant access to `trip-guides`, then come back — it'll appear.

**B5. Pick the repo** `trip-guides` and click **Begin setup**.

**B6. Enter the build settings** (the only screen that matters):
- **Project name:** becomes your address, e.g. `trip-guides` → `trip-guides.pages.dev`.
- **Production branch:** `main`.
- **Framework preset:** **Astro** — if Astro isn't offered, **None** is fine,
  because the build command below is all that's needed.
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- You do **not** need any adapter, plugin, or "SSR" option — this is a static site.

**B7. Click Save and Deploy.** The first build takes 1–3 minutes (it installs
things and converts your photos to fast WebP images). When it finishes you get a
live link like `https://trip-guides.pages.dev`. Open it — that's your site.

### If the build fails (open the build log; common causes)

- **"Node version" / engine error:** in your project go to **Settings → Variables**
  (or **Environment variables**), add **`NODE_VERSION`** = `20`, then **Retry
  deployment**.
- **"Could not read package.json" / install failed:** `package.json` or
  `package-lock.json` didn't upload. Re-upload them (Part A3); the build retries
  after you commit.
- **"Output directory not found":** it must be exactly `dist` (Part B6). Fix it in
  the project's build settings and retry.
- **A photo didn't load, but the site deployed:** that's the built-in safety net —
  if the build server can't fetch one Wikimedia photo, that single image falls back
  to the plain version and everything else is fine.
- **The build log names a content file** (e.g. `korea.json`): the checker is telling
  you a field is missing or mistyped — fix that file on GitHub and commit.
- **You accidentally used the Workers path and it opened a pull request adding
  config:** close/ignore that PR. For a clean start, delete the project and redo
  B3 via **Pages → Connect to Git**.

---

## Part C — Make it feel like a real site (optional)

- **Custom domain:** in your Pages project → **Custom domains → Set up a domain**.
  Registering the domain through Cloudflare wires it up automatically; an outside
  domain just needs the on-screen DNS step.
  - *DNS can take a little while* — use the `pages.dev` link meanwhile; it works
    immediately.
- **Share the `pages.dev` link** anywhere — it behaves like any other website.

---

## Part D — Changing the site later

1. On GitHub, open the guide file you want to edit (e.g.
   `src/content/guides/japan.json`) and click the **pencil** icon.
2. Make your change, scroll down, **Commit changes**.
3. Cloudflare rebuilds automatically — refresh your site in a minute or two.

**Safety net:** if an edit ever breaks the build, your **live site stays on the
last working version** — a bad save can't take the site down. The build log shows
what went wrong; fix it and commit again.

To add a whole new destination, see "How to add a new destination" in `README.md`.
