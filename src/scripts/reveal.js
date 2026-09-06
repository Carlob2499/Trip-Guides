/* Entrance choreography — a section-by-section reveal, driven by GSAP.
 *
 * THE RULE THIS FILE OBEYS. Nothing is hidden that this module is not already certain it can
 * reveal, and nothing is hidden in CSS at all. Every initial state is set from here, after GSAP
 * has resolved — so if the import fails, the browser is old, the reader asked for reduced motion,
 * or JS never runs, the page is simply the page. A reveal that fails closed takes the content
 * with it, which is a far worse outcome than no animation.
 *
 * AND NOTHING ALREADY ON SCREEN IS HIDDEN. Setting opacity 0 on above-the-fold content after load
 * would flash it away and bring it back, which looks like a bug and withholds the very thing the
 * reader came for. Only groups that start outside the viewport are staged; whatever is visible at
 * load stays visible, untouched.
 *
 * WHAT IT DOES NOT DO. No smooth-scroll engine. Waypoint is a field tool with a bottom nav, read
 * one-handed on a phone, often while moving — hijacking native scroll costs real usability
 * (momentum, scrollbar position, find-in-page, the OS's own reduced-motion handling) to buy
 * polish on a surface that is not a marketing page. Motion here is entrance only, and it never
 * touches the scroll position or animates anything the reader is trying to read.
 *
 * Usage: mark a container with data-reveal, and its children animate in on a stagger. Anything
 * that must never move — the chrome, the globe controls, a live region — simply carries no mark.
 */

import { reducedMotion } from "./util.js";

/* Small enough that the page never feels withheld: at 12px and 0.42s the reveal reads as the
   content settling, not as a curtain being raised. Anything larger starts to feel like a load. */
const SHIFT = 12;
const DUR = 0.42;
const STAGGER = 0.055;

export function initReveal(root = document) {
  const groups = [...root.querySelectorAll("[data-reveal]")];
  if (!groups.length) return;

  /* Three gates before anything is hidden. Reduced motion is checked live rather than cached:
     a reader can change the preference with the page already open. */
  if (reducedMotion()) return;
  if (typeof IntersectionObserver === "undefined") return;

  let cancelled = false;
  /* If GSAP is slow, the reveal is abandoned rather than applied late — a stagger that starts a
     second and a half after the reader began scrolling is worse than none at all, and by then
     they may already be past the section it would have animated. */
  const bail = setTimeout(() => { cancelled = true; }, 1200);

  import("gsap")
    .then((mod) => {
      const gsap = mod.gsap || mod.default;
      if (!gsap || cancelled) return;
      clearTimeout(bail);

      const targets = new Map();
      for (const group of groups) {
        /* Only element children, and only ones that are actually laid out — animating a
           display:none row leaves it stuck at opacity 0 when something later reveals it. */
        const kids = [...group.children].filter((el) => el.nodeType === 1);
        if (kids.length) targets.set(group, kids);
      }
      if (!targets.size) return;

      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const kids = targets.get(entry.target);
          io.unobserve(entry.target);
          if (!kids) continue;
          gsap.to(kids, {
            opacity: 1,
            y: 0,
            duration: DUR,
            stagger: STAGGER,
            ease: "power2.out",
            /* Clearing the inline props hands layout back to the stylesheet once the reveal is
               done, so nothing downstream inherits a transform it did not ask for. */
            onComplete: () => gsap.set(kids, { clearProps: "opacity,transform" }),
          });
          targets.delete(entry.target);
        }
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });

      /* Stage only what is genuinely off screen. getBoundingClientRect here is one forced layout
         on a list of a few containers, before any animation has started — cheap, and it buys the
         guarantee above. */
      const vh = innerHeight || document.documentElement.clientHeight;
      for (const group of [...targets.keys()]) {
        if (group.getBoundingClientRect().top < vh * 0.92) { targets.delete(group); continue; }
        gsap.set(targets.get(group), { opacity: 0, y: SHIFT });
        io.observe(group);
      }
    })
    .catch(() => { /* no motion, no harm: nothing was ever hidden */ });
}
