/* Waypoint trip links panel — the honest static version of a document hub.
   User-added links (booking refs, tickets, reservations) stored per-guide in
   localStorage and shareable via the ?links= query param (same base64 pattern
   as TripSplit/Voting — query param, NOT location.hash, because guide-ui.js's
   tab router querySelector()s the hash). Links only; no files, no accounts. */

(function () {
  var modal = document.getElementById("shareModal");
  if (!modal) return;
  var storeKey = document.body.getAttribute("data-storekey") || "guide";
  var KEY = "tg-links-" + storeKey;

  function enc(str) { return btoa(unescape(encodeURIComponent(str))); }
  function dec(b64) { return decodeURIComponent(escape(atob(b64))); }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function save(links) {
    try { localStorage.setItem(KEY, JSON.stringify(links)); } catch (e) {}
  }

  /* ── Import links shared via ?links= (merge by URL, never overwrite) ────── */
  var params = new URLSearchParams(window.location.search);
  if (params.get("links")) {
    try {
      var incoming = JSON.parse(dec(params.get("links")));
      if (Array.isArray(incoming)) {
        var mine = load();
        var have = {};
        mine.forEach(function (l) { have[l.url] = true; });
        incoming.forEach(function (l) {
          if (l && typeof l.url === "string" && typeof l.label === "string" && !have[l.url]) {
            mine.push({ label: l.label.slice(0, 80), url: l.url.slice(0, 500) });
          }
        });
        save(mine);
      }
    } catch (e) {}
    params.delete("links");
    var qs = params.toString();
    history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
  }

  /* ── Panel inside the share modal ───────────────────────────────────────── */
  var panel = document.createElement("div");
  panel.className = "links-panel";
  panel.innerHTML =
    '<p class="links-head">Trip links</p>' +
    '<ul class="links-list"></ul>' +
    '<form class="links-form">' +
    '<input class="links-label" type="text" maxlength="80" placeholder="Label (e.g. KTX booking)" aria-label="Link label" required />' +
    '<input class="links-url" type="url" placeholder="https://…" aria-label="Link URL" required />' +
    '<button class="links-add" type="submit">Add</button></form>' +
    '<button class="links-share" type="button" hidden>Copy share link (includes your links)</button>';
  modal.appendChild(panel);

  var listEl = panel.querySelector(".links-list");
  var form = panel.querySelector(".links-form");
  var shareBtn = panel.querySelector(".links-share");

  function render() {
    var links = load();
    listEl.innerHTML = "";
    links.forEach(function (l, i) {
      var li = document.createElement("li");
      li.className = "links-item";
      var a = document.createElement("a");
      a.href = l.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.textContent = l.label;
      var rm = document.createElement("button");
      rm.type = "button"; rm.className = "links-rm";
      rm.setAttribute("aria-label", "Remove " + l.label);
      rm.textContent = "✕";
      rm.addEventListener("click", function () {
        var cur = load(); cur.splice(i, 1); save(cur); render();
      });
      li.appendChild(a); li.appendChild(rm);
      listEl.appendChild(li);
    });
    shareBtn.toggleAttribute("hidden", !links.length);
    listEl.toggleAttribute("hidden", !links.length);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var label = panel.querySelector(".links-label").value.trim();
    var url = panel.querySelector(".links-url").value.trim();
    if (!label || !url) return;
    var links = load();
    links.push({ label: label, url: url });
    save(links);
    form.reset();
    render();
  });

  shareBtn.addEventListener("click", function () {
    var url = window.location.origin + window.location.pathname + "?links=" + enc(JSON.stringify(load()));
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(
      function () { shareBtn.textContent = "Copied ✓"; setTimeout(function () { shareBtn.textContent = "Copy share link (includes your links)"; }, 1600); },
      function () { window.prompt("Copy this link:", url); }
    );
  });

  render();
})();
