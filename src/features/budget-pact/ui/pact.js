/* Budget pact — DOM half (decisions in ../model/pact.ts). Reads the Budget tab's own
   plan (`.brow[data-basis][data-rate]`) and its own "your spend" inputs (`.bactual`,
   already wired by guide-ui.js's budget calculator) for the SAME `.budget` section —
   no cross-silo reach into Trip Split. Renders one honest line under the total row;
   absent until at least one real actual is entered (never a guessed $0). */

import { computeBudgetPact } from "../model/pact";
import { tripWindow } from "../../../lib/trip-dates";

function fmt(cur, n) {
  return cur + Math.round(n).toLocaleString("en-US");
}

export function initBudgetPact(cfg) {
  const budgets = document.querySelectorAll(".budget");
  if (!budgets.length) return;

  const now = new Date();
  const win = tripWindow(cfg && cfg.firstDayDate, cfg && cfg.lastDayDate, now);
  const daysElapsed = win.hasDates ? Math.max(0, -win.daysUntilStart + 1) : 0;

  budgets.forEach((bud) => {
    const cur = bud.getAttribute("data-cur") || "$";
    const days = parseFloat(bud.getAttribute("data-days")) || 1;
    const rows = Array.prototype.slice.call(bud.querySelectorAll(".brow[data-basis]"));
    if (!rows.length) return;

    const items = rows.map((row) => {
      const basis = row.getAttribute("data-basis");
      const rate = parseFloat(row.getAttribute("data-rate"));
      const trip = parseFloat(row.getAttribute("data-trip"));
      return { basis: basis === "day" ? "day" : "trip", est: basis === "day" ? rate : trip };
    });

    const inputs = Array.prototype.slice.call(bud.querySelectorAll(".bactual"));
    if (!inputs.length) return;

    const pactEl = document.createElement("p");
    pactEl.className = "budget-pact";
    pactEl.hidden = true;
    const grid = bud.querySelector(".budget-grid");
    if (grid) grid.insertAdjacentElement("afterend", pactEl);
    else bud.appendChild(pactEl);

    function render() {
      const actualSoFar = inputs.reduce((sum, inp) => {
        const v = parseFloat(inp.value);
        return isNaN(v) ? sum : sum + v;
      }, 0);
      const result = computeBudgetPact({ items, days, daysElapsed, actualSoFar, currency: cur });
      if (!result) {
        pactEl.hidden = true;
        return;
      }
      pactEl.hidden = false;
      pactEl.classList.toggle("budget-pact-over", result.status === "over");
      if (result.status === "on") {
        pactEl.textContent = `${result.dayLabel}: right on plan (${fmt(cur, result.planSoFar)}).`;
      } else {
        pactEl.textContent = `${result.dayLabel}: ${fmt(cur, result.deltaAmount)} ${result.status} plan (${fmt(cur, result.actualSoFar)} spent vs. ${fmt(cur, result.planSoFar)} planned so far).`;
      }
    }

    inputs.forEach((inp) => inp.addEventListener("input", render));
    render();
  });
}
