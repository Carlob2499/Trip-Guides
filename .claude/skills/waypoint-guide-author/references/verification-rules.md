# Verification Rules — Waypoint Guide Author

**What this is.** The decision layer that separates a shippable fact from a
flagged one from an omitted one. The block-type catalog tells you *where* a
fact goes; this file tells you *whether it may go there at all, and in what
state*. When authoring or researching a guide, these rules are binding.

**The one-line bar** ("The bar", from CLAUDE.md): before writing any fact,
ask — *"Could a generic AI have written this from training data alone, without
research and without knowing this traveler?"* If yes, it fails. Verify it,
personalize it, or cut it.

---

## 1. The four gates (from CLAUDE.md — binding, not restated here)

A guide is not done unless it passes all four: **Verified · Personal ·
Actionable · Honest** (full definitions in `CLAUDE.md`, which auto-loads). This
file is the operational decision layer *underneath* those gates: for a given
fact, whether it may ship at all and in what state. If you can't satisfy a gate
for a fact, that fact isn't ready — flag or omit it (§4). Never paper over a
failed gate.

---

## 2. Classify the fact first: perishable vs. durable

Only **perishable** facts require a source + date. Deciding this correctly is
what keeps verification effort proportionate.

- **Perishable — always needs a source + verification date.** Prices, opening
  hours, event rosters/dates, transit schedules and fares, booking rules,
  seasonal availability, "is it still open," visa/entry rules, exchange rates.
  These age; an unsourced perishable fact is a liability.
- **Durable — does not need a live source, but must still be correct.**
  Physical addresses, geographic relationships, what a place fundamentally is,
  historical facts, a neighborhood's character. Stable, but still never
  invented — if unsure, confirm or omit.

**Rule:** if a fact could be wrong *because time passed since you last
checked*, it is perishable and the date rules apply.

---

## 3. What counts as a source (quality hierarchy)

Use the highest tier available; drop a tier only when the one above doesn't
exist for that fact. Cite up the ladder, never down.

1. **T0 · primary / official** — the venue's own site, the official transit
   operator, the government entry-rules page, the event's official page.
   Required for prices, hours, booking rules, entry rules. **This is what you
   cite — reach it for every specific fact.**
2. **T1 · authoritative secondary** — an operator aggregator or a domain
   reference the community treats as canonical (e.g. Leek Duck for GO event
   data). Fine for facts that primary sources publish poorly, if named.
   Prefer to trace back to the T0 it cites.
3. **T2 · cross-checked general** — two independent reputable sources
   agreeing. Acceptable only for durable facts, never for a price or an hour
   on its own. Review sites, wikis, blogs, forums, and AI answers are **leads
   only** — use them to *find* the T0 source; never cite them for a fact.

Never source a perishable fact from: a single blog, a forum post, an
undated page, or your own training memory. If that's all that exists, the
fact is unverified — flag or omit it.

**Adversarial check before you trust a fact:** spend one search trying to
*disprove* what you just found ("X closed", "X moved", "X price 2026"), not
only to confirm it. A first result that matches your expectation is not
verification — see `~/.claude/CLAUDE.md` rule #10 (confirmation bias).

**Conflicting sources:** do not average or pick silently. Record the range and
flag it (see the denmark guide's "Akershus interior price (≈150 NOK — conflicting
sources)"). Surfacing the conflict *is* the honest answer.

---

## 4. Ship / flag / omit — the core decision

For each fact, exactly one outcome:

| State | When | How it's written |
|-------|------|------------------|
| **Ship clean** | Durable fact, correct; or perishable fact confirmed from a primary source today | Plain text. The guide-level `verified` stamp covers the date. |
| **Ship with `≈`** | You found the official figure but it varies, is dynamic, or is a close estimate (dynamic pricing, "about 60–70 min," a fare that shifts) | Prefix the figure: `≈₩4,050`, `≈08:30`. Means *sourced but approximate — verify before paying/relying*. |
| **Ship with `⚠`** | The fact matters but you could **not** confirm it online, or it's known to change (a schedule that's been altered before, hours you couldn't reach) | Inline warning in the prose: `⚠ confirm exact times against your booking`. Means *act on this only after checking*. |
| **Omit** | You can't confirm it and it isn't load-bearing | Leave it out. A missing price is honest. Say nothing rather than guess. |
| **Placeholder** | A `map` point's `place_id` you haven't verified | The literal string `__VERIFICATION_REQUIRED__` in the `place_id` field — never a guessed ID. |

**The two hard lines:**
- A guessed figure wearing a `≈` is a fabrication. `≈` means *sourced-and-
  approximate*, never *plausible-and-unchecked*.
- A `⚠` is not a license to write an unverified number as if it were real. It
  flags a **known gap**, not a disguised guess.

---

## 5. Per-fact-type minimums

**Every venue/restaurant entry answers four questions** (else it's not
Actionable — cut it or complete it):
1. **Where?** Exact address, local script + romanized where relevant.
2. **How from base?** Transit route + approximate time.
3. **When does it fit?** Best day, and why.
4. **Book?** Walk-in / reserve online / call ahead.

**Prices** — currency + figure + basis (per person / per group / per day).
Perishable: source + date, or `≈`, or omit.

**Hours** — primary source only. If unreachable, `⚠` and tell the reader to
check; never publish an unconfirmed hour as fact.

**Transit fares/times** — official operator. Times that vary get `≈` or a
range. Name the specific service (line, bus number), not "a bus."

**Events / rosters** — official event page (T0) or the canonical domain
source (T1, named). These age fastest; carry a per-section date if the
guide-level stamp is older.

**Entry / visa rules** — official government page only, and state the
assumed passport ("assumes a US passport; on another, check your own").

**Photos (`img.file`)** — must be an exact Wikimedia Commons `File:` page
filename that you confirmed exists. If unsure, omit the image. Never guess a
filename.

**Prose HTML** — allowlist is `<p> <b> <i> <a> <ul> <li> <ol>` only. Reaching
for anything else means the content wants a typed section, not richer prose.

---

## 6. Verification stamps

**Guide-level `verified` field** — not just a date. Write it as:
`Checked [date] for the [trip] · ` then (a) what was confirmed and from where,
and (b) an explicit **re-check** list of the most perishable items before
travel. Match the pattern in the korea / denmark guides — the stamp doubles as
the reader's pre-trip re-verification checklist.

**On drafts** the stamp stays `⚠`-prefixed (it renders as the masthead warning
pill) with the date + re-check list riding along. Dropping the `⚠` / `draft`
is the human graduation call, never yours.

**Per-section stamps** — sections whose facts age fastest (restaurant hours,
event rosters) should carry their own verified date where practical, since the
guide-level date will drift past them.

**On every edit** — CLAUDE.md already binds you to date a changed fact on write
and to run the continuity sweep ("Editing a Guide — Continuity Is Mandatory").
What that means here: one changed fact ripples into splits, counts, day plans,
and *other stamps* — grep the whole guide, not just the edited section.

---

## 7. Stopping conditions (when to mark incomplete, not fill)

Stop and leave an honest blank — do **not** improvise — when:

- The only available source for a perishable fact is a blog/forum/undated page
  or your own memory.
- Sources conflict and you can't determine which is current (record the range,
  flag it, move on).
- A priority calls for a section you can't research to standard within scope
  (mark the section a draft stub rather than filling it generically).
- Completing the fact would require a live check you can't perform in this
  environment (e.g. no network) — flag it for a networked research pass.

An admitted "couldn't confirm — check before you go" is a passing outcome. A
smooth, confident, unverified paragraph is a failing one.

---

## 8. Self-check before declaring done

1. **The bar** applied to the whole draft, item by item — for each load-bearing pick (an
   anchor rec, a marquee sight/food choice, a party-fit claim; `docs/GUIDE_RUBRIC.md` rows
   #6/#9/#12), ask: *"Would this appear in ANY generic AI guide, unresearched, without
   knowing this traveler?"* If yes: **replace** it with something this traveler's own
   ranked priorities actually justify, or **write the justification down** — don't just cut
   silently or wave it through because it isn't factually wrong. Anything a generic AI
   could have written unresearched is cut, verified, or explicitly justified — never left
   bland-but-technically-correct and unflagged. Any replacement re-enters gate #2 below
   (source + date) and the continuity sweep (CLAUDE.md) for whatever it ripples into — a
   rewrite that orphans a citation is a defect, not progress. Record the outcome even when
   nothing needed changing ("bar test: clean, no replacements") — silence reads as "not run".
2. Every perishable fact has a source + date, an `≈`, a `⚠`, or is omitted —
   nothing perishable sits bare.
3. Every venue answers the four questions.
4. Every `img.file` confirmed on Commons; every unverified `place_id` is the
   literal placeholder.
5. No prose body uses a tag outside the allowlist.
6. Guide-level `verified` stamp written with its re-check list.
7. `npm run build` passes with zero schema errors; the fact is confirmed in
   `dist/`, not just source.

If any check fails, the guide is not done — fix or flag, then re-run.
