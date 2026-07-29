/**
 * Intake question model — structured question records emitted by the research agent
 * during a pass and surfaced on the progress page as traveler-framed question cards.
 *
 * A question is traveler-framed: it asks about the trip ("Do you prefer Oct 15 or Oct 22?"),
 * never about the pipeline ("Should I run Pass B?"). A banned-term check enforces this.
 */

export interface IntakeQuestion {
  /** Stable ID — `q-<slug>-<n>` where n is a monotonic counter per guide. */
  id: string;
  /** The traveler-facing question text. Must not contain pipeline vocabulary. */
  text: string;
  /** What the research agent assumed in the absence of an answer. */
  assumption: string;
  /** Which guide section or day this affects. */
  context: string;
  /** ISO timestamp when the question was emitted. */
  emittedAt: string;
  /** The traveler's answer, or null if unanswered. */
  answer: string | null;
  /** ISO timestamp when answered, or null. */
  answeredAt: string | null;
  /** Status: open (awaiting answer), answered, absorbed (answer applied to guide). */
  status: "open" | "answered" | "absorbed";
}

/** Pipeline vocabulary that must NEVER appear in a traveler-facing question. */
export const BANNED_TERMS = [
  "pipeline", "pass a", "pass b", "reconcile", "checkpoint", "scaffold",
  "agent", "verify", "gate", "workflow", "dispatch", "state.json",
  "coverage.json", "passB.json", "intake doc", "intake spec",
] as const;

const BANNED_RE = new RegExp(`\\b(${BANNED_TERMS.join("|")})\\b`, "i");

export function hasBannedTerm(text: string): string | null {
  const m = text.match(BANNED_RE);
  return m ? m[1] : null;
}

export function validateQuestion(q: IntakeQuestion): string[] {
  const errs: string[] = [];
  if (!q.id) errs.push("missing id");
  if (!q.text?.trim()) errs.push("missing text");
  if (!q.assumption?.trim()) errs.push("missing assumption");
  const banned = hasBannedTerm(q.text);
  if (banned) errs.push(`banned term "${banned}" in question text`);
  if (q.assumption) {
    const bannedA = hasBannedTerm(q.assumption);
    if (bannedA) errs.push(`banned term "${bannedA}" in assumption`);
  }
  return errs;
}

/** Parse questions from the intake doc's `## Questions for the traveler` section. */
export function parseQuestionsFromIntake(md: string): IntakeQuestion[] {
  const sectionRe = /## Questions for the traveler\n([\s\S]*?)(?=\n##\s|\n*$)/;
  const match = md.match(sectionRe);
  if (!match) return [];

  const questions: IntakeQuestion[] = [];
  const blockRe = /### (q-[\w-]+)\n- \*\*Q:\*\* (.+)\n- \*\*Assumed:\*\* (.+)\n- \*\*Context:\*\* (.+)\n- \*\*Status:\*\* (\w+)(?:\n- \*\*Answer:\*\* (.+))?/g;
  let m;
  while ((m = blockRe.exec(match[1])) !== null) {
    questions.push({
      id: m[1],
      text: m[2],
      assumption: m[3],
      context: m[4],
      emittedAt: new Date().toISOString(),
      answer: m[6] || null,
      answeredAt: null,
      status: m[5] as IntakeQuestion["status"],
    });
  }
  return questions;
}

/** Format a question block for the intake doc. */
export function formatQuestionBlock(q: IntakeQuestion): string {
  const lines = [
    `### ${q.id}`,
    `- **Q:** ${q.text}`,
    `- **Assumed:** ${q.assumption}`,
    `- **Context:** ${q.context}`,
    `- **Status:** ${q.status}`,
  ];
  if (q.answer) lines.push(`- **Answer:** ${q.answer}`);
  return lines.join("\n");
}
