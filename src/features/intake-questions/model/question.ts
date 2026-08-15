/**
 * Intake question model — structured question records emitted by the research agent
 * during a pass and surfaced on the progress page as traveler-framed question cards.
 *
 * A question is traveler-framed: it asks about the trip ("Do you prefer Oct 15 or Oct 22?"),
 * never about the pipeline ("Should I run Pass B?"). A banned-term check enforces this.
 */

export interface IntakeQuestion {
  /** Stable ID — `q-<slug>-<n>` where n is a monotonic counter per guide (`fork-<slug>-<n>`
   *  for a blocking fork; the two share this shape because they share an answer endpoint). */
  id: string;
  /** The traveler-facing question text. Must not contain pipeline vocabulary. */
  text: string;
  /** What the research agent assumed in the absence of an answer. For a blocking fork this is
   *  the recommendation — same role, since a fork is what a run stops on rather than assumes. */
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
  /** Named choices, when the decision point HAS a fixed set (a blocking fork always does —
   *  validate-revision-plan.mjs requires ≥ 2). Absent/empty means free text. */
  options?: string[];
  /** True when the run is STOPPED on this and waiting (a blocking fork), false/absent when it
   *  proceeded on the assumption (an intake question). The reader must be able to tell those
   *  apart: one is "we guessed, correct us", the other is "nothing moves until you say". */
  blocking?: boolean;
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

/** The two ledger sections that hold decision points, and whether items under each stop the run.
 *  ONE block format serves both (`### <id>` + `- **Key:** value` lines) — a fork is a question
 *  with named options that nothing proceeds past, not a second surface to parse. */
export const DECISION_SECTIONS: { heading: string; blocking: boolean }[] = [
  { heading: "Questions for the traveler", blocking: false },
  { heading: "Blocking forks", blocking: true },
];

/** Options are written as one line of `A | B | C` — a fork's choices are short labels, and a
 *  one-line list stays readable in the ledger's own markdown. */
const OPTION_SEPARATOR = "|";

function parseBlock(raw: string, blocking: boolean): IntakeQuestion | null {
  const lines = raw.split("\n");
  const id = (lines.shift() ?? "").trim();
  if (!id) return null;
  const fields: Record<string, string> = {};
  for (const line of lines) {
    const m = line.match(/^- \*\*([^*]+):\*\*\s*(.*)$/);
    if (m) fields[m[1].trim().toLowerCase()] = m[2].trim();
  }
  if (!fields.q) return null; // a block with no question is not a decision point
  const options = fields.options
    ? fields.options.split(OPTION_SEPARATOR).map((o) => o.trim()).filter(Boolean)
    : [];
  const status = (fields.status || "open") as IntakeQuestion["status"];
  return {
    id,
    text: fields.q,
    assumption: fields.assumed || "",
    context: fields.context || "",
    emittedAt: new Date().toISOString(),
    answer: fields.answer || null,
    answeredAt: null,
    status,
    ...(options.length ? { options } : {}),
    ...(blocking ? { blocking: true } : {}),
  };
}

/** Parse the decision points out of the research ledger (guides-intake/<slug>/ledger.md —
 *  research state, never the frozen intake). Field lines are read individually rather than as
 *  one rigid regex, so an added line (Options) doesn't silently drop every block that has it. */
export function parseQuestionsFromIntake(md: string): IntakeQuestion[] {
  const out: IntakeQuestion[] = [];
  for (const { heading, blocking } of DECISION_SECTIONS) {
    const section = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n##\\s|\\n*$)`).exec(md || "");
    if (!section) continue;
    for (const raw of section[1].split(/^### /m).slice(1)) {
      const q = parseBlock(raw.trimEnd(), blocking);
      if (q) out.push(q);
    }
  }
  return out;
}

/** Format a decision block for the research ledger — the write side of the parser above. */
export function formatQuestionBlock(q: IntakeQuestion): string {
  const lines = [
    `### ${q.id}`,
    `- **Q:** ${q.text}`,
    `- **Assumed:** ${q.assumption}`,
    `- **Context:** ${q.context}`,
  ];
  if (q.options?.length) lines.push(`- **Options:** ${q.options.join(` ${OPTION_SEPARATOR} `)}`);
  lines.push(`- **Status:** ${q.status}`);
  if (q.answer) lines.push(`- **Answer:** ${q.answer}`);
  return lines.join("\n");
}

/** The `{id, answer}` pairs POST /answer takes, from whatever the reader actually filled in.
 *  Pure so the "which of these count as answered" rule is tested, not inferred from the DOM:
 *  blank entries are dropped rather than sent as empty answers the Worker would reject. */
export function buildAnswerPayload(
  slug: string,
  entries: { id: string; answer: string }[],
): { slug: string; answers: { id: string; answer: string }[] } {
  const answers = (entries ?? [])
    .map((e) => ({ id: String(e?.id ?? "").trim(), answer: String(e?.answer ?? "").trim() }))
    .filter((e) => e.id && e.answer);
  return { slug, answers };
}
