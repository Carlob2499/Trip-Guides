/* Waypoint first-visit orientation — one dismissible strip under the tab bar
   teaching the three navigation gestures in one glance. Appears once per
   device (localStorage), never again after dismissal or first section change
   (using the nav proves the lesson landed). Content is device-appropriate:
   swipe on touch, tabs + Ctrl+K search on desktop. */

(function () {
  var KEY = "tg-nav-hint-done";
  try { if (localStorage.getItem(KEY)) return; } catch (e) { return; }
  var tabs = document.getElementById("guideTabs");
  if (!tabs) return;

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
