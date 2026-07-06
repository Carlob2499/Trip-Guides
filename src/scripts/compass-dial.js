/* Waypoint compass dial — the guide's signature navigator (desktop ≥900px).
   A compass FAB in the bottom-right corner; pressing it fans the guide's
   sections out in an arc of numbered bearing chips that fly from the needle
   like blades — hover pulls one forward, click flies to that section (through
   the real tab buttons, so all existing navigation state holds). Mobile keeps
   the bottom-bar sheet, which is already the right device there.
   Accessible: real <button>s, aria-expanded, Escape/outside-click close,
   focus moves in on open and returns to the FAB on close. Reduced motion:
   chips appear in place, no flight. */

(function () {
  var tabs = document.getElementById("guideTabs");
  if (!tabs) return;
  var gtabs = Array.prototype.slice.call(tabs.querySelectorAll(".gtab"));
  if (gtabs.length < 2) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Build the DOM ─────────────────────────────────────────────────────── */
  var root = document.createElement("div");
  root.className = "dial-root";
  var fab = document.createElement("button");
  fab.type = "button";
  fab.className = "dial-fab";
  fab.setAttribute("aria-label", "Open section compass");
  fab.setAttribute("aria-expanded", "false");
  fab.setAttribute("aria-controls", "dialMenu");
  fab.innerHTML = '<span class="dial-needle" aria-hidden="true">✦</span>';
  var menu = document.createElement("div");
  menu.className = "dial-menu";
  menu.id = "dialMenu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Guide sections");
  root.appendChild(menu);
  root.appendChild(fab);
  document.body.appendChild(root);

  // One bearing chip per tab, fanned along an arc from "due north" of the FAB
  // sweeping to its west. Two alternating radii give the fan a blade layering.
  var chips = gtabs.map(function (t, i) {
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "dial-chip";
    chip.setAttribute("role", "menuitem");
    var num = /^\d+$/.test(t.getAttribute("data-tab")) ? String(i + 1).padStart(2, "0") : "·";
    chip.innerHTML = '<span class="dial-chip-num"></span><span class="dial-chip-label"></span>';
    chip.querySelector(".dial-chip-num").textContent = num;
    chip.querySelector(".dial-chip-label").textContent = t.textContent.trim();
    var n = gtabs.length;
    var a = (0.06 + 0.42 * (i / (n - 1))) * Math.PI; // 0.06π (near-up) → 0.48π (near-left)
    var R = (i % 2 === 0) ? 168 : 236;               // alternating radii = blade fan
    chip.style.setProperty("--dx", (-Math.sin(a) * R).toFixed(1) + "px");
    chip.style.setProperty("--dy", (-Math.cos(a) * R).toFixed(1) + "px");
    chip.style.setProperty("--dial-delay", (i * 26) + "ms");
    chip.addEventListener("click", function () {
      close();
      t.click(); // real navigation — state, flight direction, scroll all reuse it
    });
    menu.appendChild(chip);
    return chip;
  });

  /* ── Open / close ──────────────────────────────────────────────────────── */
  var open = false;
  function syncActive() {
    gtabs.forEach(function (t, i) {
      chips[i].classList.toggle("dial-chip-active", t.classList.contains("gtab-active"));
    });
  }
  function openDial() {
    if (open) return;
    open = true;
    syncActive();
    root.classList.add("dial-open");
    fab.setAttribute("aria-expanded", "true");
    var active = menu.querySelector(".dial-chip-active") || chips[0];
    setTimeout(function () { active.focus(); }, reduced ? 0 : 180);
  }
  function close() {
    if (!open) return;
    open = false;
    root.classList.remove("dial-open");
    fab.setAttribute("aria-expanded", "false");
    fab.focus();
  }
  fab.addEventListener("click", function () { open ? close() : openDial(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) { e.preventDefault(); close(); }
  });
  document.addEventListener("click", function (e) {
    if (open && !root.contains(e.target)) close();
  });
})();
