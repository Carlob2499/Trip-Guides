// The Guide Author skill's two homes stay one skill.
//
// `.claude/skills/waypoint-guide-author/` is the canonical copy; `.agents/skills/…` is the
// generated mirror (same content, with the auto-loading instructions file renamed CLAUDE.md →
// AGENTS.md — the ONLY sanctioned platform difference). Nothing in the language connects them,
// so this parity test is the seam: edit the canonical copy, run
// `node scripts/sync-skill-mirror.mjs`, and this stays green; edit one side alone and it goes
// red naming the file.
//
// It also pins the skill doctrine itself: the fixed research floors are GONE from the skill
// (adaptive saturation replaced them — DECISIONS.md "Research breadth"), the decision-impact
// depth layer exists and covers what the locked decisions require, each policy has ONE
// authoritative home, and implementation-history pointers stay out of the live skill tree.

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

describe("skill doctrine — locked decisions landed, fixed floors gone", () => {
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
      expect(text).not.toMatch(/16\/10\/6/); // not even as "superseded" vocabulary
      expect(text).not.toMatch(/owes ≥8 finds/);
      expect(text).not.toMatch(/researchFloors/); // the escape hatch dies with the floors it escaped
    }
  });

  it("the live skill tree carries doctrine, not implementation history", () => {
    // Rules stand on their own; decision diaries live in git history / docs archive. A pointer
    // into the archive or a plan/milestone tag inside the skill is history re-accreting.
    for (const f of ["SKILL.md", ...readdirSync(path.join(CANON, "references")).map((r) => path.join("references", r))]) {
      const text = read(path.join(CANON, f));
      expect(text, f).not.toMatch(/docs\/archive\//);
      expect(text, f).not.toMatch(/supersedes/i);
    }
  });

  it("source-access honesty has one authoritative home, pointed at by every V2 stage prompt", () => {
    expect(efficiency).toMatch(/Source access is recorded, never inflated/);
    expect(efficiency).toMatch(/NEVER the origin/);
    for (const p of ["research-passA-v2.md", "research-passB-v2.md", "research-reconcile-v2.md"]) {
      const prompt = norm(read(path.join(ROOT, "prompts", p)));
      expect(prompt, p).toMatch(/`source\.access` is recorded honestly, never inflated/);
      expect(prompt, p).toMatch(/Fetch discipline/);
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
