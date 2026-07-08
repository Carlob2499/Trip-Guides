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
      'aria-controls="palList" aria-autocomplete="list" placeholder="Search this guide — sections, days, food, any keyword…" />' +
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
      items.push({ label: label, kind: "Day", hint: textOf(d.querySelector(".day-tldr")), search: textOf(d).toLowerCase(), act: makeJump(d) });
    });
    document.querySelectorAll(".sight").forEach(function (s) {
      var name = textOf(s.querySelector(".sight-name"));
      if (name) items.push({ label: name, kind: "Sight", hint: textOf(s.querySelector(".sight-body, p")).slice(0, 90), act: makeJump(s) });
    });
    // Full-text: every content card, so a keyword ("tax", "jimjilbang",
    // "KTX") jumps straight to the card that mentions it — the search the
    // guide was missing. Label = the card's heading; hint = a text preview;
    // both are matched against the query.
    document.querySelectorAll(".catblock .card, .catblock .block").forEach(function (c) {
      var full = textOf(c);
      if (!full) return;
      var title = textOf(c.querySelector(".block-title, .cat-title, strong, h3, h4"));
      items.push({
        label: title || full.slice(0, 60),
        kind: "In text",
        hint: full.slice(0, 130),
        search: full.toLowerCase(), // match against the WHOLE card, not a preview
        act: makeJump(c),
      });
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
    // Rank: section/day/sight matches on the label rank above in-text matches;
    // a keyword found only in body text still surfaces its card.
    var scored = [];
    items.forEach(function (it) {
      if (!q) { if (it.kind !== "In text") scored.push({ it: it, r: 1 }); return; }
      var inLabel = it.label.toLowerCase().indexOf(q) !== -1;
      var inText = it.search && it.search.indexOf(q) !== -1;
      if (inLabel) scored.push({ it: it, r: it.kind === "In text" ? 2 : 0 });
      else if (inText) scored.push({ it: it, r: 3 });
    });
    scored.sort(function (a, b) { return a.r - b.r; });
    results = scored.map(function (s) { return s.it; }).slice(0, 12);
    sel = 0;
    list.innerHTML = "";
    results.forEach(function (it, i) {
      var li = document.createElement("li");
      li.className = "pal-item" + (i === sel ? " pal-sel" : "");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", i === sel ? "true" : "false");
      li.innerHTML = '<span class="pal-kind"></span><span class="pal-body"><span class="pal-label"></span><span class="pal-hint"></span></span>';
      li.querySelector(".pal-kind").textContent = it.kind;
      li.querySelector(".pal-label").textContent = it.label;
      if (it.hint && q && it.label.toLowerCase().indexOf(q) === -1) li.querySelector(".pal-hint").textContent = it.hint;
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

  // Visible entry point: a Search button in the topbar chrome (many users
  // never discover Ctrl+K). Kept out of the .gtab tab set so the tab router,
  // keyboard nav and spine are untouched.
  var topRight = document.querySelector(".topbar-right");
  if (topRight) {
    var sb = document.createElement("button");
    sb.type = "button";
    sb.className = "topbar-btn topbar-search";
    sb.setAttribute("aria-label", "Search this guide");
    sb.innerHTML = "<svg class='tb-ico' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.1' stroke-linecap='round' aria-hidden='true'><circle cx='11' cy='11' r='7'/><path d='m20 20-3.6-3.6'/></svg><span class='tb-label'>Search</span>";
    sb.addEventListener("click", open);
    topRight.insertBefore(sb, topRight.firstChild);
  }
  document.addEventListener("tg:search", open);
})();
