// Case 11 (docs/PLAN_EVIDENCE_FIRST.md, fixture MANIFEST) — transit leg durations asserted
// without a routing authority behind them.
//
// THE DEFECT. Guides state inter-stop durations as honest estimates — "JR Senzan Line to
// Yamagata (≈70–90 min) then a local bus (≈35–40 min)". The `≈` is correct notation under
// verification-rules.md §4, but nothing ever checks the leg against an authority, so a
// rerouted line or a withdrawn bus service reads exactly like a good estimate. This is the
// one defect class in the fixture that is systemic rather than particular: every guide in the
// corpus has it (korea 12 units, denmark 17, us 3, fixture 14).
//
// ADVISORY, ALWAYS — BY DESIGN, NOT BY TIMIDITY. The creator settled Google Routes as
// config-gated and default OFF (clarifying question 4), and the fixture MANIFEST states the
// consequence explicitly: "with no key the check degrades to advisory and never fails, so H1
// must assert the advisory finding, not a blocker." A count that fires on every guide is
// therefore the CORRECT behaviour here — it is a standing measurement of how much of a guide's
// transit is unattested, not a pass/fail gate.
//
// WHAT IS AND ISN'T BUILT, stated plainly. The advisory half is complete and needs no key: it
// finds leg-duration claims carrying no `source_url`. The LIVE half — actually asking Routes
// whether ≈70–90 min is true — is gated below and inert, and it needs one thing this repo does
// not yet have: machine-readable ORIGIN→DESTINATION pairs. The durations live in prose, and
// resolving "JR Senzan Line to Yamagata" to two coordinates is a content-structure problem
// (the guide's `map` points are the raw material), not an API problem. Wiring the key without
// that would produce a call with nothing to ask about, so the gate stays inert and says why.

const MINUTES = /(?:≈|~|about\s)?\d{1,3}\s?(?:–|-|to\s)?\s?\d{0,3}\s?min\b/i;
const TRANSIT = /\b(line|train|bus|subway|metro|ferry|tram|shinkansen|JR\s|ride|transfer|walk)\b/i;

/** Pure: every unit (section or item) asserting a transit-leg duration, split by whether it
    carries provenance. A unit inherits its section's `source_url` — an item under a sourced
    section is attested by that source, and counting it as unverified would overstate the gap. */
export function extractLegDurations(sections = []) {
  const legs = [];
  for (const s of sections ?? []) {
    for (const unit of [s, ...(s?.items ?? [])]) {
      const text = JSON.stringify(unit);
      if (!MINUTES.test(text) || !TRANSIT.test(text)) continue;
      legs.push({
        label: unit?.name || unit?.title || s?.title || s?.group || "(untitled)",
        sourced: Boolean(unit?.source_url || s?.source_url),
      });
    }
  }
  return legs;
}

/** Is live route verification available? Inert until a key is configured — the Places
    precedent (`lookup-venue.mjs`), and the creator's default-OFF ruling. */
export function routesConfigured({ apiKey = process.env.ROUTES_API_KEY } = {}) {
  return Boolean(apiKey);
}

/**
 * Advisory report for one guide. Never returns "fail": the MANIFEST fixes this as advisory,
 * and an absent key must degrade rather than break.
 */
export function checkRoutes(sections = [], { apiKey = process.env.ROUTES_API_KEY } = {}) {
  const legs = extractLegDurations(sections);
  if (!legs.length) return { status: "n/a", reason: "no transit-leg durations found", findings: [], legs: 0, unverified: 0 };

  const unverified = legs.filter((l) => !l.sourced);
  const configured = routesConfigured({ apiKey });
  const findings = [];

  if (unverified.length) {
    const sample = unverified.slice(0, 3).map((l) => `"${l.label}"`).join(", ");
    findings.push({
      code: "leg-duration-unverified",
      count: unverified.length,
      msg:
        `${unverified.length} of ${legs.length} transit-leg duration(s) carry no source — e.g. ${sample}. ` +
        `An \`≈\` is honest notation, but nothing has checked these legs against a routing authority`,
    });
  }

  if (!configured) {
    findings.push({
      code: "routes-not-configured",
      msg:
        "ROUTES_API_KEY is not set, so leg durations cannot be verified live — this check is " +
        "advisory by design (config-gated, default OFF) and never fails a run",
    });
  } else {
    // Configured but still unable to verify: see the header. The blocker is structural, not
    // credential-shaped, and saying so is more useful than a silent no-op.
    findings.push({
      code: "routes-legs-unresolvable",
      msg:
        "ROUTES_API_KEY is set, but leg durations live in prose with no machine-readable " +
        "origin→destination pair to query — structuring legs against the guide's `map` points " +
        "is the remaining work before live verification can run",
    });
  }

  return { status: "advisory", configured, findings, legs: legs.length, unverified: unverified.length };
}
