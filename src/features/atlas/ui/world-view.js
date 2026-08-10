// World view controller (README §2, SPEC-COMPONENTS §8-9) — mounts <atlas-map>, wires its
// overlays (index rail, key, THE RECORD, zoom/fit/spin controls, motto, toast), and runs the
// pin-card collision solver against its atlas-pos stream. Progressive enhancement over the
// table view (D4): nothing here runs until this module is imported and a guide feed exists.

import "./atlas-map.js";
import { solvePlacement } from "../model/solver";
import { localClockLabel } from "../model/local-time";
import { attachSheetDrag } from "../../../scripts/sheet-drag.js";
import { atWidth, srcsetFor } from "../../../lib/img-width";

const CARD_W = 220;
/* The plate is 3:2 inside a 220px card — 220x146 — and `object-fit: cover` fills the SHORT
   axis. A cover wider than 3:2 (Nyhavn is 2.21:1) asked for at 220px comes back 220x100 and
   gets scaled UP to cover 146px of height, which is how a correctly-thumbnailed image still
   lands on screen soft. Asking at twice the card width clears the height for any cover this
   product is likely to carry, and is still an order of magnitude off the 258 KB original. */
const PLATE_W = CARD_W * 2;
const CARD_FULL_H = 140;
const CARD_COMPACT_H = 60;
const DRIFT_THRESHOLD = 90;

// Live-checked, not cached (D5): a phone rotated to landscape, or a resized preview window,
// must not get stuck on whichever branch was true at page load.
const isMobile = () => matchMedia("(max-width: 759px)").matches;

function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function initAtlasWorld(root = document) {
  const host = root.querySelector("[data-atlas-globe]");
  const dataEl = root.querySelector("[data-atlas-guides-json]");
  if (!host || !dataEl) return;

  let guides;
  try { guides = JSON.parse(dataEl.textContent || "[]"); } catch { guides = []; }
  if (!guides.length) return;

  const base = (document.body.dataset.base || "").replace(/\/$/, "");
  const map = document.createElement("atlas-map");
  host.querySelector("[data-atlas-map-slot]")?.appendChild(map);
  map.guides = guides.map((g) => ({
    slug: g.slug, name: g.name, countryId: g.countryId, anchor: g.anchor, origin: g.origin,
    surveyed: g.status === "past" || g.status === "ongoing",
  }));

  const pinsLayer = host.querySelector("[data-atlas-pins]");
  const toast = root.querySelector("[data-atlas-toast]");
  const coordEl = root.querySelector("[data-atlas-coord]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    let s = null;
    try { s = JSON.parse(sessionStorage.getItem(HOME_STATE) || "null"); } catch { return; }
    if (!s) return;
    if (s.slug && guides.some((g) => g.slug === s.slug)) {
      savedSlug = s.slug;
      rowOf(s.slug)?.setAttribute("data-selected", "");
      map.focus(s.slug);
    }
    // Only when the browser has NOT already restored it. Its own restoration wins — writing a
    // second offset on top produces the visible double-jump this is supposed to prevent.
    if (s.y > 0 && window.scrollY < 4) window.scrollTo(0, s.y);
  }
  window.addEventListener("pageshow", (ev) => { if (!ev.persisted) restoreHomeState(); });

  /* One pick, four consequences — the halo on the globe, the mark on the row, the sheet, and
     the list scrolling to where the row is. Every mobile entry point (the pin, its chip, the
     canvas hit test) goes through here so none of them can drift into doing three of the four.
     `map.focus` is what holds the spin; see its own note. */
  function pickGuide(g) {
    map.focus(g.slug);
    markSelected(g.slug);
    showPingSheet(g);
    scrollToRow(g.slug);
  }

  /* Tapping a ROW is the ordinary way into a guide — the globe is the scenic one — so it has to
     record the selection too, or Back from the most common exit is the one that forgets. */
  root.querySelectorAll(".atlas-sheet[data-sheet-slug]").forEach((row) => {
    row.addEventListener("click", () => saveHomeState(row.dataset.sheetSlug));
  });

  // ── Index rail + THE RECORD (README §2) ─────────────────────────────────────────────
  const indexList = root.querySelector("[data-atlas-index-list]");
  if (indexList) {
    indexList.innerHTML = guides
      .map((g) => `<li><button type="button" data-fly="${g.slug}">${g.ordinal != null ? String(g.ordinal).padStart(2, "0") : "—"} · ${escapeHtml(g.name)}</button></li>`)
      .join("");
  }
  const recordList = root.querySelector("[data-atlas-record-list]");
  if (recordList) {
    const STATUS_LABEL = { past: "COMPLETE", ongoing: "IN PROGRESS", upcoming: "PLANNED", undated: "" };
    recordList.innerHTML = guides
      .map((g) => `<li><button type="button" data-fly="${g.slug}" data-open="${g.href}"><span>${escapeHtml(g.name)}</span><span class="status">${STATUS_LABEL[g.status] || ""}</span></button></li>`)
      .join("");
  }
  root.querySelectorAll("[data-fly]").forEach((btn) => {
    btn.addEventListener("click", () => {
      map.flyTo(btn.dataset.fly, reduced ? 0 : 1100);
      const openHref = btn.dataset.open;
      if (openHref) setTimeout(() => { window.location.href = openHref; }, reduced ? 0 : 900);
    });
  });

  // ── Zoom / fit / spin controls ───────────────────────────────────────────────────────
  root.querySelector("[data-atlas-zoom-in]")?.addEventListener("click", () => map.zoomBy?.(1.35));
  root.querySelector("[data-atlas-zoom-out]")?.addEventListener("click", () => map.zoomBy?.(1 / 1.35));
  root.querySelector("[data-atlas-fit]")?.addEventListener("click", () => map.resetView?.());
  const spinBtn = root.querySelector("[data-atlas-spin]");
  spinBtn?.addEventListener("click", () => {
    const spinning = map.toggleSpin?.();
    spinBtn.textContent = spinning ? "PAUSE" : "SPIN ON";
  });

  // ── Motto dismiss (persisted) ────────────────────────────────────────────────────────
  const motto = root.querySelector("[data-atlas-motto]");
  const MOTTO_KEY = "tg-atlas-motto-dismissed";
  if (motto) {
    try { if (localStorage.getItem(MOTTO_KEY)) motto.hidden = true; } catch { /* storage unavailable */ }
    motto.querySelector("[data-atlas-motto-close]")?.addEventListener("click", () => {
      motto.hidden = true;
      try { localStorage.setItem(MOTTO_KEY, "1"); } catch { /* storage unavailable */ }
    });
  }

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
      .map((g) => `<button type="button" data-fly="${g.slug}">${g.ordinal != null ? String(g.ordinal).padStart(2, "0") : "—"} · ${escapeHtml(g.name)}</button>`)
      .join("");
    flySlot.querySelectorAll("[data-fly]").forEach((btn) => {
      btn.addEventListener("click", () => { map.flyTo(btn.dataset.fly, reduced ? 0 : 1100); closeMenu(); });
    });
  }
  /* ── The dock (creator, 2026-08-08) ─────────────────────────────────────────────────
     The globe's own readout: the featured trip's status, live local time, emergency
     numbers, currency and two actions — all server-rendered from the same `quick` row the
     table view uses, so nothing here is a second source of truth.

     It ships `hidden` and is unhidden here rather than by CSS, because without JS there is
     no globe to dock to: a no-JS phone gets the table view, where this data already lives.

     Collapsed/expanded persists per device. It stands DOWN whenever the menu or the ping
     sheet is up — three surfaces stacked on one thumb's worth of screen is the crowding
     the design doctrine names, not the information it asks for. */
  const dock = root.querySelector("[data-atlas-dock]");
  const dockToggle = root.querySelector("[data-atlas-dock-toggle]");
  const DOCK_KEY = "tg-atlas-dock";
  if (dock) {
    dock.hidden = false;
    let open = false;
    try { open = localStorage.getItem(DOCK_KEY) === "open"; } catch { /* private mode */ }
    const setDock = (o) => {
      dock.toggleAttribute("data-open", o);
      dockToggle?.setAttribute("aria-expanded", o ? "true" : "false");
      try { localStorage.setItem(DOCK_KEY, o ? "open" : "shut"); } catch { /* private mode */ }
    };
    setDock(open);
    dockToggle?.addEventListener("click", () => setDock(!dock.hasAttribute("data-open")));
  }
  /* Fold the dock away while another bottom surface owns the screen. Two independent owners
     (the menu and the ping sheet) share this, so it counts them rather than holding a boolean:
     with a boolean, closing the ping sheet while the menu was still open put the dock back
     underneath the menu. */
  const dockOwners = new Set();
  function standDownDock(down, owner) {
    if (down) dockOwners.add(owner); else dockOwners.delete(owner);
    dock?.toggleAttribute("data-stood-down", dockOwners.size > 0);
  }

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
  function showPingSheet(g) {
    if (!pingSheet) { window.location.href = g.href; return; }
    if (pingKicker) pingKicker.textContent = `${g.cc || ""} · ${g.ordinal != null ? String(g.ordinal).padStart(2, "0") : "—"}`;
    if (pingTitle) pingTitle.textContent = g.name;
    if (pingMeta) pingMeta.textContent = [STATUS_LABEL_PING[g.status], g.tz ? localClockLabel(g.tz, new Date()) : null].filter(Boolean).join(" · ");
    if (pingOpen) pingOpen.href = g.href;
    /* The cover, at the size it is actually drawn. atWidth/srcsetFor are the same helpers the
       table rows use, so a Commons file is requested resized rather than pulled full-size — a
       64px thumbnail must not fetch a 258 KB original. No cover means no frame at all: an
       honest blank beats a grey placeholder pretending to be a photo. */
    if (pingThumb) {
      const src = atWidth(g.coverImg, 64);
      pingThumb.hidden = !src;
      if (src) {
        pingThumb.src = src;
        const ss = srcsetFor(g.coverImg, 64);
        if (ss) pingThumb.srcset = ss; else pingThumb.removeAttribute("srcset");
      }
    }
    pingSheet.dataset.slug = g.slug;
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
  map.addEventListener("atlas-select", (ev) => {
    const { slug } = ev.detail || {};
    const g = guides.find((x) => x.slug === slug);
    if (g) {
      if (isMobile()) { pickGuide(g); return; }
      // Desktop opens the guide directly (README "Clicking a pin"), so the selection it
      // records is the one Back will restore.
      markSelected(slug);
      window.location.href = g.href;
      return;
    }
    markSelected(null);
    if (!toast) return;
    toast.innerHTML = `No guide here yet. <a href="${base}/new/">Start one →</a>`;
    toast.toggleAttribute("data-open", true);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.removeAttribute("data-open"), 4000);
  });

  // ── atlas-pos: coordinate readout, fade-zoom law, pin-card solve scheduling ──────────
  const byIndex = new Map(guides.map((g) => [g.slug, g]));
  const cardEls = new Map();
  let lastVisible = "";
  let lastSolveAt = { x: 0, y: 0 };
  let solveQueued = false;

  function fadeZoomFor(zoom) {
    const scale = Math.max(0.5, 1 - (zoom - 1) * 0.5);
    const opacity = Math.max(0, 1 - (zoom - 1) * 0.85);
    return { scale, opacity };
  }

  function applyFadeZoom(zoom) {
    const { scale, opacity } = fadeZoomFor(zoom);
    root.querySelectorAll("[data-ref-fadezoom]").forEach((el) => {
      el.style.transform = `scale(${scale})`;
      el.style.opacity = String(opacity);
      el.toggleAttribute("data-faded", opacity < 0.15);
    });
  }

  function ensureCard(slug) {
    if (cardEls.has(slug)) return cardEls.get(slug);
    const g = byIndex.get(slug);
    if (!g) return null;
    /* The plate is 220px wide and was being handed the ORIGINAL — Nyhavn is 1600x724 and 258 KB
       for a 218x145 box, measured 2026-08-10. The table rows and the ping sheet both already
       ask Commons for a thumbnail at the size they draw; this is the third surface using the
       same cover and the only one that never did. */
    const el = document.createElement("a");
    el.className = "atlas-pincard";
    el.href = g.href;
    el.style.width = `${CARD_W}px`;
    el.innerHTML = `
      <span class="atlas-pincard-tail"></span>
      ${g.coverImg ? `<img class="atlas-pincard-plate" src="${escapeHtml(atWidth(g.coverImg, PLATE_W))}"${srcsetFor(g.coverImg, PLATE_W) ? ` srcset="${escapeHtml(srcsetFor(g.coverImg, PLATE_W))}"` : ""} alt="" loading="lazy" style="view-transition-name:cover-${escapeHtml(g.slug)}" />` : ""}
      <span class="atlas-pincard-body">
        <span class="atlas-pincard-cc">${escapeHtml(g.cc || "")} · ${g.ordinal != null ? String(g.ordinal).padStart(2, "0") : "—"}</span>
        <span class="atlas-pincard-title">${escapeHtml(g.name)}</span>
        ${g.tz ? `<span class="atlas-pincard-clock" data-tick data-tz="${escapeHtml(g.tz)}">${escapeHtml(localClockLabel(g.tz, new Date()) || "—")}</span>` : ""}
        <span class="atlas-pincard-cta">Open the guide →</span>
      </span>`;
    pinsLayer.appendChild(el);
    cardEls.set(slug, el);
    return el;
  }

  /* ── Mobile pin chips (creator, 2026-08-08) ─────────────────────────────────────────
     The README's "no floating cards, no side rails" on mobile was read as "no labels at
     all", and the result was a globe of anonymous dots: nothing said a country HAD a guide
     until you tapped it. These are the desktop pincard scaled to a phone's budget — a
     status dot and the trip's name, no photo, no clock, no CTA — so which countries are
     surveyed is apparent at a glance, which is what the pins were for.

     They are positioned in the atlas-pos handler on every frame rather than in the solver,
     which is throttled by a drift threshold: a label that updates only every 90px would
     visibly swim behind its own pin while the globe spins. Positioning is one transform
     write per guide, which is cheap enough to do per frame.

     No collision solving. Four guides on a phone-sized globe rarely collide, and a solver
     that reflowed labels mid-spin would be more distracting than the overlap it prevents. */
  const CHIP_FADE_FROM = 0.68; // fraction of the globe's radius where a chip starts fading
  const CHIP_LIFT = 12;        // px the chip sits above its pin — matches the CSS margin
  const chipEls = new Map();
  const CHIP_STATUS = { ongoing: "on this trip now", upcoming: "filed, not travelled yet", past: "surveyed", undated: "guide filed" };

  function ensureChip(slug) {
    if (chipEls.has(slug)) return chipEls.get(slug);
    const g = byIndex.get(slug);
    if (!g) return null;
    // A button, not a link: on mobile a pin raises the ping sheet first (README "Clicking a
    // pin"), so the chip must do exactly what tapping its own pin does, not jump the queue.
    const el = document.createElement("button");
    el.type = "button";
    el.className = "atlas-pinchip";
    el.setAttribute("data-status", g.status || "undated");
    el.innerHTML = `<span class="atlas-pinchip-dot" aria-hidden="true"></span><span class="atlas-pinchip-name">${escapeHtml(g.name)}</span>`;
    // Every status has its own word. This used to test only for "now", so a past trip and an
    // upcoming one both announced "guide filed" while the ping sheet called the same trip
    // SURVEYED — two surfaces describing one fact differently.
    el.setAttribute("aria-label", `${g.name} — ${CHIP_STATUS[g.status] || CHIP_STATUS.undated}. Open details.`);
    el.setAttribute("data-slug", slug);
    // Through the same function the pin itself uses, not straight to the sheet: the comment
    // above says the chip must do exactly what tapping its pin does, and once a pick also
    // haloes the pin, marks the row and holds the spin, "exactly" has four parts to it.
    el.addEventListener("click", () => pickGuide(g));
    pinsLayer.appendChild(el);
    chipEls.set(slug, el);
    return el;
  }

  function clearChips() {
    for (const [, el] of chipEls) el.remove();
    chipEls.clear();
  }

  function placeChips(pos) {
    if (!isMobile()) { if (chipEls.size) clearChips(); return; }
    const R = Math.min(pos.w, pos.h) / 2 || 1;

    // Frontmost first, so when two labels want the same patch of sky the one nearer the
    // middle of the globe keeps it. Two overlapping labels are unreadable AND make the rear
    // one's contrast unverifiable — the a11y gate caught that before any eye did.
    const wanted = [];
    for (const g of guides) {
      const p = pos[g.slug];
      const el = ensureChip(g.slug);
      if (!el) continue;
      if (!p || !p.v) { el.removeAttribute("data-on"); el.style.opacity = "0"; continue; }
      // Fade toward the limb, so a label never floats over the globe's own edge with
      // nothing under it.
      const d = Math.hypot(p.x - pos.w / 2, p.y - pos.h / 2) / R;
      const o = d <= CHIP_FADE_FROM ? 1 : Math.max(0, 1 - (d - CHIP_FADE_FROM) / (1 - CHIP_FADE_FROM));
      // The centring lives HERE, not in the stylesheet: this line rewrites `transform`
      // every frame, so a `translate(-50%,-100%)` written in CSS would be erased on the
      // first pos event. Anchor = the pin's own point; the chip sits centred just above it.
      el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -100%)`;
      wanted.push({ el, x: p.x, y: p.y, o, d });
    }
    wanted.sort((a, b) => a.d - b.d);

    const placed = [];
    for (const c of wanted) {
      // offsetWidth, not getBoundingClientRect: the element carries a live transform, and
      // the layout box is what collides here, not the painted one.
      const w = c.el.offsetWidth || 90, h = c.el.offsetHeight || 22;
      const box = { l: c.x - w / 2, r: c.x + w / 2, t: c.y - h - CHIP_LIFT, b: c.y - CHIP_LIFT };
      const clash = placed.some((q) => box.l < q.r && box.r > q.l && box.t < q.b && box.b > q.t);
      const o = clash ? 0 : c.o;
      c.el.style.opacity = String(o);
      c.el.toggleAttribute("data-on", o > 0.06);
      if (!clash) placed.push(box);
    }
  }

  function runSolve(pos) {
    // No floating CARDS on mobile (README "Mobile": no spatial budget for them) — the chips
    // above carry the name instead, and a tap still opens the bottom sheet.
    if (isMobile()) {
      for (const [, el] of cardEls) el.remove();
      cardEls.clear();
      lastVisible = guides.filter((g) => pos[g.slug]?.v).map((g) => g.slug).sort().join(",");
      lastSolveAt = { x: pos.center[0], y: pos.center[1] };
      solveQueued = false;
      return;
    }
    const visibleGuides = guides.filter((g) => pos[g.slug]?.v);
    const cards = visibleGuides.map((g) => ({
      code: g.slug, x: pos[g.slug].x, y: pos[g.slug].y, w: CARD_W, fullH: CARD_FULL_H, compactH: CARD_COMPACT_H,
    }));
    const obstacles = Array.from(root.querySelectorAll("[data-ref-fadezoom]:not([data-faded])")).map((el) => {
      const hostRect = host.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { l: r.left - hostRect.left, t: r.top - hostRect.top, r: r.right - hostRect.left, b: r.bottom - hostRect.top };
    });
    const result = solvePlacement(cards, obstacles, { w: pos.w, h: pos.h });

    // Drop cards for guides no longer visible.
    for (const [slug, el] of cardEls) {
      if (!visibleGuides.some((g) => g.slug === slug)) { el.remove(); cardEls.delete(slug); }
    }
    for (const seat of result.seats) {
      const el = ensureCard(seat.code);
      if (!el) continue;
      el.style.transform = `translate3d(${seat.l}px, ${seat.t}px, 0)`;
      el.style.height = `${seat.h}px`;
      const plate = el.querySelector(".atlas-pincard-plate");
      if (plate) plate.style.display = seat.compact ? "none" : "block";
      el.toggleAttribute("data-tail", seat.tail);
      el.toggleAttribute("data-ready", true);
    }
    lastVisible = visibleGuides.map((g) => g.slug).sort().join(",");
    lastSolveAt = { x: pos.center[0], y: pos.center[1] };
    solveQueued = false;
  }

  function maybeSolve(pos) {
    const visibleNow = guides.filter((g) => pos[g.slug]?.v).map((g) => g.slug).sort().join(",");
    const drift = Math.hypot(pos.center[0] - lastSolveAt.x, pos.center[1] - lastSolveAt.y) * 60; // rough px-equivalent
    const setChanged = visibleNow !== lastVisible;
    if (!setChanged && drift < DRIFT_THRESHOLD) return;
    if (solveQueued) return;
    solveQueued = true;
    const run = () => runSolve(pos);
    if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 220 });
    else setTimeout(run, 0);
  }

  map.addEventListener("atlas-pos", (ev) => {
    const pos = ev.detail;
    if (coordEl) {
      const lat = pos.center[1], lng = pos.center[0];
      coordEl.textContent = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? "E" : "W"}`;
    }
    applyFadeZoom(pos.zoom);
    placeChips(pos);
    maybeSolve(pos);
  });

  // Local clocks on pin cards tick via the shared helper, re-scanned after each solve.
  const tick = () => {
    const now = new Date();
    pinsLayer.querySelectorAll("[data-tick][data-tz]").forEach((el) => {
      const label = localClockLabel(el.dataset.tz, now);
      if (label) el.textContent = label;
    });
  };
  tick();
  setInterval(tick, 30_000);
}
