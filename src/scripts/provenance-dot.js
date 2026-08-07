/** Provenance dot — tap to show/hide source + verification info. */
import { staleness, SHELF_LIFE_DAYS } from "../lib/staleness";

(function () {
  let open = null;
  const close = () => { if (open) { open.removeAttribute("data-open"); open = null; } };

  // design-handoff README.md's notation-layer spec: the popover carries "the claim,
  // ✓ CHECKED <date>, a STALENESS READING, and the source link." Computed on the CLIENT
  // clock each time a popover opens (a build-time judgment would freeze "N days left" at
  // deploy) — same live-clock contract as staleness-ui.js's section-level pill, just
  // rendered inside the popover instead of as a title-row pill.
  function renderStaleness(pop) {
    var existingDt = pop.querySelector(".prov-staleness-label");
    var existingDd = pop.querySelector(".prov-staleness");
    if (existingDt) existingDt.remove();
    if (existingDd) existingDd.remove();
    var date = pop.getAttribute("data-verified-on");
    if (!date) return;
    var cat = pop.getAttribute("data-shelf-life");
    if (!cat || !Object.prototype.hasOwnProperty.call(SHELF_LIFE_DAYS, cat)) cat = "default";
    var s = staleness(date, cat, new Date());
    if (!s) return;
    var life = SHELF_LIFE_DAYS[cat];
    var text = null, warn = false;
    if (s.stale) {
      text = "⚠ " + s.ageDays + " DAYS OLD — " + (s.ageDays - life) + " PAST ITS " + cat.toUpperCase() + " SHELF LIFE";
      warn = true;
    } else if (s.remainingDays <= life / 3) {
      // "Inside the last third" of shelf life — a heads-up, not yet a downgrade.
      text = "AGEING — " + s.remainingDays + " DAYS OF SHELF LIFE LEFT";
    }
    if (!text) return; // well within shelf life — nothing extra to say, per the honest-blank rule
    // <dt>/<dd>, not a bare <div> — a <dl> mixing loose dt/dd with a wrapping div violates
    // the HTML5 content model (all-loose or all-wrapped, never both).
    var dt = document.createElement("dt");
    dt.className = "prov-staleness-label";
    dt.textContent = "Status";
    var dd = document.createElement("dd");
    dd.className = "prov-staleness" + (warn ? " prov-staleness--warn" : "");
    dd.textContent = text;
    // Right after "Checked <date>" (the first dt/dd pair), before Source — the spec's order.
    var firstDd = pop.querySelector("dd");
    if (firstDd) { firstDd.insertAdjacentElement("afterend", dd); firstDd.insertAdjacentElement("afterend", dt); }
    else { pop.prepend(dd); pop.prepend(dt); }
  }

  document.addEventListener("click", (e) => {
    const dot = e.target.closest(".prov-dot");
    if (!dot) { close(); return; }
    e.stopPropagation();
    const pop = dot.nextElementSibling;
    if (!pop || !pop.classList.contains("prov-popover")) return;
    if (pop === open) { close(); return; }
    close();
    renderStaleness(pop);
    const rect = dot.getBoundingClientRect();
    pop.style.top = `${rect.bottom + window.scrollY + 6}px`;
    pop.style.left = `${Math.max(8, rect.left + window.scrollX - 80)}px`;
    pop.setAttribute("data-open", "");
    open = pop;
  });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
})();
