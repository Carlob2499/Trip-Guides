// PIPELINE V2 — the GENERATED, stage-relevant machine-contract capsule (Core Proof blocker 1A).
//
// The Core Proof showed agents being validated against vocabulary their prompts never exposed:
// canonical candidate ids, dynamically derived coverage ask ids, anchor rules, enum values,
// freshness caps, depth structures. This module derives that capsule AT RUN TIME from the SAME
// modules that validate the artifacts (contracts.mjs, research-rules.mjs, coverage.mjs), so the
// validator and the agent contract cannot drift apart — there is no second, manually synchronized
// copy to rot. The workflow substitutes the capsule into the stage prompt as {{contract}}.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EVIDENCE_SCHEMA, COVERAGE_SCHEMA,
  CANDIDATE_STATUSES, EVIDENCE_KINDS, SOURCE_KINDS, EVIDENCE_ORIGINS, DISPOSITIONS,
  WORTH_LABELS, SOURCE_ACCESS, GROUP_REF,
  candidateSchema, evidenceSourceSchema, evidenceRecordSchema, reservationFindingSchema,
  transportFindingSchema, disagreementSchema, saturationSchema, coverageAskSchema,
  ContractError,
} from "./contracts.mjs";
import { candidateId } from "./evidence.mjs";
import { OBJECTIVE_RECHECK_MAX_DAYS, EXPERIENTIAL_STALE_MONTHS, PROXY_HOSTS, OBJECTIVE_SOURCE_KINDS, EXPERIENTIAL_FORBIDDEN } from "./research-rules.mjs";
import { loadCoverageContext } from "./coverage.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const INTAKE_DIR = path.join(ROOT, "guides-intake");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");

export const CAPSULE_STAGES = ["passA", "passB", "reconcile", "critic"];

/** Field vocabulary introspected from a zod object schema: name, required?, enum values, and a
    JSON type hint (the canary's Pass A wrote `appliesToYears: ["2026"]` — string vs number is
    exactly the class of drift this must expose). */
export function fieldVocabulary(schema) {
  const shape = schema.shape || {};
  return Object.entries(shape).map(([name, field]) => {
    const required = !field.safeParse(undefined).success;
    let values = null;
    let type = null;
    let probe = field;
    // Unwrap defaults/nullable/optional wrappers until an enum or base type is visible.
    for (let i = 0; i < 6 && probe; i++) {
      if (probe.options && Array.isArray(probe.options) && probe.options.every((o) => typeof o === "string")) {
        values = probe.options;
        break;
      }
      const t = probe.def?.type;
      if (["string", "number", "boolean", "array", "object", "int"].includes(t)) {
        type = t === "int" ? "number" : t;
        if (t === "array") {
          const el = probe.def?.element?.def?.type;
          if (el) type = `array of ${el === "int" ? "number" : el}${el === "object" ? "s" : "s (JSON " + (el === "int" ? "number" : el) + "s, not strings)"}`;
          if (el === "object") type = "array of objects";
        }
        break;
      }
      probe = probe.unwrap?.() ?? probe.def?.innerType ?? probe.removeDefault?.() ?? null;
    }
    return { name, required, values, type };
  });
}

function vocabLines(title, schema) {
  const rows = fieldVocabulary(schema).map(({ name, required, values, type }) => {
    const bits = [required ? "required" : "optional"];
    if (values) bits.push(`one of: ${values.join(" | ")}`);
    else if (type) bits.push(type);
    return `  - \`${name}\` (${bits.join("; ")})`;
  });
  return [`${title}:`, ...rows];
}

/** The minimal valid example skeletons. Tests assert these VALIDATE against the real schemas —
    a schema change that would break the example (and therefore the capsule) fails the suite. */
export function exampleEvidenceDoc({ slug = "<slug>", runId = "<run-id>", origin = "passA" } = {}) {
  const cid = candidateId("Example Venue", "Riverside branch");
  return {
    schemaVersion: EVIDENCE_SCHEMA,
    slug,
    runId,
    candidates: [{
      id: cid, name: "Example Venue", branch: "Riverside branch", priority: "food",
      status: "shipped", shortlisted: true, reason: null, worth: null,
    }],
    evidence: [{
      id: "ev-example-hours", candidateId: cid,
      claim: "Open 09:00-17:00, closed Mondays",
      kind: "objective", origin,
      source: {
        url: "https://example.com/hours", kind: "official", language: "en",
        publishedAt: "2026-01-15", family: null, independent: null,
        access: "fetched", appliesToYears: [],
      },
      verifiedOn: "2026-08-19", firsthand: null,
      freshness: { perishable: true, shelfLife: "hours", recheckOn: "2026-10-19" },
    }],
    reservations: [],
    transport: [],
    disagreements: [],
    depth: {
      reservations: { requiredCandidateIds: [], notApplicableReason: "example skeleton: no reservation-critical finalist exists" },
      transport: { requiredRouteIds: [], notApplicableReason: "example skeleton: no route reaches risk R3 or above" },
    },
    saturation: { stopped: true, trend: "duplicates", unresolvedCouldChange: false, note: "example: last searches produced duplicates; unresolved leads could not change the winner" },
    passB: origin === "passB"
      ? { nativeLanguage: { used: true, why: "local coverage outweighed English results", searchClasses: ["local-review-site"], yield: "two resident-reviewed alternatives" }, noYieldReason: null }
      : null,
    reconciliation: [],
  };
}

export function exampleCoverageDoc({ slug = "<slug>", runId = "<run-id>", askId = "priority-1", ask = "food first", groupRef = "02-food.json#example-venue" } = {}) {
  return {
    schemaVersion: COVERAGE_SCHEMA,
    slug,
    runId,
    asks: [
      { id: askId, ask, status: "covered", where: [groupRef], evidenceIds: ["ev-example-hours"], reason: null },
      { id: "example-excluded", ask: "an ask research could not honestly cover", status: "excluded", where: [], evidenceIds: [], reason: "no verifiable option exists within the trip window — stated honestly rather than filled" },
    ],
  };
}

function commonEvidenceSections({ slug, runId }) {
  const idExample1 = candidateId("Example Venue", "Riverside branch");
  const idExample2 = candidateId("Café Åkersberga");
  return [
    "### Canonical candidate ids (validator-enforced)",
    "`candidates[].id` is DERIVED from name + branch, deterministically — the validator recomputes it and",
    "rejects any other id. Rule: lowercase, accents stripped, non-alphanumerics collapsed to single hyphens,",
    "prefixed `c-`; a branch appends `--<same treatment>`. Computed examples:",
    `  - name "Example Venue", branch "Riverside branch" → \`${idExample1}\``,
    `  - name "Café Åkersberga", no branch → \`${idExample2}\``,
    "",
    "### Enum vocabulary (exact values; anything else fails closed)",
    `  - candidate \`status\`: ${CANDIDATE_STATUSES.join(" | ")}`,
    `  - evidence \`kind\`: ${EVIDENCE_KINDS.join(" | ")}`,
    `  - source \`kind\`: ${SOURCE_KINDS.join(" | ")}`,
    `  - source \`access\`: ${SOURCE_ACCESS.join(" | ")}`,
    `  - evidence \`origin\`: ${EVIDENCE_ORIGINS.join(" | ")}`,
    `  - candidate \`worth\`: ${WORTH_LABELS.join(" | ")} (or null)`,
    `  - reconciliation \`disposition\`: ${DISPOSITIONS.join(" | ")}`,
    "",
    "### Evidence-kind ↔ source-kind law (validator-enforced)",
    `An OBJECTIVE claim (hours, prices, rules, schedules, dates) must cite source kind ${[...OBJECTIVE_SOURCE_KINDS].join(" | ")};`,
    "aggregator and press sources are DISCOVERY for objective facts, never their citation — climb to the",
    "origin authority or keep the claim out of the artifact. An EXPERIENTIAL claim (crowds, atmosphere,",
    `feel) must NOT cite ${[...EXPERIENTIAL_FORBIDDEN].join(" or ")} (that is a fabricated citation); it needs \`kind: "firsthand"\``,
    "with `firsthand: true`, and every experiential claim on a shipped/detour candidate needs ≥2",
    "corroborating records for the SAME claim text from independent sources (distinct `family` values,",
    "or `independent: true`) — write the second source as its own evidence record.",
    "",
    "### Source access + proxy policy (validator-enforced)",
    "`source.access` records HOW the source was reached: `fetched` = the origin page itself was retrieved",
    "and read; `search-preview` = only a search-result snippet was seen (discovery, NOT verification);",
    "`blocked` = the origin refused/failed and that is recorded honestly; `unknown` only where genuinely",
    "unknowable. An objective claim citing an official/operator source must be `fetched` or `blocked` —",
    "a search preview referencing an official page is never \"verified against the official source\".",
    "Event-date claims recording `appliesToYears` must be `fetched`. Reader/mirror/proxy services",
    `(${PROXY_HOSTS.join(", ")}) are never the origin — cite the true origin or record it blocked.`,
    "",
    "### Freshness / recheck caps (validator-enforced)",
    "Every objective record carries `freshness { perishable, shelfLife, recheckOn }`. Perishable facts",
    "need shelfLife + recheckOn, recheckOn after verifiedOn, within the class cap:",
    ...Object.entries(OBJECTIVE_RECHECK_MAX_DAYS).map(([k, v]) => `  - \`${k}\`: ≤ ${v} days`),
    `Experiential evidence older than ${EXPERIENTIAL_STALE_MONTHS} months is a lead to re-verify, not current evidence.`,
    "",
    "### Depth structure (validator-enforced)",
    "`depth.reservations.requiredCandidateIds` enumerates every candidate owing reservation depth;",
    "`depth.transport.requiredRouteIds` every route owing R3+ transport depth. An empty list requires a",
    "concrete `notApplicableReason` (≥20 chars). Every required id must resolve to a real record.",
    "R3+ transport records must name `evidenceIds` resting on at least one `fetched` source.",
    "",
    "### Field vocabulary (introspected from the live validator)",
    ...vocabLines("candidate", candidateSchema),
    ...vocabLines("evidence record", evidenceRecordSchema),
    ...vocabLines("evidence source", evidenceSourceSchema),
    ...vocabLines("reservation finding", reservationFindingSchema),
    "reservation `leads[]` entry (a lead is a labeled, unpromoted booking rumor):",
    "  - `claim` (required; string — what the lead asserts)",
    "  - `status` (required; one of: unconfirmed-lead | confirmed)",
    "  - `source` (optional; evidence-source object or null)",
    "  - `verifiedOn` (optional; YYYY-MM-DD or null — required with source when status is confirmed)",
    ...vocabLines("transport finding", transportFindingSchema),
    ...vocabLines("disagreement", disagreementSchema),
    ...vocabLines("saturation record", saturationSchema),
    "",
    "### Minimal valid example (shape reference only — never copy its content)",
    "```json",
    JSON.stringify(exampleEvidenceDoc({ slug, runId }), null, 2),
    "```",
  ];
}

async function reconcileSections({ slug, runId, intakeDir, guidesDir }) {
  const { groups, groupAnchors, expectedAskIds } = await loadCoverageContext(slug, { intakeDir, guidesDir });
  // IDs only, deliberately: ask labels/values are intake-authored traveler text, and untrusted
  // text rides the DATA channel (the agent reads coverage.json + intake.md in its workspace) —
  // never a prompt string. The validator's vocabulary need is the exact id set.
  let askRows;
  try {
    const legacy = JSON.parse(await readFile(path.join(intakeDir, slug, "coverage.json"), "utf8"));
    askRows = (legacy.asks || []).map((a) => `  - \`${a.id}\``);
  } catch {
    askRows = [...(expectedAskIds || [])].map((id) => `  - \`${id}\``);
  }
  const anchorRows = groups.map((g) => {
    const anchors = [...(groupAnchors.get(g) || [])];
    const shown = anchors.slice(0, 12).map((a) => `#${a}`).join(", ");
    const more = anchors.length > 12 ? ` … +${anchors.length - 12} more` : "";
    return `  - \`${g}\`: ${shown || "(no anchors yet — anchors come from id/title/name/label/heading/day fields)"}${more}`;
  });
  return [
    "### Coverage contract (validator-enforced, derived from THIS guide right now)",
    `Write \`guides-intake/${slug}/coverage.v2.json\` (schema \`${COVERAGE_SCHEMA}\`). Every material intake`,
    "ask below MUST appear exactly once, `covered` with real refs or `excluded` with an honest reason.",
    "",
    "Material ask ids (all are required rows — what each id MEANS is in your workspace's",
    `guides-intake/${slug}/coverage.json and intake.md, the data channel):`,
    ...(askRows.length ? askRows : ["  - (no legacy ask registry — enumerate every ranked priority, constraint and special requirement from intake.md; the document cannot be empty)"]),
    "",
    `Legal \`where\` refs match \`${GROUP_REF.source}\` — a real group file of THIS guide plus a #anchor that`,
    "identifies an actual title/name/label in that file. The guide's group files and their current legal anchors:",
    ...(anchorRows.length ? anchorRows : ["  - (no group files yet)"]),
    "",
    "`evidenceIds` cite records that exist in evidence.v2.json.",
    "",
    "### Coverage field vocabulary (introspected from the live validator)",
    ...vocabLines("coverage ask", coverageAskSchema),
    "",
    "### Minimal valid coverage example (shape reference only)",
    "```json",
    JSON.stringify(exampleCoverageDoc({ slug, runId, groupRef: groups.length ? `${groups[0]}#example-anchor` : "02-food.json#example-anchor" }), null, 2),
    "```",
    "",
    "### Reconciliation contract",
    `Every passB-origin evidence record gets EXACTLY ONE disposition: ${DISPOSITIONS.join(" | ")}, with a note.`,
    "A disposition pointing at no record, a double disposition, or a silently dropped find fails the run.",
  ];
}

/** Generate the stage-relevant capsule. Pure derivation from the live validators — no prose here
    may restate a rule the validator does not enforce. */
export async function generateContractCapsule(stage, { slug, runId = "<run-id>", intakeDir = INTAKE_DIR, guidesDir = GUIDES_DIR } = {}) {
  if (!CAPSULE_STAGES.includes(stage)) throw new ContractError(`no contract capsule for stage "${stage}" — one of: ${CAPSULE_STAGES.join(", ")}`);
  const head = [
    "## Machine contract (GENERATED from the live validators — exact, current, stage-specific)",
    "Everything in this section is enforced fail-closed by deterministic validation after you finish.",
    "",
  ];
  if (stage === "passA") {
    return [
      ...head,
      `Your owed artifact: \`guides-intake/${slug}/evidence.v2.json\`, schema \`${EVIDENCE_SCHEMA}\`, with`,
      `\`slug: "${slug}"\` and \`runId: "${runId}"\`. Every evidence record carries \`origin: "passA"\`.`,
      "",
      ...commonEvidenceSections({ slug, runId }),
    ].join("\n");
  }
  if (stage === "passB") {
    return [
      ...head,
      `Your owed artifact: \`guides-intake/${slug}/passB.v2.json\`, schema \`${EVIDENCE_SCHEMA}\`, with`,
      `\`slug: "${slug}"\` and \`runId: "${runId}"\`. EVERY evidence record carries \`origin: "passB"\`;`,
      "any other origin, or any entry in `reconciliation`, is rejected — reconciling is stage 3's job.",
      "An empty `evidence` array requires a written `passB.noYieldReason`; `passB.nativeLanguage`",
      "(`{ used, why, searchClasses[], yield }`) is always required, with searchClasses + yield when used.",
      "",
      ...commonEvidenceSections({ slug, runId }),
    ].join("\n");
  }
  if (stage === "reconcile") {
    return [
      ...head,
      `Your owed artifacts: the MERGED \`guides-intake/${slug}/evidence.v2.json\` (schema \`${EVIDENCE_SCHEMA}\`)`,
      `and \`guides-intake/${slug}/coverage.v2.json\`. Keep passB records' ids and origin when folding them in.`,
      "",
      ...(await reconcileSections({ slug, runId, intakeDir, guidesDir })),
      "",
      ...commonEvidenceSections({ slug, runId }),
    ].join("\n");
  }
  // critic — its owed artifacts are ledger sections + the patterns fragment; the validator for
  // the fragment is compound-patterns. State its exact row grammar from the enforced shape.
  return [
    ...head,
    `Your owed artifacts, validated after you finish:`,
    `  - \`guides-intake/${slug}/ledger.md\` gains \`## Critic findings\` and \`## Citation audit\` (and a`,
    "    `#### Continuity sweep — critic execution` whenever you edited the guide).",
    `  - \`guides-intake/${slug}/pipeline-patterns.fragment.md\`: 1–10 bare table rows, EXACTLY`,
    `    \`| YYYY-MM-DD | ${slug} | [critic] | <rubric row or lens> | <distilled pattern> | open |\``,
    "    (six cells; date real; slug and `[critic]` literal; final cell literally `open`; ≤1200 chars/row;",
    "    no headings, no prose outside rows). A malformed row fails the run.",
    `  - If and only if you change any \`facts.json\` row, write \`guides-intake/${slug}/critic-corrections.v2.json\``,
    `    with schema \`wp-critic-corrections/1.0\`: slug \`${slug}\`, runId \`${runId}\`, and one correction`,
    "    per changed factId carrying exact previousValue/correctedValue/claim, fetched source metadata, verifiedOn,",
    "    and freshness. You still may not read evidence.v2.json; the trusted control plane reconciles this handoff.",
  ].join("\n");
}
