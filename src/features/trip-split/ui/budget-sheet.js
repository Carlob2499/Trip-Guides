/* Budget summary sheet — the sendable record of what the trip cost.

   Two printed pages, built from the live calculator state:
     1. COVER — trip identity, the headline total, per-person/per-day, and who pays who.
        The page you send when someone asks "what did it come to?"
     2. STATEMENT — paid/share/net per traveller, every expense itemised, then each
        person's own lines. The page that answers "where did it go?"

   WHY PRINT AND NOT A PDF LIBRARY: the browser's own print engine renders the page's real
   text, so Hangul names and payment handles come out as text. A bundled generator (jsPDF and
   friends) ships WinAnsi fonts and would turn "김민준" into boxes unless a CJK font were
   embedded — a several-hundred-KB fix to a problem print doesn't have. Print also gives
   selectable vector text, a tiny file, and zero dependencies. The user's "Save as PDF"
   destination does the rest.

   PREVIEW THEN PRINT (issue #47): the old flow called window.print() the instant the
   trigger was clicked — the reader never saw the document before it hit the printer. Now
   the click opens a visible, on-screen preview (built from the SAME .bsheet element that
   later prints, not a copy) and only the preview's own Print button calls window.print().
   That call still has to be SYNCHRONOUS inside its own click gesture — window.print() must
   never sit behind an await, the same popup-blocker-class trap recorded in the boundary
   checks — which is why the preview's Print button calls it directly, not through any
   async step. The sheet is appended to <body> (never inside .split-wrap, which print.css
   hides outright) and removed once the preview is dismissed or printing ends. */

import { esc, trapFocus } from "../../../scripts/util.js";
import { formatMinor, BASE_CURRENCY } from "../model/money";

/** All summary figures arrive as integer minor units of the base currency. */
function money(minor) {
  return formatMinor(Math.abs(Math.round(minor || 0)), BASE_CURRENCY);
}
/** An amount in whatever currency it was actually paid in. */
function native(minor, currency) {
  try { return formatMinor(Math.round(minor || 0), currency); }
  catch (e) { return String(minor); }
}

/* Local-currency line. Deliberately coarse — a to-the-cent conversion of a converted figure
   claims precision the rate doesn't have — and always carries where the rate came from, so a
   printed number can't outlive its provenance (the site's sourced-approximate discipline). */
function localLine(totalMinor, cur) {
  if (!cur || !cur.code || !cur.rate || cur.code === BASE_CURRENCY || !totalMinor) return null;
  // totalMinor is cents of the base currency; the rate is local units per 1 base unit.
  var converted = Math.round((totalMinor / 100) * cur.rate);
  var rounded = converted >= 10000 ? Math.round(converted / 100) * 100 : converted;
  return {
    value: "≈ " + rounded.toLocaleString() + " " + cur.code,
    note: cur.live
      ? "Rate " + cur.rate.toLocaleString() + " " + cur.code + " = $1 · ECB via Frankfurter · " + cur.date
      : cur.locked
        ? "Rate " + cur.rate.toLocaleString() + " " + cur.code + " = $1 · locked " + cur.date + " · offline"
        : "Seed rate " + cur.rate.toLocaleString() + " " + cur.code + " = $1" + (cur.date ? " · " + cur.date : "") + " · live rate unavailable",
  };
}

function coverPage(s, meta) {
  var loc = localLine(s.total, meta.currency);
  var sub = [
    meta.dateRange,
    s.memberCount + (s.memberCount === 1 ? " traveller" : " travellers"),
    s.days ? s.days + (s.days === 1 ? " day" : " days") : null,
  ].filter(Boolean).join(" · ");

  var tiles = "";
  if (s.memberCount > 1) {
    tiles += "<div class='bs-tile'><span class='bs-tile-lbl'>Per person</span><span class='bs-tile-val'>" +
      money(s.perPerson) + "</span><span class='bs-tile-note'>average of " + s.memberCount + "</span></div>";
  }
  if (s.perDay != null) {
    tiles += "<div class='bs-tile'><span class='bs-tile-lbl'>Per day</span><span class='bs-tile-val'>" +
      money(s.perDay) + "</span><span class='bs-tile-note'>across " + s.days + " days</span></div>";
  }
  tiles += "<div class='bs-tile'><span class='bs-tile-lbl'>Expenses</span><span class='bs-tile-val'>" +
    s.expenseCount + "</span><span class='bs-tile-note'>recorded</span></div>";

  // Payment handles are deliberately ABSENT from the sheet. They live in the calculator for
  // the group; a PDF gets forwarded, and a forwarded file shouldn't carry anyone's Venmo.
  var settle = s.txns.length
    ? "<ul class='bs-settle'>" + s.txns.map(function (t) {
        return "<li class='bs-settle-row'><span class='bs-settle-who'>" + esc(t.fromName) +
          " <span class='bs-arrow'>→</span> " + esc(t.toName) + "</span><span class='bs-settle-amt'>" +
          money(t.amtMinor) + "</span></li>";
      }).join("") + "</ul>"
    : (s.settledCount
        ? "<p class='bs-square'>All square — every transfer has been settled.</p>"
        : "<p class='bs-square'>All square — no transfers needed.</p>");

  return "<section class='bs-page bs-cover'>" +
    "<header class='bs-brand'><span class='bs-mark'>Waypoint</span><span class='bs-kind'>Budget summary</span></header>" +
    (meta.coverSrc ? "<img class='bs-cover-img' src='" + esc(meta.coverSrc) + "' alt='' />" : "") +
    "<h1 class='bs-title'>" + esc(meta.title) + "</h1>" +
    (sub ? "<p class='bs-sub'>" + esc(sub) + "</p>" : "") +
    "<p class='bs-total-lbl'>Total spend</p>" +
    "<p class='bs-total'>" + money(s.total) + "</p>" +
    (loc ? "<p class='bs-total-alt'>" + esc(loc.value) + "</p>" : "") +
    "<div class='bs-tiles'>" + tiles + "</div>" +
    "<h2 class='bs-h'>Settle up" + (s.txns.length ? " · " + s.txns.length + (s.txns.length === 1 ? " payment" : " payments") : "") + "</h2>" +
    settle +
    "</section>";
}

function statementPage(s, meta) {
  var loc = localLine(s.total, meta.currency);

  var landed = "<table class='bs-table'><thead><tr>" +
    "<th>Traveller</th><th class='bs-num'>Paid</th><th class='bs-num'>Their share</th><th class='bs-num'>Net</th>" +
    "</tr></thead><tbody>" +
    s.people.map(function (p) {
      // Integer minor units: a balance is either zero or it isn't — no tolerance band.
      var verb = p.net > 0 ? "is owed " + money(p.net)
        : p.net < 0 ? "owes " + money(p.net)
          : "settled";
      var cls = p.net > 0 ? "bs-owed" : p.net < 0 ? "bs-owes" : "bs-even";
      return "<tr><td>" + esc(p.name) + "</td><td class='bs-num'>" + money(p.paid) +
        "</td><td class='bs-num'>" + money(p.share) + "</td><td class='bs-num " + cls + "'>" + verb + "</td></tr>";
    }).join("") +
    "</tbody></table>";

  var itemised = s.items.length
    ? "<table class='bs-table'><thead><tr><th>What for</th><th>Paid by</th><th class='bs-num'>Shared</th><th class='bs-num'>Amount</th></tr></thead><tbody>" +
      s.items.map(function (it) {
        // A foreign expense prints what was actually handed over, with the converted figure
        // beneath it — the receipt in your pocket says ₩45,000, not $31.16.
        var amt = it.nativeMinor != null
          ? native(it.nativeMinor, it.nativeCurrency) + "<span class='bs-conv'>" + money(it.baseMinor) + "</span>"
          : money(it.baseMinor);
        return "<tr><td>" + esc(it.desc) +
          (it.category && it.category !== "Uncategorised" ? "<span class='bs-cat'>" + esc(it.category) + "</span>" : "") +
          "</td><td>" + esc(it.payerName) + "</td><td class='bs-num'>" +
          it.sharerCount + (it.sharerCount === s.memberCount ? "" : " of " + s.memberCount) +
          "</td><td class='bs-num'>" + amt + "</td></tr>";
      }).join("") +
      "<tr class='bs-total-row'><td>Total</td><td></td><td></td><td class='bs-num'>" + money(s.total) + "</td></tr>" +
      "</tbody></table>"
    : "<p class='bs-square'>No expenses recorded.</p>";

  // Where it went — printed only when the trip actually categorised something.
  var categorised = s.byCategory.filter(function (c) { return c.category !== "Uncategorised"; });
  var byCat = categorised.length
    ? "<h2 class='bs-h'>Where it went</h2><table class='bs-table'><thead><tr><th>Category</th><th class='bs-num'>Expenses</th><th class='bs-num'>Share</th><th class='bs-num'>Total</th></tr></thead><tbody>" +
      s.byCategory.map(function (c) {
        var pct = s.total ? Math.round((c.total / s.total) * 100) : 0;
        return "<tr><td>" + esc(c.category) + "</td><td class='bs-num'>" + c.count +
          "</td><td class='bs-num'>" + pct + "%</td><td class='bs-num'>" + money(c.total) + "</td></tr>";
      }).join("") + "</tbody></table>"
    : "";

  var perPerson = s.byPerson.filter(function (p) { return p.items.length; }).map(function (p) {
    return "<div class='bs-person'>" +
      "<div class='bs-person-head'><span class='bs-person-name'>" + esc(p.name) + "</span>" +
      "<span class='bs-person-total'>" + money(p.total) + "</span></div>" +
      "<ul class='bs-person-items'>" + p.items.map(function (i) {
        return "<li><span>" + esc(i.desc) + "</span><span class='bs-num'>" + money(i.share) + "</span></li>";
      }).join("") + "</ul></div>";
  }).join("");

  var footBits = [
    "Generated " + meta.generatedOn,
    s.settledCount ? s.settledCount + " payment" + (s.settledCount === 1 ? "" : "s") + " already settled, totalling " + money(s.settledMinor) : null,
    // An omission the reader would otherwise never know about.
    s.unconvertedCount ? s.unconvertedCount + " expense" + (s.unconvertedCount === 1 ? " is" : "s are") + " not included — no exchange rate was captured for " + (s.unconvertedCount === 1 ? "it" : "them") : null,
    loc ? loc.note : null,
    meta.url,
  ].filter(Boolean);

  return "<section class='bs-page'>" +
    "<header class='bs-runhead'><span>" + esc(meta.title) + " · budget summary</span><span>" + esc(meta.dateRange || "") + "</span></header>" +
    "<h2 class='bs-h'>Where it landed</h2>" + landed +
    byCat +
    "<h2 class='bs-h'>Every expense</h2>" + itemised +
    (perPerson ? "<h2 class='bs-h'>Person by person</h2><div class='bs-people'>" + perPerson + "</div>" : "") +
    "<footer class='bs-foot'>" + footBits.map(function (b) { return "<span>" + esc(b) + "</span>"; }).join("") + "</footer>" +
    "</section>";
}

/** Build the sheet element. Exported for tests and for anything that wants to inspect the
    markup without opening the preview. Not aria-hidden: once opened it's the visible,
    focusable content of a real dialog, not print-only furniture nobody sees. */
export function buildSheet(summary, meta) {
  var el = document.createElement("div");
  el.className = "bsheet";
  el.id = "budgetSheet";
  el.innerHTML = coverPage(summary, meta) + statementPage(summary, meta);
  return el;
}

var BAR_HTML =
  '<div class="bsp-backdrop" id="bspBackdrop"></div>' +
  '<div class="bsp-modal" id="bspModal" role="dialog" aria-modal="true" aria-label="Print preview">' +
    '<div class="bsp-bar">' +
      '<span class="bsp-bar-label">Print preview</span>' +
      '<div class="bsp-bar-actions">' +
        '<button class="bsp-cancel" id="bspCancel" type="button">Cancel</button>' +
        '<button class="bsp-print" id="bspPrint" type="button">Print</button>' +
      '</div>' +
    '</div>' +
    '<div class="bsp-scroll" id="bspScroll"></div>' +
  '</div>';

/** Build the sheet and open it in an on-screen preview — the reader sees exactly what is
    about to print before choosing to print it. Returns false when there is nothing worth
    summarising. The Print button inside the preview calls window.print() synchronously
    from its OWN click, so the gesture constraint holds without the trigger itself printing
    anything. */
export function previewBudgetSummary(summary, meta) {
  if (!summary || !summary.expenseCount) return false;

  var opener = document.activeElement;
  var existingSheet = document.getElementById("budgetSheet");
  if (existingSheet) existingSheet.remove();
  var existingModal = document.getElementById("bspModal");
  if (existingModal) { existingModal.remove(); var bd = document.getElementById("bspBackdrop"); if (bd) bd.remove(); }

  document.body.insertAdjacentHTML("beforeend", BAR_HTML);
  var backdrop = document.getElementById("bspBackdrop");
  var modal = document.getElementById("bspModal");
  var scroll = document.getElementById("bspScroll");
  var cancelBtn = document.getElementById("bspCancel");
  var printBtn = document.getElementById("bspPrint");

  var sheet = buildSheet(summary, meta);
  scroll.appendChild(sheet);
  document.body.setAttribute("data-bsheet-open", "");

  var cleaned = false;
  var untrap = trapFocus(modal, function () { return !cleaned; });
  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    document.body.removeAttribute("data-bsheet-open");
    modal.remove();
    backdrop.remove();
    window.removeEventListener("afterprint", cleanup);
    document.removeEventListener("keydown", onKeydown);
    untrap();
    if (opener && opener.focus) opener.focus();
  }
  function onKeydown(e) { if (e.key === "Escape") cleanup(); }

  window.addEventListener("afterprint", cleanup);
  document.addEventListener("keydown", onKeydown);
  backdrop.addEventListener("click", cleanup);
  cancelBtn.addEventListener("click", cleanup);
  printBtn.addEventListener("click", function () {
    // SYNCHRONOUS, inside this click's own gesture — no await between here and print().
    try { window.print(); } catch (e) { /* dialog blocked/unsupported — preview stays open */ }
    // Safari/iOS fire afterprint unreliably; a timed sweep guarantees the sheet never
    // outlives the dialog and reappears as a stray block on screen.
    setTimeout(cleanup, 60000);
  });

  printBtn.focus();
  return true;
}
