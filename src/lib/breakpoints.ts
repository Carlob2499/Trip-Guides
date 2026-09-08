/* THE BREAKPOINT SOURCE — three numbers, one file, every surface that switches on width.

   Before this file the same two numbers were typed out in ten places (four stylesheets, an
   .astro component, three feature scripts, an onboarding script) and nothing connected them.
   CONTEXT.md's 2026-08-12 decision names that scatter as a CAUSE, not a tidiness problem: the
   guide-desktop and tablet audits each independently found navigation-model files disagreeing
   about which body model applied at the same width, and a literal repeated ten times is how a
   pair of them drifts apart without anyone editing anything.

   WHY A .ts MODULE AND NOT A CSS TOKEN. base.css is the design-token home, but a custom
   property cannot be read inside an @media or @container PRELUDE — the condition is evaluated
   before the cascade exists, so `@media (max-width: var(--bp)))` is simply invalid. There is no
   preprocessor in this build (no PostCSS config, no Lightning CSS drafts) to substitute one
   either. So the stylesheets keep their literals, each marked at the site it appears with a
   `bp:` comment naming the constant it owes itself to, and src/styles/breakpoints.test.ts parses
   both this file and every marked site and fails when they disagree. Same shape as
   type-scale.test.ts and atlas-tokens.test.ts: the source is declared once, mirrors are PARSED
   rather than hand-copied, and drift is a failing test rather than a screenshot someone notices
   six weeks later.

   JS reads it directly — see the four import sites. Each still writes its own matchMedia() call
   rather than calling a shared isPhone() helper, deliberately: scripts/__tests__/
   no-device-checks.test.mjs works by NAMING every file that reads a width, and a helper would
   hide the next one behind an import the gate cannot see. */

/** Phone model ceiling. Page CHROME only — the bottom tab bar, the yielding topbar, the swipe
    gesture, the sheet. A VIEWPORT number by design: chrome is positioned against the viewport,
    which is the one thing it may legitimately ask about (guide.css, R5 container scaffold). */
export const MOBILE_MAX = 899;

/** Tablet model floor — the guide body's CONTAINER width, never the viewport.
    Lowered from 744 on 2026-08-12: .shell's query box is the viewport less its own 1.1rem
    gutters (35.2px), so a 768px iPad measured 732.8px and fell under the old literal — the
    single most common physical tablet never got the tablet model even once the dead
    self-referential @container was fixed. */
export const TABLET_MIN = 720;

/** Desktop model floor — the same container, where the spine turns horizontal again. */
export const DESKTOP_MIN = 1180;

/** The width the frame STRIP needs to draw itself at full size — a VIEWPORT number, like
    MOBILE_MAX and for the same reason: the strip is chrome, positioned against the viewport.

    Added 2026-09-08 because the number already existed, unwritten. Between MOBILE_MAX+1 and
    here the strip's three groups (wordmark · destination tabs · Search/SOS/share/theme) want
    more row than the frame has, and a centred middle group overflows out of both its sides
    instead of clipping, so the wordmark drew over the tabs and the tabs over the search pill at
    900, 960, 1024 and 1060. chrome.css compacts the strip below this width; above it the search
    label, its shortcut and the quiet orientation label come back. Not DESKTOP_MIN: that one is
    the guide body's CONTAINER floor and answers a different question about a different box. */
export const STRIP_FULL_MIN = 1100;
