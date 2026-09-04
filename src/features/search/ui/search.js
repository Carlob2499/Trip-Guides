/* The ONE search overlay — context-aware universal Search with category drawers
   (design-system.md §21). Opened from the top strip and the rail, and from "/" or
   Ctrl/Cmd+K. It is a dialog over the current surface, never a page or a tab: the page
   underneath keeps its destination, its chapter and its scroll, and dismissing restores focus
   to the control that opened it. Not a command palette: rows are traveler objects, the
   drawers are the guide's own categories, and the context line says what is being searched.
   Desktop adds a fluid result/detail workspace beside the list; a phone keeps the compact
   sheet with the same drawers and a clear Close.

   Two indexes, one list: the current guide's own records ship inline (#searchIndex, so
   search works offline) and lead every result; the cross-guide index (dist/data/
   search-index.json) is fetched lazily on first use and appears as "Other trips". Ranking
   and grouping are the model's (model/rank.ts) — this file only draws rows and routes a
   choice to the object's own anchor through the page router. */

import { rankSearch, MIN_CHARS } from "../model/rank";
import { trapFocus, reencodeUrl } from "../../../scripts/util.js";

/* A record's photograph is a repository rendition path (or an http URL for another guide's
   record); anything else is dropped rather than painted. */
function photoUrl(r) {
  const raw = r && r.img ? String(r.img) : "";
  if (!raw || !/^(https?:\/\/|\/)/i.test(raw)) return null;
  return reencodeUrl(raw);
}

function el0(tag, cls, text) { const n = document.createElement(tag); n.className = cls; n.textContent = text; return n; }

const ACTION = { place: "Open place", venue: "Open place", day: "Open day", stop: "Open day", section: "Open in guide", module: "Open in guide" };
/* The drawers (§21): the traveler-facing categories the ranker already groups by. */
const DRAWERS = [["all", "All"], ["places", "Places"], ["itinerary", "Itinerary"], ["guide", "Guide"], ["other", "Other trips"]];
const DEST_LABEL = { trip: "Trip", itinerary: "Itinerary", map: "Map", guide: "Guide", split: "Split" };

export function initSearch(root) {
  const doc = root || document;
  const openers = Array.prototype.slice.call(doc.querySelectorAll("[data-search-open], [data-search-field]"));
  if (!openers.length) return;
  const base = (doc.body.getAttribute("data-base") || "").replace(/\/$/, "");
  const currentSlug = doc.body.getAttribute("data-slug") || null;
  let local = [];
  try { const el = doc.getElementById("searchIndex"); if (el) local = JSON.parse(el.textContent || "[]"); } catch (_) { local = []; }
  let remotePromise = null;
  const loadRemote = () => remotePromise || (remotePromise = fetch(`${base}/data/search-index.json`)
    .then((r) => (r.ok ? r.json() : []))
    .then((rows) => rows.filter((r) => r.slug !== currentSlug))
    .catch(() => []));

  let overlay = null, input = null, list = null, status = null, lastFocus = null, sel = -1, flat = [], remote = [];
  let drawers = null, ctxEl = null, detail = null, drawer = "all";

  /* What is being searched, from the page's own state — never composed from guesses. */
  function contextLine() {
    let title = null;
    try { title = JSON.parse((doc.getElementById("tgConfig") || {}).textContent || "{}").title || null; } catch (_) { /* no config on Atlas */ }
    if (!currentSlug || !title) return "Searching every guide";
    const parts = [title];
    const dest = DEST_LABEL[doc.body.getAttribute("data-dest") || ""];
    if (dest) parts.push(dest);
    const day = doc.querySelector("[data-planner-days] .day[data-day]:not([hidden])");
    if (day && dest === "Itinerary") parts.push("Day " + (parseInt(day.getAttribute("data-day"), 10) + 1) + (day.getAttribute("data-date") ? " · " + day.getAttribute("data-date") : ""));
    return "Searching " + parts.join(" · ") + " — and every other guide";
  }

  function build() {
    if (overlay) return;
    overlay = doc.createElement("div");
    overlay.className = "srch";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Search");
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="srch-panel">' +
        '<div class="srch-bar">' +
          '<svg class="srch-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>' +
          '<input class="srch-input" type="search" autocomplete="off" spellcheck="false" placeholder="Search this trip, places, guides…" aria-label="Search" role="combobox" aria-expanded="false" aria-controls="srchList" aria-autocomplete="list" />' +
          '<button class="srch-close" type="button" aria-label="Close search">Close</button>' +
        '</div>' +
        '<p class="srch-ctx"></p>' +
        '<div class="srch-drawers" role="group" aria-label="Show"></div>' +
        '<p class="srch-status" role="status" aria-live="polite"></p>' +
        '<div class="srch-body">' +
          '<div class="srch-list" id="srchList" role="listbox"></div>' +
          '<aside class="srch-detail" aria-label="Selected result" hidden></aside>' +
        '</div>' +
      '</div>';
    doc.body.appendChild(overlay);
    input = overlay.querySelector(".srch-input");
    list = overlay.querySelector(".srch-list");
    status = overlay.querySelector(".srch-status");
    ctxEl = overlay.querySelector(".srch-ctx");
    detail = overlay.querySelector(".srch-detail");
    drawers = overlay.querySelector(".srch-drawers");
    DRAWERS.forEach(([key, label]) => {
      const b = el0("button", "srch-drawer", label);
      b.type = "button";
      b.setAttribute("data-drawer", key);
      b.setAttribute("aria-pressed", key === drawer ? "true" : "false");
      const n = el0("span", "srch-drawer-n", "");
      b.appendChild(n);
      b.addEventListener("click", () => { drawer = key; render(); });
      drawers.appendChild(b);
    });
    list.addEventListener("mouseover", (e) => {
      const row = e.target.closest && e.target.closest("[data-srch-i]");
      if (row) showDetail(flat[parseInt(row.getAttribute("data-srch-i"), 10)]);
    });
    list.addEventListener("focusin", (e) => {
      const row = e.target.closest && e.target.closest("[data-srch-i]");
      if (row) showDetail(flat[parseInt(row.getAttribute("data-srch-i"), 10)]);
    });
    overlay.querySelector(".srch-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); if (flat[sel]) go(flat[sel]); }
      else if (e.key === "Escape") { e.preventDefault(); if (input.value) { input.value = ""; render(); } else close(); }
    });
    list.addEventListener("click", (e) => {
      const row = e.target.closest && e.target.closest("[data-srch-i]");
      if (row) go(flat[parseInt(row.getAttribute("data-srch-i"), 10)]);
    });
    trapFocus(overlay, () => !overlay.hidden);
  }

  /* The desktop detail pane (§21 "fluid results/detail workspace"): the highlighted result's
     own facts and its one action, beside the list. Hidden on a phone by CSS. */
  function showDetail(r) {
    if (!detail) return;
    if (!r) { detail.hidden = true; detail.replaceChildren(); return; }
    const other = r.slug !== currentSlug;
    const kind = other ? r.crumb : String(r.group || "").toUpperCase();
    const act = other ? "Open guide" : (Object.prototype.hasOwnProperty.call(ACTION, r.kind) ? ACTION[r.kind] : "Open");
    const wrap = doc.createElement("div");
    const pic = photoUrl(r);
    if (pic) {
      const fig = el0("span", "srch-detail-photo", "");
      const im = doc.createElement("img");
      im.src = pic; im.alt = ""; im.loading = "lazy"; im.decoding = "async";
      im.addEventListener("error", () => fig.remove());
      fig.appendChild(im);
      wrap.appendChild(fig);
    }
    wrap.appendChild(el0("p", "srch-detail-k", kind));
    wrap.appendChild(el0("h3", "srch-detail-title", r.title));
    if (r.snippet) wrap.appendChild(el0("p", "srch-detail-snip", r.snippet));
    const go_ = el0("button", "srch-detail-go", act + " →");
    go_.type = "button";
    go_.addEventListener("click", () => go(r));
    wrap.appendChild(go_);
    detail.replaceChildren(wrap);
    detail.hidden = false;
  }

  function paintDrawers(groups) {
    if (!drawers) return;
    const counts = {};
    let total = 0;
    groups.forEach((g) => { counts[g.key] = g.items.length; total += g.items.length; });
    drawers.querySelectorAll("[data-drawer]").forEach((b) => {
      const key = b.getAttribute("data-drawer");
      const n = key === "all" ? total : (counts[key] || 0);
      b.querySelector(".srch-drawer-n").textContent = n ? String(n) : "";
      b.setAttribute("aria-pressed", key === drawer ? "true" : "false");
      b.disabled = key !== "all" && n === 0;
    });
  }

  function render() {
    const q = input.value;
    const all = rankSearch(local.concat(remote), q, currentSlug);
    if (drawer !== "all" && !all.some((g) => g.key === drawer)) drawer = "all";
    paintDrawers(all);
    const groups = drawer === "all" ? all : all.filter((g) => g.key === drawer);
    flat = [];
    sel = -1;
    showDetail(null);
    if (q.trim().length < MIN_CHARS) {
      list.replaceChildren();
      status.textContent = "";
      input.setAttribute("aria-expanded", "false");
      drawers.hidden = true;
      return;
    }
    drawers.hidden = false;
    if (!groups.length) {
      list.replaceChildren(el0("p", "srch-empty", "Nothing in this trip or the other guides matches that."));
      status.textContent = "No matches";
      input.setAttribute("aria-expanded", "true");
      return;
    }
    // Rows are built as DOM nodes, never as an HTML string: every field here came from a
    // JSON payload (the inline index or a fetched one), so it is text and stays text.
    list.replaceChildren();
    const el = (tag, cls, text) => {
      const n = doc.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    };
    groups.forEach((g) => {
      const group = el("div", "srch-group");
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", g.label);
      group.appendChild(el("p", "srch-group-h", g.label));
      g.items.forEach((r) => {
        const i = flat.push(r) - 1;
        const other = r.slug !== currentSlug;
        const row = el("button", "srch-row");
        row.type = "button";
        row.setAttribute("role", "option");
        row.setAttribute("aria-selected", "false");
        row.setAttribute("data-srch-i", String(i));
        row.id = "srch-opt-" + i;
        const pic = photoUrl(r);
        if (pic) {
          const th = el("span", "srch-thumb");
          const im = doc.createElement("img");
          im.src = pic; im.alt = ""; im.loading = "lazy"; im.decoding = "async";
          im.addEventListener("error", () => th.remove());
          th.appendChild(im);
          row.appendChild(th);
        }
        const main = el("span", "srch-row-main");
        main.appendChild(el("span", "srch-row-title", r.title));
        if (r.snippet) main.appendChild(el("span", "srch-row-snip", r.snippet));
        const side = el("span", "srch-row-side");
        side.appendChild(el("span", "srch-row-crumb", other ? r.crumb : String(r.group || "").toUpperCase()));
        const action = other ? "Open guide" : (Object.prototype.hasOwnProperty.call(ACTION, r.kind) ? ACTION[r.kind] : "Open");
        side.appendChild(el("span", "srch-row-act", action + " →"));
        row.appendChild(main);
        row.appendChild(side);
        group.appendChild(row);
      });
      list.appendChild(group);
    });
    status.textContent = flat.length + " result" + (flat.length === 1 ? "" : "s");
    input.setAttribute("aria-expanded", "true");
    input.removeAttribute("aria-activedescendant");
  }

  function move(delta) {
    if (!flat.length) return;
    sel = (sel + delta + flat.length) % flat.length;
    list.querySelectorAll(".srch-row").forEach((el, i) => {
      const on = i === sel;
      el.classList.toggle("srch-row--sel", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
      if (on) { el.scrollIntoView({ block: "nearest" }); input.setAttribute("aria-activedescendant", el.id); }
    });
    showDetail(flat[sel]);
  }

  // Index fields are data from a JSON payload; a route is only ever built from the shapes
  // the index builder emits (a kebab slug, an id-safe anchor) — anything else is dropped.
  const SLUG = /^[a-z0-9][a-z0-9-]*$/;
  const ANCHOR = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
  function go(r) {
    if (!r || !ANCHOR.test(String(r.anchor || ""))) return;
    const hash = "#" + r.anchor;
    if (r.slug !== currentSlug) {
      if (!SLUG.test(String(r.slug || ""))) return;
      const url = new URL(`${base}/guides/${r.slug}/`, location.origin);
      url.hash = hash;
      location.assign(url.href);
      return;
    }
    close({ keepFocus: true });
    if (window.__tgShowDest) {
      if (location.hash === hash) window.dispatchEvent(new HashChangeEvent("hashchange"));
      else location.hash = hash;
    } else {
      location.hash = hash;
    }
  }

  let scrollY = 0;
  function open(seed) {
    build();
    lastFocus = doc.activeElement;
    scrollY = window.scrollY;
    overlay.hidden = false;
    doc.body.classList.add("srch-lock");
    if (ctxEl) ctxEl.textContent = contextLine();
    if (drawers) drawers.hidden = true;
    if (typeof seed === "string" && seed) input.value = seed;
    input.focus();
    if (input.value) render();
    loadRemote().then((rows) => { remote = rows; if (!overlay.hidden && input.value) render(); });
  }
  function close(opts) {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    doc.body.classList.remove("srch-lock");
    // Exact prior context: the page never moved, but a mobile browser can shift on focus loss.
    if (Math.abs(window.scrollY - scrollY) > 2) window.scrollTo(0, scrollY);
    if (!(opts && opts.keepFocus) && lastFocus && lastFocus.focus) lastFocus.focus();
    const field = doc.querySelector("[data-search-field]");
    if (field) field.value = "";
  }

  openers.forEach((el) => {
    if (el.matches("[data-search-field]")) {
      // The inline field hands over on focus; what was typed already seeds the overlay.
      el.addEventListener("focus", () => open(el.value));
      el.addEventListener("input", () => { if (!overlay || overlay.hidden) open(el.value); else { input.value = el.value; render(); } });
    } else {
      el.addEventListener("click", () => open(""));
    }
  });
  doc.addEventListener("keydown", (e) => {
    const t = e.target;
    const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); open(""); }
    else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); open(""); }
  });
}

if (typeof document !== "undefined") initSearch(document);
