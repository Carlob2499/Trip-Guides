/* Waypoint command palette — Ctrl/Cmd+K (or "/") jump-to-anything.
   Indexes what's already in the DOM at open time (section groups, individual
   sections, itinerary days, sights) — no build-time index to go stale.
   Activation reuses the existing navigation: sheet/tab links are clicked, so
   tab switching, scroll offsets, and history behave exactly as they already
   do. aria-combobox semantics; focus returns to the invoking context on close. */

(function () {
  var UI_BUILT = false;
  var overlay, input, list, items = [], results = [], sel = 0, lastFocus = null;

  function buildUi() {
    if (UI_BUILT) return;
    UI_BUILT = true;
    overlay = document.createElement("div");
    overlay.className = "pal-backdrop";
    overlay.innerHTML =
      '<div class="pal" role="dialog" aria-modal="true" aria-label="Jump to a section">' +
      '<input class="pal-input" type="text" role="combobox" aria-expanded="true" ' +
      'aria-controls="palList" aria-autocomplete="list" placeholder="Jump to a section, day, or sight…" />' +
      '<ul class="pal-list" id="palList" role="listbox"></ul>' +
      '<p class="pal-hint">↑↓ navigate · Enter jump · Esc close</p></div>';
    document.body.appendChild(overlay);
    input = overlay.querySelector(".pal-input");
    list = overlay.querySelector(".pal-list");
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    input.addEventListener("input", render);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); go(results[sel]); }
      else if (e.key === "Escape") { e.preventDefault(); close(); }
    });
  }

  function textOf(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  // Rebuilt at every open — cheap (a few dozen nodes) and never stale.
  function buildIndex() {
    items = [];
    document.querySelectorAll(".gtab[data-tab]").forEach(function (t) {
      if (/^(split|vote)$/.test(t.getAttribute("data-tab"))) return;
      items.push({ label: textOf(t), kind: "Section", act: function () { t.click(); scrollTo(0, 0); } });
    });
    document.querySelectorAll(".sheet-link[data-tab]").forEach(function (a) {
      items.push({ label: textOf(a), kind: "Section", act: function () { a.click(); } });
    });
    document.querySelectorAll(".planner-days .day[data-day]").forEach(function (d) {
      var label = textOf(d.querySelector(".d")) + " — " + textOf(d.querySelector(".b strong"));
      items.push({ label: label, kind: "Day", act: makeJump(d) });
    });
    document.querySelectorAll(".sight").forEach(function (s) {
      var name = textOf(s.querySelector(".sight-name"));
      if (name) items.push({ label: name, kind: "Sight", act: makeJump(s) });
    });
  }

  // Activate the element's tab group, then scroll to it.
  function makeJump(el) {
    return function () {
      var cat = el.closest(".catblock");
      if (cat) {
        var tab = document.querySelector('.gtab[data-tab="' + cat.getAttribute("data-ci") + '"]');
        if (tab && tab.getAttribute("aria-selected") !== "true") tab.click();
      }
      setTimeout(function () {
        // Manual offset: block:start would park the target under the sticky chrome.
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 120);
        el.classList.add("pin-flash");
        setTimeout(function () { el.classList.remove("pin-flash"); }, 1800);
      }, 60);
    };
  }

  function render() {
    var q = input.value.trim().toLowerCase();
    results = items.filter(function (it) {
      return !q || it.label.toLowerCase().indexOf(q) !== -1;
    }).slice(0, 12);
    sel = 0;
    list.innerHTML = "";
    results.forEach(function (it, i) {
      var li = document.createElement("li");
      li.className = "pal-item" + (i === sel ? " pal-sel" : "");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", i === sel ? "true" : "false");
      li.innerHTML = '<span class="pal-kind"></span><span class="pal-label"></span>';
      li.querySelector(".pal-kind").textContent = it.kind;
      li.querySelector(".pal-label").textContent = it.label;
      li.addEventListener("click", function () { go(it); });
      li.addEventListener("mousemove", function () { setSel(i); });
      list.appendChild(li);
    });
    if (!results.length) {
      var empty = document.createElement("li");
      empty.className = "pal-empty";
      empty.textContent = "Nothing matches — try a shorter word.";
      list.appendChild(empty);
    }
  }

  function setSel(i) {
    sel = i;
    Array.prototype.forEach.call(list.children, function (li, j) {
      li.classList.toggle("pal-sel", j === i);
      li.setAttribute("aria-selected", j === i ? "true" : "false");
    });
  }
  function move(d) {
    if (!results.length) return;
    setSel((sel + d + results.length) % results.length);
    var li = list.children[sel];
    if (li && li.scrollIntoView) li.scrollIntoView({ block: "nearest" });
  }
  function go(it) { if (!it) return; close(); it.act(); }

  function open() {
    buildUi();
    buildIndex();
    lastFocus = document.activeElement;
    overlay.classList.add("pal-open");
    input.value = "";
    render();
    input.focus();
  }
  function close() {
    if (overlay) overlay.classList.remove("pal-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("keydown", function (e) {
    var inField = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || "")) || e.target.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      (overlay && overlay.classList.contains("pal-open")) ? close() : open();
    } else if (e.key === "/" && !inField && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      open();
    }
  });
})();
