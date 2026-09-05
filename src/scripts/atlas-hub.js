/* Atlas hub page chrome (extracted from index.astro's inline script, 2026-08-14 —
   page behavior belongs in src/scripts/, not the layout/page markup):
   header height var, WORLD|TABLE mode toggle, sheet-row weather boot, skip-link fix. */
import { startLocalClocks, initAtlasWorld } from "../features/atlas/index";
import { initSearch } from "../features/search/index";
import { initDarkToggle } from "./theme.js";
import { initHomeWeather } from "../features/live-data/index.js";

// The strip measures its own height into --hdr-h ("sticky offsets are never literals") —
// the list's sticky head consumes it. On desktop the strip is static inside the frame, so the
// number is only load-bearing on a phone, where the strip is sticky.
const chrome = document.getElementById("chrome");
if (chrome) {
  const setHdrH = () => document.documentElement.style.setProperty("--hdr-h", `${getComputedStyle(chrome).position === "sticky" ? chrome.offsetHeight : 0}px`);
  setHdrH();
  if ("ResizeObserver" in window) new ResizeObserver(setHdrH).observe(chrome);
  window.addEventListener("resize", setHdrH);
}

initSearch(document);
startLocalClocks(document);
initAtlasWorld(document);
initDarkToggle("btnDark");

// WORLD|TABLE toggle (README §"State" mode atlas/ledger) — table is the markup
// default (D4); switch to world once JS is confirmed running, remembering the
// visitor's own last choice.
const MODE_KEY = "tg-atlas-mode";
const modeBtns = document.querySelectorAll("[data-atlas-mode-btn]");
function setMode(mode) {
  document.documentElement.setAttribute("data-atlas-mode", mode);
  modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.atlasModeBtn === mode)));
  try { localStorage.setItem(MODE_KEY, mode); } catch { /* storage unavailable */ }
}
modeBtns.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.atlasModeBtn || "world")));
let initialMode = "world";
try { initialMode = localStorage.getItem(MODE_KEY) || "world"; } catch { /* storage unavailable */ }
setMode(initialMode);

// The horizon strip is the way back to WORLD on a phone (bundle §1b). It is the same
// globe either way — this switches a state, it never remounts anything.
document.querySelector("[data-atlas-horizon]")?.addEventListener("click", () => setMode("world"));

// Current conditions on the sheet rows. Reads the SAME guides payload the globe reads —
// one source for the coordinates, not a second registry (CONTENT IS KING).
const wxJson = document.querySelector("[data-atlas-guides-json]")?.textContent;
if (wxJson) {
  try { initHomeWeather(document, JSON.parse(wxJson)); }
  catch { /* malformed payload — rows simply carry no temperature */ }
}

// "Skip to guides" targets #atlasTable, which world mode hides — so in world mode
// (the JS default) the skip link jumped to a display:none element and did nothing,
// which is the whole failure mode skip links exist to prevent. Switching to the
// table first makes the promise true: the link always lands on the list of guides.
// Found by axe's own skip-link rule ("target should become visible on activation")
// when this page became the hub and entered the a11y gate's page list.
document.querySelectorAll('.skip-link, [data-atlas-show-table]').forEach((a) => a.addEventListener("click", () => setMode("table")));
