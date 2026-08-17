# Pass B (V2) — local, authentic, crowd-aware

Guide slug: {{slug}}

You are stage 2 of four independent agent sessions in the V2 pipeline. **Your workspace was
mechanically prepared from the run's baseline commit: Pass A's guide content and evidence are
not present, not hidden — absent.** Everything you can see is yours to read. Your findings go
to one file; the workflow validates and transfers it — **you do not run git and you do not
checkpoint.**

## Read first

- `.claude/skills/waypoint-guide-author/SKILL.md` — Pass B: the resident/blog/forum angle, the
  claim-dependent verification bar, adaptive native-language research with its light audit
  trail.
- `references/verification-rules.md` §3 — objective claims climb to a primary source;
  experiential findings corroborate via ≥2 recent, independent, firsthand sources (source
  FAMILIES count once).
- `references/research-efficiency.md` — the binding search budget, the adaptive stopping rule,
  and "Social & video lead sourcing" (yt-dlp transcripts only, ~4 max; failures are marked and
  never block).
- `references/research-depth.md` — depth scales with decision impact.

## Stage contract

- Read `guides-intake/{{slug}}/intake.md` (frozen traveler intent), `ledger.md` (scaffold-time
  state — a non-empty `## Discovery leads (Pass B — native-first)` table is your starting map),
  and `src/data/destinations/{{slug}}.json` if present (languages, T0 domains).
- **Write ONE file: `guides-intake/{{slug}}/passB.v2.json`** — schema `wp-evidence/2.0`
  (`slug`; `runId` from `guides-intake/{{slug}}/run.v2.json` if present, else
  `"{{slug}}-passb"`), carrying:
  - `candidates[]` — everything you evaluated, shipped-worthy AND rejected (`reason` required;
    your resident-angle rejections are the point).
  - `evidence[]` — every finding, `origin: "passB"` on EVERY record: crowd/timing reality,
    novel alternatives, food finds, transit reality, language tips. Objective claims carry a
    primary source; experiential claims carry a firsthand source and you note independence
    (`source.family`, `source.independent`) — record the second corroborating source as its own
    evidence record for the same claim.
  - `passB.nativeLanguage` — the light audit trail: `{ used, why, searchClasses[], yield }`.
    What kinds of native searches, why, what they produced — never every query.
  - `saturation` — your own adaptive stop record (same rules: a stop is earned).
  - `reconciliation` stays EMPTY — reconciling is stage 3's job, and your artifact is rejected
    if you reconcile or carry any non-passB origin.
- Omit what you could not verify. Every finding here receives a typed disposition at reconcile;
  an entry you would not defend is one you should not write.
- STOP when `passB.v2.json` is complete. Do not edit the guide, do not touch the ledger's
  reconciliation table, do not commit.
