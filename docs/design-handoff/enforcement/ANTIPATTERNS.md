# Rejected alternatives — the things already tried

Every entry below was built, looked at, and removed. They are listed because each one is a
reasonable idea that a competent developer will independently arrive at, and re-arriving at it
costs a day and lands back here. If you are about to do one of these, the decision is already
made.

---

**Masonry with row spans for the panel grid.** Packs tightly, and destroys reading order —
section three ends up above section two because it happened to be short. Also needs constant
JS re-measurement, which fights the collapse animation. Replaced by `grid-auto-flow: dense`
plus the full-width → open → collapsed sort, which gets 90% of the packing with none of the
cost.

**A graticule over guide photography.** The globe keeps its graticule because there the
graticule *is* the map. Over a photo at card scale it reads as dirt on the lens. Removed.

**SVG for the globe.** Correct instinct, wrong node count. Four hundred country paths plus a
graticule plus per-frame route resampling could not hold frame rate. Canvas, two layers,
DPR-capped, dirty-flagged. This is not negotiable and it is not a premature optimisation — it
is the second implementation.

**Greedy per-card collision solving.** The first pin card claims its full-size seat, and the
three behind it have nowhere clean left to go. The solver must run whole passes and be willing
to compact every plate at once.

**Animating `left`/`top` on pin cards.** They ride the globe every frame. Transform only.

**Hover-only provenance dots.** Unusable on the device the guide is actually read on, mid-trip,
one-handed. Click, with a real focus state.

**Telemetry-driven bottom-bar ranking.** Telemetry is write-only on the client and is a
cross-visitor aggregate. A stranger's average is not this traveller's habit. Ranking counts
are per-device, in localStorage, keyed by the group's full name.

**Ranking without `seat()`.** Two promoted groups trade places under the thumb that just
tapped one. `seat()` keeps a promoted group where it already is.

**Inventing a preference for an unopened group.** No count at all; fall back to the guide's own
order.

**A fabricated "start here" on the Groups sheet.** When nothing is remembered, the resume line
is simply absent.

**Resetting the yield accumulator on any upward pixel.** Page jitter is 1–3px on every settle,
so the accumulator never survived to the threshold and chrome could never yield. Remember the
rebound; `JITTER 6`.

**Claiming a diagonal swipe as horizontal.** A page that steals a scroll feels broken in a way
that a swipe needing one more pixel never does. `AXIS_LOCK_PX 24`, unambiguous only.

**A message at the first/last group.** Rubber-band instead — 0.28, capped 56px. The platform's
own way of saying "this is the end".

**Keeping the motto panel on mobile.** It fought the ☰ button for the same corner. Removed
entirely on mobile, not shrunk.

**Floating pin cards on mobile.** No spatial budget. Bare pings, and a bottom sheet on tap.

**Shrinking the desktop layout for phones.** The mobile model is deliberately a different
model, not a narrower one. Globe → pings. Rails → menu. Coordinate readout → gone.

**Bare `env()` for safe areas.** An environment reporting zero must still leave the reserved
gap. Always `max(reserved, var(--safe-*))`, and `viewport-fit=cover` or every inset is zero.

**Softening motion under `prefers-reduced-motion`.** It cuts. Halving a 780ms iris is still an
iris.

**Entrance animations on the table view.** It is the in-transit surface. Instant paint.

**Rounding a radius anywhere between 0 and 999px.** There is no middle value in this system.

**Turning something oxide for emphasis.** Oxide marks the instrument. Emphasis is size,
position, and weight.

**Inventing an exchange rate.** Only Korea has a sourced one (₩1,461/$1, Fed H.10, 24 Jul
2026). The other three say "no local rate captured". An unsourced rate in this product is
worse than no rate, because the whole premise is that a shown number was checked.

**Guessing Japan's holidays.** Not in the repo. The tool says so. Fetch `JP-2026` or leave the
absence.

**Porting `prototype/trip-split.js` back into the repo.** It is a JS port *of your own
TypeScript*, made only so the prototype could run. Your originals have tests and are the
source of truth.

**Introducing React.** The prototype uses a React-flavoured runtime because that is what the
design tool renders in. The target is Astro components plus vanilla enhancement scripts, and
every component in this design maps cleanly onto that.
