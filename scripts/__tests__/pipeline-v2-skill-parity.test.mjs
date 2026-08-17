// M3 of Pipeline V2 — the Guide Author skill's two homes stay one skill.
//
// `.claude/skills/waypoint-guide-author/` is the canonical copy; `.agents/skills/…` is the
// generated mirror (same content, with the auto-loading instructions file renamed CLAUDE.md →
// AGENTS.md). Nothing in the language connects them, so this parity test is the seam — edit the
// canonical copy, regenerate the mirror, and this stays green; edit one side alone and it goes
// red naming the file.
//
// It also pins the M3 doctrine changes themselves: the fixed research floors are GONE from the
// skill (adaptive saturation replaced them — DECISIONS.md "Research breadth"), and the
// decision-impact depth layer exists and covers what the locked decisions require.

// @protects-file The Guide Author doctrine has one source per rule, mirrored, with no fixed floors.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CANON = path.join(ROOT, ".claude", "skills", "waypoint-guide-author");
const MIRROR = path.join(ROOT, ".agents", "skills", "waypoint-guide-author");
const read = (p) => readFileSync(p, "utf8");

describe("skill parity — .claude canonical, .agents generated", () => {
  it("both trees carry the same reference files", () => {
    expect(readdirSync(path.join(MIRROR, "references")).sort()).toEqual(
      readdirSync(path.join(CANON, "references")).sort(),
    );
  });

  it.each(readdirSync(path.join(CANON, "references")))("references/%s is byte-identical", (f) => {
    expect(read(path.join(MIRROR, "references", f))).toBe(read(path.join(CANON, "references", f)));
  });

  it("SKILL.md differs ONLY by the CLAUDE.md → AGENTS.md rename", () => {
    const canonical = read(path.join(CANON, "SKILL.md"));
    const mirrored = read(path.join(MIRROR, "SKILL.md"));
    expect(mirrored).toBe(canonical.replaceAll("CLAUDE.md", "AGENTS.md"));
  });
});

describe("M3 doctrine — locked decisions landed, fixed floors gone", () => {
  // Markdown hard-wraps at ~98 cols, so every doctrinal phrase is matched against
  // whitespace-normalized text — a rewrap must never flip these assertions.
  const norm = (s) => s.replace(/\s+/g, " ");
  const skill = norm(read(path.join(CANON, "SKILL.md")));
  const efficiency = norm(read(path.join(CANON, "references", "research-efficiency.md")));
  const rules = norm(read(path.join(CANON, "references", "verification-rules.md")));
  const depth = norm(read(path.join(CANON, "references", "research-depth.md")));

  it("no fixed candidate/Pass-B floors remain in the skill doctrine", () => {
    for (const text of [skill, efficiency]) {
      expect(text).not.toMatch(/16\/8 · 10\/5 · 6\/3/);
      expect(text).not.toMatch(/owes ≥8 finds/);
      expect(text).not.toMatch(/researchFloors/); // the escape hatch dies with the floors it escaped
    }
  });

  it("the adaptive stopping rule is stated with BOTH conditions", () => {
    for (const text of [skill, efficiency]) {
      expect(text).toMatch(/duplicates or clearly weaker/);
      expect(text).toMatch(/unlikely to change the/);
    }
  });

  it("objective vs experiential evidence is a stated distinction with the corroboration bar", () => {
    expect(rules).toMatch(/Objective facts/);
    expect(rules).toMatch(/Experiential evidence/);
    expect(rules).toMatch(/≥2.*recent.*independent.*firsthand/i);
    expect(rules).toMatch(/official URL pasted onto a subjective claim/);
    expect(skill).toMatch(/experiential findings/i);
  });

  it("source independence is about families, not domain counts", () => {
    expect(rules).toMatch(/FAMILIES, not domains/);
    expect(rules).toMatch(/count ONCE/);
  });

  it("the depth layer covers the locked decision set", () => {
    for (const marker of [
      "decision impact, disagreement, booking friction, and transport risk",
      "exact date to attempt",
      "unconfirmed-lead",
      "Worth the Effort",
      "Worth the Detour",
      "last practical return",
      "fail DIFFERENTLY",
      "prior-year data is a LEAD, never a confirmed date",
      "memory proposes, current research verifies",
    ]) {
      expect(depth.toLowerCase()).toContain(marker.toLowerCase());
    }
  });

  it("Pass B native-language research is adaptive with a light audit trail", () => {
    expect(skill).toMatch(/Native-language research is adaptive/);
    expect(skill).toMatch(/never every query or result/);
  });

  it("independence is stated honestly — V1 is a contract, V2 is mechanical", () => {
    const passB = norm(read(path.join(ROOT, "prompts", "research-passB.md")));
    expect(passB).not.toMatch(/STRUCTURALLY INDEPENDENT/);
    expect(passB).toMatch(/may physically contain Pass A/);
    expect(skill).toMatch(/mechanically EXCLUDES/);
  });
});
