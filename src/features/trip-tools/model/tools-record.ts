/* The one record every tool on the Tools screen runs off — derived at BUILD time from a
   guide's own sections, never from a parallel registry (CLAUDE.md's CONTENT IS KING).

   The design-handoff README describes a client that fetches a manifest and calls
   `ensureGuide(slug)` before showing a tool, and warns that the entry point which forgets
   to load is the one that ships. This site is statically built, so the equivalent guard is
   stronger and needs no runtime discipline: the record is computed for every trip during
   the build and rendered into that trip's own Tools page. There is no code path that can
   reach a tool with the trip's data missing, because the data is the page.

   What is NOT here, deliberately: the trip-split ledger. The creator's ruling (2026-08-08)
   is that Trip Split records what was ACTUALLY spent and is unrelated to the budget a guide
   researched — so no budget row is ever copied into it, seeded or otherwise, and the
   calculator on this screen is the same instance on the same key as the one in the guide
   rather than a second ledger that could disagree with it. */

import { buildReminders, type ReminderItem, type ChecklistSource } from "./reminders";
import { buildClosures, closureCount, type ClosureDay } from "./closures";
import { buildRoutePlan, type RouteDay, type RouteDaySource } from "./route-plan";

export interface ToolsRecordInput {
  slug: string;
  title: string;
  country: string;
  /** IANA zone for the jetlag tool; null when the guide has none (the tool then hides). */
  tz: string | null;
  /** The per-device storage key the trip-split calculator is already keyed on. */
  storeKey: string;
  /** Flattened sections — the same list every other build-time consumer reads. */
  sections: (ChecklistSource & { type?: string; items?: unknown[] })[];
  firstDayDate: string | null;
  lastDayDate: string | null;
}

export interface ToolsRecord {
  slug: string;
  title: string;
  country: string;
  tz: string | null;
  storeKey: string;
  firstDayDate: string | null;
  lastDayDate: string | null;
  reminders: ReminderItem[];
  /** Booking-flagged reminders, counted for the panel's kicker. */
  bookAheadCount: number;
  closures: ClosureDay[];
  closurePlaceCount: number;
  route: RouteDay[];
  /** Days that carry stops but fewer than two located ones — an admitted gap, not hidden. */
  routeSkippedDays: number;
}

export function deriveToolsRecord(input: ToolsRecordInput): ToolsRecord {
  const sections = Array.isArray(input.sections) ? input.sections : [];
  const dayItems = sections
    .filter((s) => s?.type === "days")
    .flatMap((s) => (s.items ?? []) as RouteDaySource[]);

  const reminders = buildReminders(sections);
  const closures = buildClosures(sections as Parameters<typeof buildClosures>[0]);
  const route = buildRoutePlan(dayItems);

  // A day with stops that could not be ordered is the interesting gap — it means the guide
  // has an itinerary the map does not yet know about, which is exactly what the coordinate
  // backfill (scripts/geocode-venues.mjs) exists to close.
  const withStops = dayItems.filter((d) => Array.isArray(d?.waypoints) && d.waypoints.length > 0).length;

  return {
    slug: input.slug,
    title: input.title,
    country: input.country,
    tz: input.tz,
    storeKey: input.storeKey,
    firstDayDate: input.firstDayDate,
    lastDayDate: input.lastDayDate,
    reminders,
    bookAheadCount: reminders.filter((r) => r.book).length,
    closures,
    closurePlaceCount: closureCount(closures),
    route,
    routeSkippedDays: Math.max(0, withStops - route.length),
  };
}
