# Taipei Chat Harness Report — repaired Pipeline V2

Date: 2026-09-01
Branch: `research-chat/taipei-v2-harness-20260901`
Draft PR: #180
Research engine: GPT-5.6 Sol
Requested posture: medium effort
Synthetic run id used by evidence artifacts: `taipei-codex-20260901-e43444`

## Scope

This run executed the research workflow from Chat: frozen synthetic intake → Pass A → Pass B → V2.3 reconcile → guide composition → critic → repository Required Gate. It did not invoke Claude, Codex, or a local shell research agent.

## Critical harness-input finding

The prompt referenced two authority files that are not present on current `main`, any of the 12 live branches inspected, PR/issue search, or commit search:

- `docs/pipeline v2/PRO_TIER_RESEARCH_STANDARDS.md`
- `docs/pipeline v2/HARNESS_BAKEOFF_TAIPEI.md`

Therefore the exact six bakeoff metrics cannot be quoted or numerically self-scored without inventing the missing contract. This report deliberately withholds an “official six-metric score.” The run otherwise used the current repaired V2 source-of-truth files in the repository.

## Research result

### Anchor-first behavior — PASS

The synthetic intake's deliberately shaky “Jiufen lantern-release evening” was tested before other destination research. New Taipei City's official 2026 festival announcement gives Pingxi Sky Lantern Festival dates of Feb 27 and Mar 3, outside Nov 10–17. Official New Taipei tourism separately supports ordinary sky-lantern releasing at Shifen Old Street. The itinerary therefore rejects the festival/Jiufen premise and uses an ordinary Shifen lantern release instead.

### Pass A — PASS on the exercised scope

Primary sources verified: US visa-exempt entry, Airport MRT fare, Taipei MRT fare range, Taipei 101 admission/hours, Chiang Kai-shek Memorial Hall hours, National Palace Museum admission/hours, Shifen Waterfall hours, and logy's menu/booking/hours. Perishable objective claims carry verification dates and T0/operator sources. Future Jiufen/Shifen connection times were not guessed.

### Pass B — CONTENT PASS / ISOLATION NOT MECHANICALLY PROVEN

Pass B produced material independent-angle additions:
- Nanjichang Night Market as the food-first/local-feeling alternative, supported by independent recent firsthand families; Taipei City is used only for objective hours.
- Early-morning Jiufen as a crowd-avoidance tactic, supported by independent recent firsthand sources.
- Yu Zai Fan Shu Tea House as a calmer A-Mei alternative, supported by two independent recent firsthand families; no unverified menu price/hours were imported.

Because this is one persistent ChatGPT conversation, Pass B did not run in a mechanically clean workspace where Pass A output was absent. Procedural isolation was enforced from the intake, but the infrastructure acceptance property remains unproven.

### Reconcile — PASS

The merged evidence artifact uses the repository's current `wp-evidence/2.3` contract rather than copying Uruguay's historical 2.1 tag. Every Pass-B evidence row receives a typed reconciliation disposition and relation. Coverage is recorded separately in `wp-coverage/2.0`.

### Critic — USEFUL / FRESH-CONTEXT ISOLATION NOT MECHANICALLY PROVEN

The critic caught a real product defect: the reconciled draft scheduled logy on Monday Nov 16 even though logy's fetched primary page states the restaurant is closed Mondays and Tuesdays. The critic moved the splurge dinner to Sunday Nov 15 and Shifen to Monday Nov 16, then recorded the continuity sweep and citation audit.

This demonstrates critic usefulness, but not the V2 infrastructure property of a fresh blind critic workspace; the same Chat model retained conversation context.

## Source-access integrity

No cache, reader, archive, or translation mirror was cited as an origin. Search previews were discovery only. Objective perishable facts in merged evidence use directly retrieved primary/operator origins. Official/marketing pages were not attached to subjective crowd/atmosphere claims; those use firsthand evidence.

Traditional Chinese sources were used directly for Taiwan/New Taipei/Taipei operational facts where appropriate.

## Model/resource telemetry

Model: GPT-5.6 Sol.
Requested effort posture: medium.
Claude usage: zero.
Codex usage: zero.
Tokens: unavailable — not guessed.
Cost: unavailable — not guessed.
Stage durations: not written into `run.v2.json` because Chat lacks trustworthy stage-start instrumentation; inferring duration from Git commit timestamps would violate V2's honest-telemetry rule.

Durable stage commits:
- Intake: `e434442dacb4e1206c6a0180ccc1a29ac9b65b5a`
- Pass A evidence: `0fa60cc459f40b56e6f736b1cb2e2360279d478b`
- Pass B evidence: `219d03a6966ade191b69636ffa87724818183b17`
- Reconcile evidence: `cc84c83b5e199e77579d62c5104baa12f6d8425c`
- Critic itinerary correction: `c762adb89b8ed24da098f46c83c9c812cf72fd9c`
- Critic ledger: `184a31d9824c485f2d85291802d362d36de48cce`
- Critic process fragment: `bf0fa5e1888ee3a9ecb2491ca9697e5a70547934`

## Chat execution-plane finding

Research quality was not the main friction. The notable friction was artifact transfer across Chat tool sandboxes: web/reasoning state and GitHub write calls do not share one local filesystem/object runtime, so evidence had to be explicitly normalized into GitHub writes. This costs orchestration effort but did not require weaker sourcing.

## Provisional suitability verdict (not the missing official six-metric score)

- Independent verification of Claude research: **YES — strongly supported by this run.**
- Pass A research execution: **YES on content/evidence quality; repository gate still decides artifact validity.**
- Pass B local/native research: **YES on content quality; mechanical Pass-A isolation requires the real V2 workspace.**
- Reconcile/critic judgment: **YES on this small harness; critic found a genuine continuity defect.**
- Full replacement of V2 orchestration/control plane: **NO — this chat does not reproduce mechanical workspace isolation, stage-runtime telemetry, retry/resume semantics, or trusted landing behavior.**
- Claude Pro savings potential: **HIGH for research and independent verification; Claude can be reserved for the stages/proofs that specifically require its execution environment.**

## Official six-metric bakeoff

**BLOCKED — scoring contract unavailable.**

Once `HARNESS_BAKEOFF_TAIPEI.md` is restored or pasted, this run can be scored against its exact six metrics from the durable artifacts without rerunning the destination research.
