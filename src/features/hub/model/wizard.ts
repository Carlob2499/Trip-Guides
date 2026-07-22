/**
 * Pure logic behind the New-Guide wizard (ui/wizard.js) — the step layout, the step-
 * transition/validation guard, and the booking-document text parser. Extracted so the
 * bug-prone bits (which fields belong to which step, whether "Next" should be allowed to
 * fire, and the regex-driven date/flight/lodging extraction) are unit-testable without a
 * DOM. The UI keeps only element creation, GSAP wiring, and file reading.
 *
 * A7 / TEST_COVERAGE_ANALYSIS.md §P6: wizard.js was named the top untested-risk-surface
 * candidate — none of this had a single test before this extraction.
 */
import { z } from "zod";

/* ── Step layout ──────────────────────────────────────────────────────────────────
   Which field ids belong to which numbered step. Pure data — ui/wizard.js uses this to
   re-parent the existing form fields into step containers (no data change, no new
   fields). Kept here (not just inline in the UI file) so a test can assert every field
   id used elsewhere in the form actually has a step, and no id is silently orphaned. */
export interface WizardStep {
  title: string;
  ids: string[];
}

export const WIZARD_STEPS: WizardStep[] = [
  { title: "Where & when", ids: ["ngCountry", "ngCities", "ngStart", "ngAnchor"] },
  { title: "Who & style", ids: ["ngTravelers", "ngParty", "ngPace", "ngTravelStyle", "ngBudget"] },
  { title: "What to research", ids: ["ngPriority1", "ngPriority2", "ngPriority3", "ngNiche", "ngComments"] },
];

/* ── Step-transition guard ────────────────────────────────────────────────────────
   The only validation the wizard enforces: you can't leave step 0 (Where & when)
   without a Country. Every other transition (back, or forward past a later step) is
   unconditional. Pulled out of ui/wizard.js's `go(dir)` so the bounds-checking +
   Country guard can be tested without building a DOM/GSAP context. */
export interface StepTransitionResult {
  /** True if the transition is allowed. */
  ok: boolean;
  /** The step index to land on if ok, else null. */
  nextStep: number | null;
  /** Set only when ok is false because of a failed field guard (not an out-of-bounds dir). */
  error?: string;
}

export function validateStepTransition(
  currentStep: number,
  direction: 1 | -1,
  totalSteps: number,
  countryValue: string,
): StepTransitionResult {
  const next = currentStep + direction;
  if (next < 0 || next >= totalSteps) return { ok: false, nextStep: null };
  // The Country guard only applies when LEAVING step 0 going FORWARD — going back to
  // step 0, or moving between any two later steps, is always unconditional.
  if (direction > 0 && currentStep === 0 && !countryValue.trim()) {
    return { ok: false, nextStep: null, error: "Country is required." };
  }
  return { ok: true, nextStep: next };
}

/* ── Booking-document parser ──────────────────────────────────────────────────────
   Pure text → structured extraction. The UI wrapper (ui/wizard.js) reads the dropped
   file as text, calls this, then does the DOM work (prefill #ngStart/#ngEnd, render
   the summary line, push to the running parsedNotes[] array). Nothing here touches
   the DOM or any global state — same file, same result, every time. */

const ParsedDocumentSchema = z.object({
  /** Sorted, deduped YYYY-MM-DD strings found in the text (ISO or ICS-style bare digits). */
  isoDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  /** Likely flight numbers (airline code + digits), capped at 6 — never guessed, only matched. */
  flights: z.array(z.string()),
  /** Lines that look like lodging info (hotel/hostel/airbnb/check-in/reservation), capped at 4. */
  hotelLines: z.array(z.string()),
  /** One human-readable summary line for the ngDocOut UI, e.g. "2 dates (... → ...) · flights: ...". */
  summary: z.string(),
});
export type ParsedDocument = z.infer<typeof ParsedDocumentSchema>;

export function parseBookingDocument(text: string): ParsedDocument {
  // ISO + ICS-style bare digits (YYYYMMDD) → normalized YYYY-MM-DD, deduped, sorted.
  const isoDates = [...new Set(
    (text.match(/\b(20\d{2})-?(0[1-9]|1[0-2])-?(0[1-9]|[12]\d|3[01])\b/g) || [])
      .map((s) => s.replace(/(\d{4})-?(\d{2})-?(\d{2})/, "$1-$2-$3")),
  )].sort();

  // Flight numbers + likely confirmation codes — attached, never guessed at. Capped at 6.
  const flights = (text.match(/\b[A-Z]{2}\s?\d{2,4}\b/g) || []).slice(0, 6);

  // Lodging-looking lines, capped at 4 (short lines only — long paragraphs mentioning
  // "hotel" in passing aren't a booking-confirmation line).
  const hotelLines = text.split(/\r?\n/)
    .filter((l) => /hotel|hostel|airbnb|check-?in|reservation/i.test(l) && l.trim().length < 120)
    .slice(0, 4);

  const found: string[] = [];
  if (isoDates.length) {
    found.push(`${isoDates.length} date${isoDates.length > 1 ? "s" : ""} (${isoDates[0]} → ${isoDates[isoDates.length - 1]})`);
  }
  if (flights.length) found.push(`flights: ${flights.join(", ")}`);
  if (hotelLines.length) found.push(`lodging lines: ${hotelLines.length}`);

  const result = {
    isoDates,
    flights,
    hotelLines: hotelLines.map((l) => l.trim()),
    summary: found.join(" · ") || "no structured data found",
  };
  return ParsedDocumentSchema.parse(result);
}

/**
 * Build the one-line "From <name>: ..." note that accumulates in parsedNotes[] and
 * eventually folds into the submitted issue's comments field.
 */
export function formatParsedNote(filename: string, doc: ParsedDocument): string {
  const base = `From ${filename}: ${doc.summary}`;
  return doc.hotelLines.length ? `${base}\n  ${doc.hotelLines.join("\n  ")}` : base;
}
