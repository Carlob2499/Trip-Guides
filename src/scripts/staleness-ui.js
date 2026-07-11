/* Staleness warning tone — the honest-downgrade UI over src/lib/staleness.ts.
   Sections carrying structured provenance (data-verified-on, from the schema's
   additive `verified_on` field) get judged against the default shelf life on
   the CLIENT clock (a build-time judgment would freeze "fresh" at deploy and
   rot silently). Past shelf life → a small ⚠ pill lands in the title row:
   "verified <date> — re-check", linking to the source when one is recorded.
   Guides without provenance data render byte-identically to before. */

import { staleness } from "../lib/staleness";

(function () {
  var nodes = document.querySelectorAll(".block[data-verified-on]");
  if (!nodes.length) return;
  var now = new Date();
  nodes.forEach(function (el) {
    var date = el.getAttribute("data-verified-on");
    var s = staleness(date, "default", now);
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
