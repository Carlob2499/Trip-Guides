# Waypoint Design Constitution

Status: **CURRENT DESIGN AUTHORITY — D6 RECONCILIATION IN PROGRESS**  
Owner: Carlo.  
Last reconciled: 2026-09-02.

This document is the **single human-readable authority for Waypoint visual and interaction
design**. No file under `docs/design-handoff/`, no prototype, screenshot, archived redesign,
research packet, or historical decision log may override it.

Authority order:

1. `PRODUCT.md` — user, product purpose, field-use priorities, capabilities, truth.
2. **This document** — brand identity, responsive composition, visual/interaction grammar.
3. `docs/reference/motion.md` — subordinate motion implementation doctrine.
4. `docs/reference/component-registry.json` — machine-facing approved component/pattern surface.
5. `src/styles/base.css`, `src/lib/breakpoints.ts`, tests/gates — executable token and safety truth.

`docs/research/waypoint-design-reference-packet.md` is advisory evidence for D6/D7. It is
never authority by itself.

---

## 1. Identity

Waypoint is **a modern boutique travel app with airline-grade precision and field-journal
warmth**.

Three registers make that concrete:

- **Modern boutique — the ground.** Calm, intentional composition; generous but useful space;
  restrained depth; polish that disappears into the task.
- **Airline precision — operational truth.** Hours, prices, transit, timing, reservations,
  warnings, state, and verification are aligned, scan-first, and predictable.
- **Field-journal warmth — identity and editorial context.** Photography, illustration,
  destination character, cartography, and narrative warmth live in controlled editorial
  regions. They never distort operational facts.

A screen may contain multiple registers, but each region must have a clear job. Decorative
language never carries safety, uncertainty, price, time, route, or verification meaning.

### Typography

- **Literata Variable** — display and reading voice.
- **Atkinson Hyperlegible Next** — operational/data/control voice, with tabular numerals where
  alignment matters.
- Existing CJK/system fallbacks remain.
- No third type family without an explicit constitution change.

### Palette

Direction: **Night Navy & Amber on warm paper**.

- deep navy = Waypoint structure/identity;
- amber = selected action/emphasis;
- warm paper/cream = daylight ground;
- warm charcoal = dark-mode ground; never blue-gray;
- semantic success/caution/critical states retain their own meaning and are not repurposed as
  destination decoration.

Destination-specific color may appear in approved identity regions when it preserves contrast
and semantic clarity. Final values come from the token system, never one-off call-site literals.

---

## 2. Responsive web design — a constitutional principle

Waypoint is one product with **responsive sibling compositions**.

Responsive does **not** mean:
- desktop with pieces hidden;
- mobile stretched larger;
- device-name branching;
- a handful of screenshots at canonical breakpoints.

The information and capability remain coherent while layout, disclosure, navigation, and
simultaneous context recompose according to available space, input method, and traveler state.

### Rules

1. **Mobile is designed, not derived.** Active-trip context comes first. Primary actions remain
   thumb reachable. Simultaneous regions reduce; disclosure becomes sequential where helpful.
2. **Desktop earns its space.** Use width to reveal relationships, compare options, and show
   spatial + operational context together. Do not merely enlarge phone cards.
3. **Prefer intrinsic/container-driven layout for content.** Components respond to the space
   they actually receive. Viewport queries are primarily for viewport-owned chrome and
   genuinely viewport-bound behavior.
4. **Intermediate widths are first-class.** A design is not accepted only because 375px and
   1440px look good.
5. **Notation relocates; it does not shrink into illegibility.** Dense tables, timelines,
   maps, and diagrams recompose, scroll locally, or disclose progressively.
6. **No capability loss by width alone.** Narrow screens may reprioritize or sequence a
   capability; they do not silently remove it.
7. **Safe areas are part of layout.** Fixed/sticky controls reserve notches, home indicators,
   and browser chrome correctly.
8. **320px reflow is the safety floor.** Long names, CJK/multilingual strings, text zoom,
   split-screen, landscape phones, tablets, and hostile unbroken content must not create
   page-level clipping or inaccessible actions.

Acceptance must cover phone, intermediate/tablet, desktop, touch, mouse, keyboard, dark mode,
text enlargement, reduced motion, offline/degraded state, missing data, and realistic long
content.

---

## 3. Hierarchy before features

Waypoint does not give every capability equal visual weight merely because it exists.

During active travel, the default hierarchy is:

1. **Now**
2. **Next**
3. **Leave by**
4. **Get there**
5. **Material problem / uncertainty**
6. **Relevant fallback**
7. everything else

Before and after a trip the hierarchy may change, but it must remain deterministic and based on
information Waypoint actually has.

A traveler should be able to identify the next useful action within a few seconds.

---

## 4. Composition grammar

The design system standardizes vocabulary without forcing every page into the same grid.

Use four composition families as defaults:

### Editorial
Destination identity, culture, context, imagery, explanatory prose. May use freer composition
and controlled visual drama.

### Operational
Schedules, hours, prices, transit, reservations, state, checklist, settlement. Compact,
aligned, predictable, scan-first.

### Spatial
Map + place relationships, route context, neighborhood/area orientation. Map and textual/list
representations should share selection and state rather than behaving as separate products.

### Focused action
One immediate task with minimal competition: route, SOS, save/change, add expense, resolve a
specific warning.

Cards/panels are tools inside these grammars, **not the universal page canvas**.

---

## 5. Progressive disclosure and truth

Dense verified information should feel calm without becoming vague.

Default sequence:
- immediate field answer;
- operational facts;
- deeper explanation/provenance on demand.

Never hide:
- a safety-critical warning;
- material uncertainty;
- stale/conflicting state that changes a decision;
- the only information needed to understand an action.

Routine verified state may be quieter than adverse state. Verification remains traceable to
claim/source/date; visual treatment may evolve during D6.

Customer-facing UI never exposes pipeline, agent, register, gate, or implementation vocabulary.

---

## 6. Destination identity

Different destinations should feel distinct without becoming different products.

Destination personality belongs in controlled regions such as:
- mastheads/hero media;
- selected editorial illustration or photography;
- atlas/spatial moments;
- section identity accents.

Operational structure remains stable across destinations. Never theme warnings, prices, hours,
transit, evidence, or interaction semantics into decorative local motifs.

Generic AI-looking gradients, invented local symbolism, and interchangeable "travel aesthetic"
art are rejected.

---

## 7. Motion

Motion explains **where something went, what changed, or how states relate**.

- Routine interaction is fast, interruptible, and subordinate to the task.
- Native scrolling is never hijacked.
- Shared/spatial continuity is preferred when it preserves orientation.
- A small number of geographic/spatial moments may be memorable; spectacle without orientation
  value is rejected.
- Continuous motion must encode live meaning or earn an explicit exception.
- Reduced motion supplies a complete usable state, not a broken or second-class version.

Implementation vocabulary and current owners live in `docs/reference/motion.md`.

---

## 8. Accessibility, resilience, and field conditions

WCAG 2.2 AA is the binding floor, plus Waypoint's stricter field-use requirements.

- Important field controls target at least approximately 44×44 CSS px where practical.
- Contrast and type are judged for outdoor/glare use, not only desktop viewing.
- Focus, keyboard, touch, and assistive semantics remain complete.
- Critical state never relies on color alone.
- Offline/degraded behavior remains honest.
- Low-bandwidth and conservative-media paths remain useful.
- Reduced-motion is complete.
- Print remains supported, but screens are designed screen-first.

A visually impressive state that fails the traveler under poor signal, glare, long text, or one
hand is not an approved Waypoint design.

---

## 9. Simplification and convergence

**Merge before adding. Retire before replacing.**

When a new pattern supersedes an old one, the old implementation and its active authority are
removed in the same program unless a documented compatibility reason prevents it.

Before introducing a component, navigation model, overlay, control family, layout grammar,
motion pattern, or visual treatment:

1. Can an existing one do the job?
2. Can two existing variants be consolidated?
3. Can an obsolete behavior be deleted instead?
4. Is this solving a traveler problem or preserving an old iteration?

No zombie patterns: two generations of navigation, cards, sheets, verification marks, or
responsive models do not coexist indefinitely.

Historical prototypes and experiments are evidence in Git history, not production authority.

---

## 10. Governance

- Agents use this constitution plus approved tokens/components; they do not infer authority from
  historical handoffs or prototypes.
- New global tokens/components require Carlo's approval and registry-first landing.
- New feature-specific composition may start locally when it uses approved primitives; it should
  graduate into the global system only after demonstrated reuse.
- Presentation work never alters factual travel content.
- Research is advisory until explicitly adopted here.
- Machine gates enforce safety floors and should ratchet toward this constitution, never preserve
  a superseded aesthetic by accident.

### Active design files

Keep active:
- `PRODUCT.md`
- `docs/reference/design-system.md`
- `docs/reference/motion.md`
- `docs/reference/component-registry.json`
- executable token/breakpoint/accessibility/resilience gates

Everything else is reference, research, implementation documentation, or history and must not
claim design authority.

---

## 11. D6 reconciliation — decision ledger

### Resolved

**D6-00 — No generic Tools/More destination.**  
Waypoint will not reserve permanent navigation space for a generic utility bucket. SOS remains
global; routing belongs with itinerary/spatial context; reminders/readiness utilities surface
where relevant. Split remains under separate review because it has demonstrated direct trip
utility.

**D6-01 — Stable primary navigation; retire adaptive promotion.**  
Primary destinations keep a stable identity and stable relative order. Waypoint will not
automatically promote/reorder content groups or tools based on device-local usage. Responsive
layouts may change the navigation *presentation* (for example bottom bar vs rail/sidebar), but
not the destination model. Remembering a user's last location inside a destination is allowed;
rewriting the navigation itself is not. D7 must remove the adaptive/promoted mobile-nav logic
and its supporting UX debt once the final destination model is approved.

### Unresolved

These are deliberately **not** inferred from previous iterations. Carlo will resolve them one
at a time after evidence/recommendation review:

- final persistent navigation architecture and labels;
- whether Split is top-level or contextual;
- panel drag/reorder;
- story-mode itinerary;
- global swipe navigation;
- yielding/scroll-reactive chrome;
- final geometry/radius system;
- provenance/verification visual treatment;
- role of Painted Atlas/living covers and ambient motion;
- cartographic ornament versus functional geography;
- command palette versus traveler-facing global Search;
- component/pattern cull and migration order.

Until a decision is recorded, current behavior may remain shipped but is **not automatically
future design law**.
