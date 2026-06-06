# Publishing your Trip Guides site (no coding required)

Goal: get a live web address you can share — like a Squarespace site, except free
and yours. You'll do this once. After that, any change you save updates the live
site automatically within a minute or two.

The path: **GitHub** stores your files → **Cloudflare Pages** builds them into a
website and serves it. Both have free plans. You never touch a command line.

---

## Before you start

Unzip `trip-guides-site.zip`. You should see a folder containing `src`,
`package.json`, `astro.config.mjs`, `README.md`, and this file. That folder's
**contents** are what you'll upload — not the zip, and not `node_modules` (there
isn't one in the zip, which is correct).

---

## Part A — Put the files on GitHub

**A1. Make a free GitHub account.** Go to github.com → Sign up.
- *If email verification stalls:* check spam; you can resend from the prompt.
- *If it asks to set up two-factor (2FA):* do it — an authenticator app is fine.
  You only need it occasionally.

**A2. Create an empty repository.** Go to github.com/new.
- Repository name: `trip-guides` (or anything).
- Visibility: **Public** is simplest. Private also works (Cloudflare can still
  read it after you grant access in Part B).
- **Do not** tick "Add a README" — your folder already has one.
- Click **Create repository**.

**A3. Upload your files.** On the new empty repo page, click the link
**"uploading an existing file"** (or **Add file → Upload files**).
- Open your unzipped folder, select **everything inside it** (the `src` folder,
  `package.json`, `astro.config.mjs`, etc.), and **drag it onto the upload area**.
  Dragging the folder keeps the structure intact.
- Scroll down, click the green **Commit changes**.
- *If dragging a folder doesn't upload the nested files (some browsers block
  this):* use Google Chrome, which handles folder drag-and-drop reliably. Or
  install **GitHub Desktop** (a free app, no command line): it lets you add the
  folder and "push" with buttons.
- *If you accidentally uploaded the `.zip` itself or a `node_modules` folder:*
  open it in the repo, click the trash icon to delete it, and commit. Neither
  belongs there.

**A4. Sanity check.** Your repo page should list `src`, `package.json`,
`astro.config.mjs`, `README.md`. If `package.json` is missing, the build in
Part B will fail — re-upload it.

---

## Part B — Build & publish with Cloudflare Pages

**B1. Make a free Cloudflare account** at cloudflare.com → Sign up. No credit
card needed for the free plan.

**B2. Open the Pages setup.** In the Cloudflare dashboard, go to
**Workers & Pages** (newer dashboards label it **Compute → Workers & Pages**).
Click **Create application → Pages tab → Connect to Git** (sometimes shown as
**Import an existing Git repository**).

**B3. Connect GitHub.** Authorize Cloudflare to see your GitHub. When asked which
repositories, you can allow just `trip-guides`.
- *If your repo isn't in the list:* click **Add account** / **Configure the
  GitHub app**, and grant access to the `trip-guides` repo (this is the usual fix
  for private repos). Come back and it'll appear.

**B4. Pick the repo** `trip-guides` and click **Begin setup**.

**B5. Enter the build settings** (this is the only screen that matters):
- **Project name:** becomes your address, e.g. `trip-guides` → `trip-guides.pages.dev`.
- **Production branch:** `main`.
- **Framework preset:** **Astro**.
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- You do **not** need any adapter, plugin, or "SSR" option — this is a static site.

**B6. Click Save and Deploy.** The first build takes 1–3 minutes (it installs
things and converts your photos to fast WebP images). When it finishes, you get a
live link like `https://trip-guides.pages.dev`. Open it — that's your site.

### If the build fails (read the build log; here are the common causes)

- **"Node version" / engine error:** add an environment variable. In your Pages
  project → **Settings → Variables and Secrets** (or **Environment variables**),
  add **`NODE_VERSION`** = `20`, then **Retry deployment**.
- **"Could not read package.json" / install failed:** `package.json` or
  `package-lock.json` didn't upload. Re-upload them (Part A3) and the build
  retries on its own after you commit.
- **"Output directory not found":** the output directory must be exactly `dist`
  (Part B5). Fix it in **Settings → Builds & deployments** and retry.
- **A photo didn't load, but the site deployed:** that's the built-in safety net
  working — if the build server can't fetch one Wikimedia photo, that single
  image falls back to the plain version and everything else is fine. Re-deploying
  later usually picks it up.
- **Anything else:** the build log names the file and line. If it's a content
  file (e.g. `korea.json`), the checker is telling you a field is missing or
  mistyped — fix that file on GitHub and commit.

---

## Part C — Make it feel like a real site (optional)

- **Custom domain:** in your Pages project → **Custom domains → Set up a domain**.
  If you register the domain through Cloudflare, it wires up automatically; an
  outside domain just needs you to follow the on-screen DNS step.
  - *DNS can take a little while to take effect* — use the `pages.dev` link in the
    meantime; it works immediately.
- **Share the `pages.dev` link** anywhere — it behaves like any other website.

---

## Part D — Changing the site later

1. On GitHub, open the guide file you want to edit (e.g.
   `src/content/guides/japan.json`) and click the **pencil** icon.
2. Make your change, scroll down, **Commit changes**.
3. Cloudflare notices the change and rebuilds automatically — refresh your site in
   a minute or two.

**Safety net:** if an edit ever breaks the build, your **live site stays on the
last working version** — a bad save can't take the site down. The build log shows
what went wrong; fix it and commit again.

To add a whole new destination, see "How to add a new destination" in `README.md`.
