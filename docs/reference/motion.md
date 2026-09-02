# Waypoint Motion Doctrine

Status: **CURRENT SUBORDINATE DESIGN SPEC**  
Authority: `docs/reference/design-system.md`.

This document owns motion implementation doctrine. It does not own product information
architecture, visual identity, or historical redesign decisions.

## 1. Purpose

Motion must communicate at least one of:
- spatial continuity;
- hierarchy/parent-child continuity;
- direct manipulation/gesture feedback;
- a true change of state;
- live state whose movement itself carries meaning.

If removing an animation does not reduce understanding, orientation, or useful feedback, it is
probably decorative and should be removed.

## 2. Routine motion

Routine UI should feel responsive rather than theatrical.

- input response is immediate;
- common transitions are generally ~150–350ms;
- motion is interruptible;
- transform/opacity are preferred on animated paths;
- scrolling remains native;
- overlays and navigation never block urgent field actions;
- no component invents private timing/easing values when a shared role exists.

Current primary owners include `scroll-motion.css` and `transitions.css`; feature-specific
gesture owners may exist where direct manipulation requires them.

## 3. Flagship spatial motion

Waypoint may use a small number of memorable transitions where geography or object continuity is
the product idea—for example atlas/map/destination continuity or a place card becoming its
detail view.

Flagship motion must:
- explain orientation;
- avoid delaying access to operational information;
- be cancellable/interruptible;
- respect performance/battery constraints;
- have a complete reduced-motion state.

No effect earns flagship status merely because it looks premium.

## 4. Gestures

Gesture-driven motion is direct manipulation, not ambient animation.

- content follows the finger/pointer while the gesture owns it;
- vertical scrolling wins when intent is vertical;
- gesture thresholds prevent accidental navigation;
- edge/rubber-band behavior never traps the traveler;
- every gesture-only convenience has an obvious non-gesture path;
- reduced-motion may remove tracking animation while preserving the action.

Existing swipe, sheet-drag, scrubber, or yielding-chrome implementations are **shipped
behavior, not constitutional law**. D6 may retain, simplify, scope, or retire them.

## 5. Continuous motion

Continuous motion is allowed only when movement conveys live meaning or an explicitly approved
identity moment.

Examples that may qualify:
- a genuinely live progress indicator;
- time/state visualization where motion is the information.

Ambient looping merely to make a surface feel alive does not qualify by default. Living covers,
Painted Atlas drift, idle globe movement, and similar existing behaviors are D6 review items.

## 6. Reduced motion

`prefers-reduced-motion` must produce a complete, immediately understandable state.

- no information is animation-only;
- no layout depends on an animation finishing;
- important state appears in its final form;
- direct actions remain available;
- reduced motion is tested, not assumed.

## 7. Performance and ownership

- Prefer native platform capabilities and CSS/View Transitions where they meet the need.
- GSAP remains the existing orchestration dependency; adding another motion library requires a
  constitution-level reason.
- Never animate expensive layout properties continuously on scroll/pointer paths.
- One owner per animated property per element.
- Hidden/background tabs must recover to the correct current state.
- Motion must not compromise offline use or first useful paint.

## 8. Verification

For any meaningful motion change, verify:
- phone and desktop/intermediate compositions;
- light/dark;
- reduced motion;
- interruption mid-transition;
- keyboard/touch paths;
- no console errors;
- no content left hidden if JS/motion initialization fails.

Historical phase narratives, retired intros, old Lighthouse notes, previous timing experiments,
and visual-overhaul ledgers belong in Git history or archive material, not in this live doctrine.
