/* Waypoint trip journal — a private notes box on every day card, saved on
   this device (localStorage), exportable as plain text from the Share modal.
   The plan becomes a keepsake: what you actually ate, what the queue was
   like, what to tell the next person. No accounts, no sync, no backend. */

(function () {
  var storeKey = document.body.getAttribute("data-storekey") || "guide";
  var KEY = "tg-journal-" + storeKey;
  var days = document.querySelectorAll(".planner-days .day[data-day]");
  if (!days.length) return;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(j) {
    try { localStorage.setItem(KEY, JSON.stringify(j)); } catch (e) {}
  }
  var journal = load();

  days.forEach(function (day) {
    var di = day.getAttribute("data-day");
    var body = day.querySelector(".b");
    if (!body) return;
    var det = document.createElement("details");
    det.className = "journal";
    if (journal[di]) det.open = true;
    det.innerHTML = '<summary class="journal-sum">✎ Journal</summary>' +
      '<textarea class="journal-ta" rows="3" placeholder="Notes from the day — meals, queues, wins…"></textarea>';
    var ta = det.querySelector(".journal-ta");
    ta.value = journal[di] || "";
    var t = null;
    ta.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        if (ta.value.trim()) journal[di] = ta.value;
        else delete journal[di];
        save(journal);
      }, 400);
    });
    body.appendChild(det);
  });

  /* Export as text from the Share modal. */
  var modal = document.getElementById("shareModal");
  if (modal) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "share-summary-btn";
    btn.textContent = "⇩ Download my trip journal (.txt)";
    btn.addEventListener("click", function () {
      var cur = load();
      var lines = ["Trip journal — " + document.title, ""];
      days.forEach(function (day) {
        var di = day.getAttribute("data-day");
        if (!cur[di]) return;
        var date = ((day.querySelector(".d") || {}).textContent || "Day " + di).replace(/^\s*\d+\s*/, "").trim();
        var title = (day.querySelector(".b strong") || {}).textContent || "";
        lines.push("== " + date + " — " + title + " ==", cur[di], "");
      });
      if (lines.length <= 2) { lines.push("(no entries yet)"); }
      var blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "journal-" + storeKey + ".txt";
      a.click();
      URL.revokeObjectURL(a.href);
    });
    modal.appendChild(btn);
  }
})();
