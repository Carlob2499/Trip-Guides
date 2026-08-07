/* Waypoint cold-visitor framing — a shared-link recipient lands on a rich guide
   page with zero context about what Waypoint is. First visit only (per browser),
   a one-line dismissible strip explains it; dismissing (or seeing it once on any
   guide) persists. Server-rendered hidden and revealed here — JS-off visitors
   simply never see it (framing is optional; content never depends on it). */

(function () {
  var strip = document.getElementById("coldOpen");
  if (!strip) return;
  var KEY = "tg-whatis";
  try { if (localStorage.getItem(KEY)) return; } catch (e) { return; }
  // M4 item 4 — ONE onboarding device per view (MOTION.md: "spend the boldness in one place").
  // This strip claims visit 1; onboard.js's nav-hint defers to it via __onboardShown below.
  strip.hidden = false;
  // Claim this view so onboard.js's nav-hint defers to the next one.
  window.__onboardShown = true;
  var btn = strip.querySelector(".cold-open-x");
  function dismiss() {
    strip.hidden = true;
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
  }
  if (btn) btn.addEventListener("click", dismiss);
  // Seeing it once counts — don't nag on every guide.
  try { localStorage.setItem(KEY, "1"); } catch (e) {}
})();
