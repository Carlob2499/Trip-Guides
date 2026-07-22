/** hub — the home-page behaviors: guide grid, dark-mode toggle, the new-guide modal
    shell + its New Guide wizard. Import order (hub before wizard) preserved from the
    original page. Importing boots all of it.

    A2: dark-toggle + the modal shell used to be an `is:inline` script in index.astro
    (~95 lines, including a duplicate dark-mode-toggle implementation) — moved here as
    real modules so they can import the shared trapFocus/initDarkToggle helpers instead
    of duplicating them inline. */
import "./ui/hub.js";
import { initDarkToggle } from "../../scripts/theme.js";
import { initNewGuideModal } from "./ui/new-guide-modal.js";
import "./ui/wizard.js";

initDarkToggle("btnDark");
initNewGuideModal();
