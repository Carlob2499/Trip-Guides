/* Hint bubbles on touch — the one thing CSS cannot do for src/components/Hint.astro.

   Hover and keyboard focus are handled entirely in the stylesheet, so this script exists
   for exactly one case: a finger, which has no hover state. It toggles `data-open` on tap,
   closes on Escape or on a tap anywhere else, and closes any other open hint first so two
   bubbles can never overlap.

   Deliberately delegated from the document rather than bound per hint: hints are rendered
   by several components across several pages, and a per-element loop would miss any that
   arrive after load. */

/* Keep a revealed bubble inside the screen.

   The bubble is anchored to its `?`, so one near the right edge opens past it — and because
   `body` is `overflow-x: clip`, the overflowing end is destroyed rather than scrollable. There
   is no gesture that reveals it and no scrollbar that hints it is there; the explanation simply
   stops mid-sentence. `data-align="end"` was the existing manual fix, which required an author
   to predict the viewport width at which each individual hint would collide. This measures.

   Runs on every reveal path, not just the tap one this file was written for, because the
   collision is a property of position and viewport — hovering into it on a narrow window
   clips exactly as hard as tapping into it. */
const GUTTER = 8;

function fit(hint) {
  const bubble = hint.querySelector("[data-hint-bubble]") || hint.querySelector(".hint-bubble");
  if (!bubble) return;
  // Measure from a clean slate: a shift left over from a previous, wider viewport would
  // otherwise be read back as part of the bubble's natural position and compound.
  bubble.style.setProperty("--hint-shift", "0px");
  const r = bubble.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  let shift = 0;
  if (r.right > vw - GUTTER) shift = -(r.right - (vw - GUTTER));
  // A bubble wider than the screen would now be pushed off the LEFT instead; clamp so the
  // start of the sentence always wins. max-width keeps this rare, not impossible.
  if (r.left + shift < GUTTER) shift = GUTTER - r.left;
  if (shift) bubble.style.setProperty("--hint-shift", Math.round(shift) + "px");
}

// Hover and focus are CSS-driven by design (the explanation must work before this file runs),
// so there is no existing hook to piggyback on — these listeners add the measurement without
// taking over the reveal itself.
for (const evt of ["pointerover", "focusin"]) {
  document.addEventListener(evt, (e) => {
    const hint = e.target.closest?.("[data-hint]");
    if (hint) fit(hint);
  });
}

/* Fit every bubble once at rest, and again when the viewport changes.

   Reveal-time fitting alone leaves the un-revealed bubbles overhanging the right edge, and an
   absolutely-positioned element still extends the document's scroll area even at opacity 0 —
   so the page measured 492px wide on a 375px screen with nothing visibly wrong. `overflow-x:
   clip` on body means no reader could ever scroll into that dead strip, but a page whose width
   is a lie is worth not shipping: it is the same measurement every layout gate reads.

   Idle-scheduled because it is a read of N bubbles and none of it is urgent — nothing is
   revealed yet by definition. */
function fitAll() {
  document.querySelectorAll("[data-hint]").forEach(fit);
}
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
idle(fitAll);
addEventListener("resize", () => idle(fitAll), { passive: true });

function closeAll(except) {
  document.querySelectorAll("[data-hint][data-open]").forEach((h) => {
    if (h === except) return;
    h.removeAttribute("data-open");
    h.querySelector("[data-hint-btn]")?.setAttribute("aria-expanded", "false");
  });
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest?.("[data-hint-btn]");
  if (!btn) {
    closeAll(null);
    /* Re-fit after any other click, because the idle pass above can only measure what was
       laid out when it ran. A station the rail has not opened yet is `hidden`, so its bubbles
       measure 0x0, take no shift, and keep overhanging the right edge once revealed — which
       is how the Tools station (the LAST stop on every guide, hidden at load by definition)
       ended up with a 461px bubble on a 375px screen. Tapping one still clamped it, because
       that path calls fit() directly; what stayed wrong was the un-revealed width, which is
       the same measurement this file already refuses to ship a lie about. Idle-scheduled and
       read-only, so a click that opened nothing costs nothing. */
    idle(fitAll);
    return;
  }
  const hint = btn.closest("[data-hint]");
  if (!hint) return;
  // The button is often inside a larger control (a Panel header, a tab). Asking what
  // something is must not also activate it.
  e.preventDefault();
  e.stopPropagation();
  const open = !hint.hasAttribute("data-open");
  closeAll(hint);
  hint.toggleAttribute("data-open", open);
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) fit(hint);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAll(null);
});
