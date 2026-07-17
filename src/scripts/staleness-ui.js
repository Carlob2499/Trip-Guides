/* Staleness warning tone — the honest-downgrade UI over src/lib/staleness.ts.
   Sections carrying structured provenance (data-verified-on, from the schema's
   additive `verified_on` field) get judged against their category's shelf life
   on the CLIENT clock (a build-time judgment would freeze "fresh" at deploy and
   rot silently). Past shelf life → a small ⚠ pill lands in the title row:
   "verified <date> — re-check", linking to the source when one is recorded.
   Guides without provenance data render byte-identically to before.

   The category comes from the section's `shelf_life` (data-shelf-life), falling
   back to "default" (90d). This used to be hardcoded to "default", which quietly
   made staleness.ts's fx/transit/hours/venue categories dead code and judged an
   exchange rate — good for ~7 days — on the same 90-day clock as a museum's
   address. */

import { staleness, SHELF_LIFE_DAYS } from "../lib/staleness";

(function () {
  var nodes = document.querySelectorAll(".block[data-verified-on]");
  if (!nodes.length) return;
  var now = new Date();
  nodes.forEach(function (el) {
    var date = el.getAttribute("data-verified-on");
    // An unknown/absent category must fall back, never crash the pill for the
    // whole page — the schema constrains it, but the DOM is not the schema.
    var cat = el.getAttribute("data-shelf-life");
    if (!cat || !Object.prototype.hasOwnProperty.call(SHELF_LIFE_DAYS, cat)) cat = "default";
    var s = staleness(date, cat, now);
    if (!s || !s.stale) return;
    var row = el.querySelector(".block-title-row") || el.querySelector(".card") || el;
    var src = el.getAttribute("data-source-url");
    var pill = document.createElement(src ? "a" : "span");
    pill.className = "stale-pill";
    pill.textContent = "⚠ verified " + date + " — re-check";
    if (src) {
      pill.href = src;
      pill.target = "_blank";
      pill.rel = "noopener noreferrer";
      pill.title = "Open the source this fact was verified against";
    }
    row.appendChild(pill);
  });
})();
