# design_handoff_guide_ui — the R5 guide-UI export

**The port this bundle directed has shipped.** What remains here is **legacy R5 implementation
reference**, not a work order and not design authority. The current `waypoint-design` skill does
not load this bundle by default.

For current design decisions, read `docs/reference/design-system.md` first. Use this folder only
when shipped implementation cites a specific historical measurement/behavior that has not yet
been migrated. Prototypes and screenshots record what R5 looked like; they are not acceptance
targets for evolved WayPoint.

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
| `design-system/` (incl. `ui_kits/`) | historical kit export — `styles.css`, components, guideline cards; not loaded by the current design skill by default |
| `prototypes/` | runnable design references. **Not production code**; they render in a design-tool runtime |
| `shots/` | working captures kept for states the committed screenshot sets lack — see `shots/INDEX.md` |
