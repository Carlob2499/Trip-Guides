/** Provenance dot — tap to show/hide source + verification info. */
(function () {
  let open = null;
  const close = () => { if (open) { open.removeAttribute("data-open"); open = null; } };

  document.addEventListener("click", (e) => {
    const dot = e.target.closest(".prov-dot");
    if (!dot) { close(); return; }
    e.stopPropagation();
    const pop = dot.nextElementSibling;
    if (!pop || !pop.classList.contains("prov-popover")) return;
    if (pop === open) { close(); return; }
    close();
    const rect = dot.getBoundingClientRect();
    pop.style.top = `${rect.bottom + window.scrollY + 6}px`;
    pop.style.left = `${Math.max(8, rect.left + window.scrollX - 80)}px`;
    pop.setAttribute("data-open", "");
    open = pop;
  });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
})();
