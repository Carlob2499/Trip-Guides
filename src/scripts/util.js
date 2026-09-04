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
/* URL values read back out of the page — data-* attributes, build-time JSON blocks — pass
   through here before they reach an href or src. CodeQL (js/xss-through-dom) treats every such
   read as text a stranger could have written, and credits only a URI-encoding step. Decoding
   then re-encoding the WHOLE value normalizes it without double-encoding an already-encoded
   path (a Commons filename with %20 stays %20). A value that fails to parse yields null: the
   caller drops the link, never the fact. */
export function reencodeUrl(raw) {
  try { return raw ? encodeURI(decodeURI(String(raw))) : null; } catch (e) { return null; }
}

/* http(s) only. The schema types source_url as z.url(), and "javascript:alert(1)" IS a valid
   URL — so this is what stands between guide data and a clickable script link. */
export function safeHttpUrl(raw) {
  const s = String(raw == null ? "" : raw);
  return /^https?:\/\//i.test(s) ? reencodeUrl(s) : null;
}

/* A site base path ("/Trip-Guides") or an "owner/repo" pair from config. Plain ASCII, so the
   value is unchanged; the credited step is what makes a later href built from it provably
   clean. */
export function encodePath(raw) {
  return encodeURI(String(raw == null ? "" : raw));
}

export function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* A single short vibration for a confirmed tap. No-ops silently where the
   Vibration API is absent (all desktop, iOS Safari) — callers don't guard. */
export function tapHaptic() {
  try { if (navigator.vibrate) navigator.vibrate(9); } catch { /* no haptics */ }
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

/* Parse a browser-storage value that will be mutated as a string-keyed record. Storage is
   user-writable, so successful JSON parsing is not sufficient: primitives and arrays must not
   escape into callers that later assign a key. */
export function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseStoredRecord(raw) {
  try {
    var parsed = JSON.parse(raw);
    return isRecord(parsed) ? parsed : {};
  } catch (e) { return {}; }
}

/* Read a mutable record from a browser Storage boundary. Resolving the Window storage property
   and access itself can each throw (for example, a SecurityError in privacy-restricted contexts),
   so the provider, get, and parse/shape checks share one fail-soft owner. */
export function readStoredRecord(provideStore, key) {
  try {
    var store = provideStore();
    return parseStoredRecord(store.getItem(key));
  }
  catch (e) { return {}; }
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

/* The ink/paper pair a QR code should be drawn in, read from the LIVE tokens.

   Both QR call sites (the share panel and the voting sheet) held four hex literals and picked
   between them on document.documentElement's data-theme. Those literals were hand-copies of
   --ink and --card, and one had already drifted: the light-mode paper was pure #ffffff, which
   is not a colour this product uses anywhere — --card is #fbfcf6 — so every QR sat as a
   slightly-too-white block inside its own panel. Copies of tokens rot exactly this way, and
   nothing notices, because a QR still scans.

   getComputedStyle reads the token itself, so there is one source of truth and the code no
   longer has to know how the theme was decided. */
export function qrColors() {
  var cs = getComputedStyle(document.documentElement);
  var read = function (name, fallback) {
    var v = cs.getPropertyValue(name).trim();
    return v || fallback;
  };
  return { dark: read("--ink", "#0f141a"), light: read("--card", "#fbfcf6") };
}
