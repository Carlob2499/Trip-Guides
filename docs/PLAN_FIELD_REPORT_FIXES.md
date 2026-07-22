# Grand Plan — Field-Report Fixes (the active execution queue)

Executes the roadmap of `docs/FIELD_REPORT_2026-07-22.md` (the evidence base — read it only
when a session needs the *why*). Eight sessions, E1→E8, each independently shippable.
**This plan absorbs and supersedes sessions F0, F3, and F8 of `PLAN_TRAVELER_FEATURES.md`**
(marked "moved" there); F1/F2/F4/F5/F6/F7 remain in that plan, sequenced after this one.

**Creator decisions already made (2026-07-22, via AskUserQuestion — do not re-ask):**
Korea AND Denmark both get provenance backfill + strict flip (Denmark via fresh re-verification
today, never invented backdates) · the OAuth secret is in place and was confirmed valid
2026-07-20 (commits `e11dd7b`→`389b229`) · entry cards research **US + additional passports**
(the additional countries are an E6 session-start clarifier — the creator chose "+ other" without
naming them) · route optimizer is **tap-to-apply**, not suggest-only.

## Binding rules for every session (the error-elimination contract)

1. **Model & switching.** Each session header names its model; the executor switches via
   `/model` at session start without asking (Medium effort assumed). Default **Sonnet**;
   **Opus** only where the header says so.
2. **Clarifying-Questions Doctrine (CLAUDE.md) applies.** Open every session by
   `AskUserQuestion`-ing its *Clarifying questions* block (plus any newly-warranted); wait for
   explicit go. A mid-session fork gets the same treatment.
3. **Line-drift rule.** File:line references were verified 2026-07-22. If a reference doesn't
   match, grep for the quoted code instead of trusting the number. If the code is genuinely
   absent, STOP and re-read the surrounding file — do not improvise a different fix — then note
   the drift in the commit body.
4. **Ship loop on every change** (CLAUDE.md): `npm run build` → `npm test` →
   `npm run typecheck` (no new hints) → `astro preview` :4322 at 375px + desktop + dark +
   reduced-motion where UI changed → grep `dist/` for stale strings → commit (message prefix
   given per session) → push `main`. Workflow-only changes still run build+test (guard against
   accidental script edits) and are additionally reviewed by re-reading the full modified YAML
   top-to-bottom before commit.
5. **Every behavior change lands WITH its test in the same commit.** A fix without a test that
   fails-before/passes-after is not done. Never weaken an existing assertion to make a test
   pass — if one breaks, the change is wrong until proven otherwise.
6. **Fact edits happen only inside the `waypoint-guide-author` skill** (E4/E5/E6) — never in
   code sessions. Code sessions never touch guide JSON facts; research sessions never touch
   code. Do not touch: `learnings/` content, `TRAVELER_PATTERNS.md`, raw `verified` blobs
   outside the backfill scope defined below.
7. **One commit per numbered task; never batch sessions.** End each session by rewriting
   `docs/HANDOFF.md` (Snapshot + Where-we-left-off, naming the next session) and committing.

## Model & time budget

| Session | Model | Est. active | Prefix |
|---|---|---|---|
| E1 fail-closed publish gate | Sonnet | 1.5–2.5 h | `fix(pipeline):` |
| E2 prove the pipeline (was F0) | **Opus** driver (workflow agent stays Sonnet) | 1.5–3 h + 1–2 h wall-clock | `fix(pipeline):` |
| E3 strict undated-figure gate | Sonnet | 1–2 h | `feat(verify):` |
| E4 Korea backfill → strict | Sonnet (guide-author skill) | 3–4 h | `research(korea):` |
| E5 Denmark backfill → strict | Sonnet (guide-author skill) | 3–4 h | `research(denmark):` |
| E6 entry + phrases (was F3) | Sonnet (guide-author skill) | 2–3 h | `research(content):` |
| E7 route optimizer, tap-to-apply (was F8) | Sonnet (Opus if the geometry fights) | 3–4 h | `feat(route-opt):` |
| E8 hygiene sweep | Sonnet / Haiku | 1–1.5 h | `chore:` |
| **Total** | | **≈ 17–24 h active** | |

**Order is load-bearing:** E1 before E2 (the run must exercise the fixed gate) · E3 before
E4/E5 (the backfills must satisfy the stronger gate, or they'd flip strict and immediately be
under-gated) · E4/E5 before E6 is preferred but not required · E7/E8 anytime after E1.

---

## E1 — Fail-closed `--network` gate on the auto-publish path

**The hole (Field Report §3):** the autonomous path graduates on an offline verify; the
post-graduation `--network` scorecard is cosmetic (`PASSED` derives from the checkpoint at
`research-pass.yml:271-272`, not the verify exit code); and the content gate fails OPEN —
`check-photos.mjs` returns `apiError` (`:46-52`) that `verify-guide.mjs:64` never reads, and
`check-links.mjs` buckets outages as non-blocking `error` (`bucketOf`, `:26-31`).

**Clarifying questions:** none — design was settled by the Field Report review. Proceed.

**Do, in order (one commit each):**
1. **`scripts/verify-guide.mjs` — add an `unverifiable` content state.** Replace the content
   block (`evaluateGuide`, `:60-66`) so that: if `net.photos.apiError` is set →
   `content = { status: "unverifiable", reason: "Commons API: " + apiError }`; else if
   `net.links` shows a TOTAL outage (its `error` bucket length equals the total URLs checked
   and that total is > 0 — inspect `checkLinks()`'s actual return shape first and derive both
   numbers from it) → `unverifiable` with reason `"all link probes failed — network outage"`;
   else the existing dead/missing logic. In the blockers block (`:68-72`) add:
   `if (content.status === "unverifiable") blockers.push("content-unverifiable")`. Per-link
   `error` entries below the total-outage threshold stay advisory (they were already retried
   once) — a single flaky URL must NOT block. Update the human/markdown renderers to print the
   unverifiable state distinctly ("could not check — do not publish on this run"). **Confirm the
   CLI exit code is non-zero whenever `pass` is false including under `--markdown`** — if the
   markdown path swallows the exit code, fix that here.
   *Tests* (`scripts/__tests__/verify-guide.test.mjs`, mocking checkLinks/checkPhotos per the
   existing pattern): apiError → `unverifiable` + fail exit · total link outage → `unverifiable`
   · one dead link → `fail` · one flaky `error` link among live ones → still `pass` · clean →
   `pass`.
2. **`research-pass.yml` — networked gate BEFORE graduation.** In the SELF-CORRECTION LOOP
   instructions (`:234-253`): keep rounds (a)–(c) offline for speed, but insert a new step
   between (c) and (d): *"(c2) FINAL NETWORK GATE — run
   `npm run verify -- --slug <slug> --network`. If it reports content FAIL, fix each finding
   (dead link → re-source the fact from a live primary; missing photo → correct the Commons
   filename via search-commons.mjs or omit the image) and re-run. If it reports
   UNVERIFIABLE (network/API outage), wait 60s and retry ONCE; if still unverifiable, do NOT
   graduate — commit, write the outage into the scorecard, and let landing take the
   NEEDS-WORK/draft-PR path. Only a full networked PASS licenses step (d)."* Renumber (d)'s
   opening to reference the networked PASS.
3. **`research-pass.yml` — derive `PASSED` from the verify exit code.** Replace the landing
   snippet (`:269-272`) so the scorecard run captures its exit code and BOTH conditions gate:
   `set +e; npm run verify -- --slug <slug> --markdown --network > /tmp/scorecard.md; VERIFY_EXIT=$?; set -e`
   then `PASSED=false; [ "$NEXT" = "null" ] && [ "$VERIFY_EXIT" -eq 0 ] && PASSED=true`.
   Update the stale P3 comment (`:267-268`) to describe the now-true behavior.
4. **Cross-check `graduate-guide.yml`** (already gates on `--network` exit at `:66,:82`): no
   logic change, but verify it inherits the new unverifiable state correctly (an outage must
   block the manual path too) — add nothing unless broken.

**Exit:** all new tests green; full ship loop; a table-top trace of both publish paths
(auto + manual) written into the commit body showing dead-link, outage, and clean scenarios
each landing in the correct terminal state.

## E2 — Prove the pipeline end-to-end (THE GATE — was F0)

**Why:** the headless Action → auto-merge loop has never fired. The spine was proven once,
interactively (Sedona: all checkpoints, human commit authors, `attempts: 0`). The secret
exists and was confirmed valid 2026-07-20 — `docs/HANDOFF.md`'s "waits on the secret" line is
STALE; fix it during this session's HANDOFF rewrite. If the first run fails auth anyway, the
creator re-runs `claude setup-token` and updates the repo secret — that is the only remaining
creator dependency.

**Clarifying questions (session start):** (a) destination, party, dates, ranked priorities for
the real test guide (use `docs/NEW_GUIDE_INTAKE.md`); (b) attempt budget for this run (default:
the built-in cap of 5).

**Do:** file the New-guide issue (or scaffold directly), confirm `new-guide.yml` auto-dispatches
`research-pass.yml`, then babysit: watch checkpoints (`npm run pipeline -- --slug <slug>
--status`), the `/progress/` page, and the Actions log. Fix wiring failures as they surface
with targeted commits to `main` (each under the ship loop — expect novel failures; that is the
point of the session). Never hand-complete a stage the agent should do — fix the wiring and
re-run so the AUTONOMOUS path is what's proven.
**Exit:** a real guide reaches `verified`, auto-graduates, lands on `main` via
`land-branch.sh` (`merged:` line), the "🚀 Auto-published" issue appears, `verify-live` passes,
and E1's network gate demonstrably ran in the log. Rewrite HANDOFF (including the stale-secret
line).

## E3 — Promote the undated-figure detector to blocking on strict guides

**The hole (Field Report §2):** a confident "opens 09:00, ₩4,050" with no `verified_on` passes
every hard gate — the strict gate keys on the honesty marker (`≈`), not on the perishable fact.
The detector already exists: `check-research.mjs` block 8 (`:114-141`, `HARD_TIME_PRICE_RE` at
`:119`) emits `info`; `guide-readiness.mjs:57` blocks only on `warn`.

**Clarifying questions:** none — settled. Proceed.

**Do:**
1. In `check-research.mjs` block 8: emit the finding as `warn` when the guide has
   `provenance: "strict"`, `info` otherwise (thread guide meta into the block if it isn't in
   scope — check first). Keep the finding text identical so existing readers stay legible.
2. **Sweep the already-strict published guide first:** run `npm run readiness` — `us.json` is
   strict and published, so any newly-blocking undated figures in it must be resolved IN THIS
   SESSION (date them from the stamp's evidence or via a primary-source re-check under the
   guide-author skill, or downgrade to `⚠`) — E3 must not leave `main` red. `mexico`/`portugal`
   are empty strict scaffolds (nothing to trip).
3. *Tests* (`check-research.test.mjs`): strict + undated price → `warn` (readiness fails) ·
   non-strict + undated price → `info` (passes) · strict + dated price → clean · strict +
   `⚠`-flagged figure → not a warn (the honest flag stays legal).
**Exit:** ship loop; `npm run verify` green on all current guides.

## E4 — Korea provenance backfill → `provenance:"strict"`

**Scope (guide-author skill, Recert mode + Edit mode):** 197 `≈` marks and 43 undated hard
figures across `src/content/guides/korea/*.json`. For each perishable fact in the strict-gated
section types (`panel`/`prose`/`list`/`routes`): (a) if the guide's `verified` stamp records a
DATED verification pass evidencing that exact fact, use that date; (b) otherwise RE-VERIFY
today against a primary source → `verified_on` = today + `source_url` + correct `shelf_life`
(the fact's own category, not the section's); (c) unconfirmable → downgrade to `⚠` or omit.
**Never write a date the stamp or a fresh check doesn't evidence.** Trip-historical narrative
("we paid X in July") is durable record — leave it undated. Then set `provenance: "strict"` in
`korea/_guide.json` (keep `archived: true` — recert stays muted by design) and run the FULL
loop: `npm run build` (the strict gate is the test), `npm run verify -- --slug korea`,
continuity sweep per CLAUDE.md.

**Clarifying questions (session start):** confirm the creator wants value CORRECTIONS applied
where today's re-check contradicts the shipped value (recommended: yes — update value +
re-date, per recert discipline), or dates-only.

**Exit:** build green WITH strict on; verify PASS; completion report (flagged/omitted/corrected
lists + ledger); ship loop.

## E5 — Denmark provenance backfill → `provenance:"strict"` (creator-directed)

Same discipline as E4 with one difference the creator explicitly set: Denmark's stamp is an
undated blob, so path (a) barely exists — **nearly every fact goes through path (b): fresh
re-verification against today's primary sources, dated today.** This is re-research, not
backdating — no invented dates, ever. 70 `≈` marks across 8 group files. Where a source has
died since June (the stamp already records two dead citations), re-source from a live primary
or downgrade `⚠`. **Honest-outcome rule:** if after the pass any `≈` in a gated section still
lacks a date, do NOT force the flip — leave `provenance` unset, report exactly which facts
blocked it, and stop. A truthful "couldn't fully backfill" beats a gamed gate.
**Clarifying questions (session start):** same corrections-vs-dates-only question as E4.
**Exit:** build green (with strict if the pass cleared; without + a written blocker list if
not); verify; continuity sweep; ship loop.

## E6 — Dormant safety content: `entry` + `phrases` (was F3)

**Scope (guide-author skill):** populate on korea, denmark, us.
- **`entry`** — one row per traveler home country. **US confirmed; the creator chose "US +
  other passports" WITHOUT naming the others — ask at session start which additional
  countries** (a party can mix passports). Research each destination's OFFICIAL
  immigration/entry page ONLY (T0); `source_url` + `verified_on` are schema-required; an
  unverifiable rule means omit the row, never guess. Note denied-boarding stakes in rigor.
- **`phrases`** — `ko-KR` (korea), `da-DK` (denmark), `en-US` n/a for us (skip — same
  language; note the skip honestly). Standard scenarios: allergy / taxi / help / directions,
  15–20 phrases, verified against reliable bilingual sources per-phrase (ship/flag/omit — a
  wrong native-script phrase is safety-adjacent). `lang` drives the Trip-kit speak button.
- **`env` day tags** where honestly known (arms the rainy-day swap on future viewing).
- **Weather sections are NOT added** to korea/denmark — the service correctly refuses
  concluded trips (`DENMARK_UPLIFT.md`); nothing would render.
**Clarifying questions (session start):** (a) the additional passport countries; (b) any
allergies/dietary needs to prioritize in phrase cards.
**Exit:** entry + phrases render in Trip kit on the live guides (verify in preview at 375px);
verify green; ship loop.

## E7 — Day-route optimizer, tap-to-apply (was F8; creator upgraded from suggest-only)

**Scope:** new SEALED silo `src/features/route-opt/` per the ARCHITECTURE contract
(`index.ts` only public surface · `model/` pure+tested · `ui/` · `mocks/` · `__tests__/`).
Zero network, zero schema changes, zero guide-JSON mutation.
1. **`model/optimize.ts` (pure):** haversine distance; nearest-neighbour seed + 2-opt over a
   day's located waypoints (those with coords); returns `{ order, savedKm, currentKm }` or
   `null` when <3 located stops OR saving < max(0.5 km, 10% of current) — the honest-blank
   threshold. *Tests:* known-optimal fixtures (incl. one where 2-opt must beat pure NN), the
   <3-stop null, the below-threshold null, ties stable.
2. **`ui/route-opt.js`:** advisory chip on qualifying day cards — "Reorder could save ≈N km"
   (a real button per the clickability doctrine, focus-visible) → opens a sheet showing the
   suggested order → **Apply** reorders the day's waypoint list in the DOM and persists the
   order to localStorage keyed by `storeKey + day` (per-device; NEVER writes guide JSON) →
   **Restore guide order** undoes and clears the key. On load, a persisted order re-applies;
   the chip then reads "Reordered — restore?". Reduced-motion safe; no new tab (chip lives on
   the existing day card).
3. **Boundary facts stated in code comments where they bind:** GPX/ICS exports and print keep
   the GUIDE's order (they're build-time; the reorder is a per-device view preference) — and
   the sheet says so in one honest line.
4. *Tests:* model unit tests (above) + a Playwright spec: chip appears on a fixture day,
   apply reorders visibly, restore undoes, persistence survives reload, absent under 3 stops.
**Clarifying questions (session start):** confirm the localStorage-only persistence framing
("reorder is your device's view, the guide itself is unchanged") is acceptable copy.
**Exit:** ship loop incl. preview at 375px + desktop + dark + reduced-motion; advisory fires
on a real guide day where reordering genuinely helps and stays silent elsewhere.

## E8 — Hygiene sweep (no half-turned keys)

**Clarifying questions:** none — all items settled or self-evident. Proceed.
1. **Shelf-life constant:** confirm a test asserts `check-staleness.mjs`'s `SHELF_LIFE_DAYS`
   (`:19`) equals `src/lib/staleness.ts`'s (`:10-16`); add it if missing (import both, deep
   equal).
2. **Guide-shape resolution dedup:** extract the flat-vs-directory resolution order into
   `scripts/lib/guide-shape.mjs`; use it from `graduate-guide.mjs:48-54` and
   `audit/lib.mjs:32-53`; replace `graduate-guide.yml:106-110`'s inline copy with a
   `node -e` call to the shared helper. Behavior byte-identical — prove with existing tests.
3. **SOS coverage:** research + add verified emergency numbers for `us`, `mexico`, `portugal`
   in `src/data/countries.mjs` (official government sources, `verified_on` in the source
   comment) so the drafts' SOS isn't blank at graduation. (Portugal is EU-112 — confirm the
   fallback already covers it and add only what's missing.)
4. **Map-tile offline decision, recorded:** keep tiles uncached (third-party, cache bloat);
   document the limitation + the `routes`-blocks-work-offline mitigation in
   `src/features/maps/README.md`.
5. **Human eyeball (creator, not agent):** the 2026-07-22 contour-visibility values
   (`MOTION.md` "Contour visibility pass") still need a real-photo check at `astro preview`,
   both themes, 375px + desktop — step back halfway if strokes fight the title.
**Exit:** ship loop; nothing on the Field Report's P2·7 list left silently open.

---
*Priority logic: E1 is a trivial change protecting the product's #1 promise; E2 proves the
factory AND validates E1; E3 hardens the gate the backfills must then satisfy; E4/E5 make the
rendered exemplars doctrine-true; E6 converts shipped mechanisms into traveler value at pure
research cost; E7 closes the one plain parity gap (free + offline vs. their $39.99/yr + online);
E8 leaves no half-turned keys. The Critic stays where it is (PLAN_TRAVELER_FEATURES F7),
evidence-gated — the Field Report's single-pass finding is the reason not to accelerate it.*
