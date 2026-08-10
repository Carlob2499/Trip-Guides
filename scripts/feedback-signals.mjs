// Deterministic divergence signals for the LEARN loop's auto-file step (REVISE_GUIDE V6,
// synthesis ruling #7: thresholds are pure logic, unit-testable — the agent only drafts and
// files). Takes the export step's per-slug summaries (export-feedback.mjs summarize() shape)
// and returns, per slug, the list of tripped signals. A slug with ANY signal is a candidate
// for an auto-filed revision-request issue; a slug with none is left alone.
//
// THRESHOLDS (Q4 — creator-confirmable defaults; numbers that file issues in the creator's
// tracker are the creator's to sign):
//   · avg overall rating ≤ 3   — the trip as delivered underperformed the guide's promise
//   · avg pacing rating  ≤ 2   — the day plan's rhythm was badly wrong, a structural miss
//   · skips per submission ≥ 3 — travelers abandoned enough planned stops that the plan
//                                diverged from reality, not just taste
// The summaries carry no per-group visit data (no tallySkipsByGroup exists in the exporter),
// so the plan doc's "any group 100% skipped" candidate signal is NOT implementable today —
// noted rather than silently approximated.

export const THRESHOLDS = {
  overallMax: 3, // avg overall ≤ this trips the signal
  pacingMax: 2, // avg pacing ≤ this trips the signal
  skipsPerSubmission: 3, // avg skipped stops per submission ≥ this trips the signal
};

// Pure: summaries (array of { slug, count, ratings{overall,pacing,food}, skips[], ... }) →
// array of { slug, signals: [string], counts: { submissions, skips } } for slugs with ≥1 signal.
export function divergenceSignals(summaries, thresholds = THRESHOLDS) {
  const out = [];
  for (const s of summaries || []) {
    if (!s || !s.slug || !Number.isFinite(s.count) || s.count < 1) continue;
    const signals = [];
    const overall = s.ratings?.overall;
    const pacing = s.ratings?.pacing;
    const skips = Array.isArray(s.skips) ? s.skips.length : 0;

    if (Number.isFinite(overall) && overall <= thresholds.overallMax)
      signals.push(`avg overall rating ${overall} ≤ ${thresholds.overallMax}`);
    if (Number.isFinite(pacing) && pacing <= thresholds.pacingMax)
      signals.push(`avg pacing rating ${pacing} ≤ ${thresholds.pacingMax}`);
    if (skips / s.count >= thresholds.skipsPerSubmission)
      signals.push(`${skips} skipped stops across ${s.count} submission(s) (≥ ${thresholds.skipsPerSubmission}/submission)`);

    if (signals.length) out.push({ slug: s.slug, signals, counts: { submissions: s.count, skips } });
  }
  return out;
}
