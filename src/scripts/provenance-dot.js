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
    // SPEC-COMPONENTS §2's popover order, "no exceptions": the claim → ✓ CHECKED <date> →
    // the staleness reading → the source link. Found by the "Checked" label, NOT by taking
    // the first dd — the popover now leads with the kicker/claim pair (ProvenancePopover.astro,
    // Stage A.6), so "first dd" is the claim and inserting there put staleness one row early.
    var checkedDd = null;
    var dts = pop.querySelectorAll("dt");
    for (var i = 0; i < dts.length; i++) {
      if (dts[i].textContent === "Checked") { checkedDd = dts[i].nextElementSibling; break; }
    }
    if (checkedDd) { checkedDd.insertAdjacentElement("afterend", dd); checkedDd.insertAdjacentElement("afterend", dt); }
    else { pop.prepend(dd); pop.prepend(dt); }
  }

  function openBelow(anchor, pop) {
    close();
    renderStaleness(pop);
    const rect = anchor.getBoundingClientRect();
    pop.style.top = `${rect.bottom + window.scrollY + 6}px`;
    // SPEC-COMPONENTS §2's exact viewport clamp: left = max(12px, min(anchorX - 160,
    // innerWidth - 340)). The right-edge term is what the old `max(8, x - 80)` lacked —
    // without it a popover opened near the right edge overflowed the viewport on mobile.
    // (340 = the popover's 300px max-width + margin, per the spec's own arithmetic.)
    // Clamped in VIEWPORT coordinates (rect.left vs innerWidth — same space), then shifted
    // by scrollX into the page coordinates position:absolute actually uses.
    pop.style.left = `${Math.max(12, Math.min(rect.left - 160, window.innerWidth - 340)) + window.scrollX}px`;
    pop.setAttribute("data-open", "");
    open = pop;
  }

  // D10/Stage A.7: renderFactValue (facts.mjs) can't emit a <dl> — prose only allows
  // <p b i a ul li ol br> (prose-html.ts) — so the ≈ flag-chip ships as a real <a> straight to
  // its source_url (works with zero JS) and this builds the SAME .prov-popover shape
  // ProvenancePopover.astro renders server-side, from the chip's own data-* attributes. Every
  // field is REQUIRED on a fact record (content.config.ts's factRecord schema), so nothing here
  // needs an absence guard the way the server-rendered popover's NO PUBLIC SOURCE branch does.
  function buildChipPopover(chip) {
    const dl = document.createElement("dl");
    dl.className = "prov-popover";
    dl.setAttribute("data-verified-on", chip.getAttribute("data-verified-on") || "");
    dl.setAttribute("data-shelf-life", chip.getAttribute("data-shelf-life") || "default");
    function pair(dtText, dtClass, ddNode, ddClass) {
      const dt = document.createElement("dt");
      if (dtClass) dt.className = dtClass;
      dt.textContent = dtText;
      const dd = document.createElement("dd");
      if (ddClass) dd.className = ddClass;
      if (typeof ddNode === "string") dd.textContent = ddNode; else dd.appendChild(ddNode);
      dl.append(dt, dd);
    }
    pair("Where this came from", "prov-kicker", chip.getAttribute("data-claim") || "", "prov-claim");
    pair("Checked", null, chip.getAttribute("data-verified-on") || "");
    // Always present: a chip only exists for a fact-registry row, and factRecord REQUIRES
    // source_url (content.config.ts) — so unlike ProvenancePopover.astro's server-rendered
    // popover (whose sight/venue items CAN lack a source), there is no NO PUBLIC SOURCE
    // branch here; one existed and was dead code, removed in the Stage A/B review pass.
    const src = chip.getAttribute("data-source-url");
    const a = document.createElement("a");
    a.href = src; a.target = "_blank"; a.rel = "noopener";
    a.textContent = (() => { try { return new URL(src).hostname + " ↗"; } catch (e) { return src; } })();
    pair("Source", null, a);
    const tier = chip.getAttribute("data-tier");
    if (tier) pair("Evidence", null, tier);
    chip.insertAdjacentElement("afterend", dl);
    return dl;
  }

  document.addEventListener("click", (e) => {
    const dot = e.target.closest(".prov-dot");
    const chip = !dot ? e.target.closest("a.flag-chip[data-claim]") : null;
    if (!dot && !chip) { close(); return; }
    e.stopPropagation();

    if (chip) {
      // Never navigate once JS is live — the popover's own Source row carries the real link,
      // one tap further in, exactly like .prov-dot's popover already works.
      e.preventDefault();
      if (chip._provPop === open) { close(); return; }
      const pop = chip._provPop || (chip._provPop = buildChipPopover(chip));
      openBelow(chip, pop);
      return;
    }

    const pop = dot.nextElementSibling;
    if (!pop || !pop.classList.contains("prov-popover")) return;
    if (pop === open) { close(); return; }
    openBelow(dot, pop);
  });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
})();
