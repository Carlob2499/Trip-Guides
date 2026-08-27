# Waypoint Design Constitution & September Design Program

Status: **AUTHORITY (pending Carlo's approval of §1–§4) + LIVING TRACKER (§5–§6)**
Owner: Carlo. Drafted 2026-08-27.

This is the single owner of Waypoint's visual identity, design-system decisions, and the
joint design/backend September schedule. Both Claude and Codex follow §5–§6. It does not
redefine Pipeline V2; backend delivery truth stays in `docs/pipeline v2/SEPTEMBER_TRACKER.md`.

---

## 1. Identity — what Waypoint looks and feels like

One sentence: **a modern boutique travel app with airline-grade precision and field-journal warmth.**

The blend, as testable rules:

- **Modern boutique (the ground).** Airy layouts, soft cards, generous whitespace,
  polish that disappears. Default posture for every surface.
- **Airline precision (the data).** Perishable facts, prices, hours, transit render as
  dense, ordered, engineered information — tables and rows, never decorative prose.
  Precision earns trust; it is applied to *data regions only*.
- **Field-journal warmth (the accent).** Paper-tinted neutrals (the existing sage/cream
  palette) and painterly touches (Painted Atlas energy) appear only in **designated accent
  slots** — mastheads, atlas art, section marks. Warmth never carries data.

Test for any new surface: could you point at each region and name which of the three
registers it is in? A region serving two registers at once is drift.

This extends, and must not contradict, the field-instrument contract in
`.claude/skills/waypoint-design/SKILL.md` (quiet paper, loud marks; truth stays visible).

## 2. Architecture — one brand, themed modes

- **One token core** in `src/styles/base.css` + `palette.css`: color roles, `--text-*`
  type scale, spacing, fonts, safe-areas, contrast doctrine (`--accent` / `--accent-ink` /
  `--on-accent` rules). This core is the only place raw values (hex, px sizes) may live.
- **Surfaces are themes of that core.** Guide reading, field tools/PWA, Painted Atlas, and
  print each remap core tokens; they do not introduce new raw values.
- Existing machine gates are the enforcement floor and only ratchet tighter:
  `type-scale.test.ts`, `var-defined.test.ts`, `on-fill.test.ts`, `breakpoints.test.ts`,
  `atlas-tokens.test.ts`, the accessibility gate, and the design drift checker.

## 3. Non-negotiable contexts

Every component must define, from creation:

1. **Dark mode** — via the core dark tokens (`--dark-*` remap), never per-component colors.
2. **Offline / degraded honesty** — explicit states for missing data, stale content
   (`--ochre` register), and no-network; blanks stay honest, no decorative shells.
3. **One-handed phone use** — ≥44px touch targets; primary actions bottom-reachable on
   field screens; glare-readable contrast (the existing contrast doctrine).

**Deliberately excluded from first-class status:** print. `print.css` is maintained so
guides stay printable, but no new component is designed print-first.

## 4. Governance — locked down

- Agents compose **only** from approved components and core tokens. New colors, spacing
  values, fonts, or components require Carlo's approval and land in the core/registry
  first; a component registry + CI check (D3 below) makes this mechanical.
- **Division of labor:**
  - **Claude** authors all binding design authority: this document, tokens, registry,
    enforcement tests, migrations, major design specs.
  - **Codex** stays in the backend/pipeline lane; it reviews design PRs under the
    revision-4 trust boundary but does not author design authority.
  - **ChatGPT (external)** is divergent research only — inspiration, comparative pattern
    research, naming. Its output is advisory and enters the repo only after Claude vets it
    against this constitution. Prefer the local `ui-ux-pro-max` skill for generic pattern/
    palette research before spending external chat turns.
- Presentation work never alters factual content (per `waypoint-design` skill).

## 5. Joint September schedule — design interleaved with Pipeline V2

Backend hard dates (owned by `SEPTEMBER_TRACKER.md`): **feature freeze Sep 20 · code
freeze Sep 27 · backend complete Sep 30.** Design work is scheduled so expensive
model/validation weeks are never double-booked; weekly usage is spent on one heavy
program at a time.

| Week | Backend focus (authority: SEPTEMBER_TRACKER) | Design focus | Design spend |
|---|---|---|---|
| Aug 27 – Sep 2 | Independent review of R-A–R-F/W1 repair branch (Codex) | D1 Constitution approved; ChatGPT reference-gathering | Light |
| Sep 3 – 9 | Fresh repaired-class Run-B validation (heavy model spend) | D2 Token core consolidation + tightened tests (deterministic only) | Light |
| Sep 10 – 16 | Await/execute cutover decision work | D3 Component inventory, cull, registry + CI check; D4 gallery page | **Heavy** |
| Sep 17 – 23 | Feature freeze Sep 20 | D5 dark-mode remap + gallery screenshot baselines land **before Sep 20**; then migration of guide reading pages (refactor-only) | Medium |
| Sep 24 – 30 | Code freeze Sep 27; backend complete Sep 30 | No new design code. D6 taste review of gallery (`better-interface`), punch list only | Light |
| Oct 1 + | Post-cutover stabilization | D7 execute punch list; migrate field tools, then atlas/home; scalability proof: one new surface built zero-custom-CSS | Medium |

If a backend week slips, its design counterpart slips with it; design never preempts a
validation or cutover run in the same week.

## 6. Design work items

Statuses: `NOT STARTED` · `IN PROGRESS` · `READY FOR REVIEW` · `DONE`

| ID | Item | Owner | Target | Status |
|---|---|---|---|---|
| D1 | This constitution approved by Carlo | Claude → Carlo | Sep 2 | READY FOR REVIEW |
| D2 | Token core consolidated; raw values outside core fail tests | Claude | Sep 9 | NOT STARTED |
| D3 | Approved-component registry + CI check (locked-down enforcement) | Claude | Sep 16 | NOT STARTED |
| D4 | Component gallery page: all components × themes × light/dark × data states | Claude | Sep 16 | NOT STARTED |
| D5 | Dark-mode core remap + gallery screenshot baselines (in before Sep 20) | Claude | Sep 19 | NOT STARTED |
| D6 | Holistic taste review of gallery; punch list | Claude | Sep 30 | NOT STARTED |
| D7 | Punch list + field-tools/atlas migration + zero-custom-CSS scalability proof | Claude | Oct 7 | NOT STARTED |
