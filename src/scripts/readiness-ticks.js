import { readStoredRecord } from "./util.js";
/* Readiness ticks on the Trip destination — per device, per trip.
   The checkbox ids come from the item's own text (features/trip's reminders model), not its
   position, so re-ordering a guide's checklist does not silently un-tick what the traveller
   has already done. Progressive by construction: with JS off the boxes still render and
   still toggle for the session — they simply do not persist. Each change announces itself
   (tg:readiness) so the "N still open" summary can follow it. */
document.querySelectorAll("[data-readiness]").forEach(function (block) {
  var KEY = "tg-readiness-" + block.getAttribute("data-readiness");
  var LEGACY = "tg-toolsrem-" + block.getAttribute("data-readiness");
  function read() {
    var cur = readStoredRecord(function () { return localStorage; }, KEY);
    if (Object.keys(cur).length) return cur;
    // The Tools station kept the same ids under its own key; a returning traveler's ticks
    // carry over once rather than being forgotten because the surface moved.
    var legacy = readStoredRecord(function () { return localStorage; }, LEGACY);
    return legacy;
  }
  function write(state) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } }
  var state = read();
  block.querySelectorAll("[data-rem-id]").forEach(function (box) {
    var id = box.getAttribute("data-rem-id");
    if (state[id]) { box.checked = true; box.closest(".tools-rem-row")?.classList.add("tools-rem-row--done"); }
    box.addEventListener("change", function () {
      if (box.checked) state[id] = 1; else delete state[id];
      box.closest(".tools-rem-row")?.classList.toggle("tools-rem-row--done", box.checked);
      write(state);
      try { document.dispatchEvent(new CustomEvent("tg:readiness")); } catch (_) {}
    });
  });
});
