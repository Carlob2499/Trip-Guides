# Waypoint Roadmap — Backlog

Not session reading. The working rules (ship loop, plan-first, verify-in-dist)
live in the auto-loaded `CLAUDE.md`. Per-session history lives in `git log` —
not duplicated here.

## Shipped
- **Live-data APIs** — currency (Frankfurter), weather (Open-Meteo), public
  holidays (Nager.Date, build-time). All fetch-once, cache, degrade gracefully.
- **Exports** — per-guide GPX + iCal, built at build time from guide data.
- **New-guide pipeline** — home-page modal → prefilled GitHub Issue → Action →
  scaffold PR (owner merges; never auto). Country table in `src/data/countries.mjs`.
- **Content-audit tooling** — weekly no-LLM sweep (`scripts/audit/*`, CI Mondays)
  for dead links / missing photos / stale API canaries.
- **Visual/UX evolution + subtraction** — see `git log` (the P1–P19 series):
  editorial identity, Plan view, hub, field tools, then a large subtraction pass
  (removed Leaflet, the compass nav, scaffold guides, three niche field tools,
  scattered motion, and budget-calculator bloat).

## Open backlog (each gets its own planning session first)
- [ ] **Decap CMS** — form-based editor over the JSON, no backend (~1 weekend).
- [ ] **Template extraction** — split personal data from destination data;
      contributor docs; publish as a GitHub template repo.
- [ ] **Real research pass on a fresh guide** — first full use of
      `docs/NEW_GUIDE_INTAKE.md` end to end, draft → verified.
