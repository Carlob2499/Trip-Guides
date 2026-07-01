# Research pass — fill a Guide-to-be to verified standard

You are performing a **research pass** on one draft ("Guide-to-be") in this repo. The
draft is a scaffold: the structure, checklists, and live data sections (map / weather /
holidays / currency) are in place, but the content is empty. Your job is to fill it with
**primary-source-verified facts** and move it toward the polish of `denmark.json` /
`korea.json` — without ever pretending unverified information is verified.

## Read first (in this order)

1. **`CLAUDE.md`** (repo root) — the accuracy standard. It is binding. In particular:
   training data is a starting point, not a source; reach the **primary** source; `≈`
   means *checked, roughly this*; when you can't verify, leave an honest blank, never a
   confident guess; distinguish fact from recommendation.
2. The **target guide**: `src/content/guides/<slug>.json` (the one on this branch — a
   `new-guide/<slug>` branch names the slug; otherwise you'll be told which).
3. The **intake spec** `guides-intake/<slug>.md` **if it exists** — it holds the traveler,
   dates, and *ranked priorities* that decide which sections get depth. If it's absent
   (stripped drafts have none), infer a sensible general-purpose scope from the country and
   note that no intake was provided.
4. **`NEW_GUIDE_INTAKE.md`** — the order-of-operations for how intake drives research.
5. **`src/content.config.ts`** — the section schema. Every field you write must validate.
6. **`src/content/guides/denmark.json`** — the gold standard for shape, depth, and voice.

## How to research

- Use **web search + web fetch** to reach primary sources (official sites, government
  portals, operator pages, official transit sites). Aggregators (review sites, wikis,
  blogs) are leads, not authorities — never cite them for a specific fact.
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
