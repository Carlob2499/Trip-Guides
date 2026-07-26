/* Waypoint first-visit orientation — one dismissible strip under the tab bar
   teaching the three navigation gestures in one glance. Appears once per
   device (localStorage), never again after dismissal or first section change
   (using the nav proves the lesson landed). Content is device-appropriate:
   swipe on touch, tabs + Ctrl+K search on desktop. */

(function () {
  var KEY = "tg-nav-hint-done";
  try { if (localStorage.getItem(KEY)) return; } catch (e) { return; }
  // M4 item 4 — ONE onboarding device per view. The story intro owns visit 1 and the
  // cold-open framing claims the next eligible view; the navigation lesson is the least
  // urgent of the three and waits its turn. Crucially this does NOT mark the hint seen —
  // it will show on a later visit, unburned. (MOTION.md: "one idea per view".)
  if (window.__storyIntro || window.__onboardShown) return;
  var tabs = document.getElementById("guideTabs");
  if (!tabs) return;
  window.__onboardShown = true;

  var touch = window.matchMedia("(pointer: coarse)").matches ||
              window.matchMedia("(max-width: 899px)").matches;
  var strip = document.createElement("div");
  strip.className = "nav-hint";
  strip.setAttribute("role", "note");
  strip.innerHTML =
    '<span class="nav-hint-txt">' +
    (touch
      ? "Swipe ⇄ to move between sections · <b>Sections</b> below jumps anywhere"
      : "Tabs up top jump between sections · <b>Ctrl+K</b> searches the whole guide") +
    '</span><button class="nav-hint-x" type="button" aria-label="Dismiss navigation hint">✕</button>';
  tabs.insertAdjacentElement("afterend", strip);

  function done() {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    strip.classList.add("nav-hint-out");
    setTimeout(function () { strip.remove(); }, 400);
  }
  strip.querySelector(".nav-hint-x").addEventListener("click", done);
  // Using the navigation dismisses the lesson too.
  tabs.addEventListener("click", function onNav(e) {
    if (e.target.closest && e.target.closest(".gtab")) {
      tabs.removeEventListener("click", onNav);
      done();
    }
  });
})();
