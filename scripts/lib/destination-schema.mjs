// D1 (docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST) — destination knowledge AS DATA. Before this, a destination's
// languages, official advisory URL, transit operators/GTFS sources, seasonal forecast sources,
// and tax-free rule pointer lived as prose scattered across the skill (or, per the plan's D10
// defect, nowhere at all) — every research pass re-found them from scratch. This is the one
// canonical home: `src/data/destinations/<slug>.json`, seeded here, consumed by research (D2
// points the skill at it instead of restating specifics).
//
// FACT DISCIPLINE APPLIES HERE TOO — this is not a config file you hand-type freely. Every URL
// is a `sourcePointer`: it carries `verified_on` (when it was actually checked) with the SAME
// rigor as a facts.json row, because a wrong destination-config URL sends every future research
// pass down a dead path. `state: "unconfirmed"` covers a URL that's correct/well-known but whose
// LIVE CONTENT wasn't independently fetched this pass (e.g. travel.state.gov's bot-gated pages —
// see the Japan seed) — `verified_on` on an unconfirmed pointer means "last attempted," never
// "confirmed." Never omit it to dodge that distinction; record the honest attempt instead.

import { z } from "zod";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// A single URL this destination's research should consult. See the module comment above for
// what `state: "unconfirmed"` means — it is not an escape hatch from `verified_on`.
export const sourcePointer = z.object({
  url: z.url(),
  label: z.string().min(1).optional(),
  verified_on: z.string().regex(DATE_RE, "verified_on must be YYYY-MM-DD"),
  state: z.enum(["confirmed", "unconfirmed"]).default("confirmed"),
});

export const destinationConfig = z
  .object({
    // Guide slug this config serves — same kebab-case contract as everything else in the
    // pipeline (scripts/lib/slug.mjs). Not necessarily 1:1 with country: two guides to the
    // same country would share a config in a later revision; today it's slug-keyed because
    // that's what a research pass actually has in hand (the intake's slug) before any guide
    // object exists to read a `country` field from.
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "slug must be kebab-case"),
    // ISO 639-1 codes, primary first — drives Pass B's native-first discovery sweep (D2).
    languages: z.array(z.string().min(2).max(3)).min(1),
    // T0 domain allowlist SEEDS — known-good official domains research should prefer citing
    // from, not an exhaustive or enforced list. A domain absent here is not forbidden; this
    // just saves re-discovering the obvious ones (a country's gov TLD, its national rail
    // operators) every single pass.
    t0Domains: z.array(z.string().min(1)).default([]),
    // Absent = not applicable (e.g. a domestic US trip needs no outbound-travel advisory).
    travelAdvisory: sourcePointer.optional(),
    transitAuthorities: z
      .array(
        z.object({
          name: z.string().min(1),
          url: sourcePointer,
        }),
      )
      .default([]),
    // National/regional open-data AGGREGATORS (e.g. Japan's ODPT), not per-operator raw feed
    // endpoints — this repo does not fabricate a specific GTFS file URL it hasn't verified
    // exists; it points at the real portal a research pass can search from there.
    gtfsPortals: z.array(sourcePointer).default([]),
    // Forecast-class sources for facts that are inherently seasonal/predictive (Japan's koyo
    // forecast is the motivating case — the Japan regression fixture's case 4 froze a guide
    // shipping koyo dates as multi-year averages with NO source row at all).
    seasonalSources: z.array(sourcePointer).default([]),
    // Absent = no destination-specific tax-free/duty-free rule research has found yet.
    taxFreeRules: sourcePointer.optional(),
    // Case 11's live Routes layer: how a scheduled day at this destination actually moves.
    // NOT a sourcePointer — this is a routing PARAMETER, not a claim about the world, so it
    // carries no verified_on. It is read from the guide's own transit section (Korea rides
    // KTX and the subway; a Sedona trip drives a rental car because that guide names driving
    // as "the recommended default for the whole trip"), never guessed from the country.
    // Absent ⇒ TRANSIT, which is the safe default: it is the mode a guide is most likely to
    // schedule around, and a wrong mode only makes the advisory noisier, never a blocker.
    defaultTravelMode: z.enum(["TRANSIT", "DRIVE", "WALK", "BICYCLE"]).optional(),
  })
  .strict();

export function validateDestinationConfig(data) {
  const r = destinationConfig.safeParse(data);
  if (r.success) return { ok: true, value: r.data };
  const error = r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
  return { ok: false, error };
}
