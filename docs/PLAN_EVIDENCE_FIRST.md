# PLAN — Evidence-First Pipeline (the master-architect program)

> **Status: IN EXECUTION since 2026-08-13.** Produced 2026-08-12 by the architect session
> against the creator's master-orchestrator mandate; the creator gave an explicit "go" on
> 2026-08-13 after settling all five clarifying questions (see the decisions block below —
> **two reversed this document's assumptions, and packet G1 is struck**). Packet-by-packet
> progress is tracked in `docs/handoff.md`, not here; this document stays the specification.
>
> Core principle, verbatim from the mandate: **EVIDENCE FIRST → GUIDE SECOND.** `facts.json` is
> the canonical fact layer; prose is presentation. Extend the existing registry — never create a
> parallel `evidence.json` or second source registry.

---

## Clarifying questions — ALL SETTLED (creator, interactive session 2026-08-13)

> These were recorded as non-blocking assumptions on 2026-08-12. They were put to the creator
> directly on 2026-08-13 and are now **decisions**. Two REVERSE what this document assumed —
> read them before executing any packet. Questions 1 and 3 also carry `CONTEXT.md` entries,
> which are authoritative if this prose ever drifts from them.

1. **Q: §10 (no autonomous publication) reverses the 2026-07-30 creator ruling and the
   pipeline.md "PUBLISH auto-resolves itself" design — confirm the reversal?**
   **DECIDED — NO. The reversal is rejected; the 2026-07-30 ruling stands.** ⚠️ *Opposite of
   this document's original assumption.* Auto-graduation **stays**: research-pass.yml's critic
   step keeps calling `graduate-guide.mjs --slug` on verify PASS. **Packet G1 is struck from the
   program** and Phase G no longer exists. The creator was walked through G1's mechanics first
   (it gates only the trigger, never the verify gates) and chose auto-publish knowingly. Also
   rejected: a review/approval surface on the website — it needs auth and a repo write-back path
   a static Astro + Pages site doesn't have; that is a separate future feature, not pipeline
   scope. §10's "no autonomous publication" mandate text is **void**; nothing below implements it.
2. **Q: Where does destination knowledge live?** Options: `src/data/destinations/`,
   `src/content/destinations/`, repo-root `destinations/`.
   **DECIDED — `src/data/destinations/<slug>.json`**, zod schema in `scripts/lib/`. Confirmed
   against the tree: `src/data/` already holds exactly this class of machine-consumed reference
   data (`airports.mjs`, `countries.mjs`, `holidays/`, `palettes/`), so destinations slot in
   beside established precedent rather than opening a new home.
3. **Q: Does the Japan guide itself get repaired once the new checks land?**
   **DECIDED — NO, never. Japan stays as-is indefinitely.** ⚠️ *Stronger than this document's
   original assumption ("yes, later, after Phase H").* Japan is the corpus's only live specimen
   of all 12 defect classes; cleaning it would leave the regression suite testing a fixture
   nothing real corresponds to. Japan failing the new hygiene gates is the **expected** state,
   not a bug queue. Gates needing corpus-wide green get a japan exemption, never a japan cleanup.
4. **Q: Google Routes API is a billed surface — enable it?**
   **DECIDED — YES**, exactly as assumed: config-gate + lazy import like Places, default OFF,
   key via GitHub secret / local untracked `.env`. Zero billing until the creator flips it;
   absent key ⇒ the check degrades to advisory, never a failure.
5. **Q: Risk-tier vocabulary (R0–R4) enters `CONTEXT.md`'s glossary?**
   **DECIDED — YES**, in Phase B (packet B1), so later sessions don't invent synonyms.

---

## 1 · Architecture audit — what actually executes today

Traced from the real files (workflows, scripts, prompts, state artifacts), not from docs.

### The spine (works, keep)

```
issue form (new-guide.yml template, derived from intake-schema.mjs FIELDS)
  └─ new-guide.yml → issue-to-scaffold.mjs → scaffold-guide.mjs
       commits scaffold straight to main · auto-dispatches ↓
research-pass.yml  (branch research/<slug>, resumable via pipeline.mjs checkpoints)
  ├─ agent 1  Pass A   canonical/verified          (input model, default Sonnet)
  ├─ agent 2  Pass B   local/authentic/crowd-aware (ALWAYS Sonnet; structurally blind —
  │                    reads only intake + skill; writes guides-intake/<slug>.passB.json)
  ├─ agent 3  Reconcile + verify loop              (verify-guide.mjs roll-up + build)
  └─ agent 4  Fresh-context critic                 (critic_model, default Opus; 5 scans;
                       owns citation audit; TODAY also auto-graduates on PASS)
  deterministic gates between agents:
    check-passb-coverage.mjs (ledger coverage + floors 8/3/2)
    check-candidates.mjs     (funnel floors P1 16/8 · P2 10/5 · P3 6/3)
    check-run-integrity.mjs  (VOID / BATCHED_COMMIT / BURST; MIN_GAP 120s)
    critic-artifact grep     (## Critic findings · ## Citation audit · sweep record)
  └─ land-branch.sh → merged:<n> on PASS (auto-publish) | draft:<n> for human triage
```

Verified strengths (all preserved by this plan): checkpoint/resume with the
`uncommittedPredecessor` guard and a 5-attempt circuit breaker; Pass A/B structural
independence; the single fresh-context critic; prompts-as-pointers into the skill; the
deterministic gate layer; `land-branch.sh` as the one tested merge path; intake single source
of truth (`intake-schema.mjs` FIELDS drives form + parser + scaffolder, contract-tested).

### Defects the trace confirmed (each maps to a mandate capability)

| # | Defect (evidence) | Mandate answer |
|---|---|---|
| D1 | **Per-fact rediscovery, no entity layer.** Japan `facts.json` has 6 near-duplicate rows for one "domestic flights" claim ($90/$60/$80,/¥11,410/$75) — the same entity re-researched per prose mention. | Entity-level research (Phase D) |
| D2 | **Malformed values.** `"$19,"`, `"$1,"`, `"$80,"` — `migrate-facts.mjs` `MONEY_RE` includes `[\d.,]*`, capturing trailing punctuation. | B2 packet |
| D3 | **Source misattribution.** Same ¥11,410 figure cited to jreast.co.jp in one row, ana.co.jp in another. | Entity keying + dedup gate (B/E) |
| D4 | **Claims are section-path echoes** ("Budget & daily costs → …"), i.e. presentation-layer addressing, not claim identity. | Claim-ID discipline (B) |
| D5 | **`tier` exists in the schema (content.config.ts, both factRecord and provenance) but nothing populates or enforces it.** | Populate + gate (B/E) — extend-before-add satisfied |
| D6 | **No risk weighting anywhere** — a museum price and a government travel advisory get the same 2-search cap and the same gates. | Risk tiers R0–R4 (B/D/E) |
| D7 | **No intake certainty states.** "Oct 15" vs "Oct 22" and the Sept 25 / Oct 24 birthday contradiction sit in `japan.md` as flat prose; nothing distinguishes fixed from assumed. | Certainty states + contradiction gate (C) |
| D8 | **Link check = liveness only.** 200 OK passes; page content is never compared to the stated value outside the critic's ≥5-row sample. | Drift detection via evidence snippets (E) |
| D9 | **Traceability is one-directional.** `{{fact:<id>}}` tokens resolve fact→prose at build, but nothing answers "which days/sections depend on fact X" or "which shipped claims have no fact row." | Derived usage index (B4) |
| D10 | **Destination knowledge lives as prose** in the skill/references (and partly nowhere — koyo sources, tax-free rules, advisory URLs are re-found per run). | Destination config as data (D1) |
| D11 | ~~**Auto-publication.** research-pass's critic step calls `graduate-guide.mjs --slug` on verify PASS.~~ **NOT A DEFECT — creator ruling 2026-08-13.** Auto-publication is intended behavior; the evidence gate (build + verify) is the bar. | ~~Phase G removal~~ — **struck** |
| D12 | **Native-language discovery is sanctioned prose, not structure** (research-efficiency.md "native-first deep sweep") — no config supplies languages/query seeds, no gate observes whether it happened. | D packets |

### Runtime-context cost (the prose problem, quantified)

Per headless agent, every run: SKILL.md 368 + verification-rules 199 + research-efficiency 204 +
pipeline-roles 138 + other references ≈ **1,413 skill lines**, plus workflow prompt lines
(research-pass ~231 across 4 agents, revise-guide ~180+, modify ~116) and CLAUDE.md 316. Four
agents per research run ⇒ the skill corpus is paid **four times per guide**. Prose reduction is
therefore a first-class deliverable (Phase F), and every new capability below is specified as
**data/config + deterministic gate**, not as new skill prose.

---

## 2 · Redundancy audit — one canonical home per concept

Classification of every pipeline-relevant surface, informed by three full inventories run this
session (20 workflows + 4 issue templates; 55 scripts + 24 npm aliases; the complete docs/ +
learnings/ trees). Headline: **zero unreferenced scripts** (all 55 have live call sites) and no
pipeline-relevant orphan docs — the redundancy problem here is *duplication of concepts across
prose surfaces*, not dead files.

### CANONICAL (single source of truth — protect)
- `scripts/intake-schema.mjs` — intake FIELDS + zod; form/parser/scaffolder derive from it.
- `src/content/guides/<slug>/facts.json` — THE fact layer (this plan extends it, adds nothing beside it).
- `src/content.config.ts` — guide + fact + provenance schemas (already carries the unused `tier`).
- `.claude/skills/waypoint-guide-author/SKILL.md` + `references/` — the research discipline.
- `scripts/pipeline.mjs` — checkpoint spine. `scripts/verify-guide.mjs` — the one verdict.
- The gate scripts (`check-passb-coverage`, `check-candidates`, `check-run-integrity`,
  `guide-readiness`, `audit/check-research`). `scripts/land-branch.sh` — the one merge path.
- `docs/standards/guide-rubric.md`, `docs/standards/new-guide-intake.md`.

### SUPPORTING (derives from or points at a canonical home)
- All 20 workflows — orchestration shells; prompts are pointers (keep them pointers).
- Issue templates — contract-tested against FIELDS.
- `docs/reference/pipeline.md` — north-star narrative. **Trim target:** its "Shipped since"
  W-series section and per-phase ✅ history restate git history; move to `docs/archive/` (F2).
- `docs/reference/architecture.md`, `issue-tracker.md`, `revise-guide.md`.

### GENERATED (machine-written; never hand-edit, never treat as doctrine)
- `guides-intake/<slug>.state.json`, `<slug>.passB.json`, `<slug>.coverage.json`,
  `korea.revision-27*.json`, run-report ledger appends, `docs/generated/`.

### HISTORICAL (evidence — archive, don't delete)
- `guides-intake/japan.state.json` (the 35 ms F1 batching stamps), Japan's malformed
  `facts.json` rows, `korea.revision-27*` (completed revision) → Phase A freezes the Japan set
  as a test fixture; Phase F moves completed revision artifacts to `guides-intake/archive/`.

### REDUNDANT (two homes for one concept — collapse)
- **new-guide.yml's issue comment embeds a 15-line interactive research prompt** (lines 90–93)
  that restates the skill's research workflow — the only non-pointer prompt copy left. → F3
  replaces it with a two-line pointer.
- **`docs/reference/pipeline.md` §"Target state" restates workflow behavior** already
  documented in the workflows' own header comments. → F2 trims to lifecycle + policy only.

### UNCLEAR — resolved (inventories complete)
- Scripts: none unreferenced; no dead npm aliases. Docs: `docs/archive/` already holds the
  historical plans (incl. `PLAN_FACTORY_V2.md`, a prior pipeline plan — superseded by THIS
  document; F2 adds a supersession note there). `docs/design-handoff/**` zero-inbound files
  are shipped-design records under the design-fidelity doctrine — out of scope, untouched.

---

## 3 · Current vs target architecture

| Axis | Current | Target |
|---|---|---|
| Unit of research | The individual prose mention (re-discovered per occurrence) | The **entity** (venue/route/event); one research act yields all its facts, keyed `entity:` on fact rows |
| Rigor allocation | Flat: 2-search cap, same gates for everything | **Risk-weighted**: R0 none → R4 mandatory-surface; caps, tiers, and gates scale with `risk` |
| Fact identity | Section-path echo claims; near-duplicates legal | Claim-ID discipline; dedup gate; one row per (entity, claim) |
| Provenance | `source_url` + `verified_on`; `tier` dormant | `tier` populated + enforced for R2+; **evidence snippet** on R3/R4 rows enabling drift detection |
| Verification of sources | HTTP 200 = alive | Alive **and still supports the value** (snippet/value match; miss ⇒ drifted, not passed) |
| Intake | Flat values; contradictions invisible | **Certainty states** (`fixed/target/flexible/unknown/none/assumed`) + deterministic contradiction gate before research spends tokens |
| Discovery | Pass B prose-sanctioned native sweep | Config-driven: destination file supplies languages, query seeds, T0 domain allowlist; language ≠ authority (tier rules unchanged) |
| Candidate flow | considered → shipped (floors) | **Funnel**: broad → shortlist → deep-verify, shortlist recorded, floors per stage |
| Destination knowledge | Skill prose + re-research per run | `src/data/destinations/<slug>.json` (data, versioned, verified like any fact source) |
| Traceability | fact→prose (build tokens) | Bidirectional via **derived** usage index (build-time script; no stored duplication) |
| Publication | Auto-graduate on verify PASS | **Unchanged — auto-graduate on verify PASS** (creator ruling 2026-08-13; `graduate-guide.yml`'s label path stays the rescue/override route it already is) |
| External data | Places (status/hours SKUs), Commons, Wikivoyage | + Routes (config-gated, off), GTFS static feeds (per destination config), Open-Meteo (keyless), OSM as cross-check only — **no new search layer, no Brave MCP, no high-volume Nominatim** |

Preserved unchanged: scaffold→passA→passB→reconcile→verified spine, checkpointing/resume,
Pass A/B independence, single critic, prompts-as-pointers, land-branch, attempt budget.

---

## 4 · External tool configuration (evaluated set only)

Credentials: **never in the repo.** GitHub Actions secrets for workflows; local untracked
`.env` for interactive runs (already the Places pattern). Every integration behind the repo's
config-gate + lazy-import doctrine — empty config ⇒ inert build, zero calls, zero cost.

| Tool | Verdict | Role & posture |
|---|---|---|
| **Google Places** | Already integrated — extend, don't rewire | `lookup-place`/`lookup-venue` + S1 CLOSED_PERMANENTLY gate stay. Policy stays: `place_id` is the only cacheable field. Tie SKU choice to risk: status SKU for R1, hours SKU only for R2+ venues actually scheduled in a day plan. |
| **Google Routes** | Adopt, config-gated, default OFF | Answers regression case 11 (routing assumptions): verify inter-stop transit durations at reconcile for scheduled day legs (R2). Budget: one matrix call per day, only for days with ≥3 scheduled stops. Key = GH secret `GOOGLE_ROUTES_KEY`; absent ⇒ check downgrades to advisory. |
| **GTFS (static)** | Adopt where feeds exist | Destination config lists official static-feed URLs (T0 — they're the operator's own data). Script fetches + caches per run for fare/schedule verification of R2 transit facts. No realtime feeds (cost/complexity, zero need). |
| **Open-Meteo** | Adopt (keyless, free) | Climate normals + 16-day forecast for plan_b/inclement-cover verification and packing context. NOT a koyo/sakura forecaster — those remain destination-config-listed primary sources (JMC/Walkerplus class). |
| **OSM** | Cross-check only | No Nominatim as a backend (mandate). Existing Places-backed `geocode-venues.mjs` remains the geocoder; OSM/Overpass allowed as a manual cross-check in research, never a pipeline dependency. |
| **Brave MCP / any new search layer** | **Rejected** (mandate) | Discovery stays: skill scripts, direct-to-primary, Pass B native sweep. |

---

## 5 · Intake changes required

All changes route through `scripts/intake-schema.mjs` (the one source of truth) and its
contract tests; the issue form and scaffolder inherit.

1. **Certainty states.** Each date-like and decision-like field gains a certainty:
   `fixed | target | flexible | unknown | none | assumed`. Form: a dropdown beside dates,
   anchor, and budget; parser stores `{ value, certainty }`; scaffolder writes
   `**Dates (target):** Oct 15–…` into the intake doc; NULLISH stays for none/undecided.
   The Japan case becomes representable: start date = `target: Oct 15` not a bare date.
2. **Contradiction gate.** New `scripts/audit/check-intake-contradictions.mjs`:
   deterministic extraction of dates, party counts, and named people across ALL intake fields;
   flags (a) two different values for the same entity ("birthday Sept 25" vs "birthday
   Oct 24"), (b) anchor date outside the trip window, (c) party-size vs traveler-list
   mismatch. Runs in `new-guide.yml` after parse and as a research-pass preflight. A hit
   emits a `### q-<slug>-<n>` traveler question (existing mechanism) and stamps the intake
   doc `## Contradictions` — research proceeds only on a recorded `**Assumed:**` line.
   Never a hard workflow failure (creator ruling: surface, don't hard-stop).
3. **Risk seeds from intake.** The parser marks anchor-event facts R3 and
   advisory/visa/health context R4 at scaffold time, so risk exists before research starts.

---

## 6 · Repository organization plan

Minimal moves; one canonical home per concept; nothing deleted that is evidence.

- `src/data/destinations/<slug>.json` — NEW: destination knowledge (languages, T0 domain
  allowlist seeds, gov advisory URLs, transit authorities + GTFS feed URLs, seasonal-source
  list, tax-free rules pointer). Zod schema in `scripts/lib/destination-schema.mjs`.
- `tests/fixtures/japan-regression/` — NEW: frozen copies of Japan's intake doc, state file,
  facts.json, and the relevant group files (Phase A). The live guide is untouched.
- `guides-intake/archive/` — completed revision artifacts (`korea.revision-27*`) move here (F1).
- `docs/archive/` — pipeline.md's shipped-history sections move here (F2).
- Everything else stays where it is — the inventories found no orphans to relocate.

---

## 7 · Implementation dependency graph

```
A  Fixture freeze ────────────────┐            (no deps; do first)
                                  │
B  Canonical fact layer  ◀────────┘
│   B1 schema fields (risk, entity, evidence) — additive, optional
│   B2 migrate-facts MONEY_RE fix    B3 dedup/claim-ID gate    B4 usage index
C  Intake (certainty + contradiction gate)      [parallel with B]
D  Research  ◀ B (needs risk/entity fields) ◀ C (consumes certainty)
│   D1 destination config    D2 entity protocol + risk budgets (skill rewrite, net prose ↓)
│   D3 candidate funnel      D4 native-language Pass B wiring
E  Verification ◀ B, D    (gates land warn-first, then enforce)
│   E1 risk-weighted gates   E2 drift detection   E3 contradiction gate in verify roll-up
F  Organization & prose reduction ◀ D2 (skill rewrite settles first)
H  Regression proof ◀ everything   (12/12 detections against the frozen fixture)

G  Publication safety — STRUCK ENTIRELY (creator ruling 2026-08-13; auto-publish stays)
```

Order of execution: **A → B ∥ C → D → E → F → H.** (The mandate's A–H lettering is kept for
packet-ID stability, so the letters now skip G — that gap is deliberate, not a missing phase.)

---

## 8 · Task packets (lower-model lanes; format per mandate)

> Conventions: complexity S/M/L · lane = opulent:mechanic (S, mechanical) / opulent:coder
> (M/L) / opulent:test-runner (all TESTS lines) / opulent:scribe (doc-only packets).
> Every packet inherits the global guardrails (§8.0). Rollback for every packet: single
> revert of its own commit — packets never share a commit.

### 8.0 Global guardrails (paste into every brief, verbatim)
- Do not touch files outside FILES TO CHANGE. Do not "improve" adjacent code.
- Do not create any new registry beside facts.json. Do not add dependencies without the packet saying so.
- Do not delete or weaken existing tests. New checks land warn-first where the packet says so.
- Do not edit anything under `src/content/guides/japan/` — it is regression evidence.
- Schema changes are additive and optional; `npm run build` must stay green on untouched guides.

---

**A1 — Freeze the Japan regression fixture** · S · mechanic
- CONTEXT: Japan's artifacts contain 12 known defect classes the new gates must detect. The live guide must not be cleaned (mandate §31).
- GOAL: Immutable fixture copies for the regression harness.
- FILES TO INSPECT: `src/content/guides/japan/facts.json`, `guides-intake/japan.md`, `guides-intake/japan.state.json`, japan group files containing the Wild Area venue, koyo, advisory, Zao, tax-free passages.
- FILES TO CHANGE: create `tests/fixtures/japan-regression/` (copies + a `MANIFEST.md` listing each of the 12 cases and which file carries it).
- DO NOT TOUCH: anything under `src/content/guides/`, `guides-intake/` (copy out, never move).
- TESTS: a trivial vitest asserting the fixture files exist and parse.
- ACCEPTANCE: 12/12 cases have a manifest row pointing at a fixture file + line evidence.

**G1 — ~~Remove autonomous publication~~ · STRUCK, DO NOT IMPLEMENT**

> **Creator ruling, 2026-08-13 (see the decisions block at the top of this file and
> `CONTEXT.md`).** The mandate's §10 called for removing auto-graduation; the creator was
> walked through this packet's exact mechanics and rejected it. Auto-publication is
> **intended behavior** and stays. This packet is retained only so a future reader who finds
> §10's prose knows it was considered and consciously declined — **executing it would
> contradict a standing ruling.** Nothing downstream depends on it: the case→packet coverage
> map routes all 12 regression cases through B/C/D/E, none through G.
>
> Original packet text preserved for the record: it would have dropped research-pass.yml's
> `graduate-guide.mjs --slug` call so a verify PASS landed the guide still `draft: true`,
> making the `graduate-approved` label the only publish path.

**B1 — Extend the fact schema (risk · entity · evidence)** · M · coder
- CONTEXT: `tier` already exists unused in `content.config.ts` (factRecord + provenance). The mandate's fact-layer needs three more optional fields; extend-before-add.
- GOAL: factRecord gains `risk: z.number().int().min(0).max(4).optional()`, `entity: z.string().optional()` (kebab-case id), `evidence: z.string().max(240).optional()` (short quoted phrase from the source page, R3/R4 only). Document field semantics in `src/lib/facts.mjs`'s shape comment.
- FILES TO INSPECT: `src/content.config.ts`, `src/lib/facts.mjs`, `scripts/migrate-facts.mjs` (writes rows).
- FILES TO CHANGE: those three.
- DO NOT TOUCH: any guide's facts.json (population is D/E work); token syntax; RESERVED ids.
- TESTS: schema unit tests (valid/invalid risk values, evidence length); build green on all guides.
- ACCEPTANCE: fields parse when present, absent everywhere today, zero behavior change.

**B2 — Fix migrate-facts value capture + dedup** · S · coder
- CONTEXT: `MONEY_RE`'s `[\d.,]*` captures trailing punctuation ⇒ `"$19,"` class defects; dedup key `value|approx|source_url` lets 6 rows exist for one entity-claim.
- GOAL: values never end in `,`/`.`; add a normalization step; dedup collapses rows whose normalized (value, claim-stem) match, keeping the row with the strongest source; emit a report of collapsed rows (propose mode) before `--write`.
- FILES TO INSPECT/CHANGE: `scripts/migrate-facts.mjs` + its tests.
- DO NOT TOUCH: existing guides' facts.json; `src/lib/facts.mjs` interpolation.
- TESTS: unit cases reproducing `$19,` / `$80,` from the Japan fixture strings; dedup case from the 6-row domestic-flights cluster (fixture data).
- ACCEPTANCE: fixture-derived inputs produce clean values and a single row per claim; byte-identical invariant preserved for non-fact text.

**B3 — Claim-ID + duplicate-row gate** · M · coder
- CONTEXT: claims are section-path echoes; duplicates and cross-source misattribution (D3/D4) are invisible to verify.
- GOAL: new `scripts/audit/check-facts-hygiene.mjs`: flags (a) two rows with same normalized value + overlapping claim stems and different `source_url` (misattribution candidate), (b) trailing-punctuation values, (c) rows whose claim is a bare section path with no noun. Wire into `verify-guide.mjs` as a new advisory section (warn-first; enforcement flips in E1).
- FILES TO INSPECT: `scripts/verify-guide.mjs` (section pattern), fixture facts.json.
- FILES TO CHANGE: new script + verify-guide.mjs roll-up row + npm alias.
- DO NOT TOUCH: existing blockers list semantics (advisory only this packet).
- TESTS: fixture facts.json triggers ≥3 distinct flags; clean korea/us facts produce none (or documented true positives).
- ACCEPTANCE: `npm run verify -- --slug japan` (against fixture copy in a temp dir) reports the D2/D3/D4 classes.

**B4 — Fact-usage index (traceability)** · S · coder
- CONTEXT: `{{fact:id}}` gives fact→prose; nothing gives prose→fact or day-level dependency (D9).
- GOAL: `scripts/audit/fact-usage.mjs --slug <slug>`: derived (never stored) map of fact-id → [group file, day, section] and the inverse list of R2+-looking values in prose with NO token (candidates for fact-row extraction). JSON + human table output.
- FILES TO INSPECT: `src/lib/facts.mjs` (FACT_TOKEN_RE), group-file day structure.
- FILES TO CHANGE: new script + npm alias.
- DO NOT TOUCH: build pipeline; no stored index file.
- TESTS: unit test on a synthetic guide dir; fixture assertion that Japan's ¥11,410 maps to ≥2 groups.
- ACCEPTANCE: bidirectional queries answer in one command; zero new stored state.

**C1 — Certainty states in the intake schema** · M · coder
- CONTEXT: FIELDS array in `intake-schema.mjs` drives form/parser/scaffolder; contract-tested. Flat values can't express `target: Oct 15`.
- GOAL: certainty enum (`fixed/target/flexible/unknown/none/assumed`) attachable to dates, anchor, budget; parser returns `{value, certainty}`; scaffolder writes `**Dates (target):**` style into the intake doc; issue form gains matching dropdowns; NULLISH unchanged.
- FILES TO INSPECT/CHANGE: `scripts/intake-schema.mjs`, `.github/ISSUE_TEMPLATE/new-guide.yml`, `scripts/scaffold-guide.mjs`, contract tests, `docs/standards/new-guide-intake.md`.
- DO NOT TOUCH: modify/revise parsers beyond what the shared `matchField` requires; existing intake docs.
- TESTS: contract tests round-trip each certainty; absent certainty defaults to `assumed` for dates and is recorded as such.
- ACCEPTANCE: a filed issue with "Dates: Oct 15 (target)" scaffolds an intake doc carrying the state; old-format issues still parse.

**C2 — Intake contradiction gate** · M · coder
- CONTEXT: The Japan intake carries "birthday Sept 25" and "birthday Oct 24" (§1 vs §2) plus Oct 15-vs-22 — nothing flags either (regression cases 1–2).
- GOAL: `scripts/audit/check-intake-contradictions.mjs` per §5.2 (date/party/person extraction, cross-field compare); wired as a step in `new-guide.yml` post-parse and a research-pass preflight; emits traveler questions + `## Contradictions` stamp; never fails the workflow.
- FILES TO INSPECT: `guides-intake/japan.md` (fixture copy), `scripts/intake-schema.mjs`, `references/pipeline-roles.md` (question format).
- FILES TO CHANGE: new script, `new-guide.yml` (+1 step), `research-pass.yml` (+1 preflight step), npm alias.
- DO NOT TOUCH: question-surfacing mechanism (reuse it), intake docs themselves.
- TESTS: fixture intake triggers both the birthday and the start-date findings; korea/us fixtures trigger none.
- ACCEPTANCE: regression cases 1 and 2 detected deterministically, run proceeds, questions posted.

**D1 — Destination config (knowledge as data)** · M · coder + scribe
- CONTEXT: D10/D12 — destination facts (languages, advisory URLs, GTFS feeds, seasonal sources, tax-free rules) live as prose or nowhere; every run re-finds them.
- GOAL: `scripts/lib/destination-schema.mjs` (zod) + `src/data/destinations/{japan,korea,us}.json` seeds, each field carrying `source_url` + `verified_on` (destination config obeys fact discipline). Skill references point at the file instead of restating specifics (net prose reduction counted in F).
- FILES TO INSPECT: `references/research-efficiency.md`, `references/verification-rules.md` (what prose becomes data).
- FILES TO CHANGE: new schema + three seed files + a schema test.
- DO NOT TOUCH: skill prose in this packet (D2 does the rewrite atomically).
- TESTS: zod validation; every URL field non-empty ⇒ has verified_on.
- ACCEPTANCE: three seeds validate; Japan seed carries advisory URL, ja language, koyo source list, GTFS feed entries, tax-free pointer.

**D2 — Entity-level research protocol + risk budgets (skill rewrite)** · L · coder
- CONTEXT: The skill's research flow verifies facts one prose-mention at a time under a flat 2-search cap (D1/D6). This packet is the one large prose surgery: research is re-specified around entities, budgets scale by risk, and destination config is consumed — with a NET LINE REDUCTION across SKILL.md + references (mandate: prose reduction is first-class).
- GOAL: (a) research unit = entity: one batch per venue/route/event yields all its facts as facts.json rows sharing `entity:` + per-row `risk`/`tier`; (b) search budgets by risk (R0 0 · R1 1 · R2 2 · R3 3–4 · R4 uncapped-but-logged, mandatory surfacing); (c) Pass B native-language sweep reads languages/seeds from destination config; (d) delete the prose D1 made into data.
- FILES TO INSPECT/CHANGE: `SKILL.md`, `references/research-efficiency.md`, `references/verification-rules.md`, `references/pipeline-roles.md`.
- DO NOT TOUCH: workflow prompt pointers (they keep pointing at the same anchors — keep heading names stable), gate scripts.
- TESTS: `skill-evals.yml` suite green (it gates `.claude/skills/**` PRs); wc -l before/after recorded in the PR body — total must go DOWN.
- ACCEPTANCE: entity protocol + risk table + config consumption present; total skill corpus line count strictly lower than before D1+D2.

**D3 — Candidate funnel: shortlist stage** · S · coder
- CONTEXT: `check-candidates.mjs` sees considered→shipped only; the mandate wants broad→shortlist→deep-verify visible.
- GOAL: candidates tables gain a `shortlist` marker column; the checker parses it and enforces shipped ⊆ shortlist ⊆ considered plus existing floors; floors gain optional per-stage overrides via `researchFloors`.
- FILES TO INSPECT/CHANGE: `scripts/check-candidates.mjs` + tests; table format spec lives where it lives today (skill reference — one heading, coordinated with D2).
- DO NOT TOUCH: existing floor defaults.
- TESTS: fixture-style tables (shortlist missing / superset / valid) unit-tested.
- ACCEPTANCE: a shipped candidate absent from shortlist fails the gate with a named row.

**E1 — Risk-weighted verification gates** · M · coder
- CONTEXT: B1/B3 landed advisory; D2 makes research emit risk/tier. Now enforcement.
- GOAL: verify-guide.mjs: (a) R2+ perishables must be facts.json rows (prose-inline hard-fails — upgrades check-research D2 from warn), (b) R2+ rows require `tier`; R3/R4 require `tier: primary` + `evidence`; (c) R4 rows must be SURFACED (referenced by ≥1 token in a rendered group — an omitted advisory is a blocker; regression case 6), (d) B3's hygiene flags become blockers at R2+.
- FILES TO INSPECT/CHANGE: `scripts/verify-guide.mjs`, `scripts/audit/check-research.mjs`, tests.
- DO NOT TOUCH: existing blocker semantics for R0/R1 (unchanged); japan live guide.
- TESTS: fixture guide fails with named R-tier blockers; korea/us pass (or their true findings are enumerated in the PR).
- ACCEPTANCE: regression cases 5, 6, 9, 10 detected as blockers on the fixture.

**E2 — Source drift detection** · M · coder
- CONTEXT: 200 ≠ verified (D8). B1 added `evidence` snippets for R3/R4.
- GOAL: extend the `--network` content audit: for rows with `evidence`, fetch `source_url` and require the snippet OR the normalized value to appear in the page text; miss ⇒ `drifted` (advisory for 1 release, then blocker for R3/R4). Respect the existing r.jina.ai-mirror second-attempt rule; unreachable keeps the existing unreachable path.
- FILES TO INSPECT/CHANGE: the `--network` audit path in `scripts/audit/` + verify roll-up row + tests (mocked fetches — zero-network tests per repo doctrine).
- DO NOT TOUCH: citation-audit critic duties (they remain the sampled human-grade check; this is the deterministic floor).
- TESTS: mocked page-with-value passes; page-without drifts; 200-empty-page drifts (the exact "200 ≠ verified" case).
- ACCEPTANCE: regression case 12-class drift (a closure notice replacing a price page) is caught by the value-absence path.

**E3 — Contradiction + uncertainty in the verify roll-up** · S · coder
- CONTEXT: C2 gates intake at scaffold; the guide itself must also not SHIP contradictory or silently-uncertain plan-critical facts (cases 2, 4, 7, 8).
- GOAL: verify roll-up adds: (a) C2's checker re-run against the intake doc (blocker if a contradiction has no `**Assumed:**` resolution), (b) anchor/date facts whose intake certainty ≠ `fixed` must carry `⚠` or an explicit assumption note in the guide (case 2), (c) forecast-class facts (koyo) must be `state: approx` with a dated source, never bare dates (case 4), (d) passB-coverage verdicts referencing ledger rows that never got a Pass A/reconcile counterpart are flagged (case 8, B-only research).
- FILES TO INSPECT/CHANGE: `scripts/verify-guide.mjs`, `scripts/check-passb-coverage.mjs`, tests.
- DO NOT TOUCH: floors; question mechanism.
- TESTS: fixture triggers all four; synthetic clean guide passes.
- ACCEPTANCE: cases 2, 4, 7 (weak support = single non-primary source on an R3 anchor-adjacent claim), 8 detected.

**F1 — Archive generated/historical artifacts** · S · mechanic
- `korea.revision-27*.json` → `guides-intake/archive/`; grep for readers of those paths first (boundary check #1). ACCEPTANCE: builds/tests green, no reader breaks.

**F2 — Trim pipeline.md to policy** · S · scribe
- Move W-series/shipped-✅ history to a new pipeline-history file under `docs/archive/` (F2 creates it). The PUBLISH section is **left describing auto-graduation** (G1 struck) — do not rewrite it. ACCEPTANCE: pipeline.md ≤140 lines, PUBLISH still documents auto-graduation accurately, docs-integrity test green.

**F3 — Pointerize new-guide.yml's embedded prompt** · S · mechanic
- Replace the 15-line interactive prompt in the issue comment with a 2-line pointer to the skill. ACCEPTANCE: comment renders, no workflow-behavior change.

**F4 — Prose-reduction ledger** · S · scribe
- Record before/after `wc -l` for SKILL.md, references, workflow prompt blocks, pipeline.md in the PR that closes Phase F. ACCEPTANCE: net total strictly down vs the 2026-08-12 baseline (1,413 skill + 316 CLAUDE.md + ~600 workflow prompt lines). No orphan-cleanup subtasks — the inventories found none.

**H1 — Regression harness: 12 cases, one command** · M · coder
- CONTEXT: The proof. Mandate §31 — the design must DETECT all 12 Japan defects; Japan itself is never cleaned.
- GOAL: `scripts/__tests__/japan-regression.test.mjs` running the B/C/E checkers against `tests/fixtures/japan-regression/` and asserting each case's specific finding fires (table-driven: case id → checker → expected finding code).
- FILES TO INSPECT: fixture MANIFEST.md, all checkers.
- FILES TO CHANGE: the test file only.
- DO NOT TOUCH: checkers (failures here are checker bugs — fix via the owning packet, never by loosening the test).
- TESTS: itself. ACCEPTANCE: 12/12 red-green — each case demonstrably detected; suite is part of `npm test`.

### Case→packet coverage map (mandate §31)

| # | Case | Detected by |
|---|---|---|
| 1 | Conflicting birthday info | C2 |
| 2 | Oct 15 vs 22 unconfirmed start | C1+C2, E3(b) |
| 3 | Unresolved Wild Area venue | E1(a) — R3 plan-critical without a primary-tier fact row |
| 4 | Koyo forecast uncertainty | E3(c) |
| 5 | Tax-free transition | E1(b) + D1 (destination config names the rule change source) |
| 6 | Blocked travel advisory | E1(c) — R4 must be surfaced |
| 7 | Weak birthday-restaurant support | E3 (single weak source on R3-adjacent claim) |
| 8 | B-only research | E3(d) |
| 9 | Section-vs-item provenance | B3 + E1 |
| 10 | Malformed `$19,` values | B2 + B3(b) |
| 11 | Routing assumptions | §4 Routes check (advisory w/o key; packet inside E1's scope note) |
| 12 | Zao closure risk | E2 drift/value-absence + S1 Places status |

---

## 9 · Test plan

- **Unit:** every new script ships with vitest coverage in the repo's existing zero-network
  style (mocked fetches); contract tests extended for C1.
- **Regression:** H1's table-driven 12-case suite against the frozen fixture, in `npm test`.
- **Preserved:** the full existing suite (805+) stays green at every packet; no test deleted
  or weakened (mandate).
- **Boundary checks** (repo doctrine — run only where a packet touches a seam):
  C2 touches workflows ⇒ force the failure path once (dispatch research-pass on a scratch
  slug with a contradiction planted; confirm the question posts and the run proceeds). The
  "confirm a PASS run lands still-draft" check is struck with G1. E2 ⇒ one live fetch
  against a real source URL before
  declaring the mocked logic done. D1 ⇒ grep for competing config discovery before adding
  the destinations dir.
- **Skill:** D2 gated by `skill-evals.yml` (existing PR gate on `.claude/skills/**`).

## 10 · Rollback & safety plan

- Packets are single-commit, independently revertible; phases land as separate PRs.
- All schema fields are **additive + optional** — reverting a consumer never breaks data.
- New gates land **warn-first** (B3, E2) with a named flip-to-blocker packet, so a false
  positive never bricks the pipeline mid-arc.
- G1 is struck (2026-08-13) — auto-publication stays, so there is no publication-path change
  to roll back. Removing auto-graduation later is a creator-only decision, not a packet.
- External APIs default OFF (config-gated); absent keys degrade checks to advisory, never
  failures. No credentials in the repo at any point.
- The attempt circuit breaker (CAP 5) and checkpoint spine are untouched — a broken gate can
  never cause unbounded agent spend.

## 11 · Definition of done (the whole program)

1. H1 green: **12/12 regression cases detected** against the frozen fixture; Japan's live
   guide byte-identical to its pre-program state — permanently, not just for this program
   (creator ruling 2026-08-13: Japan is never repaired).
2. `facts.json` remains the ONLY fact registry; `risk`/`entity`/`evidence`/`tier` live there;
   no parallel evidence store exists anywhere in the tree.
3. ~~A newly researched guide cannot publish without a human `graduate-approved` label.~~
   **STRUCK 2026-08-13** — auto-graduation on verify PASS is intended behavior and is
   preserved unchanged. The evidence gate (build + verify) is the publication bar.
4. Intake round-trips certainty states; a planted contradiction produces a traveler question
   and a recorded assumption, deterministically.
5. Net prose reduction recorded and negative (F4 ledger) — skill corpus + workflow prompts
   + pipeline.md strictly below the 2026-08-12 baseline.
6. Full existing test suite + new suites green; `npm run build`/`lint`/`typecheck` green;
   no credentials or keys in the repo; every external integration inert when unconfigured.
7. The spine (checkpoints, A/B independence, single critic, land-branch, attempt budget)
   demonstrably unchanged: `pipeline.mjs` and `land-branch.sh` **diff-clean, full stop** —
   with G1 struck, no packet in this program has any reason to touch either file.
