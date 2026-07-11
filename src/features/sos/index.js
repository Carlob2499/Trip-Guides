/** sos — one-tap verified emergency numbers (topbar button + sheet).
    Data comes from emergencyFor() (countries.mjs) via tgConfig: verified
    entries win; EU/EEA countries fall back to a warn-toned 112-only sheet;
    everywhere else renders nothing. Importing boots the UI. */
import "./ui/sos.js";
