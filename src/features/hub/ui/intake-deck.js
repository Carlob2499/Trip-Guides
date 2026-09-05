/* Waypoint /new — the ADAPTIVE QUESTION DECK (design-system.md §23 "Create Guide").

   One clear decision at a time. The checklist (intake-checklist.js) still owns every real
   control, the meter, the matchups, the fork gate and the dispatch — this file only decides
   WHICH question is in front of the traveler and keeps the answered ones visible as a quiet
   history stack above it. Nothing is duplicated or re-parented: a card IS the checklist row
   (`.itk-row`) the schema already renders, so intake-submit.js reads the same ids and the
   no-JS form is the same form with every card open.

   Branching: a later question is skipped when an earlier answer makes it moot (one traveler →
   no "who are they?"; no anchor → no "how firm is that?"). Skipped cards stay in the history,
   marked, and reopen if the earlier answer changes. "Just tell Waypoint" jumps to the free-text
   card at any time — the natural-language escape hatch (§22). The last card hands over to the
   compiled checklist: every answer visible in its section, the fork gate, then send. */

import { reducedMotion } from "../../../scripts/util.js";
import { SECTIONS } from "../index";

var STORE = "wp-intake-deck-v1";

/* Board 07's "Your guide preview": the answers already given, in the traveler's own words.
   Never a prediction — no day count, no itinerary shape, no "what's included" list, because
   none of that exists until the research runs. */
var PREVIEW = [
  ["Destination", ["ngCountry", "ngCities"]],
  ["Dates", ["ngStart", "ngEnd"]],
  ["Travellers", ["ngTravelers"]],
  ["Pace", ["ngPace"]],
  ["Budget", ["ngBudget"]],
];

/* A card is moot when an earlier answer settles it. Each rule reads the live controls. */
var SKIP = {
  party: function (v) { return v("ngTravelers") === "1"; },
  "dates-certainty": function (v) { return !v("ngStart") && !v("ngEnd"); },
  "anchor-certainty": function (v) { return !v("ngAnchor"); },
  "budget-certainty": function (v) { return !v("ngBudget"); },
};

export function initIntakeDeck() {
  var form = document.getElementById("ngForm");
  if (!form || form.hasAttribute("data-deck")) return;
  var rows = Array.prototype.slice.call(form.querySelectorAll(".itk-row")).filter(function (r) {
    return !r.hidden && !r.hasAttribute("data-fallback");
  });
  if (rows.length < 2) return;
  var reduced = reducedMotion();
  var byId = function (id) { return document.getElementById(id); };
  var val = function (id) { var n = byId(id); return n ? String(n.value || "").trim() : ""; };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  /* ── The deck's own chrome: history above, controls below the current card. ───────── */
  var deck = el("div", "itk-deck");
  var history = el("ol", "itk-deck-history");
  history.setAttribute("aria-label", "Your answers so far");
  var progress = el("p", "itk-deck-progress");
  progress.setAttribute("role", "status");
  var controls = el("div", "itk-deck-controls");
  var back = el("button", "itk-deck-back", "← Back"); back.type = "button";
  var skip = el("button", "itk-deck-skip", "Skip — leave it open"); skip.type = "button";
  var next = el("button", "itk-deck-next", "Next →"); next.type = "button";
  var tell = el("button", "itk-deck-tell", "Just tell Waypoint"); tell.type = "button";
  var review = el("button", "itk-deck-review", "Review everything"); review.type = "button";
  controls.appendChild(back); controls.appendChild(skip); controls.appendChild(next);
  var aside = el("div", "itk-deck-aside");
  aside.appendChild(tell); aside.appendChild(review);
  /* The answered stack lives under the frame when the page gives it a home (board 07's "Your
     answers"); on any other host — the gallery specimen, a no-frame page — it stays in the deck
     where it has always been. The progress line stays beside the card either way. */
  var answersHost = byId("itkAnswers");
  (answersHost || deck).appendChild(history);
  deck.appendChild(progress);
  form.insertBefore(deck, form.firstChild.nextSibling && form.firstChild.classList && form.firstChild.classList.contains("itk-meter") ? form.firstChild.nextSibling : form.firstChild);
  // The controls ride under whichever row is current (moved on every step).

  var idx = 0;
  try { var s = parseInt(sessionStorage.getItem(STORE), 10); if (!isNaN(s)) idx = s; } catch (_) {}

  function fieldOf(row) { return row.getAttribute("data-field") || (row.classList.contains("itk-row-match") ? "priorities" : ""); }
  function questionOf(row) { var q = row.querySelector(".itk-q"); return q ? q.textContent.trim() : ""; }
  function answerOf(row) {
    if (row.classList.contains("itk-row-match")) {
      var podium = row.querySelectorAll(".itk-podium-lab");
      return podium.length ? Array.prototype.map.call(podium, function (n) { return n.textContent; }).join(" · ") : "";
    }
    var parts = [];
    row.querySelectorAll("input, select, textarea").forEach(function (c) {
      if (c.tagName === "SELECT") { var o = c.options[c.selectedIndex]; if (o && o.value) parts.push(o.text); }
      else if (c.value && String(c.value).trim()) parts.push(String(c.value).trim());
    });
    return parts.join(" → ");
  }
  function skipped(row) { var rule = SKIP[fieldOf(row)]; return !!(rule && rule(val)); }
  function live() { return rows.filter(function (r) { return !skipped(r); }); }

  function paintHistory(current) {
    history.innerHTML = "";
    var seen = 0;
    rows.forEach(function (row, i) {
      if (i >= current) return;
      var li = el("li", "itk-deck-hist" + (skipped(row) ? " itk-deck-hist--moot" : ""));
      var b = el("button", "itk-deck-hist-btn"); b.type = "button";
      b.setAttribute("aria-label", "Change: " + questionOf(row));
      b.appendChild(el("span", "itk-deck-hist-q", questionOf(row)));
      var a = answerOf(row);
      b.appendChild(el("span", "itk-deck-hist-a" + (a ? "" : " itk-deck-hist-a--open"), skipped(row) ? "not needed" : (a || "left open")));
      b.addEventListener("click", function () { go(i, { focus: true }); });
      li.appendChild(b);
      history.appendChild(li);
      seen++;
    });
    history.hidden = seen === 0;
    // The below-frame card says so plainly rather than sitting there as an empty titled box.
    var empty = byId("itkAnswersEmpty");
    if (empty) empty.hidden = seen > 0;
  }

  /* ── The rail and the preview (board 07) ─────────────────────────────────────────────
     Both are PROJECTIONS: the rail copies the mark intake-checklist.js already paints on each
     section, and the preview reads the same controls the pipeline will. Neither decides
     anything, so neither can disagree with the checklist about what is done. */
  var rail = byId("itkRail");
  var preview = byId("itkPreview");
  var railSteps = null;
  function sectionOf(row) { var s = row.closest(".itk-sec"); return s ? s.getAttribute("data-sec") : ""; }
  function buildRail() {
    if (!rail || railSteps) return;
    railSteps = [];
    SECTIONS.forEach(function (sec, i) {
      var b = el("button", "itk-rail-step"); b.type = "button";
      var mark = el("span", "itk-mark itk-mark-todo", String(i + 1));
      mark.setAttribute("aria-hidden", "true");
      b.appendChild(mark);
      b.appendChild(el("span", null, sec.title));
      b.addEventListener("click", function () {
        var at = rows.findIndex(function (r) { return sectionOf(r) === sec.id && !skipped(r); });
        if (at >= 0) go(at, { focus: true });
      });
      rail.appendChild(b);
      railSteps.push({ id: sec.id, btn: b, mark: mark });
    });
  }
  function paintRail(current) {
    if (!railSteps) return;
    var here = sectionOf(rows[current]);
    railSteps.forEach(function (s) {
      var src = form.querySelector('[data-sec="' + s.id + '"] [data-mark]');
      if (src) s.mark.className = src.className;
      if (s.id === here) s.btn.setAttribute("aria-current", "step");
      else s.btn.removeAttribute("aria-current");
    });
  }
  function paintPreview() {
    if (!preview) return;
    preview.replaceChildren();
    preview.appendChild(el("p", "itk-eyebrow", "Your guide preview"));
    var dl = el("dl", null);
    PREVIEW.forEach(function (pair) {
      var parts = [];
      pair[1].forEach(function (id) {
        var n = byId(id);
        if (!n) return;
        if (n.tagName === "SELECT") { var o = n.options[n.selectedIndex]; if (o && o.value) parts.push(o.text); }
        else if (String(n.value || "").trim()) parts.push(String(n.value).trim());
      });
      if (!parts.length) return;
      dl.appendChild(el("dt", null, pair[0]));
      dl.appendChild(el("dd", null, parts.join(" · ")));
    });
    if (dl.children.length) preview.appendChild(dl);
    else preview.appendChild(el("p", "itk-prev-empty", "Nothing yet. What you answer appears here, in your own words."));
  }

  function go(i, opts) {
    opts = opts || {};
    // Never land on a moot card: step past it in the direction of travel.
    var dir = i >= idx ? 1 : -1;
    while (i >= 0 && i < rows.length && skipped(rows[i])) i += dir;
    if (i < 0) i = 0;
    if (i >= rows.length) { finish(); return; }
    idx = i;
    try { sessionStorage.setItem(STORE, String(idx)); } catch (_) {}
    rows.forEach(function (row, n) {
      if (n === idx) row.setAttribute("data-deck-current", "");
      else row.removeAttribute("data-deck-current");
    });
    var row = rows[idx];
    row.appendChild(controls);
    row.appendChild(aside);
    var all = live();
    var pos = all.indexOf(row) + 1;
    progress.textContent = "Question " + pos + " of " + all.length;
    back.disabled = idx === 0;
    var last = all[all.length - 1] === row;
    next.textContent = last ? "Review & send →" : "Next →";
    skip.hidden = last;
    paintHistory(idx);
    paintRail(idx);
    paintPreview();
    if (!reduced) { row.classList.remove("itk-deck-deal"); void row.offsetWidth; row.classList.add("itk-deck-deal"); }
    var first = row.querySelector("input, select, textarea, button.itk-vs-btn");
    if (opts.focus !== false && first) first.focus({ preventScroll: true });
    row.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
  }

  function finish() {
    // Hand over to the compiled checklist: every section, every answer, the gate, then send.
    form.removeAttribute("data-deck");
    deck.hidden = true;
    controls.remove(); aside.remove();
    rows.forEach(function (r) { r.removeAttribute("data-deck-current"); });
    form.querySelectorAll("details.itk-sec").forEach(function (d) { d.open = true; });
    var target = form.querySelector(".itk-gate:not([hidden])") || form.querySelector(".itk-dispatch") || form;
    target.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    var f = target.querySelector("button, .itk-chip");
    if (f) f.focus({ preventScroll: true });
    try { sessionStorage.setItem(STORE, "done"); } catch (_) {}
    var again = byId("itkDeckAgain");
    if (again) again.hidden = false;
  }

  back.addEventListener("click", function () { go(idx - 1, { focus: true }); });
  next.addEventListener("click", function () { go(idx + 1, { focus: true }); });
  skip.addEventListener("click", function () { go(idx + 1, { focus: true }); });
  tell.addEventListener("click", function () {
    var i = rows.findIndex(function (r) { return r.getAttribute("data-field") === "comments"; });
    if (i >= 0) go(i, { focus: true });
  });
  review.addEventListener("click", finish);
  // Enter in a single-line control advances — the deck's rhythm; a textarea keeps its newline.
  form.addEventListener("keydown", function (e) {
    if (!form.hasAttribute("data-deck") || e.key !== "Enter") return;
    var t = e.target;
    if (!t || t.tagName === "TEXTAREA" || t.tagName === "BUTTON") return;
    if (t.tagName === "INPUT" || t.tagName === "SELECT") { e.preventDefault(); go(idx + 1, { focus: true }); }
  });
  // An answer that changes a branch re-evaluates the history stack in place.
  function repaint() { if (!form.hasAttribute("data-deck")) return; paintHistory(idx); paintRail(idx); paintPreview(); }
  form.addEventListener("input", repaint);
  form.addEventListener("change", repaint);

  // "Start the deck again" lives in the hero, for a traveler who reviewed and wants the cards back.
  var again = byId("itkDeckAgain");
  if (again) again.addEventListener("click", function () {
    form.setAttribute("data-deck", "");
    deck.hidden = false;
    form.querySelectorAll("details.itk-sec").forEach(function (d) { d.open = true; });
    again.hidden = true;
    go(0, { focus: true });
  });

  var done = false;
  try { done = sessionStorage.getItem(STORE) === "done"; } catch (_) {}
  if (done) { if (again) again.hidden = false; return; }
  form.setAttribute("data-deck", "");
  form.querySelectorAll("details.itk-sec").forEach(function (d) { d.open = true; });
  buildRail();
  go(Math.min(idx, rows.length - 1), { focus: false });
}
