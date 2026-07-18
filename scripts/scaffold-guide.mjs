// Deterministic "new guide" scaffolder. Pure Node, no network. Turns a few
// quick-start answers into two committed files:
//   1. src/content/guides/<slug>.json  — a draft guide built on the canonical
//      backbone (the universal section groups + empty activity cards/checklists),
//      with the API-driven sections (map + weather + holidays) PRE-WIRED so live
//      weather / holidays / currency light up immediately, before any research.
//   2. guides-intake/<slug>.md          — NEW_GUIDE_INTAKE filled with the answers,
//      the spec a later Claude Code research pass builds against.
//
// Used by: the local CLI (below), the GitHub Action (.github/workflows/new-guide.yml),
// and the one-off "strip the unverified guides to template" step.
//
// Reused, not duplicated: country facts come from src/data/countries.mjs (accent,
// currency, IANA tz, ISO code, capital coordinate).

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { genRoomId } from "./gen-room-id.mjs";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { countryData, isoCodeFor } from "../src/data/countries.mjs";
import { validateAnswers } from "./intake-schema.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");
const INTAKE_DIR = path.join(ROOT, "guides-intake");

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DEFAULT_DAYS = 7;
const MAX_DAYS = 30;
const DRAFT_STAMP =
  "⚠ Draft scaffold — nothing here is researched or verified yet. This is a starting " +
  "skeleton; every price, hour, address and fact must be added and checked against a " +
  "primary source before use (see the intake spec + CLAUDE.md).";

export function slugify(s) {
  return String(s || "")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")   // strip accents
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "guide";
}

// [startISO, endISO] → ["Wed Jul 8", ...] labels (parseGuideDate-compatible). Capped
// at MAX_DAYS. Returns [] if the range can't be parsed — caller falls back to Day N.
export function dayLabelsFromRange(startISO, endISO) {
  const start = startISO ? new Date(startISO + "T00:00:00Z") : null;
  if (!start || isNaN(start.getTime())) return [];
  let end = endISO ? new Date(endISO + "T00:00:00Z") : null;
  if (!end || isNaN(end.getTime()) || end < start) end = start;
  const out = [];
  for (let d = new Date(start); d <= end && out.length < MAX_DAYS; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(`${WD[d.getUTCDay()]} ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`);
  }
  return out;
}

// The canonical backbone. `coords` (or the country capital) wires map+weather;
// `iso` wires holidays; neither is invented — omitted sections simply hide.
export function buildGuideObject(answers = {}) {
  const country = answers.country || "";
  const data = countryData(country);
  const sym = data?.currency?.symbol || "$";
  const iso = isoCodeFor(country);
  const coords = answers.coords || data?.capital || null;
  const dayLabels = (answers.dayLabels && answers.dayLabels.length)
    ? answers.dayLabels.slice(0, MAX_DAYS)
    : Array.from({ length: DEFAULT_DAYS }, (_, i) => `Day ${i + 1}`);

  const P = (group, title, extra = {}) => ({ type: "panel", group, title, body: "", ...extra });
  const sections = [];

  // Plan
  sections.push(P("Plan", "When you land"));
  sections.push(P("Plan", "Local essentials"));
  sections.push(P("Plan", "Entry & documents"));
  sections.push(P("Plan", "Phone & data"));
  sections.push(P("Plan", "Booking checklist", {
    checklist: ["Flights", "Accommodation", "Airport transfer", "Travel insurance", "Any timed tickets"],
  }));
  if (coords) sections.push({ type: "weather", group: "Plan", title: "Weather for your dates" });
  if (iso)    sections.push({ type: "holidays", group: "Plan", title: "Public holidays & closures" });

  // Money & budget
  sections.push(P("Money & budget", "Money & currency"));
  sections.push({
    type: "budget", group: "Money & budget", title: "Budget & daily costs",
    intro: "Rough per-person estimates — replace the zeros with researched figures.",
    currency: sym, days: dayLabels.length,
    items: [
      { label: "Lodging, per night", basis: "day", est: 0 },
      { label: "Food & drink, per day", basis: "day", est: 0 },
      { label: "Local transport, per day", basis: "day", est: 0 },
      { label: "Sights & activities, per day", basis: "day", est: 0 },
      { label: "Flights — round trip", basis: "trip", est: 0 },
    ],
  });

  // Health & safety
  sections.push(P("Health & safety", "Health & pharmacy"));
  // Etiquette & language
  sections.push(P("Etiquette & language", "Etiquette & language"));

  // Getting around
  sections.push({ type: "routes", group: "Getting around", title: "Key transit routes", steps: [] });
  if (coords) {
    sections.push({
      type: "map", group: "Getting around", title: "Orientation map",
      center: { lat: coords.lat, lng: coords.lng }, span: 0.08,
    });
  }

  // Itinerary
  sections.push({
    type: "days", group: "Itinerary", title: "Day by day",
    items: dayLabels.map((d) => ({ date: d, title: "", pace: "", body: "" })),
  });

  // Sights + Food (content shells; filled during research)
  sections.push({ type: "sights", group: "Sights", title: "Top sights", items: [] });
  sections.push({ type: "prose", group: "Food & shopping", title: "What to eat", body: "" });

  // Traveler's specific niche interest (free-text) → one dedicated shell, if given.
  // This is the only priority materialized as a scaffold section: it has no home in
  // the universal backbone and is an explicit custom signal. The ranked dropdown
  // priorities are recorded in the intake doc instead and drive research-TIME depth
  // (CLAUDE.md order-of-operations), which keeps the backbone predictable and avoids
  // seeding empty generic priority tabs on a viewable draft.
  const niche = (answers.niche || "").trim();
  if (niche) sections.push(P("Highlights", niche));

  // References — canonical closing section; the research pass fills the sources.
  sections.push({ type: "prose", group: "References", title: "Sources & further reading", body: "" });

  const cityLabel = (answers.cities || "").trim();
  return {
    kicker: "Field guide",
    title: answers.title || (cityLabel ? `${cityLabel} & ${country}` : country),
    dek: "",
    country,
    draft: true,
    verified: DRAFT_STAMP,
    // Born strict: every guide from here on must date the facts it claims to have
    // checked. A fresh scaffold has no facts, so this passes trivially — it starts
    // biting the moment research writes the first ≈ figure, which is exactly when the
    // date is knowable and exactly what "new facts get a verification date on write,
    // never bolted on later" means. Korea/Denmark predate the gate and stay loose.
    provenance: "strict",
    // Salted, unguessable id for this guide's shared Trip-Split / feedback / reminders room.
    // Born with one so the room is writable (rules gate writes on length >= 16) AND unguessable,
    // unlike the pre-hardening guides whose slug-keyed rooms are now frozen read-only.
    roomId: genRoomId(),
    footer: "",
    sections,
  };
}

// Fill NEW_GUIDE_INTAKE with what the quick-start collected; leave the rest blank.
export function buildIntakeMd(answers = {}) {
  const prio = (answers.priorities || []).filter(Boolean);
  return `# New Guide Intake — ${answers.country || "[Destination]"}

> Generated by the "Make a new Guide" scaffolder. Quick-start answers are filled in;
> complete the blanks WITH THE TRAVELER before research. See CLAUDE.md "Order of
> Operations". Keep this file next to the guide so future updates know the priorities.

## 1. The Traveler(s)
- **Who is this for / party:** ${answers.party || ""}  *(→ pick the TRAVELER_PATTERNS party A/B/new before researching; do NOT infer from the last guide)*
- Number of travelers: ${answers.travelers || ""}
- Group makeup / ages / mobility / dietary (from Comments): ${answers.comments || ""}
- First time or returning:
- Languages spoken:
- Home country (drives visa & entry research):

## 2. Trip Shape
- Exact dates (start–end): ${[answers.start, answers.end].filter(Boolean).join(" – ")}
- Cities: ${answers.cities || ""}
- Number of nights / cities:
- **Anchor event (the non-negotiable the trip is built around):** ${answers.anchor || ""}  *(VERIFY this first, against a T0 source — dates + venue — before any other research)*
- Pace preference: ${answers.pace || "packed / balanced / slow"}

## 3. Priorities — RANK them
Top 3, in order:
1. ${prio[0] || ""}
2. ${prio[1] || ""}
3. ${prio[2] || ""}
- Niche interest: ${answers.niche || ""}
- **Travel style:** ${answers.travelStyle || "bucket-list must-sees / off-the-beaten-path / balanced"}  *(→ drives Pass B's aggressiveness on crowd-avoidance + novel picks)*

## 4. Budget Reality
- Per-day target (from form): ${answers.budget || ""}
- Accommodation style: hostel / mid-range / boutique / luxury
- Splurge on: / Save on:

## 5. Constraints & Dealbreakers
- Dietary: / Physical limits: / Hard avoids: / Safety priorities:

## 6. The Tone
- Who will read this: / Voice: practical & terse / warm & narrative / detailed

## 7. Special Requirements
- Anything that makes this trip unlike a default version of the same destination:

---

## Spec Summary (fill after intake, before research)
- Section types to include / exclude (and why):
- The 2–3 priorities driving depth:
- Hard filters applied to every entry:
- Verification focus (most perishable / most important to get right):

## Research reconciliation (fill during the dual-pass — see the guide-author skill)
> Pass A = canonical/verified (official, anchors, logistics). Pass B = local/authentic/crowd-aware
> (resident + blog knowledge, off-peak timing, novel alternatives). Record what each pass found and
> how conflicts resolved — this is the corroboration trail behind the guide.

| Item | Pass A (canonical) | Pass B (local/authentic) | Reconciled → guide | Note (conflict / crowd / novel) |
|------|--------------------|--------------------------|--------------------|---------------------------------|
|      |                    |                          |                    |                                 |

## Amendments (append-only — record every research-forced re-plan)
> When research changes the plan (an anchor moved, a neighborhood beats the intended one, a day
> collapsed), log it here with the reason. The intake above stays the ORIGINAL intent; this is the
> diff. (Korea/Denmark were "corrected three times by running it" — that history now has a home.)

- (none yet)
`;
}

// Pick a slug not already used by a guide file.
async function uniqueSlug(base) {
  let slug = base, n = 2;
  while (existsSync(path.join(GUIDES_DIR, `${slug}.json`))) { slug = `${base}-${n++}`; }
  return slug;
}

// Write both files for a set of answers. Returns { slug, guidePath, intakePath }.
export async function writeScaffold(answers) {
  // Validate against the shared intake schema (country required; everything else optional) — this
  // is the one gate both entry points (CLI + issue form) pass through.
  const v = validateAnswers(answers);
  if (!v.ok) throw new Error(`invalid intake: ${v.error}`);
  // Derive the day labels from the trip dates HERE, so every caller gets the right per-day card
  // count without repeating dayLabelsFromRange (kept overridable for direct/test callers).
  const a = answers.dayLabels ? answers : { ...answers, dayLabels: dayLabelsFromRange(answers.start, answers.end) };
  const slug = await uniqueSlug(slugify(a.slug || a.country || a.title));
  const guide = buildGuideObject(a);
  const intake = buildIntakeMd(a);
  await mkdir(GUIDES_DIR, { recursive: true });
  await mkdir(INTAKE_DIR, { recursive: true });
  const guidePath = path.join(GUIDES_DIR, `${slug}.json`);
  const intakePath = path.join(INTAKE_DIR, `${slug}.md`);
  await writeFile(guidePath, JSON.stringify(guide, null, 2) + "\n");
  await writeFile(intakePath, intake);
  return { slug, guidePath, intakePath };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
// node scripts/scaffold-guide.mjs --country "Brazil" --cities "Rio de Janeiro" \
//   --start 2026-03-01 --end 2026-03-08 --travelers 2 --pace balanced \
//   --priorities "Food,Nature" --niche "live music" --budget "Mid-range ($75-150/day)" \
//   --comments "one vegetarian" [--title "..."] [--lat -22.9 --lng -43.2] [--slug rio]
function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) { a[argv[i].slice(2)] = argv[i + 1]; i++; }
  }
  return a;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a.country && !a.title) {
    console.error("Usage: node scripts/scaffold-guide.mjs --country <name> [--cities ..] [--start YYYY-MM-DD --end YYYY-MM-DD] [--travelers N] [--pace ..] [--priorities a,b,c] [--niche ..] [--budget ..] [--comments ..] [--lat ..] [--lng ..] [--slug ..]");
    process.exit(1);
  }
  // Accept EITHER --start/--end OR the issue form's --dates "YYYY-MM-DD to YYYY-MM-DD",
  // so the CLI and the New-guide issue path take the same date format.
  let [start, end] = [a.start, a.end];
  if (a.dates && !start) [start, end] = a.dates.split(/\s+to\s+/i).map((s) => s.trim());
  const answers = {
    country: a.country, title: a.title, cities: a.cities,
    slug: a.slug, start, end,
    travelers: a.travelers, pace: a.pace, niche: a.niche, budget: a.budget, comments: a.comments,
    anchor: a.anchor, party: a.party, travelStyle: a["travel-style"],
    priorities: a.priorities ? a.priorities.split(",").map((s) => s.trim()) : [],
    coords: (a.lat && a.lng) ? { lat: parseFloat(a.lat), lng: parseFloat(a.lng) } : null,
  };
  // dayLabels is derived inside writeScaffold from start/end — the CLI no longer computes it.
  const res = await writeScaffold(answers);
  console.log(`[scaffold] wrote ${path.relative(ROOT, res.guidePath)} + ${path.relative(ROOT, res.intakePath)} (slug: ${res.slug})`);
}

// Run as CLI only when invoked directly (not when imported).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error("[scaffold] error:", err.message); process.exit(1); });
}
