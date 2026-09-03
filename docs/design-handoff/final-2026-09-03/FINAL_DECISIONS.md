# WayPoint D6 — Final Late-Review Decisions

Status: **BINDING DELTA — 2026-09-03**

This file exists because several user decisions were made after the longer D6 ledger paragraphs were written. It is intentionally small. Where one of the clauses below conflicts with an older paragraph in `docs/reference/design-system.md`, **this final user-approved clause wins**. Everywhere else, `docs/reference/design-system.md` remains authoritative.

## F1 — Executable WayPoint palette wins over the old “Night Navy & Amber” phrase

For implementation, use D6-23 and `src/styles/base.css` as the color truth. The old high-level Section 1 phrase “Night Navy & Amber on warm paper” must **not** be interpreted as permission to re-theme the product.

Current identity:
- light ground `#e3e7dc`
- sunken ground `#ced5c4`
- card `#fbfcf6`
- ink `#0f141a`
- oxide accent `#9c4421`
- dark mode remains the existing warm charcoal/chart-room family
- Literata Variable + Atkinson Hyperlegible Next

Destination-specific imagery/color may enrich immersive regions, but navigation and operational surfaces stay within the WayPoint token system.

## F2 — Desktop immersion is an outer layer, not the working surface

Desktop may use destination photography, cartographic atmosphere, or destination-derived color as a broad immersive background/opening layer. Navigable and operational content must float on a **distinct, readable WayPoint working surface**. Dense facts do not sit directly on busy photography.

Use immersion selectively:
- Atlas: strongest
- Guide landing/chapter openings: strong
- Trip: restrained hero treatment
- Itinerary: kinetic/spatial, not wallpaper-heavy
- Map: the real map is the immersion
- Split/Search/SOS: direct working surfaces; Split may still use an immersive outer desktop backdrop

## F3 — Split hierarchy: ledger + fast entry first

This clause supersedes the older D6-41 “balance-first” wording.

Trip Split remains the current repository’s **budgeting / bill-splitting tool**, not a broader collaboration product.

Primary hierarchy:
1. **Recent Expenses**
2. **Add Expense** — immediately visible/reachable
3. per-expense split method and participant state
4. balance / who-owes-who / settlement as useful secondary state

Every expense row should make its method visible without opening it: `Even`, `Exact`, `Shares`, or `%`. Editing may progressively reveal participant/value controls. Preserve the existing split engine, validation, currency handling, recorded payments, undo, search/filter behavior, and Firebase trip-specific state.

Use larger operational type and reusable semantic category icons. Do not generate/fetch expense photos unless the expense is explicitly linked to a canonical WayPoint place that already owns a verified image; icon-first is the default.

No Decisions tab, voting, invite/travel-party dashboard, generic budget analytics, or collaboration creep.

## F4 — SOS stays deliberately simple

This clause narrows the older D6-25 layered-help wording.

SOS is **not a page or tab** and is not a proactive emergency assistant. It is quiet global infrastructure that is always reachable.

When opened, prioritize:
- verified emergency phone numbers with direct `tel:` links;
- useful verified emergency/travel-help links already supported by the guide;
- concise location/base/address context only when WayPoint already has it and it is genuinely useful.

Preserve offline baked-in emergency numbers and elevated official advisory behavior. Do **not** build category dashboards, symptom triage, “help request sent,” responder orchestration, automatic group sharing, or emergency-service workflows.

## F5 — Search final presentation

Search remains global infrastructure, not a destination.

- desktop: prominent persistent Search field in global utility chrome;
- mobile at page top: expanded Search field;
- mobile while scrolled: compact sticky/recoverable Search affordance;
- activation: focused overlay/sheet;
- dismissal: restore exact prior page/context/scroll;
- current trip first, then broader canonical WayPoint results.

Do not add a Search FAB when the global top/chrome solution works.

## F6 — Guide hero and contextual knowledge

Guide landing should keep a **large editorial cover/hero**, especially on desktop. Do not shrink the destination image merely to fit more modules above the fold.

Reusable How-To / transit / etiquette / culture modules are approved only as canonical Guide knowledge objects linked deterministically by Composer metadata to relevant itinerary days/places/events. They supplement the location-first Guide; they do not replace it with an article portal.

## F7 — Google Maps operational rule

Any operational map shown in the normal connected state should be the **real Google Maps integration**, not a decorative imitation. OSM remains the resilient no-key/failure fallback and must not be removed before Google successfully initializes.

Waypoint stores/communicates coarse researched timing such as `≈30 min · check live`; live traffic/navigation belongs to Google Maps/native provider handoff.

## F8 — Mockup handling

The original generated mockups are **not implementation artifacts** because several contain known hallucinated controls/data. The final handoff therefore includes sanitized SVG redraws containing only the approved composition signals. Claude/Fable may use those redraws as spatial/layout references only, under `MOCKUP_MANIFEST.json`.

If a mockup element is not supported by product authority, repository capability/content, or an explicit approved D6 decision, omit it.
