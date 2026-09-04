/* The change page (/change/) — DOM wiring. Every decision lives in ../model/.
   Replaces the 3-step modal wizard: a 420px dialog on a guide page could not carry a guide
   picker, a live advisory and a section map, and the plan's deep link needs all three.

   Progressive enhancement is UNCHANGED in substance and better in reach: the page server-renders
   one real prefilled-issue link per guide (the <noscript> block), so a reader with scripts off
   reaches the same GitHub issue the footer pill used to hand them — for every guide, not just
   the one they were standing on.

   The advisory panel is a SUGGESTION and must read like one. It has never seen the guide's
   content; it matched words against tab names. Everything it renders is derived from the current
   textarea value on every keystroke and stored nowhere. */

import {
  sectionOptions,
  validateStep,
  remainingChars,
  buildRequestUrl,
  buildRequestPayload,
  submitMode,
  MODE_COPY,
  SENT_COPY,
  CHANGE_MAX,
} from "../model/change-request";
import {
  affectedGroups,
  matchedCategories,
  deriveWeight,
  sectionTouches,
  CATEGORY_LABEL,
  CATEGORY_TONE,
  WEIGHT_NOTE,
  advisoryEmptyLine,
} from "../model/advisory";
import { createChangeGateway } from "../gateway.js";
import { WAYPOINT_BACKEND } from "../../../lib/backend-config.js";
import { readOwnerKey } from "../../../scripts/owner-key.js";
import { encodePath } from "../../../scripts/util.js";

/* Long enough that a fast typist is not announced mid-word, short enough that the panel still
   feels like it is answering. The VISUAL counter updates immediately; only this recompute waits. */
const SETTLE_MS = 450;
const COUNT_LOW = 120;

const KIND_WORD = { rewrite: "redo", check: "check" };

export function initChangePage() {
  const root = document.getElementById("cpRoot");
  const cfgEl = document.getElementById("cpConfig");
  if (!root || !cfgEl) return;

  let cfg;
  try {
    cfg = JSON.parse(cfgEl.textContent || "{}");
  } catch (_) {
    return; // a malformed config leaves the server-rendered page exactly as it is
  }
  const guides = cfg.guides || [];
  if (!guides.length) return;

  // Config values that end up inside hrefs pass the credited encoding step once, here (util.js).
  const repo = encodePath(cfg.repo || "");
  const base = encodePath(cfg.base || "");

  const elCards = root.querySelectorAll("[data-cp-card]");
  const elFrom = root.querySelector("[data-cp-from]");
  const elFromName = root.querySelector("[data-cp-from-name]");
  const elFromClear = root.querySelector("[data-cp-from-clear]");
  const elStarters = root.querySelector("[data-cp-starters]");
  const elTextarea = root.querySelector("[data-cp-change]");
  const elCount = root.querySelector("[data-cp-count]");
  const elErr = root.querySelector("[data-cp-err]");
  const elCats = root.querySelector("[data-cp-cats]");
  const elAffected = root.querySelector("[data-cp-affected]");
  const elGhost = root.querySelector("[data-cp-ghost]");
  const elWeight = root.querySelector("[data-cp-weight]");
  const elNote = root.querySelector("[data-cp-note]");
  const elSend = root.querySelector("[data-cp-send]");
  const elSent = root.querySelector("[data-cp-sent]");
  const elFootNote = root.querySelector("[data-cp-footnote]");
  const elMapHead = root.querySelector("[data-cp-map-head]");
  const elSecs = root.querySelector("[data-cp-secs]");
  const elTriage = root.querySelector("[data-cp-triage]");

  const mode = submitMode({ backendUrl: WAYPOINT_BACKEND.url, hasOwnerKey: !!readOwnerKey() });
  const copy = MODE_COPY[mode];

  /* The owner's queue is not traveller navigation (design-handoff README). It appears only when
     this browser holds a key — the same gate the progress page's decision controls use. */
  if (elTriage && readOwnerKey()) elTriage.hidden = false;

  let guide = guides[0];
  /* null = nothing chosen, distinct from "" = the explicit "no particular tab". The deep link
     from a guide page fills this with the tab the reader was actually looking at. */
  let section = null;
  let dropped = new Set();
  let sending = false;
  let settle = 0;

  /* ── URL → state. The guide page's "Request a change" pill carries both. ─────────────── */
  function readQuery() {
    let params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (_) {
      return;
    }
    const wanted = params.get("slug");
    const found = wanted && guides.find((g) => g.slug === wanted);
    if (found) guide = found;
    const tab = params.get("tab");
    // Only a tab this guide actually has. A stale link must not name a tab the reader can't find.
    if (tab && (guide.groups || []).indexOf(tab) !== -1) section = tab;
  }

  /* ── Rendering ───────────────────────────────────────────────────────────────────────── */

  function renderCards() {
    elCards.forEach((card) => {
      card.setAttribute("aria-pressed", String(card.getAttribute("data-cp-card") === guide.slug));
    });
  }

  function renderFrom() {
    if (!elFrom) return;
    const show = typeof section === "string" && section !== "";
    elFrom.hidden = !show;
    if (show && elFromName) elFromName.textContent = section;
  }

  function renderStarters() {
    if (!elStarters) return;
    elStarters.textContent = "";
    /* The starters are the guide's OWN tabs, phrased as a sentence opener. Generic examples
       ("the price is wrong") teach the reader nothing about this guide; a real tab name does. */
    for (const opt of sectionOptions(guide.navSections).slice(0, 4)) {
      if (!opt.value) continue;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cp-starter";
      b.textContent = "Something in " + opt.label;
      b.addEventListener("click", () => {
        section = opt.value;
        const seed = "In " + opt.label + ": ";
        if (elTextarea && !elTextarea.value.trim()) elTextarea.value = seed;
        if (elTextarea) {
          elTextarea.focus();
          const end = elTextarea.value.length;
          elTextarea.setSelectionRange(end, end);
        }
        renderFrom();
        renderCount();
        renderAdvisory();
      });
      elStarters.appendChild(b);
    }
  }

  function renderCount() {
    if (!elCount || !elTextarea) return;
    const left = remainingChars(elTextarea.value);
    elCount.textContent = left + " left";
    elCount.classList.toggle("cp-count-low", left <= COUNT_LOW);
    if (elTextarea.value.length > CHANGE_MAX) {
      elTextarea.value = elTextarea.value.slice(0, CHANGE_MAX);
    }
  }

  function renderCategories(text) {
    if (!elCats) return;
    elCats.textContent = "";
    const cats = matchedCategories(text);
    elCats.hidden = !cats.length;
    for (const c of cats) {
      const chip = document.createElement("span");
      chip.className = "cp-cat";
      chip.setAttribute("data-tone", CATEGORY_TONE[c]);
      chip.textContent = CATEGORY_LABEL[c];
      elCats.appendChild(chip);
    }
  }

  function renderAffected(affected) {
    if (!elAffected) return;
    elAffected.textContent = "";
    elAffected.hidden = !affected.length;
    for (const a of affected) {
      const li = document.createElement("li");
      li.className = "cp-aff";
      const name = document.createElement("span");
      name.textContent = a.group;
      const kind = document.createElement("span");
      kind.className = "cp-aff-kind";
      kind.textContent = KIND_WORD[a.kind];
      const x = document.createElement("button");
      x.type = "button";
      x.className = "cp-aff-x";
      x.setAttribute("aria-label", "Leave " + a.group + " alone");
      x.textContent = "×";
      x.addEventListener("click", () => {
        dropped.add(a.group);
        renderAdvisory();
      });
      li.append(name, kind, x);
      elAffected.appendChild(li);
    }
  }

  function renderMap(affected) {
    const groups = guide.groups || [];
    if (elMapHead) {
      // The count is the guide's own. Denmark has 8 tabs and Korea 11; a hardcoded 10 would be
      // wrong on both.
      elMapHead.textContent =
        "Your guide's " + groups.length + " section" + (groups.length === 1 ? "" : "s") + " — what we'd touch";
    }
    if (!elSecs) return;
    elSecs.textContent = "";
    for (const t of sectionTouches(groups, affected)) {
      const li = document.createElement("li");
      li.className = "cp-sec";
      li.setAttribute("data-tag", t.tag);
      const name = document.createElement("span");
      name.className = "cp-sec-name";
      name.textContent = t.group;
      const tag = document.createElement("span");
      tag.className = "cp-sec-tag";
      tag.textContent = t.tag;
      const bar = document.createElement("span");
      bar.className = "cp-sec-bar";
      bar.setAttribute("aria-hidden", "true");
      li.append(name, tag, bar);
      elSecs.appendChild(li);
      /* Set the bar's target on the NEXT frame so the element is in the document with 0 first —
         assigning it in the same tick gives the browser nothing to transition FROM and the
         stroke would appear instead of drawing. */
      requestAnimationFrame(() => bar.style.setProperty("--cp-bar", String(t.bar)));
    }
  }

  function renderAdvisory() {
    const text = elTextarea ? elTextarea.value : "";
    const affected = affectedGroups(text, guide.groups, dropped);
    const weight = deriveWeight(affected);

    renderCategories(text);
    renderAffected(affected);
    renderMap(affected);

    if (elGhost) {
      elGhost.hidden = affected.length > 0;
      const line = elGhost.querySelector("[data-cp-ghost-line]");
      if (line) line.textContent = advisoryEmptyLine(text);
    }
    if (elWeight) {
      elWeight.textContent = weight;
      elWeight.setAttribute("data-weight", weight);
    }
    if (elNote) elNote.textContent = WEIGHT_NOTE[weight];
  }

  /* ── Sending ─────────────────────────────────────────────────────────────────────────── */

  function state() {
    return { section: section, change: elTextarea ? elTextarea.value : "" };
  }

  function renderSent() {
    if (!elSent) return;
    elSent.textContent = SENT_COPY + " ";
    const a = document.createElement("a");
    a.href = base + "/progress/?slug=" + encodeURIComponent(guide.slug);
    a.textContent = "Open the progress page →";
    elSent.appendChild(a);
    elSent.hidden = false;
    elSent.focus();
    if (elSend) elSend.hidden = true;
  }

  function send() {
    if (sending) return;
    const s = state();
    const v = validateStep(1, s);
    if (!v.ok) {
      if (elErr) elErr.textContent = v.error;
      if (elTextarea) elTextarea.focus();
      return;
    }
    if (elErr) elErr.textContent = "";

    if (mode === "worker") {
      // Async is SAFE here only because nothing after the await opens a window or navigates —
      // the result is rendered into this same page.
      sending = true;
      if (elSend) { elSend.disabled = true; elSend.textContent = "Sending…"; }
      const gateway = createChangeGateway({ ownerKey: readOwnerKey() });
      gateway.submitChange(buildRequestPayload(guide.slug, s)).then((res) => {
        sending = false;
        if (elSend) { elSend.disabled = false; elSend.textContent = copy.next; }
        if (res.ok) { renderSent(); return; }
        if (elErr) elErr.textContent = res.message;
      });
      return;
    }

    /* The URL is built and navigation happens SYNCHRONOUSLY inside this click — no await
       anywhere on this path. An `await` here would put a window.open outside the user gesture
       and popup blockers would eat it silently (CLAUDE.md boundary check #2). Same-tab
       navigation avoids the question entirely. */
    window.location.href = buildRequestUrl(repo, encodeURIComponent(guide.slug), s);
  }

  /* ── Wiring ──────────────────────────────────────────────────────────────────────────── */

  elCards.forEach((card) => {
    card.addEventListener("click", () => {
      const next = guides.find((g) => g.slug === card.getAttribute("data-cp-card"));
      if (!next || next === guide) return;
      guide = next;
      // A veto and a tab hint both belong to the guide they were made about.
      dropped = new Set();
      section = null;
      renderCards();
      renderFrom();
      renderStarters();
      renderAdvisory();
    });
  });

  if (elFromClear) {
    elFromClear.addEventListener("click", () => {
      section = "";
      renderFrom();
    });
  }

  if (elTextarea) {
    elTextarea.addEventListener("input", () => {
      renderCount();
      if (elErr) elErr.textContent = "";
      window.clearTimeout(settle);
      settle = window.setTimeout(renderAdvisory, SETTLE_MS);
    });
  }

  if (elSend) {
    elSend.textContent = copy.next;
    elSend.addEventListener("click", send);
  }
  if (elFootNote) elFootNote.textContent = copy.foot;

  readQuery();
  renderCards();
  renderFrom();
  renderStarters();
  renderCount();
  renderAdvisory();
}
