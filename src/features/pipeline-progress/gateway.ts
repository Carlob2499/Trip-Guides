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
import type { PipelineState, RunSnapshot } from "./model/progress";
import { adaptV2Snapshot, EMPTY_SNAPSHOT } from "./model/progress";
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
  /**
   * The generation-aware read (M7): the V2 run record (research-v2/<slug> branch, run.v2.json)
   * when one exists — with its REAL run status, failure classification and deployed-live fact —
   * else the V1 state through the same shape with those facts honestly null. A V2 file that
   * exists but cannot be read comes back `malformed: true`, never as "no run".
   */
  fetchRun(slug: string): Promise<RunSnapshot>;
  /** True once the guide's own committed JSON on `main` has no `draft: true` — the moment
   *  research-pass.yml's publish-on-verify step (scripts/pipeline/publish.mjs) has landed.
   *  This is the MERGE fact. It says nothing about the deploy — that is isLive(). */
  isPublished(slug: string): Promise<boolean>;
  /**
   * The DEPLOY fact: is the published guide actually in the live site's own search index
   * (dist/data/search-index.json — regenerated per deploy, drafts excluded by build)?
   * Resolves true / false / null — null when no site base is configured or the index is
   * unreachable, and an unknown must render as unknown, never as "live".
   */
  isLive(slug: string): Promise<boolean | null>;
  /** Intake questions AND blocking forks from the research branch's ledger, or empty if none. */
  fetchQuestions(slug: string): Promise<IntakeQuestion[]>;
  /** Open feedback-driven revision proposals for this guide. Owner-facing. */
  fetchProposals(slug: string): Promise<RevisionProposal[]>;
  /**
   * Live telemetry for the run — what it fetched, decided and learned (model/run-events.ts).
   *
   * V2 EMITS THIS FOR REAL: scripts/pipeline/v2/events.mjs rebuilds events.json from the durable
   * run artifacts at every stage finish/fail and at landing, so a V2 run's stage decisions,
   * failures, geocode outcomes and landing verdict are actual emitted data. What the emitter
   * cannot prove stays honestly absent — fetch-level events, nuggets and unmeasured counters
   * render their honest-empty copy, never a fabricated feed. V1 emits nothing, so V1 runs still
   * resolve EMPTY_RUN_EVENTS.
   */
  fetchRunEvents(slug: string): Promise<RunEvents>;
}

export interface GithubGatewayOptions {
  owner: string;
  repo: string;
  /** Defaults to "main" — the branch a merged, published guide lives on. */
  baseBranch?: string;
  /** The live site's own base path/origin (e.g. "/Trip-Guides/"). Enables isLive(); absent,
   *  isLive() honestly resolves null rather than probing a URL nobody configured. */
  siteBase?: string;
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
  const { owner, repo, baseBranch = "main", siteBase, fetchImpl } = opts;
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
    async fetchRun(slug) {
      // V2 first: run.v2.json on the V2 research branch (each stage job commits it there). The
      // raw text is fetched separately from its parse so "file exists but is not a run" reads
      // as MALFORMED — the fail-closed rule — while "no file" falls through to V1 honestly.
      const v2Text = await getText(raw(`research-v2/${slug}`, `guides-intake/${slug}/run.v2.json`))
        ?? await getText(raw(baseBranch, `guides-intake/${slug}/run.v2.json`));
      if (v2Text != null) {
        let parsed: unknown;
        try { parsed = JSON.parse(v2Text); } catch { parsed = null; }
        return adaptV2Snapshot(parsed);
      }
      const state = await this.fetchState(slug);
      if (!state) return EMPTY_SNAPSHOT;
      return { ...EMPTY_SNAPSHOT, version: 1, state };
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
    async isLive(slug) {
      if (!siteBase) return null; // unconfigured is unknown, and unknown must never read "live"
      const url = `${siteBase.replace(/\/$/, "")}/data/search-index.json?t=${Date.now()}`;
      const index = await getJson(url);
      if (!Array.isArray(index)) return null; // unreachable/unparseable — still unknown
      // The index is rebuilt from PUBLISHED guides on every deploy, so the slug appearing in
      // the deployed copy is the deploy actually carrying the published guide.
      return index.some((r) => (r as { slug?: string })?.slug === slug);
    },
    async fetchQuestions(slug) {
      // Questions and forks are research state, so they live in the ledger — intake.md is
      // frozen intent. Prefer the V2 branch; a stale V1 branch must not hide the active run's
      // questions.
      const v2 = await getText(raw(`research-v2/${slug}`, `guides-intake/${slug}/ledger.md`));
      const md = v2 ?? await getText(raw(`research/${slug}`, `guides-intake/${slug}/ledger.md`));
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
      // The branch is where an ACTIVE run lives, so it is read first — but a merged V2 product
      // landing deletes its branch and carries events.json into `main` (the same fallback
      // fetchRun already makes for run.v2.json), so the finished run's event log stays
      // readable after the merge. V1 branches are tried last; V1 emits nothing today, so that
      // read resolving empty is honest. A 404 becomes EMPTY_RUN_EVENTS via parseRunEvents(null);
      // the UI keeps LOOKING while the run is active (probeEventsThisTick in
      // model/run-events.ts), just less often, so telemetry that starts late still surfaces.
      const v2 = await getJson(raw(`research-v2/${slug}`, `guides-intake/${slug}/events.json`))
        ?? await getJson(raw(baseBranch, `guides-intake/${slug}/events.json`));
      if (v2) return parseRunEvents(v2);
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
