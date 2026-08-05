/** hub — the home-page behaviors: guide grid + dark-mode toggle. Importing boots all of it.

    A2: dark-toggle used to be an `is:inline` script in index.astro — moved here as a real
    module so it imports the shared initDarkToggle helper instead of duplicating it inline.
    R4 (2026-08-05): the new-guide modal + wizard that also booted here moved to the /new
    page (ui/intake-flow.js + ui/intake-submit.js) — the hub's "＋ New guide" is a plain
    link now, so nothing intake-related loads on the hub at all. */
import "./ui/hub.js";
import { initDarkToggle } from "../../scripts/theme.js";

initDarkToggle("btnDark");
