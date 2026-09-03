# WayPoint SOS — Final Responsive UI Contract

Status: **LOCKED D6 implementation note**  
Parent authority: `docs/reference/design-system.md` D6-25.

This note clarifies the final reviewed presentation of the already-approved global SOS action. It does not create a new destination or feature family.

## Core rule

SOS is **not a page, destination, tab, triage flow, help center, or proactive assistance system**. It is a low-key but always-available global emergency utility.

The generated broad SOS dashboard/category mockups are non-authoritative and must not be implemented.

## Desktop

- Keep SOS as a small persistent global utility control in top or side chrome.
- It should be visually quieter than primary navigation and Search, while remaining unmistakable and reachable from every surface.
- Activating it opens a compact modal or side sheet over the current context; it does not navigate to a standalone SOS page.

## Mobile

- Keep SOS always reachable from a compact top-header/global-chrome control or an equally reliable nav-adjacent emergency control.
- It must not consume a sixth permanent destination slot in the five-item `Trip · Itinerary · Map · Guide · Split` navigation.
- The resting affordance should be low-key enough not to dominate ordinary travel use, but use an unmistakable emergency icon/label and a field-safe touch target.
- Activating SOS opens a focused full-height sheet.

## Sheet hierarchy

Keep the sheet deliberately simple:

1. verified local emergency numbers as large tap-to-call rows;
2. concise labels for what each number is for;
3. useful direct links already supported by the researched guide, when present;
4. elevated official travel advisory only when the existing advisory logic says it is relevant;
5. a short current/base-address line only when WayPoint already has reliable context and it materially helps.

For South Korea, preserve the repo-backed numbers:
- 112 — Police
- 119 — Fire / Ambulance
- 1330 — Korea Travel Hotline
- 1339 — medical line / nearest ER help

## Explicitly reject

Do not add unless separately approved and implemented:

- medical/safety/travel-issue category dashboards;
- symptom or triage questions;
- built-in emergency-service dispatch;
- group help requests;
- automatic responder sharing;
- contact-tree workflows;
- request-sent confirmation flows;
- generic safety/help-center content;
- a dedicated SOS page/tab.

## Existing repository behavior to preserve

- Verified emergency numbers only; never guess a local number.
- `tel:` handoff for direct calling.
- Offline availability for baked-in emergency data.
- Elevated official travel advisory may surface when present.
- Honest fallback treatment where only a statutory universal number is verified.
- Focus trapping, keyboard Escape/close behavior, and mobile sheet drag/dismiss behavior remain accessible.

## Visual intent

SOS should feel like emergency infrastructure: quiet until invoked, extremely clear once opened. The purpose is essentially **numbers and useful links immediately available when needed**. Avoid immersive photography, decorative cards, broad category menus, or marketing-style reassurance content.
