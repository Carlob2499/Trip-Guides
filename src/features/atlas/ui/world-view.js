// World view controller (README §2, SPEC-COMPONENTS §8-9) — mounts <atlas-map>, wires its
// overlays (index rail, key, THE RECORD, zoom/fit/spin controls, motto, toast), and runs the
// pin-card collision solver against its atlas-pos stream. Progressive enhancement over the
// table view (D4): nothing here runs until this module is imported and a guide feed exists.

import "./atlas-map.js";
import { solvePlacement } from "../model/solver";
import { localClockLabel } from "../model/local-time";

const CARD_W = 220;
const CARD_FULL_H = 140;
const CARD_COMPACT_H = 60;
const DRIFT_THRESHOLD = 90;

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

  // ── atlas-select: navigate, or toast for a no-guide country/ocean click ─────────────
  let toastTimer = null;
  map.addEventListener("atlas-select", (ev) => {
    const { slug } = ev.detail || {};
    const g = guides.find((x) => x.slug === slug);
    if (g) { window.location.href = g.href; return; }
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
    const el = document.createElement("a");
    el.className = "atlas-pincard";
    el.href = g.href;
    el.style.width = `${CARD_W}px`;
    el.innerHTML = `
      <span class="atlas-pincard-tail"></span>
      ${g.coverImg ? `<img class="atlas-pincard-plate" src="${escapeHtml(g.coverImg)}" alt="" loading="lazy" style="view-transition-name:cover-${escapeHtml(g.slug)}" />` : ""}
      <span class="atlas-pincard-body">
        <span class="atlas-pincard-cc">${escapeHtml(g.cc || "")} · ${g.ordinal != null ? String(g.ordinal).padStart(2, "0") : "—"}</span>
        <span class="atlas-pincard-title">${escapeHtml(g.name)}</span>
        ${g.tz ? `<span class="atlas-pincard-clock" data-tick data-tz="${escapeHtml(g.tz)}">—</span>` : ""}
        <span class="atlas-pincard-cta">Open the guide →</span>
      </span>`;
    pinsLayer.appendChild(el);
    cardEls.set(slug, el);
    return el;
  }

  function runSolve(pos) {
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
