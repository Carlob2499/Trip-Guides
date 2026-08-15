# design_handoff_guide_ui — the R5 guide-UI export

**The port this bundle directed has shipped.** What remains here is reference, not a work order:
the exact values a design decision was made against, and the kit the `waypoint-design` skill
composes from. Nothing in this folder outranks the repo's live design authority.

**Authority order**, highest first — apply it before quoting anything below:

1. `docs/design-handoff/DESIGN.md` — the single written design authority. R5's seven overrides
   were folded into its body on 2026-08-14 and `SUPERSEDES.md` deleted with them.
2. `docs/design-handoff/enforcement/` — `SPEC-COMPONENTS.md`, `ANTIPATTERNS.md`,
   `ACCEPTANCE.md`, and `check-drift.mjs`, the machine-checkable half.
3. The prototypes and screenshots — `prototypes/` here, plus `docs/design-handoff/screenshots/`
   and `enforcement/screenshots/`. Compare a running build against the pictures, not only the
   prose.

Token values are the one thing none of these own: `src/styles/base.css` is the place a token
value is ever true, and its `ATLAS TOKEN CONTRACT` comments carry the contrast measurement
behind each one.

## What shipped from this bundle

The spine rail (with Tools and Field log as stations, `src/features/guide-rail/`), the phone pill
row and progress line, the day scrubber, the fold, the gap block, the lifted day palette with the
`glare` theme deleted, the cities-and-next-leg plate line, four tools instead of five, and Trip
Split shipping empty. The R5 narrative, the reading order, the paste-in prompt, the six-step build
order and the fallback rules were the *process* half of that port — deleted 2026-08-15. All five
read back from the commit before the deletion:
`git show 39fd26e:docs/design-handoff/design_handoff_guide_ui/<file>` (`HANDOFF-R5-NARRATIVE.md`,
`00-START-HERE.md`, `PROMPT.md`, `BUILD_ORDER.md`, `FALLBACKS.md`). The absent-state rules they
carried are doctrine in `CLAUDE.md` and DESIGN.md, and the gates are live tests.

## What is still here, and why

| Path | What it is |
| --- | --- |
| `TOKENS.md` · `COMPONENTS.md` | exact values and per-component measurements — the reason to open this folder |
| `SCREENS.md` · `BEHAVIOR.md` | screen composition per viewport; interaction, state, motion, keyboard, print |
| `TESTS.md` · `ACCEPTANCE.md` | the tests the port was held to, and its ticked checklist |
| `design-system/` (incl. `ui_kits/`) | the kit export — `styles.css`, components, guideline cards. The `waypoint-design` skill reads this |
| `prototypes/` | runnable design references. **Not production code**; they render in a design-tool runtime |
| `shots/` | working captures kept for states the committed screenshot sets lack — see `shots/INDEX.md` |
