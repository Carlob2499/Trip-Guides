/* Waypoint print day-sheets — a "⎙ Print this day" button on each day card.
   Marks the chosen day + its ancestor group, sets body[data-print-day], and
   calls window.print(); print-day.css scopes the sheet to that one day.
   afterprint (and a focus fallback) restores normal state. */

(function () {
  var days = document.querySelectorAll(".planner-days .day[data-day]");
  if (!days.length) return;

  function cleanup() {
    document.body.removeAttribute("data-print-day");
    document.querySelectorAll(".print-day").forEach(function (el) { el.classList.remove("print-day"); });
    document.querySelectorAll(".print-keep").forEach(function (el) { el.classList.remove("print-keep"); });
  }
  window.addEventListener("afterprint", cleanup);

  days.forEach(function (day) {
    var body = day.querySelector(".b");
    if (!body) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-print-btn";
    btn.textContent = "⎙ Print this day";
    btn.setAttribute("aria-label", "Print a one-page sheet for this day");
    btn.addEventListener("click", function () {
      cleanup();
      day.classList.add("print-day");
      // Mark the whole ancestor chain so the CSS can re-open exactly this path.
      var node = day.parentElement;
      while (node && node !== document.body) {
        node.classList.add("print-keep");
        if (node.classList.contains("catblock")) break;
        node = node.parentElement;
      }
      document.body.setAttribute("data-print-day", day.getAttribute("data-day"));
      window.print();
      // Some browsers skip afterprint on cancel — clear on next interaction too.
      setTimeout(function () {
        window.addEventListener("focus", cleanup, { once: true });
      }, 0);
    });
    body.appendChild(btn);
  });
})();
