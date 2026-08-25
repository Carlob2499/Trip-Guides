// Compatibility-preserving task routing for Waypoint agent work.
//
// This file is deliberately NOT wired into the headless research workflows yet. It encodes the
// intended progressive-disclosure map while V01/V02/V03/V05 validate the current research
// candidate. The headless routes therefore preserve the existing full research stack exactly.

export const FULL_RESEARCH_REFERENCES = Object.freeze([
  "references/verification-rules.md",
  "references/research-efficiency.md",
  "references/research-depth.md",
  "references/block-types.md",
  "references/image-sourcing.md",
]);

const ROUTES = Object.freeze({
  "headless-passA": {
    skill: "waypoint-guide-author",
    references: FULL_RESEARCH_REFERENCES,
    context: ["target-guide", "run-state", "stage-contract", "traveler-context", "pipeline-patterns"],
    compatibilityFrozen: true,
  },
  "headless-passB": {
    skill: "waypoint-guide-author",
    references: FULL_RESEARCH_REFERENCES,
    context: ["baseline-guide", "intake", "stage-contract", "traveler-context", "pipeline-patterns"],
    compatibilityFrozen: true,
  },
  "headless-reconcile": {
    skill: "waypoint-guide-author",
    references: FULL_RESEARCH_REFERENCES,
    context: ["passA-evidence", "passB-evidence", "stage-contract", "traveler-context"],
    compatibilityFrozen: true,
  },
  "headless-critic": {
    skill: "waypoint-guide-author",
    references: FULL_RESEARCH_REFERENCES,
    context: ["critic-input", "stage-contract"],
    compatibilityFrozen: true,
  },
  "new-guide": {
    skill: "waypoint-guide-author",
    references: FULL_RESEARCH_REFERENCES,
    context: ["intake", "run-state", "target-guide", "traveler-context", "relevant-stage-contract"],
  },
  "section-research": {
    skill: "waypoint-guide-author",
    references: [
      "references/verification-rules.md",
      "references/research-efficiency.md",
      "references/research-depth.md",
      "references/block-types.md",
    ],
    context: ["target-section", "intake", "traveler-context", "relevant-stage-contract"],
  },
  "fact-edit": {
    skill: "waypoint-guide-author",
    references: ["references/verification-rules.md"],
    context: ["affected-guide-section", "relevant-state", "continuity-sweep"],
  },
  recert: {
    skill: "waypoint-guide-author",
    references: ["references/verification-rules.md"],
    conditionalReferences: ["references/research-depth.md"],
    context: ["stale-fact-list", "affected-guide-sections", "continuity-sweep"],
  },
  image: {
    skill: "waypoint-guide-author",
    references: ["references/image-sourcing.md"],
    context: ["minimal-guide-context"],
  },
  "content-structure": {
    skill: "waypoint-guide-author",
    references: ["references/block-types.md"],
    conditionalReferences: ["references/verification-rules.md"],
    context: ["affected-guide-content"],
  },
  personalization: {
    skill: "waypoint-guide-author",
    references: [],
    conditionalReferences: [
      "references/verification-rules.md",
      "references/research-efficiency.md",
      "references/research-depth.md",
    ],
    context: ["correct-party-traveler-evidence", "current-intake"],
  },
  "design-code": {
    skill: "waypoint-design",
    references: [],
    context: ["design-system", "affected-code"],
    guideAuthor: false,
  },
});

export function routeSkillTask(mode) {
  const route = ROUTES[mode];
  if (!route) {
    const allowed = Object.keys(ROUTES).join(", ");
    throw new Error(`Unknown skill route '${mode}'. Expected one of: ${allowed}`);
  }
  return structuredClone(route);
}

export function listSkillRoutes() {
  return Object.keys(ROUTES);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2];
  if (!mode) {
    console.log(listSkillRoutes().join("\n"));
    process.exit(0);
  }
  try {
    console.log(JSON.stringify(routeSkillTask(mode), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
