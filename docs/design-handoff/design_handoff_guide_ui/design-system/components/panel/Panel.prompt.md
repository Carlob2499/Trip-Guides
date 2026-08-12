Use `Panel` for every card-shaped thing in Waypoint — guide sections, tool panels, hub overlays. Never write a bespoke card.

```jsx
<Panel kicker="LEDGER" title="Where the money went" stamp="✓ 6 lines · entered by you" onToggle={toggle}>
  <Ledger rows={rows} />
</Panel>
```

- `span` for internally-gridded types: sights, venues, days, budget, map, divergences, and any list over five items.
- `collapsed` panels must sort AFTER open ones in the grid — a collapsed title bar beside a full panel is what creates dead space.
- Collapse animates `grid-template-rows` + opacity via CSS transition over 350ms `cubic-bezier(.16,1,.3,1)` (no GSAP), and the grid re-sorts on transitionend.
- Collapse state and order persist in localStorage keyed per scope (guide slug + section group), never globally.
