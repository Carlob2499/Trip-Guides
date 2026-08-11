/* The fold's only script: toggle on click, and keep aria-expanded honest.

   Hover is CSS-only (fold.css) and deliberately does NOT write aria-expanded — hovering is not
   a state a screen-reader user is in, and reporting "expanded" because a mouse happened to pass
   over the element would describe a page nobody is looking at.

   Delegated from the document rather than bound per fold: folds are rendered inside day cards,
   Panels and tool screens, several of which are built after this runs, and a per-element
   listener would miss every one of those. */
export function initFolds(root) {
  const doc = root || document;

  doc.addEventListener("click", (e) => {
    const btn = e.target.closest ? e.target.closest("[data-fold-btn]") : null;
    if (!btn || !doc.contains(btn)) return;
    const region = doc.getElementById(btn.getAttribute("aria-controls"));
    if (!region) return;
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", open ? "false" : "true");
    if (open) region.removeAttribute("data-open");
    else region.setAttribute("data-open", "");
  });

  /* Print force-opens every fold in CSS, but aria-expanded is an attribute and CSS cannot write
     it — so a fold printed open would still announce itself as collapsed to anything reading
     the DOM. Sync it around the print, and put it back after: the reader's own open/closed
     choices survive printing. */
  if (typeof window !== "undefined" && window.matchMedia) {
    const before = [];
    window.addEventListener("beforeprint", () => {
      before.length = 0;
      doc.querySelectorAll("[data-fold-btn]").forEach((b) => {
        before.push([b, b.getAttribute("aria-expanded")]);
        b.setAttribute("aria-expanded", "true");
      });
    });
    window.addEventListener("afterprint", () => {
      before.forEach(([b, v]) => {
        if (v === null) b.removeAttribute("aria-expanded");
        else b.setAttribute("aria-expanded", v);
      });
      before.length = 0;
    });
  }
}
