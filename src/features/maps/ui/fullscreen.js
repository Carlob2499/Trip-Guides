/* Fullscreen button for the default OSM map embed. Self-boots on import, matching
   gmaps-render.js's convention in this silo — no explicit call needed from the layout.

   Runs synchronously at module-eval time (guide-ui.js imports this silo right after
   itself), wiring every `.osmmap` iframe present in the initial DOM. gmaps-render.js's
   Google upgrade is LAZY (IntersectionObserver-gated) and can fire minutes later, well
   after this has already run — see gmaps-render.js's own `init()`, which removes any
   `.map-fs-btn` this attaches when it swaps the iframe for a Google map (Google's map
   ships its own `fullscreenControl: true`, so a stale OSM button pointing at a removed,
   detached iframe would otherwise sit there doing nothing on click). */

var mounts = [];
document.querySelectorAll(".osmmap").forEach(function (frame) {
  var wrap = frame.parentElement;
  if (!wrap || !document.fullscreenEnabled) return;
  wrap.style.position = "relative";
  var btn = document.createElement("button");
  btn.className = "map-fs-btn";
  btn.setAttribute("aria-label", "View map fullscreen");
  btn.title = "Fullscreen";
  btn.textContent = "⤢";
  wrap.appendChild(btn);
  btn.addEventListener("click", function () {
    // Fullscreen the iframe itself so the .osmmap:fullscreen CSS applies and the map
    // fills the screen (wrap.requestFullscreen left it at the wrap's own size).
    if (frame.requestFullscreen) frame.requestFullscreen();
    else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen();
  });
  mounts.push({ frame: frame, btn: btn });
});

// One shared handler for all maps, not one per frame: each button reflects only
// ITS OWN frame's state. With a per-frame listener, fullscreening one map on a
// multi-map guide flipped every button to ✕ (they all read the single
// document.fullscreenElement). Now only the frame that's actually fullscreen shows ✕.
if (mounts.length) {
  document.addEventListener("fullscreenchange", function () {
    var fsEl = document.fullscreenElement;
    mounts.forEach(function (m) {
      m.btn.textContent = fsEl === m.frame ? "✕" : "⤢";
    });
  });
}
