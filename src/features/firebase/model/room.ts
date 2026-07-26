/* Room identity + write-failure classification. Pure, so both are testable without Firebase.

   Both functions here exist because of one incident, and it is worth stating plainly so nobody
   reinstates either behaviour:

   `roomId()` used to fall back to the guide's storeKey when a guide declared no roomId — the
   comment said legacy guides would then be "frozen read-only", and that was true, but only
   because rules.json requires a 16–40 char room code and a slug like "denmark" is 7. So every
   write was denied. Combined with a swallowed `.catch`, Trip Split's "+ Add person" did nothing
   at all: RTDB applies a write locally first, so a row appeared, the server rejected it, the row
   vanished, and no message reached the user or the console. A fallback that produces a value the
   server will always reject is not a fallback. It is a slow failure wearing a helpful face.

   So: no fallback. An invalid or absent roomId yields "" — local-only, which is the documented
   behaviour when sync is unconfigured — and scripts/__tests__/guide-room-id.test.mjs fails the
   build before a guide can ship without one. */

/** rules.json's own constraint, mirrored: the room code is the only thing protecting a trip's
    budget once anyone can sign in anonymously, so a short guessable one is a security bug. */
export const ROOM_ID_RE = /^[a-z0-9]{16,40}$/;

export function isValidRoomId(value: unknown): boolean {
  return typeof value === "string" && ROOM_ID_RE.test(value);
}

/** A `#room=<code>` URL-fragment override, or "" if the fragment carries none/an invalid one.
 *
 *  M5 (creator-requested): the zero-setup default stays — a guide's committed `roomId` is what
 *  makes group sync work with no accounts and no setup, and that tradeoff is settled. This is
 *  the OPT-IN alternative for a group that wants the room private: generate a code
 *  (`scripts/gen-room-id.mjs`), share the link privately, and the code never enters the repo.
 *  A URL fragment is the right carrier precisely because browsers never send it to a server —
 *  it stays between the people holding the link. Same 16–40 char validation as any other room
 *  code, so a short guessable one can't sneak in through the URL either. */
export function parseRoomHash(hash: unknown): string {
  if (typeof hash !== "string" || !hash) return "";
  const m = /(?:^#|&|^)room=([^&]+)/.exec(hash);
  if (!m) return "";
  let code: string;
  try {
    code = decodeURIComponent(m[1]);
  } catch {
    return ""; // a malformed %-escape is not a room code
  }
  return isValidRoomId(code) ? code : "";
}

/** The room this guide syncs to, or "" for local-only. NEVER derives one from the storeKey.
 *  A valid `#room=` override wins over the guide's committed roomId — that is the whole point
 *  of the override; called with one argument it behaves exactly as it always has. */
export function resolveRoomId(
  cfg: { roomId?: unknown; storeKey?: unknown } | null | undefined,
  hash?: unknown,
): string {
  const override = parseRoomHash(hash);
  if (override) return override;
  const id = cfg && cfg.roomId;
  return isValidRoomId(id) ? (id as string) : "";
}

/** Days after the trip's last day before the shared room stops accepting edits from this
 *  client. Long enough to settle up after getting home, short enough that the record stops
 *  drifting while nobody is looking. */
export const POST_TRIP_GRACE_DAYS = 14;

/** Is this trip far enough past that its room should be READ-ONLY on the client?
 *
 *  M5 (creator's question — "what use is a room code post-trip?"): the answer is that the room
 *  stops being a live scratchpad and becomes the trip's financial record — it still feeds the
 *  recap and the Plan⇄Actual view. Locking is what protects that record: the numbers stay
 *  visible forever, but nothing new can be typed into a settled trip months later, and a
 *  publicly-committed room code stops being a standing write invitation once the trip is over.
 *
 *  Deliberately CLIENT-side only: it hides and disables the write UI, it does not touch the
 *  database or its rules, so no existing data can be altered or lost by this feature. A
 *  rules-level freeze is a possible later hardening, noted in the plan.
 *
 *  Returns false whenever the end date is unknown — an undated guide is never locked, because
 *  guessing "probably over" about someone's live trip would be the worse failure. */
export function isPostTripLocked(
  tripEnd: Date | null | undefined,
  now: Date,
  graceDays: number = POST_TRIP_GRACE_DAYS,
): boolean {
  if (!(tripEnd instanceof Date) || isNaN(tripEnd.getTime())) return false;
  if (!(now instanceof Date) || isNaN(now.getTime())) return false;
  const unlockUntil = new Date(tripEnd.getTime());
  unlockUntil.setDate(unlockUntil.getDate() + graceDays);
  // End-of-day on the final grace day — a lock that trips at 00:00 would read as "locked on
  // the last day I was still allowed to edit".
  unlockUntil.setHours(23, 59, 59, 999);
  return now.getTime() > unlockUntil.getTime();
}

/* A rejected write is either PERMANENT or transient, and conflating them costs both ways.
   Treat a transient one as permanent and an offline edit is dropped instead of flushing on
   reconnect; treat a permanent one as transient — which is what the old empty `.catch` did in
   effect — and the outbox retries a doomed write on every page load, forever, silently. */
export function isPermanentWriteError(err: unknown): boolean {
  const e = err as { code?: unknown; message?: unknown } | null;
  const text = String((e && (e.code ?? e.message)) ?? "");
  return /permission[_\s-]?denied/i.test(text);
}
