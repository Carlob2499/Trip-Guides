/* Shared client helpers. Bundled once by Astro across the modules that import
   it (guide bundle + hub bundle), so this is the single home for the tiny
   cross-module checks that were previously copy-pasted per file. */

/* Escape a string for interpolation into HTML. Escapes BOTH quote styles — callers
   build markup with single- AND double-quoted attributes, and the per-module copies
   this replaces had drifted (none escaped single quotes, which let user-typed text in
   the shared rooms break out of single-quoted attributes). */
export function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* True when the visitor has asked the OS to minimize motion. Callers gate
   every non-essential animation / smooth-scroll behind this. */
export function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* A single short vibration for a confirmed tap. No-ops silently where the
   Vibration API is absent (all desktop, iOS Safari) — callers don't guard. */
export function tapHaptic() {
  try { navigator.vibrate && navigator.vibrate(9); } catch (e) {}
}

/* R8: one-time storage-key migration. storeKey moved from title-derived to
   slug-derived (so two similarly-titled guides can no longer collide and share
   storage) — this copies a returning visitor's existing value from the OLD
   (title-derived) key to the NEW (slug-derived) one, once, the first time each
   key is read under the new name. No-ops (including when legacyKey === newKey,
   the common case for every guide whose slug already equals its normalized
   title) or when the new key already has a value — never overwrites live data. */
export function migrateStorageKey(store, newKey, legacyKey) {
  if (!legacyKey || legacyKey === newKey) return;
  try {
    if (store.getItem(newKey) != null) return; // new key already has data — nothing to migrate
    var old = store.getItem(legacyKey);
    if (old != null) store.setItem(newKey, old);
  } catch (e) { /* storage unavailable — nothing we can do, and nothing to lose */ }
}

/* R3: shared focus-trap for any dialog/sheet that claims aria-modal — extracted from the
   mobile sheet's own Tab-wrap handler, which was the only one of four aria-modal dialogs
   that actually trapped focus (lightbox, SOS, the address card, and the new-guide modal
   all claimed it in markup and didn't). Wires a keydown listener on `document` that, while
   `isOpen()` reports true, wraps Tab/Shift+Tab between the container's first and last
   focusable element — so focus can never silently escape into the page behind an open
   modal. Returns a teardown function; callers wire it once at open-time (or once at
   module init, gated by `isOpen`) and call the returned function on close/unmount.

   Deliberately does NOT own Escape-to-close — every caller already has its own Escape
   handler with dialog-specific behavior (some also restore focus, some close a sibling
   sheet first), so this stays a single-purpose trap, not a whole dialog controller. */
export function trapFocus(container, isOpen) {
  function handler(e) {
    if (e.key !== "Tab" || !isOpen()) return;
    var focusables = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    var first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener("keydown", handler);
  return function teardown() { document.removeEventListener("keydown", handler); };
}

/* Today's calendar date AT THE DESTINATION (IANA tz), not on the device —
   "today" for a trip means the traveler's day in-country (WayFinder
   retrospective: using the device clock breaks today-semantics for anyone
   checking the guide from another timezone). Returns {y, m (1-12), d}, or
   null when tz is absent/invalid (callers fall back to the device date).
   `now` is injectable for tests. */
export function todayInTz(tz, now) {
  if (!tz) return null;
  try {
    var parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now || new Date());
    var get = function (t) { return Number((parts.find(function (p) { return p.type === t; }) || {}).value); };
    var y = get("year"), m = get("month"), d = get("day");
    return y && m && d ? { y: y, m: m, d: d } : null;
  } catch (e) { return null; }
}
