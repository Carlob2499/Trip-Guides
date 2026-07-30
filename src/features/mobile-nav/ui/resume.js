/* Resume lines — the reason the Groups sheet is navigation rather than a link list.

   Every group the traveller has actually read carries a second line naming where they
   stopped ("you were at Late-night eats"), so choosing a group is choosing a PLACE,
   not a label. A group with nothing remembered gets no line at all: the honest blank
   is the feature (CLAUDE.md), and inventing a "start here" would make the sheet lie
   about a trip that hasn't happened yet.

   Where the reader stopped is recorded off the scroll-spy's own verdict — guide-ui
   dispatches `tg:section` on every spy change — so there is one spy, not two, and the
   memory is exactly what the reader saw highlighted. It has to be captured while the
   group is VISIBLE: a hidden `.catblock` measures as zero, so the title cannot be
   recovered later from a saved scroll offset alone. */

import { resumeLine } from "../model/rank";

var SEC_KEY = "tg-lastsec-";

function readMap(ctx) {
  try {
    var raw = ctx.store.read(SEC_KEY + ctx.storeKey);
    var o = raw ? JSON.parse(raw) : null;
    return o && typeof o === "object" && !Array.isArray(o) ? o : {};
  } catch (e) { return {}; }
}

/** Persist "the section this group was last read at", throttled to one write a second. */
export function initSectionMemory(ctx) {
  var last = 0, pending = null;
  function flush() {
    if (!pending) return;
    var map = readMap(ctx);
    map[pending.cat] = pending.title;
    // `_last` records WHICH group was most recently read — the resume chip needs to know
    // where to send you, not just what each group remembers. A leading underscore cannot
    // collide with the numeric group keys beside it.
    map._last = pending.cat;
    ctx.store.write(SEC_KEY + ctx.storeKey, JSON.stringify(map));
    pending = null;
    last = Date.now();
  }
  document.addEventListener("tg:section", function (e) {
    var d = (e && e.detail) || {};
    if (d.cat == null || !d.secId) return;
    var el = document.getElementById(d.secId);
    var head = el && el.querySelector(".block-title, h2, h3");
    var title = head ? (head.textContent || "").trim() : "";
    if (!title) return;
    pending = { cat: String(d.cat), title: title };
    if (Date.now() - last > 1000) flush();
  });
  // The reader leaving mid-section is exactly the case the resume line exists for,
  // so the throttle must not be allowed to swallow the last position.
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
  });
}

/** Paint the lines into the sheet each time it opens (memory changes while it's shut). */
export function initResume(ctx) {
  var sheet = document.querySelector(".sheet");
  var opener = document.getElementById("sheetOpen");
  if (!sheet || !opener) return;

  function paint() {
    var map = readMap(ctx);
    sheet.querySelectorAll(".sheet-cat[data-cat]").forEach(function (a) {
      var line = resumeLine(map[a.getAttribute("data-cat")]);
      var el = a.querySelector(".sheet-resume");
      if (!line) { if (el) el.remove(); return; }
      if (!el) {
        el = document.createElement("span");
        el.className = "sheet-resume";
        a.appendChild(el);
      }
      el.textContent = line;
    });
  }

  opener.addEventListener("click", paint);
  paint(); // so the first open is already correct even if the click order shifts
}

/**
 * The resume chip — offered on a FRESH arrival only.
 *
 * scroll-memory deliberately does NOT restore a mid-scroll position on a fresh
 * navigation (that was the "lopsided landing"), so a returning reader lands at the top
 * of the cover with no way back to where they were except hunting for it. This offers
 * the way back instead of taking it: a reload or back/forward already restores, so the
 * chip stays out of those; and with nothing remembered it never renders at all.
 */
export function initResumeChip(ctx) {
  var content = document.getElementById("content");
  if (!content || !content.parentNode) return;
  var nav = (performance.getEntriesByType && performance.getEntriesByType("navigation")[0]) || null;
  if (!nav || nav.type !== "navigate" || location.hash) return;

  var map = readMap(ctx);
  var cat = map._last;
  if (cat == null || !map[cat]) return;
  var idx = parseInt(cat, 10);
  var name = ctx.order[idx];
  if (isNaN(idx) || !name) return;

  var chip = document.createElement("button");
  chip.type = "button";
  chip.className = "resume-chip";
  chip.innerHTML =
    '<span class="resume-chip-lead">Continue where you left off</span>' +
    '<span class="resume-chip-dest"></span>';
  // textContent, not innerHTML: these strings come from the guide's own headings, but
  // they arrive here via localStorage, which anything on this origin can write.
  chip.querySelector(".resume-chip-dest").textContent = name + " — " + map[cat];
  chip.addEventListener("click", function () {
    var btn = ctx.tabs.querySelector('.gtab[data-tab="' + idx + '"]');
    if (btn) btn.click(); // scroll-memory's own click handler lands on the saved spot
    chip.remove();
  });
  content.parentNode.insertBefore(chip, content);
  // Taking the offer, or scrolling well past it, both answer the question. Armed a beat
  // LATE on purpose: several things scroll the page during load (a restored tab, the
  // jump-to-today, an anchor), and a chip dismissed by a scroll the reader never made is
  // an offer they were never shown.
  setTimeout(function () {
    window.addEventListener("scroll", function once() {
      if (window.scrollY > 900) { chip.remove(); window.removeEventListener("scroll", once); }
    }, { passive: true });
  }, 1200);
}
