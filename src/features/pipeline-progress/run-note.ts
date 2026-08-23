import type { RunSnapshot } from "./model/progress";
import { postToWorker, failureMessage } from "../../lib/worker-client.js";

export type RunNoteTarget = { slug: string; runId: string; issue: number };
export type RunNoteResolution =
  | { ok: true; target: RunNoteTarget }
  | { ok: false; reason: "not-v2" | "conflict" | "malformed" | "missing" | "stale" | "network" };

type FetchLike = typeof fetch;
type RunIdentitySnapshot = Pick<RunSnapshot, "version" | "runId" | "malformed" | "conflict">;
type RunIdentityGateway = { fetchRun(slug: string): Promise<RunIdentitySnapshot> };
type WorkerResult = Awaited<ReturnType<typeof postToWorker>>;
type RawRunRecord = Record<string, unknown>;

type WorkerOptions = {
  ownerKey?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

function decodeBase64Utf8(content: unknown): string {
  const binary = atob(String(content ?? "").replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function asRecord(value: unknown): RawRunRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as RawRunRecord
    : null;
}

async function fetchV2Record(
  owner: string,
  repo: string,
  slug: string,
  ref: string,
  fetchImpl: FetchLike,
): Promise<{ kind: "missing" } | { kind: "network" } | { kind: "record"; raw: RawRunRecord }> {
  const path = `guides-intake/${slug}/run.v2.json`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`;
  let res: Response;
  try {
    res = await fetchImpl(url, { headers: { Accept: "application/vnd.github+json" } });
  } catch {
    return { kind: "network" };
  }
  if (res.status === 404) return { kind: "missing" };
  if (!res.ok) return { kind: "network" };

  try {
    const envelope: unknown = await res.json();
    const content = asRecord(envelope)?.content;
    const raw = asRecord(JSON.parse(decodeBase64Utf8(content)) as unknown);
    return raw ? { kind: "record", raw } : { kind: "network" };
  } catch {
    return { kind: "network" };
  }
}

/**
 * Resolve the one V2 issue that may receive an owner note.
 *
 * The normal Progress gateway decides which generation owns the slug. Only after that says V2 do
 * we read the durable V2 run record to obtain `issue`, then require the raw record's slug + runId
 * to agree with the snapshot. A V1 snapshot never receives a guessed issue number.
 */
export async function resolveRunNoteTarget(opts: {
  slug: string;
  gateway: RunIdentityGateway;
  owner: string;
  repo: string;
  baseBranch?: string;
  fetchImpl?: FetchLike;
}): Promise<RunNoteResolution> {
  const { slug, gateway, owner, repo, baseBranch = "main", fetchImpl = fetch } = opts;
  const snapshot = await gateway.fetchRun(slug);
  if (snapshot.conflict) return { ok: false, reason: "conflict" };
  if (snapshot.malformed) return { ok: false, reason: "malformed" };
  if (snapshot.version !== 2 || !snapshot.runId) return { ok: false, reason: "not-v2" };

  for (const ref of [`research-v2/${slug}`, baseBranch]) {
    const found = await fetchV2Record(owner, repo, slug, ref, fetchImpl);
    if (found.kind === "missing") continue;
    if (found.kind === "network") return { ok: false, reason: "network" };
    const raw = found.raw;
    const issue = Number(raw.issue);
    const matches = /^wp-run\/2\./.test(String(raw.schemaVersion ?? "")) &&
      raw.slug === slug && raw.runId === snapshot.runId && Number.isInteger(issue) && issue > 0;
    if (!matches) return { ok: false, reason: "stale" };
    return { ok: true, target: { slug, runId: snapshot.runId, issue } };
  }
  return { ok: false, reason: "missing" };
}

export function createRunNoteWorkerGateway(opts: WorkerOptions = {}) {
  return {
    sendNote(target: RunNoteTarget, note: string) {
      return postToWorker("note", { ...target, note }, opts);
    },
  };
}

export function runNoteFailureMessage(result: WorkerResult) {
  if (!result.ok && result.status === 409) {
    return "This run changed while you were typing. Refresh and try again.";
  }
  return failureMessage(result);
}
