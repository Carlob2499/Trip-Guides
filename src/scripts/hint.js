/* Hint bubbles on touch — the one thing CSS cannot do for src/components/Hint.astro.

   Hover and keyboard focus are handled entirely in the stylesheet, so this script exists
   for exactly one case: a finger, which has no hover state. It toggles `data-open` on tap,
   closes on Escape or on a tap anywhere else, and closes any other open hint first so two
   bubbles can never overlap.

   Deliberately delegated from the document rather than bound per hint: hints are rendered
   by several components across several pages, and a per-element loop would miss any that
   arrive after load. */

function closeAll(except) {
  document.querySelectorAll("[data-hint][data-open]").forEach((h) => {
    if (h === except) return;
    h.removeAttribute("data-open");
    h.querySelector("[data-hint-btn]")?.setAttribute("aria-expanded", "false");
  });
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest?.("[data-hint-btn]");
  if (!btn) { closeAll(null); return; }
  const hint = btn.closest("[data-hint]");
  if (!hint) return;
  // The button is often inside a larger control (a Panel header, a tab). Asking what
  // something is must not also activate it.
  e.preventDefault();
  e.stopPropagation();
  const open = !hint.hasAttribute("data-open");
  closeAll(hint);
  hint.toggleAttribute("data-open", open);
  btn.setAttribute("aria-expanded", open ? "true" : "false");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAll(null);
});
