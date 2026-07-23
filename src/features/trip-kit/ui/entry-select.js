/* Entry-requirements country picker (docs/FEATURES.md #7) — when a guide's entry[] carries
   more than one passport-country row, only one traveler's row is relevant at a time. The
   dropdown swaps which row is visible; a single-row guide never shows a dropdown at all
   (TripKit.astro only renders one when entry.length > 1). */

export function initEntrySelect() {
  var select = document.getElementById("tkEntrySelect");
  if (!select) return;
  var rows = document.querySelectorAll("[data-entry-idx]");
  if (!rows.length) return;

  function show(idx) {
    rows.forEach(function (row) {
      row.hidden = row.getAttribute("data-entry-idx") !== idx;
    });
  }

  select.addEventListener("change", function () {
    show(select.value);
  });
  show(select.value);
}
