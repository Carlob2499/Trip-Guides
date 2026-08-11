`ThumbBar` is the only pinned chrome at the bottom of a phone screen.

```jsx
<ThumbBar slots={rank(counts, group, groups)} value={group} onSelect={setGroup} />
```

- `seat()` keeps a promoted group where it already is — without it the two buttons trade places under the thumb that just tapped one.
- `slotLabel()` takes the head of a compound name ("Food & shopping" → "Food") and truncates on a word boundary at 9 chars, only if the stub stays readable. The full name stays in the accessible name.
- Every target ≥44px, and the bar pads with `max(reserved, var(--safe-bottom))`.
