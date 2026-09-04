# Waypoint Motion Doctrine

Status: **CURRENT SUBORDINATE DESIGN SPEC — D7**  
Authority: `docs/reference/design-system.md`.  
Last reconciled: 2026-09-04.

Motion makes Waypoint feel like one connected spatial system.

> **Everything should feel physically connected, but nothing should make the traveler wait for the animation.**

Motion is allowed only when it communicates:
- spatial continuity;
- hierarchy/parent-child continuity;
- direct manipulation;
- true state change;
- geographic arrival/context;
- live state where movement itself carries meaning.

If removing an animation does not reduce understanding, orientation, useful feedback, or an
explicitly approved identity moment, remove it.

---

## 1. Timing roles

Use shared roles. Components do not invent private timing values.

### Immediate feedback
**80–140ms**
- press/focus acknowledgement;
- icon fill/morph acknowledgement;
- selection highlight;
- tiny opacity/state feedback.

The application state should update immediately; this role confirms it.

### Routine transition
**140–240ms**
- filters;
- tabs;
- search category changes;
- save/unsave;
- small menu/sheet changes;
- day selector changes;
- simple control reveal.

These should feel nearly instantaneous.

### Spatial/object transition
**240–420ms**
- card expansion;
- card stack → laid-out reflow;
- pane reorganization;
- place card → detail;
- itinerary item → map selection;
- search result → contextual detail;
- sheet → focused state.

Use enough time to preserve object continuity, never enough to feel ceremonial.

### Scene transition
**520–900ms**
- Atlas → destination;
- major Guide/Trip scene recomposition;
- large map camera/pane choreography;
- post-trip/editorial scene shift.

Operational controls remain available as soon as practical.

### First-entry arrival
**800–1500ms total choreography**
Only for first entry to a destination/Guide or an equivalent flagship geographic moment.
The content may begin appearing before the final flourish finishes.

Repeat entry uses a shorter scene transition, not the full arrival.

---

## 2. Easing

Default motion should feel smooth and deliberate, not bouncy.

Preferred shape:
- quick acquisition;
- soft deceleration;
- no overshoot unless direct manipulation physically warrants it.

Use shared CSS/GSAP easing tokens.
Avoid playful spring bounce on operational UI.

---

## 3. Shared-object continuity

When the same object exists before and after a transition, animate the object rather than replacing
it with an unrelated fade whenever practical.

Examples:
- a place card becomes a detail pane;
- an itinerary card becomes the selected map object;
- a stacked recommendation card moves into a planned day;
- a Search result opens into Guide/place context;
- a destination card becomes the arrival/Guide hero.

Rules:
- preserve source/destination identity;
- do not randomize order during reflow;
- keep labels/images stable long enough to track;
- avoid simultaneous unrelated motion that competes with the main object.

---

## 4. Card choreography

Card movement is a Waypoint signature.

Allowed:
- stack;
- fan;
- offset;
- compress;
- unfold;
- spread;
- merge into chronology;
- move between spatial and list states.

Card transitions must:
- maintain readable final geometry;
- preserve keyboard/focus state;
- avoid layout thrash;
- use transform/opacity where practical;
- keep the selected card visually trackable;
- not require animation completion for state correctness.

On mobile, vertical scroll owns the gesture unless a clearly horizontal deck/day scrubber owns it.

---

## 5. Fluid workspace transitions

Desktop pane movement may be richer, but it must remain predictable.

When active focus changes:
- the selected object moves/expands;
- surrounding panes yield/reflow;
- persistent orientation remains anchored;
- pinned comparison objects remain stable;
- the map camera and detail pane should not fight each other.

Single-focus is the default. Do not animate a dozen panels at once.

---

## 6. Scroll

Native scrolling is never hijacked.

Allowed:
- sticky/pinned sections where the content relationship benefits;
- native horizontal card scrollers;
- scroll-linked reveal where the next composition logically follows;
- restrained map/hero choreography for flagship sequences.

Rejected:
- wheel remapping used only for spectacle;
- scroll traps;
- long mandatory parallax;
- continuous expensive layout updates;
- motion that makes the page feel slower than native scrolling.

---

## 7. Map motion

Map camera motion must follow user expectation.

Routine:
- selected marker focus;
- route fit;
- nearby area adjustment.

Keep it short and interruptible.

Flagship:
- Atlas/globe → country/city continuity;
- destination arrival;
- major itinerary overview.

Map motion never hides urgent operational information.

---

## 8. Microinteractions

Default is refined with selective expressive moments.

Use:
- subtle scale/elevation;
- route-line draw;
- icon morph/fill;
- selection continuity;
- mobile haptic feedback where platform-appropriate;
- clear save/move/confirm feedback.

Expressive reactions are allowed only when they reinforce meaning.
Waypoint must not feel toy-like.

---

## 9. Empty/loading/error motion

Loading skeletons preserve final geometry.
Do not animate layout into place from unrelated shapes.

Empty states may use a short destination-aware reveal.

Error/offline states prioritize comprehension over motion.

SOS uses minimal motion:
- immediate sheet/action response;
- no cinematic transitions;
- no decorative loops.

---

## 10. Continuous/ambient motion

Continuous motion is exceptional.

Allowed only when:
- it represents live progress/state;
- it is an explicitly approved destination/Atlas identity moment;
- battery/performance impact is bounded.

Idle globe drift, living-cover motion, animated backgrounds, and similar effects are not default.
If retained, they must stop when offscreen/backgrounded and have a reduced-motion/static equivalent.

---

## 11. Reduced motion

`prefers-reduced-motion` is a complete product state.

- no information is animation-only;
- no layout depends on animation finishing;
- shared-object transitions become immediate/short fades or direct state swaps;
- arrival sequences resolve to the final destination state quickly;
- parallax/continuous motion stops;
- all actions remain available;
- reduced motion is visually intentional, not broken.

---

## 12. Performance

Prefer:
- CSS transform/opacity;
- View Transitions where appropriate;
- existing GSAP only when orchestration materially requires it;
- one owner per animated property per element.

Avoid:
- continuous layout-property animation;
- JS-driven scroll loops when CSS/native behavior works;
- new motion dependencies without a constitution-level reason.

Hidden/background tabs must recover to the correct current state.

Motion may never compromise:
- first useful paint;
- low-bandwidth mode;
- battery;
- offline state;
- urgent field actions.

---

## 13. Verification

For every meaningful motion change verify:
- mobile;
- intermediate/tablet;
- desktop;
- touch;
- mouse;
- keyboard;
- light;
- destination-aware dark;
- reduced motion;
- interruption mid-transition;
- rapid repeated input;
- back/forward navigation;
- no content left hidden when motion JS fails;
- no console errors;
- no scroll trap;
- no material layout shift after the final state.
