/* Group Vote — DOM wiring for the #tripVote panel. Options + tally live in localStorage; the
   "Copy vote link" / QR share and the ?vote= hydrate use the tested base64url codec in
   ../model/vote-link.ts. Reuses the Budget Calculator's split / sc / se-new-card CSS. */

import { esc } from "../../../scripts/util.js";
import { decodeVote, encodeVote, isVoteState } from "../model/vote-link";

(function () {
  var wrap = document.getElementById("tripVote");
  if (!wrap) return;

  var SK = "tg-vote-" + (wrap.dataset.sk || "guide");
  var state = { options: [] }; // [{ text, votes }]

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(SK) || "null");
      if (isVoteState(s)) state.options = s.options;
    } catch (_) {}
  }
  function save() {
    try { localStorage.setItem(SK, JSON.stringify(state)); } catch (_) {}
  }

  function voteLinkUrl() {
    return window.location.origin + window.location.pathname + "?vote=" + encodeVote(state);
  }
  function hydrateFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("vote");
    if (!raw) return false;
    var s = decodeVote(raw);
    if (!s) return false;
    state.options = s.options;
    save();
    params.delete("vote");
    var qs = params.toString();
    history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
    return true;
  }

  function render() {
    var list = document.getElementById("voList");
    if (!list) return;
    if (!state.options.length) {
      list.innerHTML = "<p class='split-empty'>Add a couple of options to start voting.</p>";
      return;
    }
    var top = Math.max.apply(null, state.options.map(function (o) { return o.votes || 0; }));
    list.innerHTML = state.options.map(function (o, i) {
      var isLeader = top > 0 && (o.votes || 0) === top;
      return "<div class='vo-row" + (isLeader ? " vo-row--leader" : "") + "' data-oi='" + i + "'>" +
        "<span class='vo-text'>" + esc(o.text) + "</span>" +
        "<span class='vo-count'>" + (o.votes || 0) + "</span>" +
        "<button class='vo-btn' data-vote-i='" + i + "' aria-label='Vote for " + esc(o.text) + "'>+1</button>" +
        "<button class='split-del' data-del-o='" + i + "' aria-label='Remove option'>×</button>" +
        "</div>";
    }).join("");

    list.querySelectorAll("[data-vote-i]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = parseInt(this.dataset.voteI, 10);
        state.options[i].votes = (state.options[i].votes || 0) + 1;
        save(); render();
      });
    });
    list.querySelectorAll("[data-del-o]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.options.splice(parseInt(this.dataset.delO, 10), 1);
        save(); render();
      });
    });
  }

  var addBtn = document.getElementById("voAddOption");
  var textInp = document.getElementById("voNewText");
  if (addBtn && textInp) {
    addBtn.addEventListener("click", function () {
      var v = textInp.value.trim();
      if (!v) { textInp.focus(); return; }
      state.options.push({ text: v, votes: 0 });
      save(); render();
      textInp.value = "";
      textInp.focus();
    });
  }

  var resetBtn = document.getElementById("voReset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      state.options.forEach(function (o) { o.votes = 0; });
      save(); render();
    });
  }

  var syncBtn = document.getElementById("voSyncLink");
  if (syncBtn) {
    var syncBtnDefault = syncBtn.textContent;
    syncBtn.addEventListener("click", function () {
      var url = voteLinkUrl();
      function flash(ok) {
        syncBtn.textContent = ok ? "✓ Copied" : "Copy failed — select manually";
        setTimeout(function () { syncBtn.textContent = syncBtnDefault; }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { flash(true); }, function () { flash(false); });
      } else {
        flash(false);
      }
    });
  }

  // QR — vendored generator (npm `qrcode`, lazy import — shared chunk with the share panel).
  var qrBtn = document.getElementById("voQrBtn");
  var qrBox = document.getElementById("voQrBox");
  var qrEl = document.getElementById("voQrEl");
  function qrUnavailable() {
    if (!qrEl) return;
    qrEl.textContent = "QR unavailable — use Copy vote link instead";
    qrEl.style.cssText = "font-size:12px;color:var(--muted);text-align:center;padding:.5rem";
  }
  if (qrBtn && qrBox && qrEl) {
    qrBtn.addEventListener("click", function () {
      var opening = qrBox.hidden;
      qrBox.hidden = !opening;
      qrBtn.setAttribute("aria-expanded", String(opening));
      if (!opening) return;
      qrEl.style.cssText = "";
      qrEl.innerHTML = "";
      var canvas = document.createElement("canvas");
      qrEl.appendChild(canvas);
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      import("qrcode").then(function (mod) {
        var QR = mod && (mod.default || mod);
        QR.toCanvas(canvas, voteLinkUrl(), {
          width: 148, margin: 1, errorCorrectionLevel: "M",
          color: { dark: dark ? "#e5e9e0" : "#1a2028", light: dark ? "#27211a" : "#ffffff" },
        }, function (err) { if (err) qrUnavailable(); });
      }).catch(qrUnavailable);
    });
  }

  load();
  hydrateFromUrl();
  render();
})();
