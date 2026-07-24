/**
 * Pure vote-link codec — the base64url ↔ vote-state round-trip behind the "Copy vote link" /
 * QR share and the `?vote=` hydrate. Extracted from Voting's DOM script so the encoding (the
 * same class of round-trip that had a real bug in the share panel) is tested without a DOM.
 *
 * base64URL (not plain base64) on purpose: the value rides in a query string, where `+` `/` `=`
 * would be mangled. `?vote=` uses a query param, NOT location.hash, because guide-ui's tab
 * router runs `document.querySelector(location.hash)` and a base64 blob there would throw.
 */

export interface VoteState {
  options: { text: string; votes: number }[];
}

/** A parsed value is a usable vote state only if it carries an `options` array. */
export function isVoteState(x: unknown): x is VoteState {
  return !!x && typeof x === "object" && Array.isArray((x as { options?: unknown }).options);
}

/** Encode a vote state to the URL-safe `?vote=` payload. */
export function encodeVote(state: unknown): string {
  return toB64Url(JSON.stringify(state));
}

/** Decode a `?vote=` payload back to a validated vote state, or null on any garbage/parse error. */
export function decodeVote(param: string): VoteState | null {
  try {
    const parsed = JSON.parse(fromB64Url(param));
    return isVoteState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/* `escape`/`unescape` below are flagged deprecated by TypeScript. They stay ON PURPOSE.
   This is the canonical UTF-8-safe base64 idiom: btoa() throws on any code point above U+00FF, so
   accented, Korean, and emoji trip data has to be squeezed into the latin1 range first, and
   unescape(encodeURIComponent(…)) does exactly that. The pair is symmetric and lossless.
   Do not "modernize" this casually: vote links ALREADY SHARED with other people were encoded by
   this exact function, and a TextEncoder rewrite that differs in any edge case silently breaks
   every link in the wild. Deprecated-but-correct beats modern-but-subtly-different here. If it is
   ever replaced, do it behind round-trip tests that decode links produced by THIS implementation. */
function toB64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64Url(b64url: string): string {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return decodeURIComponent(escape(atob(b64)));
}
