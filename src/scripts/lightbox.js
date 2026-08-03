/* Waypoint lightbox — tap any venue photo to view it full-screen with its
   caption and Commons credit. Mobile-first (photos are small in the card
   grid; the detail is in the full image). Esc/backdrop/✕ close; focus is
   trapped inside the dialog (R3 — src/scripts/util.js's shared trapFocus;
   this claimed aria-modal + "focus is trapped" before without actually
   wiring a Tab-wrap, so Tab could walk out to the ✕ button, the Commons
   credit link, then straight out into the page behind it) and returned on exit. */

import { trapFocus } from "./util.js";

(function () {
  var box = null, lastFocus = null;
  function build() {
    if (box) return;
    box = document.createElement("div");
    box.className = "lb-backdrop";
    box.innerHTML =
      '<figure class="lb-fig" role="dialog" aria-modal="true" aria-label="Photo viewer">' +
      '<button class="lb-x" type="button" aria-label="Close photo">✕</button>' +
      '<img class="lb-img" alt="" />' +
      '<figcaption class="lb-cap"><span class="lb-alt"></span> <a class="lb-credit" target="_blank" rel="noopener"></a><span class="lb-credit-text"></span></figcaption>' +
      "</figure>";
    document.body.appendChild(box);
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.classList.contains("lb-x")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("lb-on")) close();
    });
    trapFocus(box, function () { return box.classList.contains("lb-on"); });
  }
  function close() {
    box.classList.remove("lb-on");
    document.body.classList.remove("sheet-lock");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function open(img) {
    build();
    lastFocus = document.activeElement;
    var full = img.currentSrc || img.src;
    // Ask for a bigger rendition than the card thumb. Commons' Special:FilePath and any
    // direct CDN that happens to use the same `width=` param both upsize; a CDN using a
    // different param simply keeps the card rendition rather than 404ing on a mangled URL.
    full = full.replace(/width=\d+/, "width=1600");
    box.querySelector(".lb-img").src = full;
    box.querySelector(".lb-img").alt = img.alt || "";
    box.querySelector(".lb-alt").textContent = img.alt || "";
    // Credit travels with the photo, whatever its source: Commons files link their File
    // page, direct-CDN photos carry their own schema-required credit — linked when a
    // creditUrl was given, plain text when it wasn't. Reading the rendered .imgcredit
    // keeps one source of truth; the old Commons-only href selector dropped attribution
    // for exactly the photos whose licence requires it.
    var fig = img.closest(".card, .sight, figure");
    var credit = fig && fig.querySelector(".imgcredit");
    var link = box.querySelector(".lb-credit");
    var plain = box.querySelector(".lb-credit-text");
    var label = credit ? credit.textContent.replace(/\s*↗\s*$/, "").trim() : "";
    link.hidden = plain.hidden = true;
    if (label && credit.href) { link.href = credit.href; link.textContent = label + " ↗"; link.hidden = false; }
    else if (label) { plain.textContent = label; plain.hidden = false; }
    box.classList.add("lb-on");
    document.body.classList.add("sheet-lock");
    box.querySelector(".lb-x").focus();
  }

  document.addEventListener("click", function (e) {
    var img = e.target.closest && e.target.closest(".sight--photo .cardimg");
    if (!img) return;
    // Don't hijack when the image failed (placeholder plate showing).
    if (img.closest(".media-fail")) return;
    e.preventDefault();
    open(img);
  });
})();
