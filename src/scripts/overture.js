/* Overture — the hub's cinematic first screen that hands off to the guide grid.
   docs/PLAN_VISUAL_OVERHAUL.md session V2, Option A (the Overture IS the masthead).

   First visit (localStorage['tg-overture-seen'] unset): play the kinetic intro, hold a beat,
   then AUTO-GLIDE — an eased auto-scroll down into the hub while the Overture recedes through a
   gradient veil and the featured band rises to meet it. Return visits render the compact hero
   (set pre-paint by the inline head script, `:root[data-overture]`) and skip all of this.

   Guardrails that make the auto-glide beautiful instead of hijacky:
   - INTERRUPTIBLE: any real user input (wheel/touch/key/pointer) cancels the pending or
     in-flight glide and hands back control — we listen to those, never to `scroll`, so our own
     programmatic scroll never trips the cancel.
   - ONCE per visit: the key is set the moment the intro starts, so a refresh mid-glide won't
     replay it.
   - REDUCED-MOTION: no kinetic arrival, no parallax, no auto-glide. The Overture renders static
     and full; the hub is a normal scroll below. (Auto-scroll is motion — it must be off.)
   - FAULT-SAFE: every animated state lives under `body.ov-play`, a class only this script adds.
     The base markup is fully visible with no JS at all.

   One-owner (MOTION.md rule 4): this module owns the Overture inner transform/opacity + contour
   parallax + route dashoffset, exactly as hero-parallax.js owns the guide masthead transform.
   Native-first note (rule 1): the scroll-linked recede is JS here, not a CSS scroll-timeline,
   because it must stay in lockstep with the cancelable auto-glide — a coordination CSS can't
   express. Transform/opacity only; rAF-throttled; passive listeners. */

import { reducedMotion } from "./util.js";

const SEEN_KEY = "tg-overture-seen";
const HOLD_MS = 1200; // beat to read the headline before the glide begins
const GLIDE_MS = 1500; // the eased descent into the hub

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* private mode — it just replays next time, harmless */
  }
}

export function initOverture() {
  const ov = document.getElementById("overture");
  if (!ov) return;

  // Signal to any other hub motion that the Overture owns the opening (mirrors __storyIntro).
  window.__overture = true;

  const isCompact = document.documentElement.getAttribute("data-overture") === "compact";
  // Compact (return visit) and reduced-motion both mean: no intro sequence, no auto-glide.
  // Compact additionally restyles via CSS; nothing to drive here.
  if (isCompact || reducedMotion()) {
    markSeen();
    return;
  }

  const inner = ov.querySelector(".ov-inner");
  const contours = Array.from(ov.querySelectorAll("[data-ov-contour]"));
  const routePath = ov.querySelector(".ov-route-path");
  const routeDot = ov.querySelector(".ov-route-dot");
  const hub = document.querySelector(".hub");

  // U8: hub-motion.css hides .ov-route entirely below 600px (no room for the decorative
  // line next to the hero text) — mirror that same breakpoint here so the per-frame
  // getPointAtLength() route-drawing work never runs on an invisible object. This is
  // exactly the device class most sensitive to wasted scroll-handler work, so it isn't
  // just correctness, it's the actual perf cost the finding was about.
  const routeVisible = window.matchMedia && window.matchMedia("(min-width: 600px)").matches;
  // The cue text promised a route that doesn't exist below 600px ("Follow the route" at
  // an invisible line) — say what's actually true on that viewport instead.
  const cue = ov.querySelector(".ov-cue");
  if (cue && !routeVisible) {
    const pinEl = cue.querySelector(".ov-cue-pin");
    cue.textContent = "";
    if (pinEl) cue.appendChild(pinEl);
    cue.appendChild(document.createTextNode("See the guides"));
  }

  // First real visit with motion: play. Mark seen immediately so a mid-glide refresh won't replay.
  markSeen();
  document.body.classList.add("ov-play");

  // Route line length for the draw-on-scroll effect — skipped entirely when the route
  // isn't visible (see routeVisible above).
  let routeLen = 0;
  if (routeVisible && routePath && typeof routePath.getTotalLength === "function") {
    routeLen = routePath.getTotalLength();
    routePath.style.strokeDasharray = String(routeLen);
    routePath.style.strokeDashoffset = String(routeLen);
  }

  // Scroll-linked recede — runs for BOTH the auto-glide and any manual scroll, so leaving the
  // Overture always looks the same however you leave it. rAF-throttled, transform/opacity only.
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const vh = window.innerHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / (vh * 0.85))); // 0 at top → 1 as the hub arrives
      if (inner) {
        inner.style.transform = `translateY(${window.scrollY * 0.24}px) scale(${1 - p * 0.07})`;
        inner.style.opacity = String(1 - p * 0.92);
      }
      contours.forEach((c, i) => {
        const depth = [0.06, 0.14, 0.24][i] ?? 0.1;
        c.style.transform = `translateY(${window.scrollY * depth}px)`;
      });
      if (routePath && routeLen) {
        routePath.style.strokeDashoffset = String(routeLen * (1 - p));
        if (routeDot) {
          const pt = routePath.getPointAtLength(routeLen * p);
          routeDot.setAttribute("cx", String(pt.x));
          routeDot.setAttribute("cy", String(pt.y));
        }
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Stats-beat count-up — the real numbers tick up as the beat scrolls into view (or during the
  // glide past it). Motion-only; with no JS the final numbers are already in the markup, so this
  // is pure enhancement. Starts each at 0, animates on first intersection.
  const statEls = Array.from(document.querySelectorAll(".stats-beat [data-count]"));
  if (statEls.length && "IntersectionObserver" in window) {
    statEls.forEach((el) => { el.textContent = "0"; });
    const countUp = (el) => {
      const target = Number(el.getAttribute("data-count")) || 0;
      let t0 = null;
      const step = (t) => {
        if (t0 === null) t0 = t;
        const p = Math.min(1, (t - t0) / 1100);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.4 });
    statEls.forEach((el) => io.observe(el));
  }

  // ── The auto-glide ────────────────────────────────────────────────────────────────────────
  let armed = true; // becomes false the instant the user takes control (before OR during the glide)
  let rafId = 0;
  const USER_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"];

  function standDown() {
    armed = false;
    if (rafId) cancelAnimationFrame(rafId);
    USER_EVENTS.forEach((e) => window.removeEventListener(e, standDown));
  }
  USER_EVENTS.forEach((e) => window.addEventListener(e, standDown, { passive: true }));

  function glideTo(targetY) {
    const start = window.scrollY;
    const dist = targetY - start;
    if (dist <= 2) return;
    let t0 = null;
    function step(t) {
      if (!armed) return; // user grabbed the wheel mid-flight — yield instantly
      if (t0 === null) t0 = t;
      const p = Math.min(1, (t - t0) / GLIDE_MS);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic — quick start, soft landing
      window.scrollTo(0, start + dist * eased);
      if (p < 1) rafId = requestAnimationFrame(step);
      else standDown();
    }
    rafId = requestAnimationFrame(step);
  }

  // Only glide if we're still at the top when the beat elapses and the user hasn't taken over.
  window.setTimeout(() => {
    if (!armed || window.scrollY > 8 || !hub) return;
    glideTo(hub.offsetTop);
  }, HOLD_MS + 1600 /* ≈ kinetic-arrival duration, keep in step with hub-motion.css */);
}
