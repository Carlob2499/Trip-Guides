// closed_days (D11, docs/archive/INDEX.md → PLAN_ATLAS_MIGRATION Stage A.3) — build-time cross-check: does any
// itinerary day schedule a waypoint on the very day the sight/venue it names is closed?
// A WARNING, never a build failure (the plan's own wording) — closed_days is too new and
// too incompletely populated to gate on yet; this just makes a real conflict visible instead
// of silent. Runs as part of `npm run build` (see package.json), after `astro build` so a
// schema error surfaces first and this never masks it.
//
// Matching is by NAME (case/whitespace-insensitive) — waypoints carry no id to match by
// (content.config.ts's `days[].waypoints` schema has name/lat/lng/time/note only). The pure
// match + weekday logic lives in src/lib/closed-days.mjs (tested, plain JS so both this
// script and SightsBlock.astro can import the same source of truth); this script is only
// the file-reading + date-label-parsing glue around it.

import { readGuides, flatten, isMain } from "./audit/lib.mjs";
import { checkClosedDayConflicts, weekdayOf } from "../src/lib/closed-days.mjs";

// Mirrors src/lib/trip-dates.ts's resolveTripDate exactly (MONTHS list + the 180-day-past
// rollover rule) — duplicated rather than imported because Node's plain `node` (this script
// runs inside `npm run build`, no tsx) cannot import a .ts module directly, same reasoning
// scripts/audit/lib.mjs documents for its own date-parsing helpers.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function resolveDayDate(label, now) {
  if (!label) return null;
  const parts = String(label).trim().split(/\s+/);
  const moIdx = MONTHS.indexOf(parts[1]);
  const day = parseInt(parts[2], 10);
  if (moIdx === -1 || isNaN(day)) return null;
  const d = new Date(now.getFullYear(), moIdx, day);
  if (d < now && (now.getTime() - d.getTime()) > 180 * 86400000) d.setFullYear(now.getFullYear() + 1);
  return d;
}

function findClosedDayWarnings(guides, now = new Date()) {
  const all = [];
  for (const { guide, slug } of guides) {
    const sections = flatten(guide.sections);
    const visitables = [];
    for (const s of sections) {
      if (s.type !== "sights" && s.type !== "venues") continue;
      for (const item of s.items || []) {
        if (item.name && item.closed_days?.length) visitables.push({ name: item.name, closedDays: item.closed_days });
      }
    }
    if (!visitables.length) continue;

    const dayInputs = [];
    for (const s of sections) {
      if (s.type !== "days") continue;
      for (const day of s.items || []) {
        const resolved = resolveDayDate(day.date, now);
        if (!resolved) continue;
        const weekday = weekdayOf(resolved);
        for (const wp of day.waypoints || []) {
          if (wp.name) dayInputs.push({ guideSlug: slug, dayDate: day.date, weekday, waypointName: wp.name });
        }
      }
    }
    if (!dayInputs.length) continue;

    all.push(...checkClosedDayConflicts(dayInputs, visitables));
  }
  return all;
}

if (isMain(import.meta.url)) {
  const guides = await readGuides();
  const warnings = findClosedDayWarnings(guides);
  if (warnings.length) {
    console.warn(`\n[closed-days] ${warnings.length} itinerary waypoint(s) scheduled on a closed day:`);
    for (const w of warnings) {
      console.warn(`  ⚠ ${w.guideSlug}: "${w.waypointName}" on ${w.dayDate} — ${w.matchedName} is closed ${w.weekday}s`);
    }
    console.warn(`  (warning only — closed_days does not block the build)\n`);
  }
  process.exit(0); // never fails the build, per D11
}
