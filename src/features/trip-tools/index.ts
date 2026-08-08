/* trip-tools — the standalone cross-trip Tools screen (design-handoff README §5).

   Five tools behind one screen, each reading the selected trip's OWN record: trip split,
   jetlag, closures, reminders, route order. The screen is server-rendered per trip
   (`src/pages/tools/[trip].astro`), so the README's "every entry point must load the trip's
   data" hazard cannot occur — there is no entry point that arrives without it.

   This silo owns the DERIVATION only. The tools' actual decisions stay where they already
   live and are imported, never reimplemented:
     · jetlag      → src/lib/jetlag.ts + src/lib/tz-offset.ts (via src/scripts/jetlag-ui.js)
     · holidays    → src/lib/holidays.ts + src/data/holidays/
     · route order → src/features/route-opt/model/optimize.ts
     · trip split  → src/features/trip-split/ (the same instance, on the same key, as the
                     guide's own tab — one ledger, per the creator's 2026-08-08 ruling)

   Public surface — the ONLY sanctioned imports from outside this silo. */
export { deriveToolsRecord } from "./model/tools-record";
export type { ToolsRecord, ToolsRecordInput } from "./model/tools-record";
export type { TripTools } from "./model/view";
export { buildReminders, isBookingItem } from "./model/reminders";
export type { ReminderItem, RawChecklistItem, ChecklistSource } from "./model/reminders";
export { buildClosures, closureCount, weekdayOf, WEEKDAYS } from "./model/closures";
export type { ClosureDay, ClosedPlace, Weekday } from "./model/closures";
export { buildRoutePlan, km } from "./model/route-plan";
export type { RouteDay, RouteLeg, RoutePoint } from "./model/route-plan";
