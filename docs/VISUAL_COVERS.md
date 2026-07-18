# Cover Art & the Magical Open — visual initiative

The design north-star for the site's visual identity work (roadmap R3 dynamic-runtime + R4
per-country identity, pulled together because they're one idea). Sits beside `docs/PIPELINE.md`
(the generation/maintenance north-star) — this is the *presentation* north-star.

## The one idea

**A guide's cover is a single shared object.** The hub shows it as a card; tapping it **morphs that
same cover into a full-bleed hero atop the guide** — "the card opens into the guide as if it had a
cover hero page." Cover art and the magical open are not two features; the cover *is* the thing that
morphs, so it must look intentional at both sizes (thumbnail card ↔ full-bleed hero).

Today the "cover" is auto-borrowed: the guide's **first sight photo**, tinted by the country
`--accent` (`src/lib/themes.ts`). That's the seed we elevate into deliberate, per-trip cover art.

## Architecture decision: cross-document View Transitions, NOT a client router

The morph uses **browser-native cross-document View Transitions** — `@view-transition { navigation:
auto }` in CSS plus a shared `view-transition-name: cover-<slug>` on the hub card/hero image and the
guide's `.mast-img`. Deliberately **not** Astro's `<ClientRouter />` (the SPA variant):

- The guide pages run heavy client JS on normal page load (tabs, Trip Split, maps, Firebase, palette,
  SOS). A ClientRouter swaps the DOM without a real navigation, so all of that would need re-wiring to
  `astro:page-load` — a large, fragile change with real regression risk.
- Cross-document VT keeps every navigation a **real page load** (scripts run exactly as they do now),
  adds **zero JS**, and **degrades gracefully**: browsers without support (Firefox today) just
  navigate normally. Reduced-motion drops the animation, not the navigation.

The morph is the site's **signature** — so everything around it stays calm (a ~420ms editorial expand
on a cubic-bezier, not a flashy zoom). Spend the boldness in one place.

## Cover-art direction (the aesthetic — to build next, with sign-off)

Every guide gets a cover that could only be *that* trip, generated at build from data it already has —
no hand-design per guide, so every current and future guide inherits it:

1. **Photo-grounded.** The guide's chosen cover photo (or its best sight photo) is the base — it roots
   the cover in the real place, not an abstract graphic.
2. **Palette-signed.** The country `theme` palette (accent/primary/secondary, already contrast-gated)
   drives a duotone/gradient scrim + rule, so Korea and Denmark read as unmistakably *different*
   countries at a glance, even as thumbnails.
3. **Editorially titled.** The title in the display face (Bricolage Grotesque), with the country as a
   quiet eyebrow — the masthead already does this; the card should echo it so card and hero feel like
   the same object.
4. **Procedural fallback.** A guide with no usable photo (a fresh scaffold) gets a palette-only cover
   (gradient field + big country initial — the existing `hubcard-cover--typo`), so the system never
   breaks and drafts still look intentional.

Photos stay **Wikimedia-Commons-only** (verifiable licensing) — the cover never introduces an
unlicensed asset. "Its own cover art" means *chosen + treated*, not *newly sourced*.

## Phases

| Step | Deliverable | State |
|------|-------------|-------|
| **V1 · Magical open** | Cross-doc VT morph card/hero → guide masthead hero; `transitions.css`; reduced-motion + graceful degradation | shipping now |
| **V1 · Cover data** | Optional `cover {file, alt, credit, focal}` on the guide meta schema; hub + masthead prefer it over the first sight photo (backward-compatible) | shipping now |
| **V2 · Cover-art treatment** | The duotone/palette + editorial cover component reused by card + hero; procedural fallback; per-guide `cover` chosen for Korea/Denmark | next (needs aesthetic sign-off) |
| **V3 · R3 runtime rest** | View Transitions polish (title morph, back-nav), live-data tiles, offline/connection state machine, per-view (Focus Today / what's-open-now / weather day-swap) | after V2 |
| **V4 · R4 identity engine** | Palette auto-extracted from the cover image at build (node-vibrant), one signature motion set, motion-doctrine doc | after V3 |

## Guardrails (inherited)

- Shared components are global; a cover change touches every guide at once — iterate freely there.
- Uniform across surfaces: the same cover renders on card, hero, masthead, OG, print — apply any
  treatment change to all in one pass; never render the same datum twice as if it were two things.
- Clickability obvious; reduced-motion respected; base-path hrefs explicit; verify at 375px + desktop,
  dark + light, in `astro preview` (never `astro dev` — OneDrive serves stale CSS).
