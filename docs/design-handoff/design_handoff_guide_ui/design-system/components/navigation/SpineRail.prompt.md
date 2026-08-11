`SpineRail` is how a reader moves between a guide's groups.

```jsx
<SpineRail stations={groups} value={group} onChange={setGroup} />
```

It claims no column, so nothing sits in dead space beside the reading. Sticky at `var(--hdr-h)` — measure the header, never hardcode the offset.
