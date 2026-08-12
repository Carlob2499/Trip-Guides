/* Staleness warning tone — the honest-downgrade UI over src/lib/staleness.ts.
   Sections carrying structured provenance (data-verified-on, from the schema's
   additive `verified_on` field) get judged against their category's shelf life
   on the CLIENT clock (a build-time judgment would freeze "fresh" at deploy and
   rot silently). Past shelf life → a small ⚠ pill lands in the title row:
   "verified <date> — re-check", linking to the source when one is recorded.
   WITHIN shelf life → the ✓ CHECKED <date> stamp lands in the same row, which is
   CLAUDE.md's per-section half of "guide-level + per-section Checked [date] stamps".
   Until that branch existed this module drew on the unhealthy path only, so a section
   that HAD been verified and one that never was looked identical on the page: the
   Verified property had no surface on any section still inside its shelf life, which
   is nearly every section in the built site.
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
    // null = no parseable date, so there is nothing to stamp OR to downgrade. An
    // unverified section still renders nothing, exactly as before.
    if (!s) return;
    // .pnl-headings: a Panel-hosted section (Atlas Phase 2) has no .block-title-row —
    // the mark lands under the Panel's title, which stays visible even collapsed.
    var row = el.querySelector(".block-title-row") || el.querySelector(".pnl-headings") || el.querySelector(".card") || el;
    if (!s.stale) {
      // HEALTHY PATH — the verification stamp. Same row as the downgrade pill, so the two
      // states of one fact occupy one place: a section says either "checked on this date" or
      // "checked on this date, and that has now aged out", never both and never neither.
      // A <span>, not a link: the design-handoff prototype's own stampRow() pairs the stamp
      // with a SEPARATE `SOURCE · host ↗` link rather than making the stamp itself clickable,
      // and a11y.spec's notation rule reads a stamp as a mark you READ, not a control you aim
      // at (which is why it needs no 44px target and gets no chip treatment).
      var stamp = document.createElement("span");
      stamp.className = "checked-stamp";
      stamp.textContent = "✓ CHECKED " + date;
      row.appendChild(stamp);
      return;
    }
    // http(s) only. The schema types source_url as z.url(), and "javascript:alert(1)" IS a
    // valid URL — so the only thing standing between guide data and a clickable script link
    // is this check. Anything else renders as a plain <span>, losing the link, not the fact.
    var src = el.getAttribute("data-source-url");
    if (src && !/^https?:\/\//i.test(src)) src = null;
    // D10 (Stage A.7): the flag-chip visual language — control-size pill, 1px current-ink
    // border, tappable — same class .prov-dot's popover-openers share. Behavior unchanged: a
    // real <a> to the source when one exists (one tap to what the reader actually wants),
    // never rewired into a popover-only control — see docs/archive/PLAN_ATLAS_MIGRATION.md Stage A.7.
    var pill = document.createElement(src ? "a" : "span");
    pill.className = "stale-pill flag-chip flag-chip--stale";
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
