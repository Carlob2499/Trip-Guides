/**
 * Durable write outbox — pure operations over the localStorage-backed queue that makes an
 * offline `add` survive a tab close.
 *
 * Why it exists: the RTDB web SDK keeps offline writes in MEMORY only. Log an expense in
 * airplane mode, close the tab before reconnecting, and it's gone — RTDB never flushed it.
 * The outbox records each add (keyed by its FINAL path, i.e. the pre-generated push key) before
 * the network call and clears it on server-ack; on the next load, unacked entries are replayed.
 *
 * Idempotent by design: the key is stable, so replaying a `set` writes the SAME record — no
 * duplicate even if RTDB's own queue also delivered it. Capped so a long offline streak can't
 * grow localStorage without bound (oldest entries drop first).
 */

export type Outbox = Record<string, unknown>;

/** Add/replace an entry, evicting the oldest (insertion order) if over `cap`. */
export function addEntry(outbox: Outbox, path: string, value: unknown, cap = 50): Outbox {
  const next: Outbox = { ...outbox, [path]: value };
  const keys = Object.keys(next);
  if (keys.length > cap) {
    for (const stale of keys.slice(0, keys.length - cap)) delete next[stale];
  }
  return next;
}

/** Remove an acked entry. Returns the same object identity when nothing changed. */
export function removeEntry(outbox: Outbox, path: string): Outbox {
  if (!(path in outbox)) return outbox;
  const next = { ...outbox };
  delete next[path];
  return next;
}

/** The entries belonging to one room (`base` = "trips/<code>"), for replay on join. */
export function entriesForRoom(outbox: Outbox, base: string): { path: string; value: unknown }[] {
  const prefix = base + "/";
  return Object.keys(outbox)
    .filter((p) => p.startsWith(prefix))
    .map((p) => ({ path: p, value: outbox[p] }));
}
