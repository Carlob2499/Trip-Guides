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

/** The room this guide syncs to, or "" for local-only. NEVER derives one from the storeKey. */
export function resolveRoomId(cfg: { roomId?: unknown; storeKey?: unknown } | null | undefined): string {
  const id = cfg && cfg.roomId;
  return isValidRoomId(id) ? (id as string) : "";
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
