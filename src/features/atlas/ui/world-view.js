// World view controller (board 01; design-system.md §12) — mounts <atlas-map>, wires the globe
// controls, the pin chips, the coordinate readout, the phone's FAB menu and ping sheet, and the
// toast. Progressive enhancement over the list (D4): nothing here runs until this module is
// imported and a guide feed exists. The desktop floating pin CARDS and their collision solver
// were retired with the frame (§33): the chip over each pin names the trip at every width, and
// the destinations panel beside the globe carries cover, status and the way in.

import "./atlas-map.js";
import { localClockLabel } from "../model/local-time";
import { attachSheetDrag } from "../../../scripts/sheet-drag.js";
import { esc as escapeHtml, reducedMotion, reencodeUrl } from "../../../scripts/util.js";
import { atWidth, srcsetFor } from "../../../lib/img-width";

// Live-checked, not cached (D5): a phone rotated to landscape, or a resized preview window,
// must not get stuck on whichever branch was true at page load.
const isMobile = () => matchMedia("(max-width: 759px)").matches;


export function initAtlasWorld(root = document) {
  const host = root.querySelector("[data-atlas-globe]");
  const dataEl = root.querySelector("[data-atlas-guides-json]");
  if (!host || !dataEl) return;

  let guides;
  try { guides = JSON.parse(dataEl.textContent || "[]"); } catch { guides = []; }
  if (!guides.length) return;

  const base = (document.body.dataset.base || "").replace(/\/$/, "");
  /* Everything read back out of the page — the guides JSON block included — is treated as
     text a stranger could have written (CodeQL js/xss-through-dom), so nothing from it reaches
     an href, src or innerHTML as a raw string. A guide's page IS base/guides/<slug>/, so the
     link is rebuilt from the encoded slug rather than trusted; an image URL goes through
     util.js's reencodeUrl. */
  const guideHref = (guide) => `${base}/guides/${encodeURIComponent(String(guide.slug || ""))}/`;
  const map = document.createElement("atlas-map");
  host.querySelector("[data-atlas-map-slot]")?.appendChild(map);
  map.guides = guides.map((guide) => ({
    slug: guide.slug, name: guide.name, countryId: guide.countryId, anchor: guide.anchor, origin: guide.origin,
    surveyed: guide.status === "past" || guide.status === "ongoing",
  }));

  const pinsLayer = host.querySelector("[data-atlas-pins]");
  const toast = root.querySelector("[data-atlas-toast]");
  const coordEl = root.querySelector("[data-atlas-coord]");
  const reduced = reducedMotion();

  /* ── Selection, and coming back to it ────────────────────────────────────────────────
     The atlas-mobile-home bundle asks for two things the hub had no notion of: picking a pin
     marks its row in the list (§1 "Selected row border"), and leaving for a guide and pressing
     Back returns "with scroll position AND selection state intact" (§2).

     Back is normally the browser's job, and where the browser does it — bfcache restores the
     whole page, DOM and scroll together — this code deliberately does nothing. It exists for
     the other path: a real reload, where scroll restoration brings the offset back but the
     selection, which only ever lived in JS, is gone. sessionStorage, so it is per-tab and
     never outlives the visit. */
  const HOME_STATE = "tg-atlas-home";
  const rowOf = (slug) => (slug ? root.querySelector(`.atlas-sheet[data-sheet-slug="${slug}"]`) : null);

  function markSelected(slug) {
    root.querySelectorAll(".atlas-sheet[data-selected]").forEach((el) => el.removeAttribute("data-selected"));
    rowOf(slug)?.setAttribute("data-selected", "");
    saveHomeState(slug);
  }

  /* Row top minus 90px (the bundle's own offset) — enough that the row clears the sticky
     header and the list's section label instead of hiding behind them. */
  function scrollToRow(slug) {
    const row = rowOf(slug);
    if (!row) return;
    const top = row.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
  }

  let savedSlug = null;
  function saveHomeState(slug) {
    savedSlug = slug || null;
    try {
      sessionStorage.setItem(HOME_STATE, JSON.stringify({ slug: savedSlug, y: Math.round(window.scrollY) }));
    } catch { /* private mode or quota — the visit simply doesn't remember */ }
  }
  // The offset that matters is the one at the moment of LEAVING, not the one when the pin was
  // tapped; a reader picks a sheet and then keeps scrolling before opening it.
  window.addEventListener("pagehide", () => saveHomeState(savedSlug));

  function restoreHomeState() {
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(HOME_STATE) || "null"); } catch { return; }
    if (!saved) return;
    if (saved.slug && guides.some((guide) => guide.slug === saved.slug)) {
      savedSlug = saved.slug;
      rowOf(saved.slug)?.setAttribute("data-selected", "");
      map.focus(saved.slug);
    }
    // Only when the browser has NOT already restored it. Its own restoration wins — writing a
    // second offset on top produces the visible double-jump this is supposed to prevent.
    if (saved.y > 0 && window.scrollY < 4) window.scrollTo(0, saved.y);
  }
  window.addEventListener("pageshow", (ev) => { if (!ev.persisted) restoreHomeState(); });

  /* One pick, four consequences — the halo on the globe, the mark on the row, the sheet, and
     the list scrolling to where the row is. Every mobile entry point (the pin, its chip, the
     canvas hit test) goes through here so none of them can drift into doing three of the four.
     `map.focus` is what holds the spin; see its own note. */
  function pickGuide(guide) {
    map.focus(guide.slug);
    markSelected(guide.slug);
    showPingSheet(guide);
    scrollToRow(guide.slug);
  }

  /* Tapping a ROW is the ordinary way into a guide — the globe is the scenic one — so it has to
     record the selection too, or Back from the most common exit is the one that forgets. */
  root.querySelectorAll(".atlas-sheet[data-sheet-slug]").forEach((row) => {
    row.addEventListener("click", () => saveHomeState(row.dataset.sheetSlug));
  });

  // ── Zoom / fit / spin controls ───────────────────────────────────────────────────────
  root.querySelector("[data-atlas-zoom-in]")?.addEventListener("click", () => map.zoomBy?.(1.35));
  root.querySelector("[data-atlas-zoom-out]")?.addEventListener("click", () => map.zoomBy?.(1 / 1.35));
  root.querySelector("[data-atlas-fit]")?.addEventListener("click", () => map.resetView?.());
  const spinBtn = root.querySelector("[data-atlas-spin]");
  const spinLabel = root.querySelector("[data-atlas-spin-label]");
  spinBtn?.addEventListener("click", () => {
    const spinning = map.toggleSpin?.();
    if (spinLabel) spinLabel.textContent = spinning ? "Pause" : "Spin on";
  });

  // ── Mobile FAB map menu (README "Mobile", D5) — the same actions the desktop rail
  // exposes (fly to a sheet, fit world, pause spin, tools, ＋ new guide), relocated into a
  // ☰ button since there's no room for a side rail on a phone. Built unconditionally (cheap,
  // static markup); CSS keeps it display:none above 759px so it's inert on desktop. ─────────
  const fab = root.querySelector("[data-atlas-menufab]");
  const menuScrim = root.querySelector("[data-atlas-menuscrim]");
  const menuSheet = root.querySelector("[data-atlas-menusheet]");
  const flySlot = root.querySelector("[data-atlas-menusheet-fly]");
  if (flySlot) {
    flySlot.innerHTML = guides
      .map((guide) => `<button type="button" data-fly="${escapeHtml(guide.slug)}">${guide.ordinal != null ? escapeHtml(String(guide.ordinal).padStart(2, "0")) : "—"} · ${escapeHtml(guide.name)}</button>`)
      .join("");
    flySlot.querySelectorAll("[data-fly]").forEach((btn) => {
      btn.addEventListener("click", () => { map.flyTo(btn.dataset.fly, reduced ? 0 : 1100); closeMenu(); });
    });
  }
  /* The dock (a floating readout under the globe) was retired in the D7 convergence: the
     quick card and the ping sheet already carry the featured trip. Kept as a no-op so the
     menu/ping owners below need no restructuring. */
  function standDownDock() { /* the dock was retired with the D7 convergence; the ping sheet and menu own the bottom edge */ }

  function setMenu(open) {
    if (!fab || !menuScrim || !menuSheet) return;
    fab.setAttribute("aria-expanded", String(open));
    fab.textContent = open ? "✕" : "☰";
    menuScrim.hidden = !open;
    menuSheet.hidden = !open;
    standDownDock(open, "menu");
  }
  const closeMenu = () => setMenu(false);
  fab?.addEventListener("click", () => setMenu(menuSheet?.hidden !== false));
  menuScrim?.addEventListener("click", closeMenu);
  root.querySelector("[data-atlas-menu-fit]")?.addEventListener("click", () => { map.resetView?.(); closeMenu(); });
  const menuSpinBtn = root.querySelector("[data-atlas-menu-spin]");
  menuSpinBtn?.addEventListener("click", () => {
    const spinning = map.toggleSpin?.();
    menuSpinBtn.textContent = spinning ? "Pause" : "Spin on";
  });

  // ── Ping sheet (README "Mobile", D5) — mobile's replacement for the desktop pincard: a
  // bottom sheet with the trip, a ZOOM control, and "Open the sheet". ─────────────────────
  const pingSheet = root.querySelector("[data-atlas-pingsheet]");
  const pingKicker = root.querySelector("[data-atlas-pingsheet-kicker]");
  const pingTitle = root.querySelector("[data-atlas-pingsheet-title]");
  const pingMeta = root.querySelector("[data-atlas-pingsheet-meta]");
  const pingOpen = root.querySelector("[data-atlas-pingsheet-open]");
  const pingThumb = root.querySelector("[data-atlas-pingsheet-thumb]");
  const STATUS_LABEL_PING = { past: "SURVEYED", ongoing: "ON THIS TRIP NOW", upcoming: "FILED", undated: "" };
  function showPingSheet(guide) {
    if (!pingSheet) { window.location.href = guideHref(guide); return; }
    if (pingKicker) pingKicker.textContent = `${guide.cc || ""} · ${guide.ordinal != null ? String(guide.ordinal).padStart(2, "0") : "—"}`;
    if (pingTitle) pingTitle.textContent = guide.name;
    if (pingMeta) pingMeta.textContent = [STATUS_LABEL_PING[guide.status], guide.tz ? localClockLabel(guide.tz, new Date()) : null].filter(Boolean).join(" · ");
    if (pingOpen) pingOpen.href = guideHref(guide);
    /* The cover, at the size it is actually drawn. atWidth/srcsetFor are the same helpers the
       table rows use, so a Commons file is requested resized rather than pulled full-size — a
       64px thumbnail must not fetch a 258 KB original. No cover means no frame at all: an
       honest blank beats a grey placeholder pretending to be a photo. */
    if (pingThumb) {
      const src = reencodeUrl(atWidth(guide.coverImg, 64));
      pingThumb.hidden = !src;
      if (src) {
        pingThumb.src = src;
        const ss = srcsetFor(guide.coverImg, 64);
        if (ss) pingThumb.srcset = ss; else pingThumb.removeAttribute("srcset");
      }
    }
    pingSheet.dataset.slug = guide.slug;
    pingSheet.hidden = false;
    // A pin chip is painted above the menu scrim (.atlas-pins z-index 5 vs 4), so it stays
    // tappable with the menu open and could raise this sheet on top of it. One bottom surface
    // at a time.
    if (menuSheet && menuSheet.hidden === false) setMenu(false);
    standDownDock(true, "ping");
  }
  function closePingSheet() {
    if (pingSheet) pingSheet.hidden = true;
    standDownDock(false, "ping");
    /* Give the world back. `flyTo` leaves the globe zoomed to 2.1R with `_target` still set on
       the guide it flew to, and its 2600ms hold only releases the SPIN — so dismissing the
       sheet left a globe rotating in close-up around a country nobody had selected any more,
       with no way back except finding the FIT control (creator, 2026-08-09: "the globe doesn't
       re-orient itself and continue spinning").
       `resetView()` is the existing, correct answer — it restores the scale, clears the target
       and drops the hold — it simply had no caller on this path. Selection sets the view, so
       clearing the selection clears it. */
    map.resetView?.();
  }
  root.querySelector("[data-atlas-pingsheet-close]")?.addEventListener("click", closePingSheet);
  // The grip drew a drag handle and nothing listened to it (creator, 2026-08-09: "there's a
  // visual cue to swipe downwards ... this does nothing"). A control that looks draggable
  // and is not is worse than no control. Same shared implementation the guide's groups
  // sheet and the SOS sheet already use, so all three dismiss with the same thresholds.
  if (pingSheet) attachSheetDrag(pingSheet, closePingSheet);
  root.querySelector("[data-atlas-pingsheet-zoom]")?.addEventListener("click", () => {
    const slug = pingSheet?.dataset.slug;
    if (slug) map.flyTo(slug, reduced ? 0 : 1100);
  });

  // ── atlas-select: navigate (desktop) or raise the ping sheet (mobile) — README "Clicking a
  // pin: desktop opens that guide directly; mobile raises a bottom sheet first" — or toast for
  // a no-guide country/ocean click. ────────────────────────────────────────────────────────
  let toastTimer = null;
  /* A pin, or its chip: the phone raises the ping sheet first; the desktop opens the guide
     directly, recording the selection so Back restores it. */
  function selectGuide(guide) {
    if (isMobile()) { pickGuide(guide); return; }
    markSelected(guide.slug);
    window.location.href = guideHref(guide);
  }
  map.addEventListener("atlas-select", (ev) => {
    const { slug } = ev.detail || {};
    const guide = guides.find((entry) => entry.slug === slug);
    if (guide) { selectGuide(guide); return; }
    markSelected(null);
    if (!toast) return;
    toast.innerHTML = `No guide here yet. <a href="${base}/new/">Start one →</a>`;
    toast.toggleAttribute("data-open", true);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.removeAttribute("data-open"), 4000);
  });

  // ── atlas-pos: coordinate readout + the pin chips ────────────────────────────────────
  const byIndex = new Map(guides.map((guide) => [guide.slug, guide]));

  /* ── Pin chips: a status dot and the trip's name over its pin, at every width. Positioned
     in the atlas-pos handler on every frame — one transform write per guide — so a label
     never swims behind its own pin while the globe spins. Two chips that want the same patch
     of sky: the one nearer the middle of the globe keeps it, the other hides (an overlap is
     unreadable and its contrast unverifiable). */
  const CHIP_FADE_FROM = 0.68; // fraction of the globe's radius where a chip starts fading
  const CHIP_LIFT = 12;        // px the chip sits above its pin — matches the CSS margin
  const chipEls = new Map();
  const CHIP_STATUS = { ongoing: "on this trip now", upcoming: "filed, not travelled yet", past: "surveyed", undated: "guide filed" };

  function ensureChip(slug) {
    if (chipEls.has(slug)) return chipEls.get(slug);
    const guide = byIndex.get(slug);
    if (!guide) return null;
    // A button, not a link: the chip does exactly what tapping its own pin does — the ping
    // sheet on a phone, the guide on a desktop (selectGuide).
    const el = document.createElement("button");
    el.type = "button";
    el.className = "atlas-pinchip";
    el.setAttribute("data-status", guide.status || "undated");
    el.innerHTML = `<span class="atlas-pinchip-dot" aria-hidden="true"></span><span class="atlas-pinchip-name">${escapeHtml(guide.name)}</span>`;
    // Every status has its own word. This used to test only for "now", so a past trip and an
    // upcoming one both announced "guide filed" while the ping sheet called the same trip
    // SURVEYED — two surfaces describing one fact differently.
    el.setAttribute("aria-label", `${guide.name} — ${CHIP_STATUS[guide.status] || CHIP_STATUS.undated}. Open details.`);
    el.setAttribute("data-slug", slug);
    el.addEventListener("click", () => selectGuide(guide));
    pinsLayer.appendChild(el);
    chipEls.set(slug, el);
    return el;
  }

  function placeChips(pos) {
    const R = Math.min(pos.w, pos.h) / 2 || 1;

    // Frontmost first, so when two labels want the same patch of sky the one nearer the
    // middle of the globe keeps it. Two overlapping labels are unreadable AND make the rear
    // one's contrast unverifiable — the a11y gate caught that before any eye did.
    const wanted = [];
    for (const guide of guides) {
      const pin = pos[guide.slug];
      const el = ensureChip(guide.slug);
      if (!el) continue;
      if (!pin || !pin.v) { el.removeAttribute("data-on"); el.style.opacity = "0"; continue; }
      // Fade toward the limb, so a label never floats over the globe's own edge with
      // nothing under it.
      const dist = Math.hypot(pin.x - pos.w / 2, pin.y - pos.h / 2) / R;
      const fade = dist <= CHIP_FADE_FROM ? 1 : Math.max(0, 1 - (dist - CHIP_FADE_FROM) / (1 - CHIP_FADE_FROM));
      // The centring lives HERE, not in the stylesheet: this line rewrites `transform`
      // every frame, so a `translate(-50%,-100%)` written in CSS would be erased on the
      // first pos event. Anchor = the pin's own point; the chip sits centred just above it.
      el.style.transform = `translate3d(${pin.x}px, ${pin.y}px, 0) translate(-50%, -100%)`;
      wanted.push({ el, x: pin.x, y: pin.y, fade, dist });
    }
    wanted.sort((a, b) => a.dist - b.dist);

    const placed = [];
    for (const chip of wanted) {
      // offsetWidth, not getBoundingClientRect: the element carries a live transform, and
      // the layout box is what collides here, not the painted one.
      const w = chip.el.offsetWidth || 90, h = chip.el.offsetHeight || 22;
      const box = { l: chip.x - w / 2, r: chip.x + w / 2, t: chip.y - h - CHIP_LIFT, b: chip.y - CHIP_LIFT };
      const clash = placed.some((other) => box.l < other.r && box.r > other.l && box.t < other.b && box.b > other.t);
      const opacity = clash ? 0 : chip.fade;
      chip.el.style.opacity = String(opacity);
      chip.el.toggleAttribute("data-on", opacity > 0.06);
      if (!clash) placed.push(box);
    }
  }

  map.addEventListener("atlas-pos", (ev) => {
    const pos = ev.detail;
    if (coordEl) {
      const lat = pos.center[1], lng = pos.center[0];
      coordEl.textContent = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? "E" : "W"}`;
    }
    placeChips(pos);
  });
}
