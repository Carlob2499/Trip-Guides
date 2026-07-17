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

  // The modal + backdrop are authored inside .sticky-chrome, which carries a
  // backdrop-filter — and a filtered ancestor becomes the containing block for
  // position:fixed, so the modal anchored to the ~175px chrome instead of the
  // viewport and flew off-screen once the page was scrolled. Reparent both to
  // <body> (mirroring how the SOS sheet / command palette mount) so `fixed` is
  // viewport-relative and the modal centers correctly at any scroll position.
  if (shareModal.parentElement !== document.body) document.body.appendChild(shareModal);
  if (shareBackdrop && shareBackdrop.parentElement !== document.body) document.body.appendChild(shareBackdrop);

  var pageTitle = document.title;
  var qrLibLoaded = false;

  // The URL to share must point at the SECTION the reader is on — tabs switch without
  // changing the URL, so this is built fresh from the active tab every time it's
  // needed, never cached across calls.
  function currentPageUrl() {
    var base = window.location.href.split("#")[0];
    var active = document.querySelector(".gtab.gtab-active");
    var t = active && active.getAttribute("data-tab");
    return buildPageUrl(base, t);
  }

  function loadQRLib(cb) {
    if (qrLibLoaded || window.QRCode) { qrLibLoaded = true; cb(); return; }
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js";
    s.onload = function () { qrLibLoaded = true; cb(); };
    s.onerror = function () {
      // Offline or CDN failure — show a helpful message instead of an empty box
      if (shareQrEl) {
        shareQrEl.style.cssText = "display:flex;align-items:center;justify-content:center;height:80px;font-size:12px;color:var(--muted);text-align:center;padding:0 8px";
        shareQrEl.textContent = "QR unavailable offline — use Copy link";
      }
      cb();
    };
    document.head.appendChild(s);
  }

  function openShare() {
    // Always open the modal (on every device) so the QR, copy-link, social links,
    // file downloads (.gpx/.ics), and Share-summary action are all reachable. Native
    // OS share is offered by the Share-summary button.
    shareModal.removeAttribute("hidden");
    shareBackdrop.classList.add("open");
    lockScroll();
    var pageUrl = currentPageUrl(); // fresh each open — carries the section
    if (shareUrlTxt) shareUrlTxt.textContent = pageUrl;
    if (shareWALink) shareWALink.href = buildWhatsAppShareUrl(pageUrl);
    if (shareEmailLink) shareEmailLink.href = buildMailtoUrl(pageTitle, pageUrl);
    if (shareCopyBtn) shareCopyBtn.dataset.url = pageUrl;
    if (shareQrEl) {
      shareQrEl.innerHTML = ""; // regenerate — the section may have changed
      loadQRLib(function () {
        if (!window.QRCode) return;
        var dark = document.documentElement.getAttribute("data-theme") === "dark";
        try {
          new window.QRCode(shareQrEl, {
            text: pageUrl, width: 148, height: 148,
            colorDark: dark ? "#e5e9e0" : "#1a2028",
            colorLight: dark ? "#27211a" : "#ffffff",
            correctLevel: window.QRCode.CorrectLevel.M
          });
        } catch (e) { /* QR lib unavailable */ }
      });
    }
    shareBtn && shareBtn.setAttribute("aria-expanded", "true");
  }

  function closeShare() {
    shareModal.setAttribute("hidden", "");
    shareBackdrop.classList.remove("open");
    unlockScroll();
    shareBtn && shareBtn.setAttribute("aria-expanded", "false");
    shareBtn && shareBtn.focus();
  }

  shareBtn.addEventListener("click", openShare);
  if (shareCloseBtn) shareCloseBtn.addEventListener("click", closeShare);
  if (shareBackdrop) shareBackdrop.addEventListener("click", closeShare);

  // Share-summary — a brief theme + planned-days + key-spots digest. Native OS share
  // on devices that support it; clipboard copy (with a toast) otherwise. Standalone
  // button, reachable WITHOUT the share modal ever having been opened — so it must
  // never depend on state the modal's own open flow set up.
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
      var pageUrl = currentPageUrl(); // own computation — see file header
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
      var url = btn.dataset.url || currentPageUrl(); // section-specific
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
