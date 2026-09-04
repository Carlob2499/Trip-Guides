/* The ONE search overlay (design-system.md D6-24, docs/reference/search-ui-final.md).

   Opened from every entry point in the chrome — the expanded top field, the compact
   scrolled control, the desktop persistent field — and from "/" or Ctrl/Cmd+K. It is a
   dialog over the current surface, never a page: the page underneath keeps its destination,
   its chapter and its scroll, and dismissing restores focus to the control that opened it.

   Two indexes, one list: the current guide's own records ship inline (#searchIndex, so
   search works offline) and lead every result; the cross-guide index (dist/data/
   search-index.json) is fetched lazily on first use and appears as "Other trips". Ranking
   and grouping are the model's (model/rank.ts) — this file only draws rows and routes a
   choice to the object's own anchor through the page router. */

import { rankSearch, MIN_CHARS } from "../model/rank";
import { trapFocus } from "../../../scripts/util.js";

function el0(tag, cls, text) { const n = document.createElement(tag); n.className = cls; n.textContent = text; return n; }

const ACTION = { place: "Open place", venue: "Open place", day: "Open day", stop: "Open day", section: "Open in guide", module: "Open in guide" };

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
        '<p class="srch-status" role="status" aria-live="polite"></p>' +
        '<div class="srch-list" id="srchList" role="listbox"></div>' +
      '</div>';
    doc.body.appendChild(overlay);
    input = overlay.querySelector(".srch-input");
    list = overlay.querySelector(".srch-list");
    status = overlay.querySelector(".srch-status");
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

  function render() {
    const q = input.value;
    const groups = rankSearch(local.concat(remote), q, currentSlug);
    flat = [];
    sel = -1;
    if (q.trim().length < MIN_CHARS) {
      list.replaceChildren();
      status.textContent = "";
      input.setAttribute("aria-expanded", "false");
      return;
    }
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
  }

  function go(r) {
    if (!r) return;
    const hash = "#" + r.anchor;
    if (r.slug !== currentSlug) {
      location.href = `${base}/guides/${encodeURIComponent(r.slug)}/${hash}`;
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
