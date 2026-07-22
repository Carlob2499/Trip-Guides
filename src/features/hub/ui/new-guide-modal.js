/* Waypoint hub — the "Make a new guide" modal: open/close/backdrop/Escape/focus-trap, and
   the submit handler that builds the prefilled GitHub issue URL and sends this tab to the
   live progress tracker. (The multi-step FORM inside the modal — step navigation, field
   carving — is wizard.js; this is the modal shell around it.)

   A2: extracted from an `is:inline define:vars={{ base }}` script in index.astro (~95 lines
   of inline script, alongside a duplicate dark-mode-toggle implementation — see theme.js).
   `define:vars` requires `is:inline`, which disables Astro's script processing (no imports,
   no shared modules) — that's why this used to duplicate trapFocus's logic inline instead of
   importing the shared helper. As a real module it can now import both shared helpers
   properly. `base` (the site's BASE_URL) is no longer threaded via define:vars; it's read
   from `document.body.dataset.base`, the same data-attribute convention storeKey/
   legacyStoreKey already use on the guide pages. */

import { trapFocus } from "../../../scripts/util.js";

export function initNewGuideModal() {
  const base = document.body.getAttribute("data-base") || "";
  const openBtn = document.getElementById("btnNewGuide");
  const modal = document.getElementById("ngModal");
  const backdrop = document.getElementById("ngBackdrop");
  const closeBtn = document.getElementById("ngClose");
  const form = document.getElementById("ngForm");
  const errEl = document.getElementById("ngErr");
  if (!openBtn || !modal) return;
  const repo = modal.getAttribute("data-repo");

  function openModal() {
    modal.removeAttribute("hidden");
    if (backdrop) backdrop.classList.add("open");
    const c = document.getElementById("ngCountry");
    if (c) c.focus();
  }
  function closeModal() {
    modal.setAttribute("hidden", "");
    if (backdrop) backdrop.classList.remove("open");
    openBtn.focus();
  }
  openBtn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (backdrop) backdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hasAttribute("hidden")) closeModal();
  });
  // R3: shared trap (src/scripts/util.js) — this modal claimed aria-modal without actually
  // trapping focus until this extraction made a real `import` possible.
  trapFocus(modal, function () { return !modal.hasAttribute("hidden"); });

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const country = val("ngCountry");
      if (!country) {
        if (errEl) { errEl.textContent = "Country is required."; errEl.removeAttribute("hidden"); }
        return;
      }
      const dates = [val("ngStart"), val("ngEnd")].filter(Boolean).join(" to ");
      const params = new URLSearchParams();
      params.set("template", "new-guide.yml");
      params.set("labels", "new-guide");
      params.set("title", "New guide: " + country);
      params.set("country", country);
      params.set("cities", val("ngCities"));
      params.set("dates", dates);
      params.set("anchor", val("ngAnchor"));
      params.set("travelers", val("ngTravelers"));
      params.set("party", val("ngParty"));
      params.set("pace", val("ngPace"));
      params.set("travel-style", val("ngTravelStyle"));
      params.set("priority1", val("ngPriority1"));
      params.set("priority2", val("ngPriority2"));
      params.set("priority3", val("ngPriority3"));
      params.set("niche", val("ngNiche"));
      params.set("budget", val("ngBudget"));
      params.set("comments", val("ngComments"));
      const url = "https://github.com/" + repo + "/issues/new?" + params.toString();
      window.open(url, "_blank", "noopener");
      closeModal();

      // Send THIS tab straight to the live progress tracker — the one unavoidable manual
      // step is clicking "Submit new issue" in the other tab; everything else, including
      // watching it happen, needs no further input. The slug here is only a best-effort
      // guess (mirrors scaffold-guide.mjs's slugify(); a same-name collision appends "-2"
      // server-side) — the progress page itself handles a wrong guess with a manual
      // correction input, and the bot's issue comment always carries the authoritative link.
      const guessSlug = country.normalize("NFKD").replace(/[̀-ͯ]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "guide";
      location.href = base + "/progress/?slug=" + encodeURIComponent(guessSlug) +
        "&country=" + encodeURIComponent(country);
    });
  }
}
