/* trip — the lifecycle-aware "what matters now" destination (design-system.md D6-02/19/30/31/33/48).

   The silo owns DERIVATION: which phase the trip is in, which stop is now/next, the
   pre-trip readiness stack, the post-trip recap atoms, and the canonical itinerary projection
   every other surface reads. Rendering is split by what can be known when: the readiness
   stack, reference cards and recap are server-rendered from guide data; Now/Next and the
   countdown are painted by ui/trip.js against the reader's clock, because a build-time "now"
   is whatever moment the site was deployed.

   Absorbed here: trip-tools' reminders/closures derivations and trip-kit's arrival/book-by
   models. Their surfaces (the Tools station, the Trip Kit tab) were retired by D6-00/D6-17;
   the derivations survive because Trip is where they were always pointing. */
export { tripPhase, todayIndex, parseStartMinutes, focusFor, daysToGo } from "./model/lifecycle";
export type { TripPhase, TripDay, TripStop, Focus } from "./model/lifecycle";
export { deriveTripDays, dayStops } from "./model/trip-data";
export { deriveReadiness, openCount } from "./model/readiness";
export type { ReadinessStack } from "./model/readiness";
export { deriveRecap } from "./model/recap";
export type { RecapAtoms, LearningsLike } from "./model/recap";
export { buildReminders, isBookingItem } from "./model/booking-reminders";
export type { ReminderItem, RawChecklistItem, ChecklistSource } from "./model/booking-reminders";
export { buildClosures, closureCount, weekdayOf, WEEKDAYS } from "./model/closures";
export type { ClosureDay, ClosedPlace, Weekday } from "./model/closures";
export { deriveArrivalPlan } from "./model/arrival";
export { deriveBookByTimeline } from "./model/book-by";
export { initTrip } from "./ui/trip.js";
export { initSpeak } from "./ui/speak.js";
export { initEntrySelect } from "./ui/entry-select.js";
export { initPacking } from "./ui/packing.js";
