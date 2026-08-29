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
 * `baseHref` should already have any existing hash stripped. `activeRoute` is the stable
 * `data-route` of the currently-active station. Positional tab indices are deliberately not
 * accepted because their meaning changes when guide information architecture changes.
 */
export function buildPageUrl(baseHref: string, activeRoute: string | null | undefined): string {
  const publicRoutes = new Set(["days", "food", "explore", "essentials", "sources", "recap", "tools"]);
  return activeRoute && publicRoutes.has(activeRoute) ? baseHref + "#dest-" + activeRoute : baseHref;
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
