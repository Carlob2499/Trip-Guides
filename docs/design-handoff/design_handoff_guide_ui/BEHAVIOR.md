# Behaviour — interaction, state, motion, gestures

---

## 1. Constants you must NOT re-derive

These are ported from `src/features/mobile-nav/` and have **model tests behind them**. Wire the
new chrome to the existing models. Each number exists because of a real bug.

### Chrome yield — `model/yield.ts`

| Constant | Value | Why it exists |
| --- | --- | --- |
| `YIELD_AT` | 80 | downward travel past this slides header, rail and thumb bar away (280ms) |
| `RETURN_AT` | 24 | upward travel above this is a deliberate flick — bring chrome back |
| `JITTER` | 6 | **upward travel under this is page jitter.** Scroll anchoring, sub-pixel rounding and lazy images produce a 1–3px rebound every time a scroll settles. The first implementation reset its accumulator on any upward pixel and so could never yield at all |
| `TOP_ZONE` | 140 | above the masthead, chrome always shows |

Chrome **stands down entirely while an overlay owns the screen** — a sheet, the menu, the
lightbox, the Groups sheet.

### Swipe between groups — `model/gesture.ts`

| Constant | Value | Why |
| --- | --- | --- |
| `AXIS_LOCK_PX` | 24 | the gesture is claimed only once it is **unambiguously horizontal**. A diagonal reads as vertical, because a page that steals a scroll feels broken in a way that a swipe needing one more pixel never does |
| `COMMIT_FRACTION` | 0.3 | commit on 30% of viewport travel |
| `COMMIT_VELOCITY` | 0.5 px/ms | or a flick that has cleared the axis lock |
| finger tracking | 0.9 | inside the range, content tracks the finger at this ratio |
| rubber-band | 0.28, capped 56px | at the first or last group. The platform's own way of saying "this is the end" without a message |

### Shelf life — `SHELF_LIFE_DAYS`

`fx: 7` · `transit: 90` · `hours: 90` · `venue: 180` · `default: 90`. Do not round the ±0.4h
jetlag dead zone away either.

---

## 2. Motion table

Additions to `SPEC-COMPONENTS.md` §9. Everything there stays.

| Moment | Duration | Curve | Property |
| --- | --- | --- | --- |
| Station change | 260ms | `cubic-bezier(.22,1,.36,1)` | opacity + `translateY(10px)` on the body |
| Pill-row progress line | 280ms | `cubic-bezier(.22,1,.36,1)` | `left` + `width` |
| Day change | 220ms | `cubic-bezier(.22,1,.36,1)` | opacity + `translateY(6px)` on the day card |
| Fold open/close | 240ms | ease | `grid-template-rows: 0fr → 1fr` |
| Sheet (all four) | 360ms | `cubic-bezier(.22,1,.36,1)` | `translateY` + opacity + delayed `visibility` |
| Sheet rows | 28ms stagger | — | opacity + `translateY(8px)` |
| Scrim | 220ms | ease | opacity |
| Panel collapse | 350ms (`--dur-reveal`) | `cubic-bezier(.16,1,.3,1)` (`--ease-out-expo`, CSS transition — no GSAP) | `grid-template-rows` + opacity, grid re-sorts on **transitionend** |
| Chrome yield | 280ms | `cubic-bezier(.22,1,.36,1)` | `translateY` |
| Present-band pulse | 2.4s loop | — | `box-shadow` spread + opacity |
| Section reveal | 700ms, once, on intersect | — | `translateY(22px)` → 0 |

**Nothing animates `left`/`top`/`width`/`height` on a per-frame path.** Transform and opacity
only. The two exceptions are deliberate and neither is per-frame: the progress line's `left`/
`width` (one 280ms transition on discrete state change) and Panel collapse's height (once, on
collapse, through GSAP, with the grid re-measuring on the update tick).

**`prefers-reduced-motion` cuts, it does not soften.** Morph → cut, iris → instant swap, reveals
paint immediately, the globe stops spinning, sheets appear without a slide. **Press states
survive: they are state, not motion.**

---

## 3. Section reveals

One 0.7s rise per element, **once**, on intersect. One long-lived `IntersectionObserver`, never
disconnected mid-flight; anything already in view on mount reveals on the next frame.

---

## 4. Keyboard and assistive technology

| Element | Behaviour |
| --- | --- |
| Station | `<button>`, `aria-current="true"` on the active one, in a `<nav aria-label="Guide sections">` |
| Day chip | `<button>`, `aria-current="date"` on the active one |
| Fold | `<button aria-expanded>` + `aria-controls` on the region |
| Provenance dot | `<button>` with an accessible name naming the claim; 44px effective target; opens on **click** |
| Sheet | focus moves to the sheet on open and returns to the opener on close; Escape closes; focus is trapped while open |
| Closed sheet | `visibility: hidden` + `aria-hidden="true"` → **out of the tab order** |
| Thumb slot | full group name in the accessible name even when `slotLabel()` truncated the visible one |
| Status | never a colour alone — the word is the accessible carrier |

**Every interactive target is ≥44px** in its smallest dimension, on every device in the matrix,
including the 375×667 SE.

---

## 5. State

| State | Scope | Persistence |
| --- | --- | --- |
| `slug`, `group` | the open guide and its station | URL |
| `day` | the open day | URL |
| `tool` | the open tool | URL |
| `theme` | `day` / `night` | `localStorage`, global |
| Panel collapse | per `slug + group` | `localStorage` |
| Panel order | per `slug + group` | `localStorage` |
| Checklist ticks | per `slug` | `localStorage` |
| Group open counts | per device | `localStorage`, keyed by the group's **full** name |
| Section memory (resume) | per `slug` | `localStorage`. **Recorded on desktop too**, so a desktop session tells the next phone one where you were |
| Sheet open / fold open | ephemeral | none |

**Never clear or overwrite a `localStorage` key you did not write.**

---

## 6. Print

`PRINT SHEET` hides every `[data-noprint]` control, **force-expands every collapsed Panel and
every fold**, drops the rail to a plain list, and prints the day card and its stops in order.
Existing rules in `src/styles/print.css` and `print-day.css` still apply.
