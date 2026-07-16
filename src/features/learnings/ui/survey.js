/* Trip Feedback survey — a 3-step modal (ratings · stops · freeform) that writes ONE
   anonymous record to Firebase under trips/<storeKey>/feedback. Modelled on the New-Guide
   wizard (src/scripts/wizard.js): numbered steps, lazy gsap slide, reducedMotion respected.

   INERT unless Firebase is configured: with an empty config the trigger button stays hidden
   and none of this runs. The `feedback` collection is a SEPARATE sibling of Trip Split's
   members/expenses under the same room — the budget is never touched. `freeform` is written
   but never rendered anywhere in the app (the private, candid channel). */

import { esc, reducedMotion } from "../../../scripts/util.js";
import { hasFirebase, joinTrip, normalizeCode } from "../../firebase/index.js";
import { buildFeedbackRecord } from "../model/feedback";

export function initFeedback() {
  var modal = document.getElementById("lnwModal");
  if (!modal) return;
  var openers = Array.prototype.slice.call(document.querySelectorAll("[data-lnw-open]"));
  if (!openers.length) return;

  // Inert without Firebase: never reveal the trigger, never build the survey.
  if (!hasFirebase()) return;

  var storeKey = modal.getAttribute("data-sk") || "guide";

  // Reveal the triggers now that live capture is available.
  openers.forEach(function (b) { b.hidden = false; });

  // Reparent to <body> so position:fixed can't be trapped by a transformed ancestor
  // (the itinerary card deck and hero use transforms).
  if (modal.parentNode !== document.body) document.body.appendChild(modal);

  var bodyEl = modal.querySelector("#lnwBody");
  var navEl = modal.querySelector("#lnwNav");
  var titleEl = modal.querySelector("#lnwTitle");
  var eyebrowEl = modal.querySelector(".lnw-eyebrow");
  if (!bodyEl || !navEl) return;

  var STEPS = ["Ratings", "What we did", "In your words"];
  var cur = 0;
  var lastFocus = null;

  // Collected answers.
  var ratings = {}; // { overall, pacing, food }
  var stopRows = []; // [{ key, day, name, went, reason }]
  var freeform = "";

  /* ── stops from the live itinerary DOM ─────────────────────────────────────
     Keys match field-tools.js exactly (di + "-" + si over .stop within each day),
     so "went" prefills from the same check-off state the traveler already ticked. */
  function collectStops() {
    var out = [];
    var visited = {};
    try { visited = JSON.parse(localStorage.getItem("tg-stops-" + storeKey)) || {}; } catch (e) {}
    // Default "went": you're filling this out because you did the trip, so most stops
    // were hit — the user only toggles the few they skipped (keeps the skips list clean).
    // But if they used the on-trip stop check-offs, trust that signal: checked = went,
    // unchecked = skipped. No check-offs at all → optimistic went for everything.
    var anyChecked = Object.keys(visited).length > 0;
    document.querySelectorAll(".planner-days .day[data-day]").forEach(function (day) {
      var di = day.getAttribute("data-day");
      var dEl = day.querySelector(".d");
      var date = dEl ? dEl.textContent.trim().replace(/^\d+\s*/, "") : "Day " + di;
      day.querySelectorAll(".stop").forEach(function (stop, si) {
        var nameEl = stop.querySelector(".stop-name");
        if (!nameEl) return;
        var key = di + "-" + si;
        out.push({ key: key, day: date, name: nameEl.textContent.trim(), went: visited[key] ? true : !anyChecked, reason: "" });
      });
    });
    return out;
  }

  /* ── step renderers ─────────────────────────────────────────────────────── */
  function renderRatings() {
    var rows = [
      { key: "overall", label: "Overall" },
      { key: "pacing", label: "Pace" },
      { key: "food", label: "Food" },
    ];
    var html = '<p class="lnw-lede">Rate the plan — tap a number. Skip any you\'re unsure about.</p>';
    rows.forEach(function (r) {
      html += '<div class="lnw-rate" role="group" aria-label="' + esc(r.label) + '"><span class="lnw-rate-lbl">' + esc(r.label) + "</span><span class='lnw-pills'>";
      for (var n = 1; n <= 5; n++) {
        var on = ratings[r.key] === n;
        html += '<button type="button" class="lnw-pill' + (on ? " lnw-pill-on" : "") +
          '" data-rate="' + r.key + '" data-val="' + n + '" aria-pressed="' + (on ? "true" : "false") + '">' + n + "</button>";
      }
      html += "</span></div>";
    });
    bodyEl.innerHTML = html;
    bodyEl.querySelectorAll(".lnw-pill").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-rate"), v = parseInt(b.getAttribute("data-val"), 10);
        ratings[k] = ratings[k] === v ? undefined : v; // tap again to clear
        renderRatings();
      });
    });
  }

  function renderStops() {
    if (!stopRows.length) stopRows = collectStops();
    if (!stopRows.length) {
      bodyEl.innerHTML = '<p class="lnw-lede">No planned stops found for this guide — skip ahead.</p>';
      return;
    }
    var html = '<p class="lnw-lede">Which stops did you actually hit? Mark the ones you skipped and why.</p>';
    var lastDay = null;
    stopRows.forEach(function (s, i) {
      if (s.day !== lastDay) { html += '<p class="lnw-day">' + esc(s.day) + "</p>"; lastDay = s.day; }
      html += '<div class="lnw-stop" data-i="' + i + '">' +
        '<span class="lnw-stop-name">' + esc(s.name) + "</span>" +
        '<span class="lnw-toggle">' +
          '<button type="button" class="lnw-tg' + (s.went ? " lnw-tg-on" : "") + '" data-go="1" aria-pressed="' + (s.went ? "true" : "false") + '">Went</button>' +
          '<button type="button" class="lnw-tg' + (!s.went ? " lnw-tg-off" : "") + '" data-go="0" aria-pressed="' + (!s.went ? "true" : "false") + '">Skipped</button>' +
        "</span>" +
        (!s.went ? '<input type="text" class="lnw-reason" placeholder="Why skipped? (optional)" value="' + esc(s.reason) + '" />' : "") +
        "</div>";
    });
    bodyEl.innerHTML = html;
    bodyEl.querySelectorAll(".lnw-tg").forEach(function (b) {
      b.addEventListener("click", function () {
        var row = b.closest(".lnw-stop"); var i = parseInt(row.getAttribute("data-i"), 10);
        stopRows[i].went = b.getAttribute("data-go") === "1";
        renderStops();
      });
    });
    bodyEl.querySelectorAll(".lnw-reason").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var row = inp.closest(".lnw-stop"); var i = parseInt(row.getAttribute("data-i"), 10);
        stopRows[i].reason = inp.value;
      });
    });
  }

  function renderFreeform() {
    bodyEl.innerHTML =
      '<p class="lnw-lede">Anything else — what you\'d change, what worked, what surprised you? This part stays private to the guide author.</p>' +
      '<textarea class="lnw-ta" id="lnwFree" rows="5" maxlength="2000" placeholder="Type freely…">' + esc(freeform) + "</textarea>";
    var ta = bodyEl.querySelector("#lnwFree");
    ta.addEventListener("input", function () { freeform = ta.value; });
  }

  var renderers = [renderRatings, renderStops, renderFreeform];

  function renderNav() {
    var dots = "";
    for (var i = 0; i < STEPS.length; i++) dots += "<span class='lnw-dot" + (i <= cur ? " lnw-dot-on" : "") + "'></span>";
    navEl.innerHTML =
      '<button type="button" class="lnw-btn lnw-back"' + (cur === 0 ? " hidden" : "") + ">← Back</button>" +
      "<span class='lnw-dots'>" + dots + "</span>" +
      (cur < STEPS.length - 1
        ? '<button type="button" class="lnw-btn lnw-primary lnw-next">Next →</button>'
        : '<button type="button" class="lnw-btn lnw-primary lnw-submit">Log it</button>');
    var back = navEl.querySelector(".lnw-back"); if (back) back.addEventListener("click", function () { go(-1); });
    var next = navEl.querySelector(".lnw-next"); if (next) next.addEventListener("click", function () { go(1); });
    var sub = navEl.querySelector(".lnw-submit"); if (sub) sub.addEventListener("click", submit);
  }

  function paint() {
    if (titleEl) titleEl.textContent = ["How did the plan hold up?", "Plan vs. reality", "In your words"][cur];
    if (eyebrowEl) eyebrowEl.textContent = "Trip feedback · step " + (cur + 1) + " of " + STEPS.length;
    renderers[cur]();
    renderNav();
  }

  function go(dir) {
    var next = cur + dir;
    if (next < 0 || next >= STEPS.length) return;
    cur = next;
    paint(); // render synchronously — navigation NEVER waits on (or is blocked by) gsap
    if (reducedMotion()) return;
    // Slide is a pure, non-blocking flourish: even if gsap fails to load or its ticker
    // never fires an onComplete, the step is already painted and further steps still work.
    import("gsap").then(function (m) {
      var gsap = m.gsap || m.default;
      if (gsap) gsap.fromTo(bodyEl.parentNode, { x: dir > 0 ? 24 : -24, autoAlpha: 0.5 },
        { x: 0, autoAlpha: 1, duration: 0.26, ease: "power3.out", clearProps: "x" });
    }).catch(function () {});
  }

  /* ── submit → Firebase ──────────────────────────────────────────────────── */
  function submit() {
    var visited = {};
    var skips = [];
    stopRows.forEach(function (s) {
      visited[s.key] = !!s.went;
      if (!s.went) skips.push({ stop: s.name, reason: s.reason });
    });
    var rec = buildFeedbackRecord({ ratings: ratings, visited: visited, skips: skips, freeform: freeform });
    if (!rec) { flashEmpty(); return; }

    var subBtn = navEl.querySelector(".lnw-submit");
    if (subBtn) { subBtn.disabled = true; subBtn.textContent = "Logging…"; }

    // Wait for the SERVER to acknowledge before telling anyone it landed. RTDB queues writes
    // while offline and that promise never settles, so race a timeout and say "queued" instead
    // of claiming success we can't prove.
    joinTrip(normalizeCode(storeKey))
      .then(function (room) {
        var ack = room.collection("feedback").addAsync(rec);
        var timeout = new Promise(function (resolve) { setTimeout(function () { resolve("queued"); }, 8000); });
        return Promise.race([ack.then(function () { return "saved"; }), timeout]);
      })
      .then(function (outcome) { success(outcome === "queued"); })
      .catch(function () {
        if (subBtn) { subBtn.disabled = false; subBtn.textContent = "Retry — couldn't reach the group"; }
      });
  }

  function flashEmpty() {
    var lede = bodyEl.querySelector(".lnw-lede");
    if (lede) { lede.classList.add("lnw-warn"); lede.textContent = "Add at least one rating, stop, or note before logging."; }
  }

  function success(queued) {
    if (titleEl) titleEl.textContent = queued ? "Saved — still syncing." : "Thanks — logged for the post-mortem.";
    if (eyebrowEl) eyebrowEl.textContent = "Trip feedback";
    bodyEl.innerHTML = '<p class="lnw-lede">' + (queued
      ? "You're offline or the connection is slow — this is saved on your device and uploads on its own once you're back."
      : "Your notes feed the guide's learnings. Add more anytime.") + "</p>";
    navEl.innerHTML = '<button type="button" class="lnw-btn lnw-primary lnw-done">Done</button>';
    var done = navEl.querySelector(".lnw-done");
    if (done) { done.addEventListener("click", close); done.focus(); }
  }

  /* ── open / close + focus trap ──────────────────────────────────────────── */
  function open() {
    lastFocus = document.activeElement;
    // Reset for a fresh submission each open.
    cur = 0; ratings = {}; stopRows = []; freeform = "";
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    paint();
    var first = modal.querySelector(".lnw-dialog");
    if (first) first.focus();
  }
  function close() {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  openers.forEach(function (b) { b.addEventListener("click", open); });
  modal.querySelectorAll("[data-lnw-close]").forEach(function (b) { b.addEventListener("click", close); });
  modal.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { close(); return; }
    if (e.key !== "Tab") return;
    var f = modal.querySelectorAll('button:not([hidden]), [href], input, textarea, [tabindex]:not([tabindex="-1"])');
    f = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null || el === document.activeElement; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
