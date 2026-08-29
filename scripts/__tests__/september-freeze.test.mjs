import { describe, expect, it } from "vitest";
import {
  easternDate,
  freezePhase,
  isCodePath,
  evaluateFreeze,
  STABILIZATION_LABEL,
  RELEASE_BLOCKER_LABEL,
  FREEZE_WAIVER_LABEL,
} from "../check-september-freeze.mjs";

describe("September freeze policy", () => {
  it("uses America/New_York for release dates", () => {
    expect(easternDate(new Date("2026-09-20T03:30:00Z"))).toBe("2026-09-19");
    expect(easternDate(new Date("2026-09-20T04:30:00Z"))).toBe("2026-09-20");
  });

  it("enters the feature freeze Sep 20 and backend code freeze Sep 27", () => {
    expect(freezePhase("2026-09-19")).toBe("open");
    expect(freezePhase("2026-09-20")).toBe("feature-freeze");
    expect(freezePhase("2026-09-26")).toBe("feature-freeze");
    expect(freezePhase("2026-09-27")).toBe("code-freeze");
    expect(freezePhase("2026-10-01")).toBe("code-freeze");
  });

  it("classifies backend/product/control-plane paths while leaving docs and guide content editable", () => {
    for (const file of [
      ".github/workflows/research-pass-v2.yml",
      ".agents/skills/waypoint-guide-author/SKILL.md",
      "prompts/research-reconcile-v2.md",
      "scripts/pipeline-v2.mjs",
      "src/components/Progress.astro",
      "public/sw.js",
      "package-lock.json",
    ]) expect(isCodePath(file), file).toBe(true);

    for (const file of [
      "docs/pipeline v2/SEPTEMBER_TRACKER.md",
      "docs/handoff.md",
      "src/content/guides/tokyo/02-food.json",
      "guides-intake/kumamoto/evidence.v2.json",
    ]) expect(isCodePath(file), file).toBe(false);
  });

  it("allows normal engineering before Sep 20", () => {
    expect(evaluateFreeze({ date: "2026-09-19", files: ["scripts/x.mjs"] }).allowed).toBe(true);
  });

  it("blocks unlabeled code changes during feature freeze", () => {
    const verdict = evaluateFreeze({ date: "2026-09-20", files: ["src/lib/x.ts"] });
    expect(verdict.allowed).toBe(false);
    expect(verdict.reason).toMatch(/feature freeze is active/);
  });

  it("allows stabilization, release-blocker, or owner waiver during feature freeze", () => {
    for (const label of [STABILIZATION_LABEL, RELEASE_BLOCKER_LABEL, FREEZE_WAIVER_LABEL]) {
      expect(evaluateFreeze({ date: "2026-09-25", labels: [label], files: ["scripts/x.mjs"] }).allowed, label).toBe(true);
    }
  });

  it("requires release-blocker or owner waiver from Sep 27 onward", () => {
    expect(evaluateFreeze({ date: "2026-09-27", labels: [STABILIZATION_LABEL], files: ["scripts/x.mjs"] }).allowed).toBe(false);
    expect(evaluateFreeze({ date: "2026-09-27", labels: [RELEASE_BLOCKER_LABEL], files: ["scripts/x.mjs"] }).allowed).toBe(true);
    expect(evaluateFreeze({ date: "2026-09-27", labels: [FREEZE_WAIVER_LABEL], files: ["scripts/x.mjs"] }).allowed).toBe(true);
  });

  it("does not block documentation or guide-content-only work in either freeze", () => {
    const files = ["docs/handoff.md", "src/content/guides/osaka/02-food.json"];
    expect(evaluateFreeze({ date: "2026-09-20", files }).allowed).toBe(true);
    expect(evaluateFreeze({ date: "2026-09-30", files }).allowed).toBe(true);
  });

  it("fails closed when a mixed docs/code PR contains code during the freeze", () => {
    const verdict = evaluateFreeze({
      date: "2026-09-28",
      files: ["docs/handoff.md", "scripts/pipeline-v2.mjs"],
    });
    expect(verdict.allowed).toBe(false);
    expect(verdict.codeFiles).toEqual(["scripts/pipeline-v2.mjs"]);
  });
});
