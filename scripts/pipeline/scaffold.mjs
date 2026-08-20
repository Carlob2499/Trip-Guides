// SCAFFOLD LANDING — the tail of new-guide.yml, lifted out of forty lines of workflow bash.
//
// The scaffold commits straight to `main` (no branch, no PR): a scaffold is `draft: true` and the
// draft quarantine already fences it off the hub grid, so a review gate here was ceremony. What
// this owns is everything after issue-to-scaffold.mjs has written the files — commit, rebase onto
// whatever landed meanwhile, push, then tell the filer what happens next and close their issue.
//
// The reply text used to be a heredoc inside the YAML, which is why it still described a separate
// approval step long after publish-on-verify replaced it, and still pointed at the flat
// `guides-intake/<slug>.md` path after the state layout became a directory. Prose that only a
// workflow can see is prose nobody greps.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gh } from "../lib/cli.mjs";
import { isValidSlug } from "../lib/slug.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// The filer's next-steps reply. Exported pure so its claims are testable and so the
// self-publish wording lives somewhere a grep can reach.
export function scaffoldComment({ slug, repo, guideUrl, progressUrl }) {
  const tree = `https://github.com/${repo}/tree/main`;
  return `Scaffolded ✅ — committed straight to \`main\`: [\`src/content/guides/${slug}/\`](${tree}/src/content/guides/${slug}) (\`_guide.json\` + per-tab \`NN-*.json\`). It's a **draft** (\`draft: true\`) — reachable directly at ${guideUrl} (not listed on the hub grid while it's a draft) — and the research pass fills the facts from here per the intake spec: [\`guides-intake/${slug}/intake.md\`](${tree}/guides-intake/${slug}/intake.md).

**Watch it happen:** ${progressUrl} — a live timer + step checklist (scaffold → Pass A → Pass B → reconcile → verify → published). Nothing to do here; that page updates itself.

**The research pass is starting automatically** (TWO independent passes → reconcile → critic, Sonnet by default). If it reaches a full verify PASS it **publishes itself**: \`draft: true\` comes off in the same run that merges to \`main\`, and it's live on the next Pages deploy. No approval step, no label, nothing further from you — an "🚀 Auto-published" issue is filed with a one-line rollback if you disagree. If it can't reach PASS (or the run gets cut off) it leaves a draft PR for a human instead, and re-running the workflow resumes from the last checkpoint.

*Didn't start, or want to re-run/target one section?* Actions → Research pass → Run workflow → slug \`${slug}\` (optionally a \`section\`). To drive it by hand instead, print the same prompt CI uses — no second copy to drift:
\`\`\`
WP_SLUG=${slug} WP_SECTION="full pass" node scripts/pipeline.mjs prompt prompts/research-passA.md
\`\`\``;
}

export function landScaffold({ slug, country, issue, siteBase, repo, cwd = ROOT }) {
  if (!isValidSlug(slug)) throw new Error(`"${slug}" isn't a valid slug`);
  // BEFORE any side effect: the issue number is a commit-message fact, a `gh issue` argument and
  // the filer's only reply channel. The live failure mode this guards (run 32375205019): a
  // missing issue pushed the scaffold to main FIRST, then died at the reply — issue never
  // closed, research never auto-started. Refusing up front keeps the failure before the push.
  if (!/^\d+$/.test(String(issue))) {
    throw new Error(`"${issue}" isn't an issue number — refusing before anything is committed`);
  }
  const git = (args) => execFileSync("git", args, { cwd, stdio: "inherit" });

  git(["add", "src/content/guides", "guides-intake"]);
  git(["commit", "-m", `Scaffold new guide: ${country || slug} (from #${issue})`]);
  // Another scaffold or a research merge may have landed since checkout.
  git(["pull", "--rebase", "origin", "main"]);
  git(["push", "origin", "HEAD:main"]);

  const body = scaffoldComment({
    slug,
    repo,
    guideUrl: `${siteBase}/guides/${slug}/`,
    progressUrl: `${siteBase}/progress/?slug=${slug}`,
  });
  gh(["issue", "comment", String(issue), "--body", body], { stdio: ["ignore", "inherit", "inherit"] });
  gh(["issue", "close", String(issue)], { stdio: ["ignore", "inherit", "inherit"] });
  return { slug, issue };
}

/** Argument resolution, pure and testable. pipeline.mjs's `get` looks up literal argv flags —
    `get("--issue")`, never `get("issue")`. This function once asked for the bare names (and an
    ISSUE_NUM env nobody sets), so every value silently fell through to env fallbacks and `issue`
    fell to "" — the exact defect live run 32375205019 hit. Flags win; the env fallback names are
    exactly the ones new-guide.yml sets (SLUG / COUNTRY / ISSUE). */
export function resolveScaffoldArgs(get, env = process.env) {
  return {
    slug: get("--slug") || env.SLUG || "",
    country: get("--country") || env.COUNTRY || "",
    issue: get("--issue") || env.ISSUE || "",
    siteBase: (env.SITE_BASE_URL || "").replace(/\/$/, ""),
    repo: env.GITHUB_REPOSITORY || "",
  };
}

export async function runScaffold(get) {
  const args = resolveScaffoldArgs(get);
  landScaffold(args);
  console.log(`[scaffold] ${args.slug} committed to main; issue closed.`);
}
