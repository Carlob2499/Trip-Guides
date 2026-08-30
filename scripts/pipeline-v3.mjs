// Pipeline V3 — one small public interface over the proven V2 control implementation.
//
// V3 intentionally reuses V2's durable state, isolation, evidence rules, bounded recovery and
// exact-head landing. Its added seam compiles deterministic model bookkeeping before those
// validators run. This keeps the safety proof local and avoids a copied second orchestrator.

import { isMain } from "./audit/lib.mjs";
import { isValidSlug } from "./lib/slug.mjs";
import { ContractError } from "./pipeline/v2/contracts.mjs";
import { run as runProvenControlPlane } from "./pipeline-v2.mjs";
import { compileStageArtifacts } from "./pipeline/v3/compiler.mjs";

export async function runV3(cmd, get, has) {
  const slug = get("--slug");
  // Let the shared CLI produce its normal input error before any compiler path is resolved.
  if (!slug || !isValidSlug(slug)) return runProvenControlPlane(cmd, get, has, { engine: "v3" });

  // Compilation happens only after untrusted output has crossed into the stage-owned path and
  // immediately before the existing validator consumes it. Missing artifacts remain normal
  // durable gate failures; malformed artifacts fail closed here.
  if (cmd === "collect-stage") {
    const stage = get("--stage");
    const from = get("--from");
    if (from && ["passA", "reconcile"].includes(stage)) {
      await compileStageArtifacts(slug, stage, { fromDir: from });
    }
  } else if (cmd === "collect-passb") {
    const from = get("--from");
    if (from) await compileStageArtifacts(slug, "passB", { fromDir: from });
  } else if (cmd === "finish-stage") {
    const stage = get("--stage");
    if (["passA", "reconcile"].includes(stage)) await compileStageArtifacts(slug, stage);
  } else if (cmd === "reconcile-critic-truth") {
    const from = get("--from");
    if (from) await compileStageArtifacts(slug, "critic", { fromDir: from });
  }

  return runProvenControlPlane(cmd, get, has, { engine: "v3" });
}

async function cliMain() {
  const argv = process.argv.slice(2);
  const get = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : null);
  const has = (flag) => argv.includes(flag);
  const cmd = argv[0];
  if (!cmd || cmd.startsWith("--")) {
    console.error("Usage: node scripts/pipeline-v3.mjs <pipeline command> --slug <slug> …");
    process.exit(1);
  }
  try {
    process.exit(await runV3(cmd, get, has));
  } catch (err) {
    if (err instanceof ContractError) {
      console.error(`[pipeline-v3] CONTRACT FAILURE: ${err.message}`);
      process.exit(2);
    }
    console.error(`[pipeline-v3] ${err?.message || err}`);
    process.exit(1);
  }
}

if (isMain(import.meta.url)) {
  cliMain().catch((err) => {
    console.error(`[pipeline-v3] ${err?.message || err}`);
    process.exit(1);
  });
}
