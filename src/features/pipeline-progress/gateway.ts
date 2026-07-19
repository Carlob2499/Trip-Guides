/** Data access for the pipeline-progress feature — see index.ts for the public surface this
 *  backs. Deliberately no new backend, no Firebase, no secrets: raw.githubusercontent.com and
 *  the guide's own committed JSON are both public, unauthenticated, static reads. */
import type { PipelineState } from "./model/progress";

export interface ProgressGateway {
  /** The most-current pipeline state for `slug`, or null if none exists (yet, or never will —
   *  a wrong slug guess looks identical to "not scaffolded yet" from here; callers decide how
   *  long to wait before treating a persistent null as "check your issue comment instead"). */
  fetchState(slug: string): Promise<PipelineState | null>;
  /** True once the guide's own committed JSON on `main` has no `draft: true` — the moment
   *  research-pass.yml's auto-graduate step (scripts/graduate-guide.mjs --slug) has landed. */
  isPublished(slug: string): Promise<boolean>;
}

export interface GithubGatewayOptions {
  owner: string;
  repo: string;
  /** Defaults to "main" — the branch a merged, graduated guide lives on. */
  baseBranch?: string;
}

// A slow/unreachable network must never leave the poll hanging — the caller renders the
// checklist either way (see ui/progress.js), but only once this settles, so a bounded timeout
// is what keeps the page from sitting blank indefinitely on a bad connection.
const FETCH_TIMEOUT_MS = 8000;

async function fetchJsonOrNull(url: string): Promise<unknown | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Real implementation: raw.githubusercontent.com reads only, no auth, no rate-limit risk
 *  worth guarding against at a one-request-per-poll-interval cadence (that CDN path is not
 *  the api.github.com REST quota). A cache-busting query param keeps the CDN's edge cache
 *  from serving a stale copy for the full default TTL while a run is actively checkpointing. */
export function createGithubGateway(opts: GithubGatewayOptions): ProgressGateway {
  const { owner, repo, baseBranch = "main" } = opts;
  const raw = (branch: string, filePath: string) =>
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}?t=${Date.now()}`;

  return {
    async fetchState(slug) {
      // The research branch gets a state-file commit after EVERY stage (the granular, live
      // signal); `main` only catches up once at the very end (scaffold, then a jump straight
      // to verified on merge) — so prefer the branch while it exists, and fall back once it's
      // been deleted (land-branch.sh deletes it on a successful merge).
      const onBranch = await fetchJsonOrNull(raw(`research/${slug}`, `guides-intake/${slug}.state.json`));
      if (onBranch) return onBranch as PipelineState;
      const onMain = await fetchJsonOrNull(raw(baseBranch, `guides-intake/${slug}.state.json`));
      return (onMain as PipelineState) ?? null;
    },
    async isPublished(slug) {
      const guide = await fetchJsonOrNull(raw(baseBranch, `src/content/guides/${slug}.json`));
      if (!guide) return false;
      return !(guide as { draft?: boolean }).draft;
    },
  };
}
