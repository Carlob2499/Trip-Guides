/** Data access for the pipeline-progress feature — see index.ts for the public surface this
 *  backs. Two gateways, because the page now does two different kinds of thing:
 *
 *  · ProgressGateway — READS. No backend, no Firebase, no secrets: raw.githubusercontent.com and
 *    the guide's own committed JSON are public, unauthenticated, static reads. Batch 3 added one
 *    api.github.com read (open revision proposals) — also public and unauthenticated, but rate-
 *    limited per IP, so it is deliberately NOT on the poll loop (see fetchProposals).
 *
 *  · WorkerGateway — WRITES. Answers and approvals go to the site's backend Worker, authenticated
 *    with the owner key. Injectable `fetchImpl` on both so tests run zero-network.
 */
import type { PipelineState } from "./model/progress";
import { toProposals, REVISION_LABEL } from "./model/proposals";
import type { RevisionProposal } from "./model/proposals";
import { parseRunEvents } from "./model/run-events";
import type { RunEvents } from "./model/run-events";
// Static since batch 3. It used to be a lazy `await import()` inside fetchQuestions so the parser
// stayed out of the initial chunk until questions actually existed — but the page now renders
// answer controls, so ui/progress.js imports the same module eagerly and the split bought
// nothing. Rollup said so out loud (INEFFECTIVE_DYNAMIC_IMPORT); a lazy import that can't be
// lazy is just a harder-to-read one.
import { parseQuestionsFromIntake } from "../intake-questions/index";
import type { IntakeQuestion } from "../intake-questions/index";
import { postToWorker, failureMessage } from "../../lib/worker-client.js";

export interface ProgressGateway {
  /** The most-current pipeline state for `slug`, or null if none exists (yet, or never will —
   *  a wrong slug guess looks identical to "not scaffolded yet" from here; callers decide how
   *  long to wait before treating a persistent null as "check back later"). */
  fetchState(slug: string): Promise<PipelineState | null>;
  /** True once the guide's own committed JSON on `main` has no `draft: true` — the moment
   *  research-pass.yml's publish-on-verify step (scripts/pipeline/publish.mjs) has landed. */
  isPublished(slug: string): Promise<boolean>;
  /** Intake questions AND blocking forks from the research branch's ledger, or empty if none. */
  fetchQuestions(slug: string): Promise<IntakeQuestion[]>;
  /** Open feedback-driven revision proposals for this guide. Owner-facing. */
  fetchProposals(slug: string): Promise<RevisionProposal[]>;
  /**
   * Live telemetry for the run — what it fetched, decided and learned (model/run-events.ts).
   *
   * NOTHING EMITS THIS YET, so today it always resolves to EMPTY_RUN_EVENTS and the cockpit's
   * sourcing / judgments / "worth knowing" panels render their honest-empty copy. The method
   * exists now, in the shape the emitter will write, so that turning telemetry on is a pipeline
   * change and not a UI one — and so nobody is tempted to fake a feed in the meantime.
   */
  fetchRunEvents(slug: string): Promise<RunEvents>;
}

export interface GithubGatewayOptions {
  owner: string;
  repo: string;
  /** Defaults to "main" — the branch a merged, published guide lives on. */
  baseBranch?: string;
  /** Injectable for tests; defaults to the platform fetch. */
  fetchImpl?: typeof fetch;
}

// A slow/unreachable network must never leave the poll hanging — the caller renders the
// checklist either way (see ui/progress.js), but only once this settles, so a bounded timeout
// is what keeps the page from sitting blank indefinitely on a bad connection.
const FETCH_TIMEOUT_MS = 8000;

/** How many open proposals are worth showing at once. More than this on one guide is a signal
 *  to fix the guide, not a list to scroll. */
const PROPOSAL_PAGE = 20;

export function createGithubGateway(opts: GithubGatewayOptions): ProgressGateway {
  const { owner, repo, baseBranch = "main", fetchImpl } = opts;
  const doFetch: typeof fetch = fetchImpl || ((...args) => fetch(...args));

  async function getText(url: string): Promise<string | null> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await doFetch(url, { cache: "no-store", signal: ctrl.signal });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function getJson(url: string): Promise<unknown | null> {
    const text = await getText(url);
    if (text == null) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  /** A cache-busting query param keeps the CDN's edge cache from serving a stale copy for the
   *  full default TTL while a run is actively checkpointing. */
  const raw = (branch: string, filePath: string) =>
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}?t=${Date.now()}`;

  return {
    async fetchState(slug) {
      // The research branch gets a state-file commit after EVERY stage (the granular, live
      // signal); `main` only catches up once at the very end (scaffold, then a jump straight
      // to verified on merge) — so prefer the branch while it exists, and fall back once it's
      // been deleted (land-branch.sh deletes it on a successful merge).
      const onBranch = await getJson(raw(`research/${slug}`, `guides-intake/${slug}/state.json`));
      if (onBranch) return onBranch as PipelineState;
      const onMain = await getJson(raw(baseBranch, `guides-intake/${slug}/state.json`));
      return (onMain as PipelineState) ?? null;
    },
    async isPublished(slug) {
      // Every guide is a DIRECTORY (CLAUDE.md; gated by guide-shape-uniform.test.mjs), so the
      // meta file is `<slug>/_guide.json`. This read used to point at the flat `<slug>.json`,
      // which does not exist anywhere in the repo — it 404'd on every guide, so `published`
      // never cleared and the page could never reach "Your guide is ready".
      const guide = await getJson(raw(baseBranch, `src/content/guides/${slug}/_guide.json`));
      if (!guide) return false;
      // Publishing DELETES the key rather than setting it false (publish.mjs), so "no draft
      // key" and "draft: false" must both read as published — which `!draft` gives for free.
      return !(guide as { draft?: boolean }).draft;
    },
    async fetchQuestions(slug) {
      // Questions and forks are research state, so they live in the ledger — intake.md is
      // frozen intent.
      const md = await getText(raw(`research/${slug}`, `guides-intake/${slug}/ledger.md`));
      if (md == null) return [];
      return parseQuestionsFromIntake(md);
    },
    async fetchProposals(slug) {
      // NOT on the poll loop, on purpose: api.github.com allows 60 unauthenticated requests per
      // hour per IP, and the page polls every 15s (240/hr) — putting this beside the state read
      // would exhaust the quota within minutes and start failing the reads that matter. The UI
      // calls it once per page load and again after an approval.
      const url =
        `https://api.github.com/repos/${owner}/${repo}/issues` +
        `?labels=${encodeURIComponent(REVISION_LABEL)}&state=open&per_page=${PROPOSAL_PAGE}`;
      const issues = await getJson(url);
      return Array.isArray(issues) ? toProposals(issues, slug) : [];
    },
    async fetchRunEvents(slug) {
      // Research-branch only: telemetry is a property of a RUN, and the branch is where a run
      // lives. `main` never carries it, so there is no fallback read to spend a request on.
      // A 404 (today, every time) becomes EMPTY_RUN_EVENTS via parseRunEvents(null) — the UI
      // stops asking after a few of those rather than polling a file forever (see ui/progress.js).
      return parseRunEvents(await getJson(raw(`research/${slug}`, `guides-intake/${slug}/events.json`)));
    },
  };
}

export interface WorkerGateway {
  /** Send answers (traveler questions and/or fork choices) for absorption. */
  sendAnswers(payload: { slug: string; answers: { id: string; answer: string }[] }):
    Promise<{ ok: boolean; message?: string }>;
  /** Approve a feedback-driven revision proposal — starts the change run. */
  approveRevision(payload: { slug: string; issue: number }): Promise<{ ok: boolean; message?: string }>;
}

export interface WorkerGatewayOptions {
  /** The owner key from this browser's store. Absent ⇒ every call fails with the Worker's 401,
   *  which is why the UI hides these controls entirely until a key is stored. */
  ownerKey?: string;
  fetchImpl?: typeof fetch;
}

export function createWorkerGateway(opts: WorkerGatewayOptions = {}): WorkerGateway {
  const { ownerKey = "", fetchImpl } = opts;
  const send = async (route: string, body: unknown): Promise<{ ok: boolean; message?: string }> => {
    const res = await postToWorker(route, body, { ownerKey, fetchImpl });
    return res.ok ? { ok: true } : { ok: false, message: failureMessage(res) };
  };
  return {
    sendAnswers: (payload) => send("answer", payload),
    approveRevision: (payload) => send("approve", payload),
  };
}
