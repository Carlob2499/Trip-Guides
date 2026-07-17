/* Pure link/text building for the share panel — no DOM, no clipboard, no QR lib.
   Extracted from guide-ui.js's share-panel IIFE, where this string formatting sat next
   to a real bug: the summary button's click handler referenced `pageUrl`, a variable
   `var`-declared inside a SIBLING function (openShare) — function-scoped, so it was
   simply undefined unless the share modal had already been opened first. Clicking
   "Share trip summary" cold threw `ReferenceError: pageUrl is not defined` and the
   feature did nothing. Reproduced live before fixing: see the Phase 5 commit. */

/**
 * The URL to share for the section currently in view. Tabs switch panel visibility
 * without changing the URL, so the link has to be built fresh from the active tab
 * rather than read off `location.href` — otherwise every share link points at whatever
 * section happened to be open on first load.
 *
 * `baseHref` should already have any existing hash stripped. `activeTabDataAttr` is the
 * `data-tab` attribute of the currently-active `.gtab` element, or null/undefined if
 * none is active (a special panel like Budget, or nothing selected yet) — only a
 * NUMBERED content tab gets a `#grp-N` deep link; special panels share the base URL.
 */
export function buildPageUrl(baseHref: string, activeTabDataAttr: string | null | undefined): string {
  const t = activeTabDataAttr;
  return t && /^\d+$/.test(t) ? baseHref + "#grp-" + t : baseHref;
}

export function buildWhatsAppShareUrl(pageUrl: string): string {
  return "https://wa.me/?text=" + encodeURIComponent(pageUrl);
}

export function buildMailtoUrl(pageTitle: string, pageUrl: string): string {
  return "mailto:?subject=" + encodeURIComponent(pageTitle) + "&body=" + encodeURIComponent(pageUrl);
}

/** Text handed to the OS share sheet or the clipboard when "Share trip summary" fires. */
export function buildSummaryShareText(summaryText: string, pageUrl: string): string {
  return summaryText + "\n\n" + pageUrl;
}
