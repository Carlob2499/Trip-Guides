/**
 * Public surface for the intake-questions feature. Never deep-import model/ or ui/ from
 * outside this file — see CLAUDE.md's sealed-silo rule.
 *
 * Intake questions are traveler-framed decision points emitted by the research agent during
 * a pass and surfaced on the progress page as cards the traveler can answer. Answers are
 * queued amendments absorbed by the next change run (source "answers").
 *
 * Blocking forks ride the same rails (batch 3): same block format, same parser, same answer
 * endpoint — a fork is a question with named options that the run is STOPPED on, and the only
 * thing the reader needs told apart is that nothing moves until they choose.
 */
export {
  validateQuestion,
  hasBannedTerm,
  parseQuestionsFromIntake,
  formatQuestionBlock,
  buildAnswerPayload,
  BANNED_TERMS,
  DECISION_SECTIONS,
} from "./model/question";
export type { IntakeQuestion } from "./model/question";
