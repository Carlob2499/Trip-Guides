# Paste this into the repo's CLAUDE.md

The anchor docs only work if they are read; CLAUDE.md is injected into every session, so
these rules cannot be skimmed away. Keep the block short — persistent context is expensive.

---

## Waypoint design system — non-negotiables

**The prototypes are the floor, not a mood board.** `Waypoint Overdrive v2.dc.html` and
`Waypoint Mobile.dc.html` are EXACTLY where the design starts. Phase one is a faithful
port — reproduce them, do not interpret them. No improvements, simplifications,
"modernisations", or personal taste until the port matches the prototype 1:1 and every
ACCEPTANCE.md gate passes. Iteration is a separate, later conversation that the user
starts — never something you begin on your own.

This repo is mid-migration to the Surveyor's Sheet design. The authority chain is:
\`DESIGN.md\` > \`design_handoff_waypoint_atlas/SPEC-COMPONENTS.md\` > the prototype > your judgment.
When in doubt, look it up; never re-derive a value that exists in those files.

**Hard rules (machine-checked by \`node check-drift.mjs src\` — run it before saying done):**
- Colours resolve through \`tokens.css\` variables only. \`--accent #9c4421\` is identical in
  both themes. No new tokens, no literals, no shadows.
- \`border-radius\` is \`0\` (content) or \`999px\` (pressables). Nothing between.
- Two typefaces: Literata (prose) and Source Sans 3 (uppercase-tracked notation). Never a third.
- Fixed/sticky edges pad with \`max(reserved, var(--safe-*))\`, never bare \`env()\`.
- Animate transform/opacity only. Panel collapse is 340ms power2.inOut; all other durations
  are in SPEC-COMPONENTS.md §9. \`prefers-reduced-motion\` cuts, it does not soften.

**Before designing a solution to ANY layout/interaction problem, check
\`ANTIPATTERNS.md\` — 25 obvious approaches were already built and rejected there.**

**At the end of each phase, run the matching gate in \`ACCEPTANCE.md\` and report every box.**
A phase with an open box is not done. If a check conflicts with something you built, the
check wins; do not rationalise the difference.

**Never:** invent a fact, an exchange rate, or a holiday; soften a gap block; add an
entrance animation to the table view; re-tune the globe or the pin-card solver; port
\`prototype/trip-split.js\` over the TypeScript originals.
