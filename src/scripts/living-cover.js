// R4 living cover (docs/reference/visual-redesign.md Move A½; docs/reference/motion.md cover rules) —
// drives the masthead's optional footage layer. The contract is poster-first: the still
// cover is COMPLETE, and this module only ever adds motion on top for visitors whose
// context welcomes it. Every gate fails toward the still, silently:
//
//   · prefers-reduced-motion   → never attach a src, never play
//   · Save-Data                → never attach a src (a ~2–4 MB stream is exactly what
//                                 that preference is asking us not to spend)
//   · out of view              → pause (in-view again → resume, unless the visitor paused)
//   · tab hidden               → pause (compositor + battery courtesy)
//   · autoplay refused / error → the poster stands; a broken video element is removed
//
// The visible pause chip (#mastPause, GuideLayout markup) appears only once footage is
// actually playing — nobody sees a control for motion they never got. While the video is
// live, the credit chip swaps from the photo's credit to the footage's (data-video-credit,
// zod-required content) — one surface, always crediting what's actually on screen.
import { reducedMotion } from "./util.js";

(function () {
  var video = document.querySelector(".mast-video");
  if (!video || !video.dataset.src) return;
  if (reducedMotion()) return;
  var conn = navigator.connection;
  if (conn && conn.saveData) return;

  var frame = video.closest(".mast-frame");
  var btn = document.getElementById("mastPause");
  var credit = document.getElementById("mastCredit");
  var userPaused = false;
  var inView = true;
  var attached = false;

  function play() {
    if (!attached) {
      attached = true;
      // muted must be true as a PROPERTY too at play() time — some engines ignore the
      // attribute after src swaps, and an unmuted play() is refused everywhere.
      video.muted = true;
      video.src = video.dataset.src;
    }
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay refused → the poster stands */ });
  }

  video.addEventListener("playing", function () {
    if (frame) frame.classList.add("mast-video-live");
    if (btn) btn.hidden = false;
    if (credit && credit.dataset.videoCredit) {
      credit.textContent = credit.dataset.videoCredit + (credit.href ? " ↗" : "");
      if (credit.href && credit.dataset.videoCreditUrl) credit.href = credit.dataset.videoCreditUrl;
      credit.setAttribute("aria-label", credit.dataset.videoCredit + " — view source");
    }
  });

  video.addEventListener("error", function () {
    // A dead stream must not leave a black rect over the poster.
    if (frame) frame.classList.remove("mast-video-live");
    if (btn) btn.remove();
    video.remove();
  });

  if (btn) {
    btn.addEventListener("click", function () {
      userPaused = !userPaused;
      if (userPaused) video.pause();
      else play();
      btn.setAttribute("aria-pressed", String(userPaused));
      btn.setAttribute("aria-label", userPaused ? "Play background video" : "Pause background video");
      btn.classList.toggle("is-paused", userPaused);
    });
  }

  // Lazy start + scroll economy: footage loads when the masthead is (nearly) on screen,
  // pauses the moment it isn't. threshold 0 + a small rootMargin so the resume beats the
  // eye on the scroll back up.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        inView = entries[i].isIntersecting;
        if (inView && !userPaused && !document.hidden) play();
        else if (!inView) video.pause();
      }
    }, { rootMargin: "120px 0px" }).observe(video);
  } else {
    play();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) video.pause();
    else if (inView && !userPaused) play();
  });
})();
