// Pre-trip auto-recert trigger (docs/archive/INDEX.md → PLAN_TRAVELER_FEATURES F6) — a daily check for
// guides entering their T-7-before-departure window. recert.yml's own weekly schedule
// only tracks each FACT's age against its shelf life; it has no concept of a guide's own
// trip dates at all, so a guide could sail into departure with stale facts nobody was
// ever nudged about between recert's Monday runs. This closes that specific gap.
//
// TWO layers, both from one daily run:
//   1. REPORT (always) — mirrors content-audit.yml's single-tracking-issue pattern
//      (find-or-update, never duplicates); names the exact commands for a human.
//   2. AUTO-DISPATCH (W1, gated on AUTO_DISPATCH=1 — the workflow sets it; a plain/local/
//      --dry-run run never dispatches) — for each in-window guide that has REAL stale facts
//      and no recert already in flight, it dispatches recert.yml with that slug. This is the
//      "evidence-earned phase 2" the report-only version deferred: the daily granularity that
//      recert.yml's weekly sweep lacks now actually ACTS, so a guide can't reach its departure
//      date on facts that went stale between Mondays. recert.yml still never auto-merges — the
//      freshness PR it opens is human-reviewed, so the judgment gate is untouched; only the
//      mechanical "notice + trigger" is automated. Dedupe (no double-dispatch, no stacking on an
//      in-flight recert) keeps it from spending agent tokens on a guide already being handled.
//
// A .ts script (run via `tsx`) rather than
// .mjs specifically so it can import src/lib/trip-dates.ts directly — the SAME year-
// inference + T-minus math the on-page countdown and weather window already use, instead
// of a second hand-kept copy of that logic (the SHELF_LIFE_DAYS split between
// check-staleness.mjs and staleness.ts is the cautionary example this avoids).
//
// Usage: tsx scripts/pretrip-check.ts [--dry-run]   (AUTO_DISPATCH=1 to actually dispatch)

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

export interface DispatchDecision {
  slug: string;
  dispatch: boolean;
  reason: string;
}

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

// How many of a guide's facts are past shelf life, per recert.mjs's byGuide entry: one per stale
// section plus one for a stale guide-level `verified` stamp. Pure; shared by the report and the
// dispatch decision so they can never disagree about "does this guide have stale facts."
export function staleItemCount(entry: RecertByGuide[string] | undefined): number {
  if (!entry) return 0;
  return (entry.sections?.length ?? 0) + (entry.guideStale ? 1 : 0);
}

// Pure decision: auto-dispatch a recert for this in-window guide? Yes ONLY when it has stale facts
// AND no staleness change run is already in flight (open change/<slug>-* PR or branch — passed in
// by the caller, which does the actual gh/git lookup). Everything else is a no, with a reason.
export function shouldDispatch(
  g: GuideInWindow,
  staleCount: number,
  recertInFlight: boolean,
): DispatchDecision {
  if (staleCount <= 0) return { slug: g.slug, dispatch: false, reason: "current — nothing past shelf life" };
  if (recertInFlight) return { slug: g.slug, dispatch: false, reason: "recert already in flight — not stacking a second" };
  return { slug: g.slug, dispatch: true, reason: `${staleCount} stale item(s), departs in ${g.daysUntilStart}d` };
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
    const itemCount = staleItemCount(byGuide[g.slug]);
    if (!itemCount) {
      lines.push("- Current — nothing past its shelf life.", "");
    } else {
      lines.push(
        `- ${itemCount} item(s) past shelf life. When AUTO_DISPATCH is on (it is, in CI) a recert is ` +
          `dispatched automatically; otherwise run \`npm run recert -- --slug ${g.slug}\` for the ` +
          "punch list, or dispatch `recert.yml` with this slug for the full re-verify pass.",
        "",
      );
    }
  }
  return lines.join("\n");
}

function gh(args: string[]): string {
  return execFileSync("gh", args, { encoding: "utf8" });
}

// The branch namespace an in-flight recert actually lives in (M6 fix). Recert's acting half is
// the CHANGE lifecycle — recert.yml dispatches change.yml, whose branches are
// `change/<slug>-<issue-or-run>`. The old `recert/<slug>` namespace this used to check no
// longer exists, so the in-flight detection detected NOTHING and every daily run could stack a
// second dispatch on a guide already being handled.
export function inFlightBranchPattern(slug: string): string {
  return `change/${slug}-*`;
}

/** Pure: does an ls-remote listing show any in-flight change branch? (Branches are deleted on
    merge, so an existing branch IS the in-flight signal; an open PR implies its branch.) */
export function hasInFlightFromRefs(lsRemoteOutput: string): boolean {
  return lsRemoteOutput.trim().length > 0;
}

// Is a staleness change run already covering this guide? Checked against the CHANGE branch
// namespace; dispatching a second one would just spend agent tokens on work already in progress.
function hasRecertInFlight(slug: string): boolean {
  try {
    const refs = execFileSync(
      "git", ["ls-remote", "--heads", "origin", inFlightBranchPattern(slug)],
      { encoding: "utf8" },
    );
    return hasInFlightFromRefs(refs);
  } catch {
    return false; // lookup unavailable — do not block the dispatch on a failed check
  }
}

function dispatchRecert(slug: string): void {
  gh(["workflow", "run", "recert.yml", "-f", `slug=${slug}`]);
  console.log(`[pretrip-check] dispatched recert.yml for ${slug}`);
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

export async function runPretripCheck(
  { dryRun = false, autoDispatch = false }: { dryRun?: boolean; autoDispatch?: boolean } = {},
): Promise<{ inWindow: GuideInWindow[]; body: string; decisions: DispatchDecision[] }> {
  const [inWindow, recert] = await Promise.all([findGuidesInWindow(), recertList()]);
  // recertList() is untyped JS (recert.mjs); name its shape here so byGuide can be indexed by slug
  // both in buildReport and in the dispatch loop below.
  const byGuide = recert.byGuide as RecertByGuide;
  const body = buildReport(inWindow, byGuide);
  if (!dryRun) await postOrUpdateIssue(body);

  // Decide (and, live, act on) auto-dispatch. The in-flight lookup only runs when we would actually
  // dispatch (autoDispatch && !dryRun) — a dry run or local invocation prints decisions assuming
  // nothing is in flight, so it never needs gh/git auth.
  const decisions: DispatchDecision[] = [];
  const live = autoDispatch && !dryRun;
  for (const g of inWindow) {
    const decision = shouldDispatch(g, staleItemCount(byGuide[g.slug]), live ? hasRecertInFlight(g.slug) : false);
    decisions.push(decision);
    console.log(`[pretrip-check] ${g.slug}: ${decision.dispatch ? "DISPATCH" : "skip"} — ${decision.reason}`);
    if (live && decision.dispatch) dispatchRecert(g.slug);
  }
  return { inWindow, body, decisions };
}

if (isMain(import.meta.url)) {
  const dryRun = process.argv.includes("--dry-run");
  const autoDispatch = process.env.AUTO_DISPATCH === "1";
  const { body } = await runPretripCheck({ dryRun, autoDispatch });
  if (dryRun) console.log(body);
}
