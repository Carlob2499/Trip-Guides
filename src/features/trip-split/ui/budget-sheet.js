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

   The sheet is appended to <body> (never inside .split-wrap, which print.css hides outright)
   and removed as soon as printing ends. Everything is built SYNCHRONOUSLY inside the click
   gesture: window.print() must not sit behind an await, the same trap that let a popup
   blocker silently swallow the change-request wizard. */

import { esc } from "../../../scripts/util.js";

function money(v) {
  return "$" + (Math.round(Math.abs(v) * 100) / 100).toFixed(2);
}

/* Local-currency line. Deliberately coarse — a to-the-cent conversion of a converted figure
   claims precision the rate doesn't have — and always carries where the rate came from, so a
   printed number can't outlive its provenance (the site's sourced-approximate discipline). */
function localLine(total, cur) {
  if (!cur || !cur.code || !cur.rate || cur.code === "USD" || !total) return null;
  var converted = Math.round(total * cur.rate);
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
          money(t.amt) + "</span></li>";
      }).join("") + "</ul>"
    : "<p class='bs-square'>All square — no transfers needed.</p>";

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
      var verb = p.net > 0.005 ? "is owed " + money(p.net)
        : p.net < -0.005 ? "owes " + money(p.net)
          : "settled";
      var cls = p.net > 0.005 ? "bs-owed" : p.net < -0.005 ? "bs-owes" : "bs-even";
      return "<tr><td>" + esc(p.name) + "</td><td class='bs-num'>" + money(p.paid) +
        "</td><td class='bs-num'>" + money(p.share) + "</td><td class='bs-num " + cls + "'>" + verb + "</td></tr>";
    }).join("") +
    "</tbody></table>";

  var itemised = s.items.length
    ? "<table class='bs-table'><thead><tr><th>What for</th><th>Paid by</th><th class='bs-num'>Shared</th><th class='bs-num'>Amount</th></tr></thead><tbody>" +
      s.items.map(function (it) {
        return "<tr><td>" + esc(it.desc) + "</td><td>" + esc(it.payerName) + "</td><td class='bs-num'>" +
          it.sharerCount + (it.sharerCount === s.memberCount ? "" : " of " + s.memberCount) +
          "</td><td class='bs-num'>" + money(it.amount) + "</td></tr>";
      }).join("") +
      "<tr class='bs-total-row'><td>Total</td><td></td><td></td><td class='bs-num'>" + money(s.total) + "</td></tr>" +
      "</tbody></table>"
    : "<p class='bs-square'>No expenses recorded.</p>";

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
    loc ? loc.note : null,
    meta.url,
  ].filter(Boolean);

  return "<section class='bs-page'>" +
    "<header class='bs-runhead'><span>" + esc(meta.title) + " · budget summary</span><span>" + esc(meta.dateRange || "") + "</span></header>" +
    "<h2 class='bs-h'>Where it landed</h2>" + landed +
    "<h2 class='bs-h'>Every expense</h2>" + itemised +
    (perPerson ? "<h2 class='bs-h'>Person by person</h2><div class='bs-people'>" + perPerson + "</div>" : "") +
    "<footer class='bs-foot'>" + footBits.map(function (b) { return "<span>" + esc(b) + "</span>"; }).join("") + "</footer>" +
    "</section>";
}

/** Build the sheet element. Exported for tests and for anything that wants to inspect the
    markup without triggering a print dialog. */
export function buildSheet(summary, meta) {
  var el = document.createElement("div");
  el.className = "bsheet";
  el.id = "budgetSheet";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = coverPage(summary, meta) + statementPage(summary, meta);
  return el;
}

/** Render the sheet and open the browser's print / Save-as-PDF dialog, then clean up.
    Returns false when there is nothing worth printing. */
export function printBudgetSummary(summary, meta) {
  if (!summary || !summary.expenseCount) return false;

  var existing = document.getElementById("budgetSheet");
  if (existing) existing.remove();

  var sheet = buildSheet(summary, meta);
  document.body.appendChild(sheet);
  document.body.setAttribute("data-print-budget", "");

  var cleaned = false;
  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    document.body.removeAttribute("data-print-budget");
    var el = document.getElementById("budgetSheet");
    if (el) el.remove();
    window.removeEventListener("afterprint", cleanup);
  }
  window.addEventListener("afterprint", cleanup);

  try {
    window.print();
  } catch (e) {
    cleanup();
    return false;
  }
  // Safari/iOS fire afterprint unreliably; a timed sweep guarantees the sheet never outlives
  // the dialog and reappears as a stray block on screen.
  setTimeout(cleanup, 60000);
  return true;
}
