/* The spine rail's runtime — three jobs, none of which switches a station.

   Station switching stays in guide-ui.js, which owns the panel router, the scroll memory and
   the session key. This file only reacts to a switch that already happened, so there is exactly
   one code path into a station no matter what clicked it — a stop, a thumb slot, a swipe, the
   Journey sheet or a URL hash.

     1. the phone's progress-line fill                      (COMPONENTS.md §3)
     2. keeping the active pill in view, inside its OWN scroller (§3, and ACCEPTANCE's ban on
        scrollIntoView — that method scrolls every ancestor, the page included)
     3. writing the measured header height into --hdr-h      (§2)
*/

import { progressGeometry } from "../model/stations.js";

/**
 * Return the visible primary traveler stops when the new hierarchy is present. Until GuideLayout
 * switches, fall back to the legacy .grail-stop set so this migration seam is behavior-neutral on
 * current main. Once data-primary lands, secondary routes stop participating in rail geometry.
 */
function primaryStops(track) {
  const marked = Array.prototype.slice.call(track.querySelectorAll('.gtab[data-primary="true"]:not([hidden])'));
  return marked.length ? marked : Array.prototype.slice.call(track.querySelectorAll(".grail-stop"));
}

/** Read the station count off the rail itself, so nothing restates it. */
function stationCount(track) {
  return primaryStops(track).length;
}

/**
 * Move the progress fill under the active pill.
 *
 * `left` and `width` are the two properties the motion table permits to transition off the
 * transform/opacity path, and they are permitted for exactly this: ONE 280ms transition on a
 * discrete state change, never a per-frame animation. The fill is a position report, and a
 * position report that eases is easier to follow than one that jumps.
 */
function paintProgress(rail, track) {
  const fill = rail.querySelector(".grail-fill");
  if (!fill) return;
  const stops = primaryStops(track);
  const index = stops.findIndex((s) => s.classList.contains("gtab-active"));
  // During the legacy phase, no active stop is a real boot state and the existing fill should
  // stay put. With primary markers present, an absent primary active stop means a secondary
  // route is open; secondary routes are deliberately not positions on the traveler rail.
  if (index < 0) {
    if (!track.querySelector('.gtab[data-primary="true"]')) return;
    fill.style.left = "0%";
    fill.style.width = "0%";
    return;
  }
  const geom = progressGeometry(index, stationCount(track));
  fill.style.left = geom.left + "%";
  fill.style.width = geom.width + "%";
}

/**
 * Centre the active pill WITHIN THE PILL ROW, and nowhere else.
 *
 * scrollIntoView() walks up the ancestor chain and scrolls every scrollable box it finds,
 * including the document — so activating a station would also throw the reader's page position
 * away. Setting scrollLeft on the one element that should move cannot do that.
 */
function centreActive(track) {
  const markedPrimary = track.querySelector('.gtab[data-primary="true"]');
  const active = markedPrimary
    ? track.querySelector('.gtab-active[data-primary="true"]:not([hidden])')
    : track.querySelector(".gtab-active");
  if (!active || track.scrollWidth <= track.clientWidth) return;
  const target = active.offsetLeft - (track.clientWidth - active.offsetWidth) / 2;
  const max = track.scrollWidth - track.clientWidth;
  track.scrollLeft = Math.min(Math.max(target, 0), max);
}

/**
 * Publish the sticky chrome's real height as --hdr-h.
 *
 * The rail sticks at this offset, and the number is not a constant: the header's height changes
 * with the theme toggle's label, the trip chip, the cold-open strip and the chrome-yield state.
 * Measuring once on mount is the bug — it bakes in whichever height happened to exist at boot.
 */
function measureHeader(header) {
  const h = Math.round(header.getBoundingClientRect().height);
  if (h > 0) document.documentElement.style.setProperty("--hdr-h", h + "px");
}

export function initGuideRail(root) {
  const doc = root || document;
  const rail = doc.querySelector(".grail");
  const track = doc.getElementById("guideTabs");
  if (!rail || !track) return;

  const sync = () => { paintProgress(rail, track); centreActive(track); };

  /* React to the router rather than to clicks. A MutationObserver on the class attribute fires
     for every route into a station — thumb slot, swipe, sheet, hash — where a click listener
     would only catch the ones that came through this rail. Observe only primary stops once the
     traveler-first markers exist; before that, preserve the legacy rail exactly. */
  const observer = new MutationObserver(sync);
  primaryStops(track).forEach((stop) => {
    observer.observe(stop, { attributes: true, attributeFilter: ["class"] });
  });

  const header = doc.querySelector(".sticky-chrome");
  if (header) {
    measureHeader(header);
    // ResizeObserver catches every cause at once — viewport change, font load, chip appearing,
    // the cold-open strip being dismissed — without this file having to know any of them.
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(() => measureHeader(header)).observe(header);
    } else {
      window.addEventListener("resize", () => measureHeader(header), { passive: true });
    }
  }

  // The fill's width depends on the pill row's own width, which changes when the container
  // model does. Re-running on resize costs nothing and keeps the two in step.
  window.addEventListener("resize", sync, { passive: true });
  sync();
}
