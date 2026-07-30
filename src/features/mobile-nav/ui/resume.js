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
