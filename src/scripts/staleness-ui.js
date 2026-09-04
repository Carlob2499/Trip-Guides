/* Staleness warning tone — the honest-downgrade UI over src/lib/staleness.ts.
   Sections carrying structured provenance (data-verified-on, from the schema's
   additive `verified_on` field) get judged against their category's shelf life
   on the CLIENT clock (a build-time judgment would freeze "fresh" at deploy and
   rot silently). Past shelf life → a small ⚠ pill lands in the title row, worded
   by staleness.ts's shared stalenessReading ("⚠ N DAYS OLD — M PAST ITS <CATEGORY>
   SHELF LIFE") and linking to the source when one is recorded.
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

import { staleness, stalenessReading, SHELF_LIFE_DAYS } from "../lib/staleness";
import { safeHttpUrl } from "./util.js";

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
    var src = safeHttpUrl(el.getAttribute("data-source-url"));
    // D10 (Stage A.7): the flag-chip visual language — control-size pill, 1px current-ink
    // border, tappable — same class .prov-dot's popover-openers share. Behavior unchanged: a
    // real <a> to the source when one exists (one tap to what the reader actually wants),
    // never rewired into a popover-only control — see docs/archive/INDEX.md → PLAN_ATLAS_MIGRATION Stage A.7.
    var pill = document.createElement(src ? "a" : "span");
    pill.className = "stale-pill flag-chip flag-chip--stale";
    // WORDING comes from staleness.ts, shared with the popover's Status row. This pill used to
    // say "⚠ verified <date> — re-check" while the popover on the same page said "⚠ N DAYS OLD
    // — M PAST ITS <CATEGORY> SHELF LIFE" about the same fact. SPEC-COMPONENTS §2 specifies the
    // second, and it is the one that answers the reader's actual question — a date alone leaves
    // them to know the category's shelf life and do the arithmetic.
    var reading = stalenessReading(s, cat);
    // s.stale is already true on this branch, so a reading always exists; the guard is for the
    // shared function's contract, not for a case that can occur here.
    if (!reading) return;
    // The glyph is decoration next to a sentence that already says the fact is past its life,
    // so it is hidden from AT rather than announced as "warning sign" (FlagChip.jsx:17's own
    // treatment). .flag-chip's `gap` supplies the space a flex container drops between them.
    var glyph = document.createElement("span");
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = reading.glyph;
    pill.append(glyph, reading.label);
    if (src) {
      pill.href = src;
      pill.target = "_blank";
      pill.rel = "noopener noreferrer";
      pill.title = "Open the source this fact was verified against";
    }
    row.appendChild(pill);
  });
})();
