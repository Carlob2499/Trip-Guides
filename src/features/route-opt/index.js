/** route-opt — the day-route optimizer (docs/archive/INDEX.md → PLAN_FIELD_REPORT_FIXES E7):
    haversine + nearest-neighbour + 2-opt over a day's located waypoints,
    surfaced as an advisory chip a traveler can apply or restore. Self-mounting
    UI only; the pure routing math lives in src/lib/route-optimize.ts so
    build-time consumers (features/trip's route derivation) never load this DOM half. */
import "./ui/route-opt.js";

