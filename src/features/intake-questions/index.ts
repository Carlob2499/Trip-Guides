/**
 * Public surface for the intake-questions feature. Never deep-import model/ or ui/ from
 * outside this file — see CLAUDE.md's sealed-silo rule.
 *
 * Intake questions are traveler-framed decision points emitted by the research agent during
 * a pass and surfaced on the progress page as cards the traveler can answer. Answers are
 * queued amendments absorbed by the next modify pass.
 */
export {
  validateQuestion,
  hasBannedTerm,
  parseQuestionsFromIntake,
  formatQuestionBlock,
  BANNED_TERMS,
} from "./model/question";
export type { IntakeQuestion } from "./model/question";
