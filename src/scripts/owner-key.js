/* The creator's backend key, stored in THIS browser only.

   Batch 3 moved the change pipeline's authorization out of GitHub (the deleted
   `modify-approved` / `revision-approved` labels) and into the Worker's `X-Owner-Key` header.
   The site is static and anonymous, so there is nowhere to authenticate against — the key is a
   secret the creator pastes once and this module keeps in localStorage, exactly like the theme
   preference next to it, and every owner-only control stays hidden until one is stored.

   Three rules the callers depend on:
     · NEVER render it back. `hasOwnerKey()` is what UI asks; `readOwnerKey()` exists only to put
       the value straight into a request header. No input is ever pre-filled with it, so a stored
       key can't be read off a shared screen or a screenshot.
     · It EXPIRES. localStorage is forever and is shared across every page on the origin, and
       `*.github.io` is one origin for every user's Pages site — so a key left there is a
       credential sitting on a shared origin with no end date, on a laptop that gets lent, sold or
       borrowed. Thirty days, then it is gone and the owner pastes it again (or rotates it —
       worker/README.md). A short-lived copy is the difference between "leaked to whoever has this
       browser next" and "leaked for a month at most".
     · Every access is try/caught. localStorage throws outright in Safari private mode and under
       some cookie-blocking settings, and an owner-only affordance is never worth taking the page
       down for — an unreadable store simply reads as "no key", i.e. the public experience.

   Cross-cutting client behavior, so it sits flat in src/scripts/ (CLAUDE.md) rather than inside
   one feature: the guide page's ✎ flow, the progress page's answer controls and the owner's
   triage queue all need it, and none of them owns it. */

const STORAGE_KEY = "wp-owner-key";
/** A key short enough to be a typo is more likely a mis-paste than a secret. Rejecting it at the
    input is a better error than a silent 401 from the Worker on every later action. This is a
    PASTE guard, not the security boundary: the Worker's own OWNER_KEY_MIN_LEN (32, in
    scripts/worker-api.mjs) is the authority and reports a shorter key as WEAK on /health. */
export const OWNER_KEY_MIN = 16;

/** How long a pasted key stays usable in this browser. Long enough not to be a chore, short
    enough that a forgotten key on a shared machine stops working on its own. */
export const OWNER_KEY_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Reads the stored `{key, exp}` entry, or "" — including when it has expired, in which case the
    entry is REMOVED on the way out rather than left to be read again. Anything that is not a
    live, well-formed entry (a legacy bare-string key from before expiry existed, a hand-edited
    value, half-written JSON) is treated as expired: an entry whose age cannot be established
    cannot be shown to be within the window, and re-pasting costs the owner one paste. */
export function readOwnerKey() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return "";
    let entry = null;
    try { entry = JSON.parse(stored); } catch { entry = null; }
    const key = entry && typeof entry.key === "string" ? entry.key : "";
    const exp = entry && typeof entry.exp === "number" ? entry.exp : 0;
    if (!key || !(exp > Date.now())) {
      clearOwnerKey();
      return "";
    }
    return key;
  } catch {
    return "";
  }
}

export function hasOwnerKey() {
  return readOwnerKey() !== "";
}

/** Returns true when the key was accepted and stored. A blank/short value is rejected rather
    than stored, so "saved" always means "will actually authenticate". Storing (re-pasting the
    same key included) restarts the 30-day clock. */
export function storeOwnerKey(raw) {
  const key = String(raw ?? "").trim();
  if (key.length < OWNER_KEY_MIN) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ key, exp: Date.now() + OWNER_KEY_TTL_MS }));
    return true;
  } catch {
    return false;
  }
}

export function clearOwnerKey() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear if the store is unreachable */
  }
}
