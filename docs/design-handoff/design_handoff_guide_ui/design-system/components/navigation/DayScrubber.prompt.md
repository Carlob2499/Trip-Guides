`DayScrubber` moves the reader through a trip's days without leaving the group.

```jsx
<DayScrubber days={days} value={day} onChange={setDay} />
```

Swipe between days is finger-tracked at 0.9, rubber-bands at the ends (0.28, capped 56px), and commits on 30% of viewport travel or a 0.5px/ms flick past the 24px axis lock. Do not re-derive those constants — they are in `mobile-nav/model/gesture.ts`.
