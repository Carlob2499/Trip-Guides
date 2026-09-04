// World view controller (README §2, SPEC-COMPONENTS §8-9) — mounts <atlas-map>, wires its
// overlays (index rail, key, THE RECORD, zoom/fit/spin controls, motto, toast), and runs the
// pin-card collision solver against its atlas-pos stream. Progressive enhancement over the
// table view (D4): nothing here runs until this module is imported and a guide feed exists.

import "./atlas-map.js";
import { solvePlacement } from "../model/solver";
import { localClockLabel } from "../model/local-time";
import { attachSheetDrag } from "../../../scripts/sheet-drag.js";
import { esc as escapeHtml, reducedMotion } from "../../../scripts/util.js";
import { atWidth, srcsetFor, imgCredit } from "../../../lib/img-width";

/* 260, not 220: the surveyed card's CTA is the long one ("✓ Verified — open the sheet →")
   and at 220 it wrapped to a second line, which is both narrower than the prototype draws the
   card and the reason axe could not resolve that line's contrast on exactly the two surveyed
   cards. The width is the fix; padding and margins were not the problem. */
const CARD_W = 260;
/* The plate is 3:2 inside a 220px card — 220x146 — and `object-fit: cover` fills the SHORT
   axis. A cover wider than 3:2 (Nyhavn is 2.21:1) asked for at 220px comes back 220x100 and
   gets scaled UP to cover 146px of height, which is how a correctly-thumbnailed image still
   lands on screen soft. Asking at twice the card width clears the height for any cover this
   product is likely to carry, and is still an order of magnitude off the 258 KB original. */
const PLATE_W = CARD_W * 2;
/* The plate's own laid-out height, from the 3:2 above — the card is 220 wide, so 147. */
const PLATE_H = Math.round((CARD_W * 2) / 3);
/* SEED estimates for the solver's collision boxes, replaced by a real measurement on the
   first card that exists (measureCardH). They were plain constants — 140 and 60, written
   when the card was text only — and when the plate was added underneath them nothing
   updated: the solver kept seating a 280px card in a 140px box and stamping that height
   back on the element, so the fill and rule stopped at the bottom of the photo and the
   kicker, title, clock and CTA sat outside the card on bare globe. A number describing a
   rendered element cannot be a literal nobody re-checks; these are a first guess now, and
   the DOM is the authority. */
let cardBodyH = 60;
let cardFullH = 140;
const DRIFT_THRESHOLD = 90;

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
     link is rebuilt from the encoded slug rather than trusted; an image URL is re-encoded
     as a whole (decode then encode, so an already-encoded Commons path is not encoded twice). */
  const guideHref = (guide) => `${base}/guides/${encodeURIComponent(String(guide.slug || ""))}/`;
  const safeImageUrl = (url) => { try { return url ? encodeURI(decodeURI(String(url))) : null; } catch { return null; } };
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

  // ── Index rail + THE RECORD (README §2) ─────────────────────────────────────────────
  /* PLANNED and NEXT TRIP are both `upcoming`; the prototype separates them because only one
     guide is the one you leave for next, and a rail that calls four trips "planned" says
     nothing about which. `isNext` is computed once on the server (index.astro). */
  const STATUS_LABEL = { past: "COMPLETE", ongoing: "IN PROGRESS", upcoming: "PLANNED", undated: "" };
  const recordLabel = (guide) => (guide.isNext ? "NEXT TRIP" : STATUS_LABEL[guide.status] || "");
  /* Both rails are two-column rows in the prototype, not one run-on line: the sheet's
     identity on the left and WHEN on the right, so the eye reads down either column alone.
     Rendering them as one string was what flattened the whole panel to a single weight. */
  /* The two rails answer different questions and so carry different orders. The INDEX is a
     register of sheets — it runs 01, 02, 03, 04, because an index out of its own numbering is
     not an index. The RECORD is a timeline and keeps the payload's relevance order (ongoing,
     then soonest ahead, then most recent behind), which is what makes NEXT TRIP land in the
     middle of it rather than at the top. */
  const byOrdinal = guides
    .slice()
    .sort((a, b) => (a.ordinal ?? Infinity) - (b.ordinal ?? Infinity));
  const byRelevance = guides
    .slice()
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));

  const indexList = root.querySelector("[data-atlas-index-list]");
  if (indexList) {
    indexList.innerHTML = byOrdinal
      .map((guide) => {
        const num = guide.ordinal != null ? String(guide.ordinal).padStart(2, "0") : "—";
        const stamp = guide.stamp ? escapeHtml(guide.stamp) + (guide.status === "past" ? " ✓" : "") : "—";
        // Sheet 01 leads the register and takes the accent — the prototype marks the top of
        // the index, not the trip's status; status is the RECORD rail's job on the right.
        return `<li><button type="button" data-fly="${escapeHtml(guide.slug)}"${guide.ordinal === 1 ? " data-lead" : ""}>` +
          `<span class="ix-n">${escapeHtml(num)}</span><span class="ix-name">${escapeHtml(guide.name)}</span>` +
          `<span class="ix-stamp">${stamp}</span></button></li>`;
      })
      .join("");
    // "INDEX OF SHEETS · 04" — the count belongs in the kicker, where the prototype puts it.
    const kicker = indexList.parentElement?.querySelector(".atlas-ov-kicker");
    if (kicker) kicker.textContent = `Index of sheets · ${String(guides.length).padStart(2, "0")}`;
  }
  const recordList = root.querySelector("[data-atlas-record-list]");
  if (recordList) {
    /* The RECORD leads with the trip's dates, in the display face, because that is what
       distinguishes one entry from the next — the country repeats from the index above it. */
    recordList.innerHTML = byRelevance
      .map((guide) => {
        const label = recordLabel(guide);
        const tone = guide.isNext ? "next" : guide.status;
        return `<li><button type="button" data-fly="${escapeHtml(guide.slug)}" data-open="${escapeHtml(guideHref(guide))}" data-tone="${escapeHtml(tone)}">` +
          `<span class="rec-dot"></span>` +
          `<span class="rec-lines"><span class="rec-when">${guide.dates ? escapeHtml(guide.dates) : "Dates not set"}</span>` +
          `<span class="rec-what">${escapeHtml(guide.name)}${label ? ` · ${escapeHtml(label)}` : ""}</span></span>` +
          `</button></li>`;
      })
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
      const src = safeImageUrl(atWidth(guide.coverImg, 64));
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
  map.addEventListener("atlas-select", (ev) => {
    const { slug } = ev.detail || {};
    const guide = guides.find((entry) => entry.slug === slug);
    if (guide) {
      if (isMobile()) { pickGuide(guide); return; }
      // Desktop opens the guide directly (README "Clicking a pin"), so the selection it
      // records is the one Back will restore.
      markSelected(slug);
      window.location.href = guideHref(guide);
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
  const byIndex = new Map(guides.map((guide) => [guide.slug, guide]));
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
    const guide = byIndex.get(slug);
    if (!guide) return null;
    /* The plate is 220px wide and was being handed the ORIGINAL — Nyhavn is 1600x724 and 258 KB
       for a 218x145 box, measured 2026-08-10. The table rows and the ping sheet both already
       ask Commons for a thumbnail at the size they draw; this is the third surface using the
       same cover and the only one that never did. */
    const el = document.createElement("a");
    el.className = "atlas-pincard";
    el.href = guideHref(guide);
    el.style.width = `${CARD_W}px`;
    // The credit chip sits on the bottom edge of the photo, so it needs the photo's height —
    // published from here, where the width it derives from actually lives. Hard-coding the
    // matching number in CSS is how CARD_FULL_H went stale in the first place.
    el.style.setProperty("--plate-h", `${PLATE_H}px`);
    el.innerHTML = `
      <span class="atlas-pincard-tail"></span>
      <span class="atlas-pincard-ticks" aria-hidden="true"></span>
      ${guide.coverImg && imgCredit(guide.coverImg) ? `<span class="atlas-pincard-credit">${escapeHtml(imgCredit(guide.coverImg))}</span>` : ""}
      ${guide.coverImg ? `<img class="atlas-pincard-plate" src="${escapeHtml(atWidth(guide.coverImg, PLATE_W))}"${srcsetFor(guide.coverImg, PLATE_W) ? ` srcset="${escapeHtml(srcsetFor(guide.coverImg, PLATE_W))}"` : ""} alt="" loading="lazy" style="view-transition-name:cover-${escapeHtml(guide.slug)}" />` : ""}
      <span class="atlas-pincard-body">
        <span class="atlas-pincard-cc">${escapeHtml(guide.cc || "")}${guide.anchorLabel ? ` · ${escapeHtml(guide.anchorLabel)}` : ""}</span>
        <span class="atlas-pincard-title">${escapeHtml(guide.name)}</span>
        ${guide.tz ? `<span class="atlas-pincard-clock" data-tick data-tz="${escapeHtml(guide.tz)}">${escapeHtml(localClockLabel(guide.tz, new Date()) || "—")}</span>` : ""}
        ${guide.isNext && guide.dates ? `<span class="atlas-pincard-next">Next trip · ${escapeHtml(guide.dates)}</span>` : ""}
        <span class="atlas-pincard-cta">${guide.status === "past" ? "✓ Verified — open the sheet →" : "Open the sheet →"}</span>
      </span>`;
    /* Status drives the card's colour, not just its words: a surveyed trip's CTA goes green
       because it is a statement of fact (this one was walked), and the next trip takes the
       accent because it is the only card on the globe with a date still ahead of it. */
    el.dataset.status = guide.status;
    if (guide.isNext) el.dataset.next = "";
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
    const guide = byIndex.get(slug);
    if (!guide) return null;
    // A button, not a link: on mobile a pin raises the ping sheet first (README "Clicking a
    // pin"), so the chip must do exactly what tapping its own pin does, not jump the queue.
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
    // Through the same function the pin itself uses, not straight to the sheet: the comment
    // above says the chip must do exactly what tapping its pin does, and once a pick also
    // haloes the pin, marks the row and holds the spin, "exactly" has four parts to it.
    el.addEventListener("click", () => pickGuide(guide));
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

  /* Read the card's real height off a card that exists, once the first one does. Both halves
     come from one element: the body is what a compacted (plate-hidden) card is, and the body
     plus the plate is what a full one is. Cheap enough to re-check while the seed is still in
     place, and it stops as soon as it has a real number. */
  function measureCardH() {
    if (cardBodyH !== 60) return false;
    const el = cardEls.values().next().value;
    const body = el && el.querySelector(".atlas-pincard-body");
    const h = body && body.offsetHeight;
    if (!h) return false;
    cardBodyH = h;
    cardFullH = h + (el.querySelector(".atlas-pincard-plate") ? PLATE_H : 0);
    return true;
  }

  function runSolve(pos) {
    // No floating CARDS on mobile (README "Mobile": no spatial budget for them) — the chips
    // above carry the name instead, and a tap still opens the bottom sheet.
    if (isMobile()) {
      for (const [, el] of cardEls) el.remove();
      cardEls.clear();
      lastVisible = guides.filter((guide) => pos[guide.slug]?.v).map((guide) => guide.slug).sort().join(",");
      lastSolveAt = { x: pos.center[0], y: pos.center[1] };
      solveQueued = false;
      return;
    }
    const visibleGuides = guides.filter((guide) => pos[guide.slug]?.v);
    const cards = visibleGuides.map((guide) => ({
      code: guide.slug, x: pos[guide.slug].x, y: pos[guide.slug].y, w: CARD_W, fullH: cardFullH, compactH: cardBodyH,
    }));
    const obstacles = Array.from(root.querySelectorAll("[data-ref-fadezoom]:not([data-faded])")).map((el) => {
      const hostRect = host.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      return { l: rect.left - hostRect.left, t: rect.top - hostRect.top, r: rect.right - hostRect.left, b: rect.bottom - hostRect.top };
    });
    const result = solvePlacement(cards, obstacles, { w: pos.w, h: pos.h });

    // Drop cards for guides no longer visible.
    for (const [slug, el] of cardEls) {
      if (!visibleGuides.some((guide) => guide.slug === slug)) { el.remove(); cardEls.delete(slug); }
    }
    for (const seat of result.seats) {
      const el = ensureCard(seat.code);
      if (!el) continue;
      el.style.transform = `translate3d(${seat.l}px, ${seat.t}px, 0)`;
      // No height is written back. The seat height is the solver's estimate for collision
      // geometry; the CARD is sized by its own content, so a title that wraps to two lines
      // grows the box instead of spilling out of it.
      const plate = el.querySelector(".atlas-pincard-plate");
      if (plate) plate.style.display = seat.compact ? "none" : "block";
      // The credit belongs to the photo, so it leaves with it when the card compacts.
      el.toggleAttribute("data-compact", seat.compact);
      el.toggleAttribute("data-tail", seat.tail);
      el.toggleAttribute("data-ready", true);
    }
    lastVisible = visibleGuides.map((guide) => guide.slug).sort().join(",");
    lastSolveAt = { x: pos.center[0], y: pos.center[1] };
    solveQueued = false;

    /* The first pass has no card to measure, so it seats everything on the seed estimate and
       cards overlap. Now that one exists, take the real height and solve exactly once more.
       Waiting for the next pos event is not enough: maybeSolve() ignores a globe that has not
       drifted, so a paused or reduced-motion globe would keep the overlapping first pass —
       which is how axe found two cards sitting on each other's text. measureCardH() latches,
       so this recurses once and never again. */
    if (measureCardH()) requestAnimationFrame(() => runSolve(pos));
  }

  function maybeSolve(pos) {
    const visibleNow = guides.filter((guide) => pos[guide.slug]?.v).map((guide) => guide.slug).sort().join(",");
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
