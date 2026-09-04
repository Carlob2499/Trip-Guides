/* The day rail — the itinerary's ONE day switch (design-system.md D6-34/D6-49).

   Every day card renders; exactly one is shown (`.day[hidden]` on the rest, so the phone
   never scrolls a deck of nine days and the desktop timeline stays the selected day). Two
   controls drive it, both through selectDay(): the thumb-zone rail (`#dayRail`, sticky above
   the bottom bar on a phone) and the header date row (`.itin-daynav`, desktop). Tap jumps;
   a horizontal drag across the rail scrubs with a bubble naming the day under the thumb;
   ←/→ move a day; a horizontal swipe on the day card itself moves to the adjacent day
   (contextual, D6-44 — the object in view is the day, never a top-level destination).

   Selection is remembered per guide on this device (D6-15) and announces `tg:day` so the
   workbench map and the Trip surface can follow. */

import { reducedMotion, tapHaptic } from "../../../scripts/util.js";
import { resolveSwipe } from "../model/gesture";

export function initDayRail(root) {
  var doc = root || document;
  var dayEls = Array.prototype.slice.call(doc.querySelectorAll("[data-planner-days] .day[data-day]"));
  if (!dayEls.length) return null;
  var jumps = Array.prototype.slice.call(doc.querySelectorAll("[data-day-jump]"));
  var rail = doc.getElementById("dayRail");
  var track = rail ? rail.querySelector("[data-day-rail]") : null;
  var bubble = rail ? rail.querySelector(".scrub-bubble") : null;
  var reduced = reducedMotion();
  var storeKey = doc.body.getAttribute("data-storekey") || "guide";
  var KEY = "tg-d7-day-" + storeKey;
  var N = dayEls.length;
  var cur = -1;

  function selectDay(idx, opts) {
    opts = opts || {};
    idx = Math.max(0, Math.min(N - 1, idx));
    var dir = idx > cur ? 1 : idx < cur ? -1 : 0;
    if (idx === cur && !opts.force) return;
    cur = idx;
    dayEls.forEach(function (el, i) {
      var on = i === idx;
      el.hidden = !on;
      if (on && !reduced && dir !== 0 && !opts.silent) {
        el.classList.remove("day-in-l", "day-in-r");
        void el.offsetWidth;
        el.classList.add(dir < 0 ? "day-in-l" : "day-in-r");
      }
    });
    jumps.forEach(function (b) {
      var on = parseInt(b.getAttribute("data-day-jump"), 10) === idx;
      if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
    if (track) {
      var chip = track.querySelector('[data-day-jump="' + idx + '"]');
      if (chip && track.scrollWidth > track.clientWidth) {
        var target = chip.offsetLeft - (track.clientWidth - chip.offsetWidth) / 2;
        track.scrollTo({ left: Math.max(0, target), behavior: reduced || opts.silent ? "auto" : "smooth" });
      }
    }
    try { localStorage.setItem(KEY, String(idx)); } catch (_) {}
    var title = doc.querySelector("[data-itin-map-title]");
    if (title) {
      var d = dayEls[idx].getAttribute("data-date") || "";
      var parts = d.split(/\s+/);
      title.textContent = (parts.length >= 3 ? parts[1] + " " + parts[2] : d) + " on the map";
    }
    try { doc.dispatchEvent(new CustomEvent("tg:day", { detail: { index: idx, date: dayEls[idx].getAttribute("data-date"), reason: opts.reason || "select" } })); } catch (_) {}
    if (opts.focus) {
      var h = dayEls[idx].querySelector(".day-title");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    }
  }

  jumps.forEach(function (b) {
    b.addEventListener("click", function () { tapHaptic(); selectDay(parseInt(b.getAttribute("data-day-jump"), 10), { reason: "tap", focus: true }); });
  });

  // Keyboard: arrows anywhere in the rail or the header row.
  [rail, doc.querySelector(".itin-daynav")].forEach(function (group) {
    if (!group) return;
    group.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        selectDay(cur + (e.key === "ArrowRight" ? 1 : -1), { reason: "key" });
        var b = group.querySelector('[data-day-jump="' + cur + '"]');
        if (b) b.focus();
      }
    });
  });

  /* Scrub: a horizontal drag across the rail selects the chip under the pointer. The rail's
     own horizontal scroll stays for a plain flick; scrubbing arms only after a clear
     horizontal intent, so a scroll is never mistaken for a scrub. */
  if (track && bubble) {
    var sx = 0, sy = 0, scrubbing = false, armed = false, pid = null;
    function chipAt(x) {
      var chips = track.querySelectorAll("[data-day-jump]");
      for (var i = 0; i < chips.length; i++) {
        var r = chips[i].getBoundingClientRect();
        if (x >= r.left && x <= r.right) return { chip: chips[i], rect: r };
      }
      return null;
    }
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      sx = e.clientX; sy = e.clientY; armed = true; scrubbing = false; pid = e.pointerId;
    }, { passive: true });
    track.addEventListener("pointermove", function (e) {
      if (!armed || e.pointerId !== pid) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!scrubbing) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { armed = false; return; }
        if (Math.abs(dx) < 14) return;
        scrubbing = true;
        rail.classList.add("scrubbing");
        try { track.setPointerCapture(pid); } catch (_) {}
      }
      var hit = chipAt(e.clientX);
      if (!hit) return;
      var idx = parseInt(hit.chip.getAttribute("data-day-jump"), 10);
      bubble.textContent = hit.chip.getAttribute("aria-label") || "";
      bubble.style.setProperty("--scrub-x", (hit.rect.left + hit.rect.width / 2 - rail.getBoundingClientRect().left) + "px");
      if (idx !== cur) { tapHaptic(); selectDay(idx, { reason: "scrub", silent: true }); }
    });
    function endScrub() { armed = false; if (scrubbing) { scrubbing = false; rail.classList.remove("scrubbing"); } }
    track.addEventListener("pointerup", endScrub);
    track.addEventListener("pointercancel", endScrub);
  }

  /* Contextual swipe on the day card (adjacent days only). */
  var deck = doc.querySelector("[data-planner-days]");
  if (deck) {
    var tsx = 0, tsy = 0, tst = 0, tracking = false;
    deck.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      if (e.target.closest && e.target.closest(".stops, .transit-links, a, button, input, .itin-map")) { tracking = false; return; }
      tracking = true; tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; tst = Date.now();
    }, { passive: true });
    deck.addEventListener("touchend", function (e) {
      if (!tracking) return; tracking = false;
      var t = e.changedTouches[0];
      var next = resolveSwipe(t.clientX - tsx, t.clientY - tsy, Date.now() - tst, cur, N);
      if (next !== null && next !== cur) { tapHaptic(); selectDay(next, { reason: "swipe" }); }
    }, { passive: true });
  }

  /* Initial day: today during the trip (guide-ui marks .day-today), else the remembered
     day, else the first. A deep link into a specific day wins over all of these. */
  var start = 0;
  var today = dayEls.findIndex(function (el) { return el.classList.contains("day-today"); });
  if (today >= 0) start = today;
  else { try { var s = parseInt(localStorage.getItem(KEY), 10); if (!isNaN(s) && s >= 0 && s < N) start = s; } catch (_) {} }
  var hashDay = location.hash && /^#day-(\d+)$/.exec(location.hash);
  if (hashDay) start = parseInt(hashDay[1], 10);
  selectDay(start, { force: true, silent: true, reason: "init" });

  doc.addEventListener("tg:reveal", function (e) {
    var t = e.detail && e.detail.target;
    var day = t && t.closest && t.closest(".day[data-day]");
    if (day) selectDay(parseInt(day.getAttribute("data-day"), 10), { reason: "hash", silent: true });
  });

  return { selectDay: selectDay, current: function () { return cur; } };
}
