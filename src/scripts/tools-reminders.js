import { parseStoredRecord } from "./util.js";

/* Reminder ticks on the Tools screen — per device, per trip.

   Small, single-mount client behaviour, so it stays in src/scripts/ rather than earning a
   silo (CLAUDE.md). The checkbox ids come from the item's own text (trip-tools' model), not
   its position, so re-ordering a guide's checklist does not silently un-tick what the
   traveller has already done.

   Progressive by construction: with JS off the boxes still render and still toggle for the
   session — they simply do not persist, which is the honest degradation for a convenience. */

var list = document.querySelector("[data-tools-reminders]");
if (list) {
  var KEY = "tg-toolsrem-" + list.getAttribute("data-tools-reminders");

  function read() {
    try { return parseStoredRecord(localStorage.getItem(KEY)); } catch (e) { return {}; }
  }
  function write(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  var state = read();
  var boxes = list.querySelectorAll(".tools-rem-box");

  boxes.forEach(function (box) {
    var id = box.getAttribute("data-rem-id");
    if (state[id]) {
      box.checked = true;
      box.closest(".tools-rem-row").classList.add("tools-rem-row--done");
    }
    box.addEventListener("change", function () {
      var s = read();
      // Delete rather than store `false`: an untouched trip's key should shrink back to {}
      // instead of accumulating a row per item the traveller once glanced at.
      if (this.checked) s[id] = 1; else delete s[id];
      write(s);
      this.closest(".tools-rem-row").classList.toggle("tools-rem-row--done", this.checked);
    });
  });
}
