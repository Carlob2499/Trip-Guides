/* Share panel — modal, QR, copy-link, WhatsApp/email links, and the standalone
   "Share trip summary" button. URL/text formatting lives in ../model/share-links.ts,
   tested there; this file is DOM wiring, clipboard, and the lazy QR script load.

   THE FIX THIS EXTRACTION CARRIES: the summary button's click handler used to reference
   `pageUrl`, a `var` declared inside the SIBLING function `openShare()` — function-scoped
   in JS, so it was simply undefined for any click that didn't follow opening the share
   modal first. Reproduced live: clicking "↗ Share trip summary" cold threw
   `ReferenceError: pageUrl is not defined` and did nothing. Fixed by giving the summary
   handler its own `currentPageUrl()` call, matching the pattern the copy-link button
   already used (`dataset.url || currentPageUrl()`) — every consumer of the current
   share URL now computes it fresh, none of them borrow another function's local. */

import { qrColors } from "../../../scripts/util.js";
import { buildPageUrl, buildWhatsAppShareUrl, buildMailtoUrl, buildSummaryShareText } from "../model/share-links";

export function initSharePanel(lockScroll, unlockScroll) {
  var shareBtn = document.getElementById("btnShare");
  var shareModal = document.getElementById("shareModal");
  var shareBackdrop = document.getElementById("shareBackdrop");
  var shareUrlTxt = document.getElementById("shareUrlTxt");
  var shareCopyBtn = document.getElementById("shareCopyBtn");
  var shareWALink = document.getElementById("shareWA");
  var shareEmailLink = document.getElementById("shareEmail");
  var shareCloseBtn = document.getElementById("shareClose");
  var shareQrEl = document.getElementById("shareQr");
  if (!shareBtn || !shareModal) return;

  if (shareModal.parentElement !== document.body) document.body.appendChild(shareModal);
  if (shareBackdrop && shareBackdrop.parentElement !== document.body) document.body.appendChild(shareBackdrop);

  var pageTitle = document.title;

  function currentPageUrl() {
    var base = window.location.href.split("#")[0];
    var active = document.querySelector(".gtab.gtab-active");
    var route = active && active.getAttribute("data-route");
    return buildPageUrl(base, route);
  }

  function qrUnavailable() {
    if (!shareQrEl) return;
    shareQrEl.style.cssText = "display:flex;align-items:center;justify-content:center;height:80px;font-size:12px;color:var(--muted);text-align:center;padding:0 8px";
    shareQrEl.textContent = "QR unavailable — use Copy link";
  }

  function renderQR(url) {
    if (!shareQrEl) return;
    shareQrEl.style.cssText = "";
    shareQrEl.innerHTML = "";
    var canvas = document.createElement("canvas");
    shareQrEl.appendChild(canvas);
    import("qrcode").then(function (mod) {
      var QR = mod && (mod.default || mod);
      QR.toCanvas(canvas, url, {
        width: 148, margin: 1, errorCorrectionLevel: "M",
        color: qrColors(),
      }, function (err) { if (err) qrUnavailable(); });
    }).catch(qrUnavailable);
  }

  function openShare() {
    shareModal.removeAttribute("hidden");
    shareBackdrop.classList.add("open");
    lockScroll();
    var pageUrl = currentPageUrl();
    if (shareUrlTxt) shareUrlTxt.textContent = pageUrl;
    if (shareWALink) shareWALink.href = buildWhatsAppShareUrl(pageUrl);
    if (shareEmailLink) shareEmailLink.href = buildMailtoUrl(pageTitle, pageUrl);
    if (shareCopyBtn) shareCopyBtn.dataset.url = pageUrl;
    renderQR(pageUrl);
    if (shareBtn) shareBtn.setAttribute("aria-expanded", "true");
  }

  function closeShare() {
    shareModal.setAttribute("hidden", "");
    shareBackdrop.classList.remove("open");
    unlockScroll();
    if (shareBtn) shareBtn.setAttribute("aria-expanded", "false");
    if (shareBtn) shareBtn.focus();
  }

  shareBtn.addEventListener("click", openShare);
  if (shareCloseBtn) shareCloseBtn.addEventListener("click", closeShare);
  if (shareBackdrop) shareBackdrop.addEventListener("click", closeShare);

  var summaryBtn = document.getElementById("btnShareSummary");
  var summaryEl = document.getElementById("tripSummary");
  if (summaryBtn && summaryEl) {
    function summaryToast(m) {
      var n = document.getElementById("savedNote"); if (!n) return;
      n.textContent = m; clearTimeout(n._t);
      n._t = setTimeout(function () { n.textContent = ""; }, 2200);
    }
    summaryBtn.addEventListener("click", function () {
      var text = (summaryEl.textContent || "").trim();
      var pageUrl = currentPageUrl();
      if (navigator.share) {
        navigator.share({ title: pageTitle, text: text, url: pageUrl }).catch(function () {});
        return;
      }
      var full = buildSummaryShareText(text, pageUrl);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(full)
          .then(function () { summaryToast("✓ Summary copied"); })
          .catch(function () { summaryToast("Copy failed — select the text manually"); });
      } else {
        summaryToast("Copy not supported here");
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !shareModal.hasAttribute("hidden")) closeShare();
  });

  if (shareCopyBtn) {
    shareCopyBtn.addEventListener("click", function () {
      var btn = shareCopyBtn;
      var url = btn.dataset.url || currentPageUrl();
      function flash() { btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = "Copy link"; }, 2200); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(flash).catch(function () { fallbackCopy(); });
      } else { fallbackCopy(); }
      function fallbackCopy() {
        var ta = document.createElement("textarea");
        ta.value = url;
        ta.style.cssText = "position:fixed;opacity:0;top:0;left:0;width:1px;height:1px";
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try { document.execCommand("copy"); flash(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  }
}
