// Pre-trip auto-recert trigger (docs/PLAN_TRAVELER_FEATURES.md F6) — a daily check for
// guides entering their T-7-before-departure window. recert.yml's own weekly schedule
// only tracks each FACT's age against its shelf life; it has no concept of a guide's own
// trip dates at all, so a guide could sail into departure with stale facts nobody was
// ever nudged about between recert's Monday runs. This closes that specific gap with the
// cheapest safe first phase — report-only, mirroring content-audit.yml's single-tracking-
// issue pattern, NOT the full agentic recert.yml pipeline run automatically every day for
// every approaching trip. The creator (or a future, evidence-earned phase 2) dispatches
// recert.yml with the named slug once this flags it — same manual trigger recert.yml's
// own workflow_dispatch already supports.
//
// A .ts script (run via `tsx`, matching aggregate-telemetry.ts's precedent) rather than
// .mjs specifically so it can import src/lib/trip-dates.ts directly — the SAME year-
// inference + T-minus math the on-page countdown and weather window already use, instead
// of a second hand-kept copy of that logic (the SHELF_LIFE_DAYS split between
// check-staleness.mjs and staleness.ts is the cautionary example this avoids).
//
// Usage: tsx scripts/pretrip-check.ts [--dry-run]

import { execFileSync } from "node:child_process";
import { readGuides, isMain } from "./audit/lib.mjs";
import { recertList } from "./recert.mjs";
import { tripWindow } from "../src/lib/trip-dates";

const ISSUE_TITLE = "Pre-trip check — guides entering their T-7 window";
const ISSUE_LABEL = "pretrip-check";
const WINDOW_DAYS = 7;

export interface GuideInWindow {
  slug: string;
  daysUntilStart: number;
  startDate: string;
}

// recert.mjs is plain JS with no type declarations, so its return value can't be checked
// structurally here — this documents the shape (scripts/recert.mjs's toWorklist()) without
// asserting it, since TS's own inference across that untyped boundary can't be trusted either way.
type RecertByGuide = Record<string, any>;

// A guide's own days[] items are the only source of its calendar dates (content.config.ts
// has no separate start/end field) — first and last item across every `days` section,
// same convention index.astro and guide-ui.js already use for the countdown.
function firstLastDayDates(guide: any): [string | null, string | null] {
  let first: string | null = null;
  let last: string | null = null;
  for (const s of guide.sections || []) {
    if (s?.type !== "days" || !Array.isArray(s.items)) continue;
    for (const day of s.items) {
      if (!day?.date) continue;
      if (!first) first = day.date;
      last = day.date;
    }
  }
  return [first, last];
}

// Pure (given `now`) so it's testable without mocking the system clock. Drafts are
// unverified by design (same skip as check-staleness.mjs) and archived trips are already
// over — neither belongs in a "your trip is approaching" nudge.
export async function findGuidesInWindow(now: Date = new Date(), guidesDir?: string): Promise<GuideInWindow[]> {
  const guides = await readGuides(guidesDir);
  const inWindow: GuideInWindow[] = [];
  for (const { slug, guide } of guides) {
    if ((guide as any).draft || (guide as any).archived) continue;
    const [firstDate, lastDate] = firstLastDayDates(guide);
    if (!firstDate) continue;
    const win = tripWindow(firstDate, lastDate, now);
    if (win.hasDates && win.daysUntilStart >= 0 && win.daysUntilStart <= WINDOW_DAYS) {
      inWindow.push({ slug, daysUntilStart: win.daysUntilStart, startDate: firstDate });
    }
  }
  return inWindow.sort((a, b) => a.daysUntilStart - b.daysUntilStart);
}

export function buildReport(inWindow: GuideInWindow[], byGuide: RecertByGuide, now: Date = new Date()): string {
  const today = now.toISOString().slice(0, 10);
  const lines = [
    `_Last run: ${today} (UTC). This issue is updated in place on every run — it does not accumulate duplicates._`,
    "",
  ];
  if (!inWindow.length) {
    lines.push("No guide is within 7 days of its trip start today.");
    return lines.join("\n");
  }
  for (const g of inWindow) {
    lines.push(`## ${g.slug} — departs in ${g.daysUntilStart}d (${g.startDate})`, "");
    const entry = byGuide[g.slug];
    const itemCount = entry ? entry.sections.length + (entry.guideStale ? 1 : 0) : 0;
    if (!itemCount) {
      lines.push("- Current — nothing past its shelf life.", "");
    } else {
      lines.push(
        `- ${itemCount} item(s) past shelf life. Run \`npm run recert -- --slug ${g.slug}\` for the punch list, ` +
          "or dispatch `recert.yml` with this slug for the full re-verify pass.",
        "",
      );
    }
  }
  return lines.join("\n");
}

function gh(args: string[]): string {
  return execFileSync("gh", args, { encoding: "utf8" });
}

async function postOrUpdateIssue(body: string): Promise<void> {
  const listOut = gh(["issue", "list", "--search", `"${ISSUE_TITLE}" in:title`, "--state", "open", "--json", "number,title"]);
  const existing = (JSON.parse(listOut) as { number: number; title: string }[]).find((i) => i.title === ISSUE_TITLE);
  if (existing) {
    gh(["issue", "edit", String(existing.number), "--body", body]);
    console.log(`[pretrip-check] updated issue #${existing.number}`);
  } else {
    gh(["issue", "create", "--title", ISSUE_TITLE, "--body", body, "--label", ISSUE_LABEL]);
    console.log("[pretrip-check] opened a new tracking issue");
  }
}

export async function runPretripCheck({ dryRun = false }: { dryRun?: boolean } = {}) {
  const [inWindow, { byGuide }] = await Promise.all([findGuidesInWindow(), recertList()]);
  const body = buildReport(inWindow, byGuide);
  if (!dryRun) await postOrUpdateIssue(body);
  return { inWindow, body };
}

if (isMain(import.meta.url)) {
  const dryRun = process.argv.includes("--dry-run");
  const { body } = await runPretripCheck({ dryRun });
  if (dryRun) console.log(body);
}
