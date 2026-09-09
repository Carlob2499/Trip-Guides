/* Waypoint dark-mode toggle — ONE shared implementation (A2). Previously duplicated between
   guide-ui.js (SVG moon/sun icons + PWA theme-color sync) and index.astro's inline hub script
   (plain-text glyph, no theme-color sync) — two copies that could silently drift apart on
   behavior (and had: the hub's button never kept the PWA chrome tint in sync). Both surfaces
   now render identically and share the exact "tg-theme" localStorage key both copies already
   used, so a preference set on one page carries over to the other with no migration needed.

   Does NOT handle the pre-paint flash-avoidance init (the tiny `is:inline` snippet in each
   page's own <head> that reads localStorage before first paint) — that one genuinely can't be
   shared: it must run synchronously before any module import machinery loads, so each page
   keeps its own copy of that specific few lines. This only extracts the AFTER-load toggle
   button wiring, which has no such constraint. */

const THEME_KEY = "tg-theme";
const MOON_SVG = "<svg class='tb-ico theme-ico theme-ico--moon' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z'/></svg>";
const SUN_SVG = "<svg class='tb-ico theme-ico theme-ico--sun' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4'/></svg>";

/* Applying a theme flips --bg, --ink, --card, --rule, every shadow and every border at once.
   Around 130 transition declarations across 43 stylesheets are watching those properties, so
   without this the switch SMEARS: each control eases to its new colour on its own duration and
   curve, and for ~300ms the page is a gradient of half-swapped surfaces rather than a swap.
   Suppressing transitions for exactly one frame makes it snap.

   The reflow read between the attribute change and the removal is load-bearing, not a
   superstition: it forces the browser to commit the new colours WHILE the suppression sheet is
   still applied. Drop it and the style element is added and removed inside one task, the
   browser coalesces both, and nothing is ever suppressed.

   Exported because the gallery ships its own toggle (it flips data-theme directly to preview
   both registers side by side) and must not re-derive this. */
export function setTheme(next) {
  const root = document.documentElement;
  const damp = document.createElement("style");
  damp.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(damp);
  root.setAttribute("data-theme", next);
  void root.offsetHeight; // commit the repaint with transitions still off
  requestAnimationFrame(function () { damp.remove(); });
}

function isDark() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

/**
 * Wire a dark/light toggle button. Call once per page, after the button exists in the DOM.
 * `btnId` defaults to "btnDark" (both the hub and every guide page use that id).
 */
export function initDarkToggle(btnId) {
  const btn = document.getElementById(btnId || "btnDark");

  function sync() {
    const dark = isDark();
    // Keep the PWA / browser-chrome tint (address bar, iOS status bar) in sync with the real
    // theme. Reading computed --bg covers the manual toggle AND the OS-preference auto-dark
    // path, so it can never drift from the page.
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) {
      const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
      if (bg) tc.setAttribute("content", bg);
    }
    if (!btn) return;
    /* Both icons live in the DOM at once, stacked, and CSS decides which is visible from
       <html data-theme> — so the swap can CROSS-FADE (scale .25 -> 1, blur 4px -> 0) instead of
       cutting. The previous version rebuilt innerHTML on every toggle, which is why it could
       only ever be a hard cut: the outgoing icon was destroyed in the same frame the incoming
       one appeared, leaving nothing to animate out. Built once here, on first sync.

       The word rides along with the icon everywhere, and CSS decides who shows it — the hub's
       desktop header does (the design labels this button), every other surface keeps the icon
       alone. It names the mode you are switching TO, which is what the button does, and matches
       the aria-label below. */
    if (!btn.querySelector(".theme-ico-swap")) {
      btn.innerHTML =
        '<span class="theme-ico-swap">' + MOON_SVG + SUN_SVG + "</span>" +
        '<span class="theme-btn-label"></span>';
    }
    const label = btn.querySelector(".theme-btn-label");
    if (label) label.textContent = dark ? "Light" : "Dark";
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.title = dark ? "Switch to light mode" : "Switch to dark mode";
  }

  sync();
  if (btn) {
    btn.addEventListener("click", function () {
      const next = isDark() ? "light" : "dark";
      setTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode — setting fails silently, harmless */ }
      sync();
    });
  }
}
