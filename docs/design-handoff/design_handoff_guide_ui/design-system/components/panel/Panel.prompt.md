Use `Panel` for every card-shaped thing in Waypoint — guide sections, tool panels, hub overlays. Never write a bespoke card.

```jsx
<Panel kicker="LEDGER" title="Where the money went" stamp="✓ 6 lines · entered by you" onToggle={toggle}>
  <Ledger rows={rows} />
</Panel>
```

- `span` for internally-gridded types: sights, venues, days, budget, map, divergences, and any list over five items.
- `collapsed` panels must sort AFTER open ones in the grid — a collapsed title bar beside a full panel is what creates dead space.
- Collapse animates height + opacity over 340ms `power2.inOut`, and the grid re-measures on the tween's update tick, not on complete.
- Collapse state and order persist in localStorage keyed per scope (guide slug + section group), never globally.
