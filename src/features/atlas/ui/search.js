// Table view search (D20, README §3, ACCEPTANCE.md Gate 5) — client-enhanced only; the
// no-JS baseline is the search <input> alone, doing nothing until this loads. Lazily fetches
// the build-time index (scripts/build-search-index.ts -> dist/data/search-index.json) on
// first focus or keystroke, matches on `hay` (title + group + stripped body text, not just
// titles), caps results at 40, debounces, and a result opens its guide's section directly
// via the same #sec-<i> anchor the guide page's own hash auto-expand (Stage A.10) already
// wires up — one tap lands on the right section, not just the right tab.

const MIN_CHARS = 2;
const CAP = 40;
const DEBOUNCE_MS = 150;

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function initAtlasSearch(root) {
  const input = root.querySelector("[data-atlas-search]");
  const clearBtn = root.querySelector("[data-atlas-search-clear]");
  const results = root.querySelector("[data-atlas-results]");
  const chips = root.querySelector("[data-atlas-chips]");
  if (!input || !results) return;

  const base = (document.body.dataset.base || "").replace(/\/$/, "");
  let indexPromise = null;
  const loadIndex = () =>
    indexPromise || (indexPromise = fetch(`${base}/data/search-index.json`).then((r) => r.json()).catch(() => []));

  let debounceId = null;

  function render(records) {
    if (!records.length) {
      results.innerHTML = `<p class="atlas-results-empty">No matches.</p>`;
      results.toggleAttribute("data-open", true);
      return;
    }
    results.innerHTML = records
      .slice(0, CAP)
      .map(
        (r) => `<a class="atlas-result" href="${base}/guides/${encodeURIComponent(r.slug)}/#sec-${r.index}">
          <span class="atlas-result-crumb">${escapeHtml(r.crumb)}</span>
          <span class="atlas-result-title">${escapeHtml(r.title)}</span>
          <span class="atlas-result-snippet">${escapeHtml(r.snippet)}</span>
        </a>`,
      )
      .join("");
    results.toggleAttribute("data-open", true);
  }

  async function runQuery() {
    const q = input.value.trim().toLowerCase();
    clearBtn?.toggleAttribute("data-shown", q.length > 0);
    if (chips) chips.hidden = q.length >= MIN_CHARS;
    if (q.length < MIN_CHARS) {
      results.removeAttribute("data-open");
      results.innerHTML = "";
      return;
    }
    const records = await loadIndex();
    const matches = records.filter((r) => r.hay.includes(q));
    render(matches);
  }

  input.addEventListener("focus", () => { loadIndex(); }, { once: true });
  input.addEventListener("input", () => {
    clearTimeout(debounceId);
    debounceId = setTimeout(runQuery, DEBOUNCE_MS);
  });
  clearBtn?.addEventListener("click", () => {
    input.value = "";
    input.focus();
    runQuery();
  });

  /* ── Collapse to an icon (creator, 2026-08-08) ────────────────────────────────────
     The sticky header followed the reader down a list of four trips at ~110px tall. It is
     a 44px toggle now, and the field opens over it.

     The default is set HERE rather than in the markup on purpose: the server ships the
     field expanded and the toggle hidden, so a reader whose JS never arrives gets a plain
     working search box instead of a button wired to nothing. The moment this module runs,
     the toggle appears and the field folds away.

     It re-opens itself whenever there is a query to show — a collapse that could hide live
     results would be a search box that eats what you typed. */
  const head = root.querySelector("[data-atlas-searchhead]") || input.closest(".atlas-tablehead");
  const toggle = root.querySelector("[data-atlas-search-toggle]");
  if (head && toggle) {
    const setOpen = (open, focus) => {
      head.toggleAttribute("data-collapsed", !open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && focus) input.focus();
    };
    toggle.hidden = false;
    setOpen(false, false);

    toggle.addEventListener("click", () => {
      const collapsed = head.hasAttribute("data-collapsed");
      // Collapsing on a live query used to hide the FIELD and leave the results panel behind
      // it — and the collapsed header sets pointer-events:none, so those results were on
      // screen and untappable. The comment above promised this never happened; now it is
      // code. Clearing first is the honest read of "fold the search away".
      if (!collapsed && input.value) { input.value = ""; runQuery(); }
      setOpen(collapsed, true);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      // Escape on a non-empty field clears first, the way a browser's own search input
      // behaves; a second Escape folds it away. Collapsing on the first press would throw
      // away a query the reader may have meant to edit.
      if (input.value) { input.value = ""; runQuery(); return; }
      setOpen(false, false);
      toggle.focus();
    });
    input.addEventListener("blur", () => {
      // Give a click on a result time to land before folding.
      setTimeout(() => {
        if (input.value || head.contains(document.activeElement)) return;
        setOpen(false, false);
      }, 160);
    });
  }
}
