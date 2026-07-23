/** route-opt — the day-route optimizer (docs/PLAN_FIELD_REPORT_FIXES.md E7):
    haversine + nearest-neighbour + 2-opt over a day's located waypoints,
    surfaced as an advisory chip a traveler can apply or restore. Purely a
    side-effecting UI feature (self-mounting IIFE, no cross-module coupling
    beyond scripts/util.js) — no public API to export. */
import "./ui/route-opt.js";
