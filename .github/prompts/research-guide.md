# Research pass — fill a Guide-to-be to verified standard

You are performing a **research pass** on one draft ("Guide-to-be") in this repo. The
draft is a scaffold: the structure, checklists, and live data sections (map / weather /
holidays / currency) are in place, but the content is empty. Your job is to fill it with
**primary-source-verified facts** and move it toward the polish of `denmark.json` /
`korea.json` — without ever pretending unverified information is verified.

## Read first (in this order)

`CLAUDE.md` (repo root) is already auto-loaded into your context — don't re-Read
it. Its accuracy standard is binding. In particular: training data is a starting
point, not a source; reach the **primary** source; `≈` means *checked, roughly
this*; when you can't verify, leave an honest blank, never a confident guess;
distinguish fact from recommendation.

1. The **target guide**: `src/content/guides/<slug>.json` (the one on this branch — a
   `new-guide/<slug>` branch names the slug; otherwise you'll be told which).
2. The **intake spec** `guides-intake/<slug>.md` **if it exists** — it holds the traveler,
   dates, and *ranked priorities* that decide which sections get depth. If it's absent
   (stripped drafts have none), infer a sensible general-purpose scope from the country and
   note that no intake was provided.
3. **`docs/NEW_GUIDE_INTAKE.md`** — the order-of-operations for how intake drives research.
4. **`src/content.config.ts`** — the section schema. Every field you write must validate.
5. **`src/content/guides/denmark.json`** — the gold standard for shape, depth, and voice.

## How to research

- **Source-tier ladder** — rank every source before trusting it; cite up the ladder,
  never down. Use **web search + web fetch** to climb it:
  - **T0 · primary / first-party** — official site, government portal, operator page,
    official transit site, direct documentation. **This is what you cite.** Reach it
    for every specific fact.
  - **T1 · authoritative secondary** — a reputable, edited reference reporting a
    primary fact. Usable only when T0 is unreachable; prefer to trace back to the T0
    it cites.
  - **T2 · aggregators / UGC** — review sites, wikis, blogs, forums, AI answers.
    **Leads only** — use them to *find* the T0 source; never cite them for a fact.
- Apply the project's **price/answer flags** exactly:
  - `≈` — you found the official source and the figure is approximately this.
  - `⚠` — hours/details could not be confirmed online; flag for a human to check.
  - A **missing** price is honest. A guessed price with `≈` is not. Omit rather than invent.
- **Restaurants** must answer the 4 questions (where / how to get there / when it fits /
  do I need to book) — see `CLAUDE.md` "Content Standards".
- **Photos**: every `sights` `img.file` must be an **exact Wikimedia Commons `File:`
  page** you have confirmed exists. If unsure, omit the image — do not guess a filename.
- **Prioritize** per the intake's ranked top 2–3 (depth there, light touch elsewhere). If
  asked to target one section (e.g. "food"), do only that section this pass.
- **Keep a verification ledger as you go** — one row per perishable fact, so the source
  and checked-on date the standard requires are captured *while* researching, not
  reconstructed afterward:

  | Claim | Value | Source (tier + URL) | Checked | Flag |
  |-------|-------|---------------------|---------|------|
  | Museum X admission | ≈ €12 adult | T0 — official site /visit | 2026-07-01 | ≈ |
  | Opening hours | Tue–Sun 10–18 | T0 — official site | 2026-07-01 | (exact) |

  The ledger doubles as your source list and your `⚠` punch-list for the finish summary.
- **Adversarial check before you trust a fact** — spend one search trying to *disprove*
  what you just found ("X closed", "X moved", "X price 2026"), not only to confirm it. A
  first result that matches your expectation is not verification; it may be a second copy
  of the same error (the global confirmation-bias rule). Seek the primary source and
  read it critically, rather than stopping the moment something says the expected thing.

## Rules (do not break)

- Edit **only** the target guide's `src/content/guides/<slug>.json` (and, if it exists, add
  research notes to its `guides-intake/<slug>.md`). **Never touch other guides.**
- **Keep `draft: true`.** Do **not** remove it, do **not** merge. Graduating a guide to the
  curated grid is a human decision made after review.
- Fields must match the schema in `src/content.config.ts`. Prose bodies use only the
  allowed inline tags (`<p><b><i><a><ul><li><ol>`); anything richer means a typed section.
- After editing, run **`npm run build`** and fix any schema errors before you finish.
- Leave the map/weather/holidays sections intact (they're already wired to live data).

## Finish

- Commit your changes to the current branch with a clear message.
- Post (or output) a **summary**: what you researched and sourced, what you filled, what
  remains `⚠` unconfirmed, and the specific items a human must still verify before this
  guide should drop `draft` and graduate. Be candid about coverage — an honest "I couldn't
  confirm X" beats a fabricated X.
- Include the **verification ledger** (the table above) with the summary — it is the
  source list and the re-check schedule for every perishable fact you added.
