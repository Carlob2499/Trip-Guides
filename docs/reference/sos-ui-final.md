# WayPoint SOS — Final Responsive UI Contract

Status: **LOCKED D6 implementation note**  
Parent authority: `docs/reference/design-system.md` D6-25.

This note clarifies the final reviewed presentation of the already-approved global SOS action. It does not create a new destination or feature family.

## Core rule

SOS is **not a page, destination, or tab**. It is a low-key but always-available global emergency action.

The generated broad SOS dashboard/category mockup is non-authoritative and must not be implemented.

## Desktop

- Keep SOS as a small persistent global utility control in top or side chrome.
- It should be visually quieter than primary navigation and Search, while remaining unmistakable and reachable from every surface.
- Activating it opens a compact modal or side sheet over the current context; it does not navigate to a standalone SOS page.
- Do not show category dashboards, travel-party cards, generic help-center navigation, request-sent flows, or other invented emergency-service workflows.

## Mobile

- Keep SOS always reachable from a compact top-header/global-chrome control or an equally reliable nav-adjacent emergency control.
- It must not consume a sixth permanent destination slot in the five-item `Trip · Itinerary · Map · Guide · Split` navigation.
- The resting affordance should be low-key enough not to dominate ordinary travel use, but use an unmistakable emergency icon/label and a field-safe touch target.
- Activating SOS opens a dominant full-height emergency sheet with large controls.

## Sheet hierarchy

First layer, immediately visible:
1. Police
2. Fire / ambulance
3. Current/base location or address context when WayPoint actually has it

Then a clearly separated secondary urgent-help layer may expose only data WayPoint explicitly has and D6-25 already permits: hospital/urgent care, embassy/consulate, lost-passport guidance, base/hotel address, insurance/contact details, and critical phrases.

The sheet is a focused emergency action surface, not a generic help dashboard.

## Existing repository behavior to preserve

- Verified emergency numbers only; never guess a local number.
- `tel:` handoff for direct calling.
- Offline availability for baked-in emergency data.
- Elevated official travel advisory may surface when present.
- Honest fallback treatment where only a statutory universal number is verified.
- Focus trapping, keyboard Escape/close behavior, and mobile sheet drag/dismiss behavior remain accessible.

## Visual intent

SOS should feel like emergency infrastructure: quiet until invoked, extremely clear once opened. Avoid immersive photography, decorative cards, broad category menus, or marketing-style reassurance content. Operational contrast and large readable targets take priority.
