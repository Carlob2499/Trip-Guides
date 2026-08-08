# Acceptance checks

**Standing rule: the prototype is the floor.** These gates verify a faithful port of
`Waypoint Overdrive v2` and `Waypoint Mobile` as they stand — not an interpretation of
them. Any intentional deviation must be listed, with its reason, in the phase report;
an unlisted difference is drift by definition. Iteration begins only after every gate
passes, and only when the user asks for it.

Mechanical, checkable assertions. Each is a thing to look at or measure, not a thing to judge.
Run them per phase; a failure is drift, not taste.

## Gate 0 — before writing any code

- [ ] `DESIGN.md` in this bundle has replaced the repo's revision.
- [ ] The seven open questions in README §"Open questions" have answers, or an explicit
      decision to ship the honest absence instead.
- [ ] The two contrast pairings (10px oxide kicker on `--card`; ochre at 9.5–10.5px) have been
      through the axe run in both themes.

## Gate 1 — tokens and type

- [ ] No colour literal appears in a component; every one resolves through a CSS variable.
- [ ] `--accent` is `#9c4421` in **both** themes. Identity does not theme.
- [ ] Grep the stylesheet for `border-radius`: every result is `0` or `999px`.
- [ ] Exactly two families load: Literata and Source Sans 3. No monospace, no third face.
- [ ] Every uppercase-tracked string is Source Sans 3; every paragraph is Literata.

## Gate 2 — the panel

- [ ] A collapsed panel never renders above an open one in the same group.
- [ ] Collapse runs 340ms and the grid height is correct on the tween's *update*, not only its
      complete — watch for a one-frame jolt at the end.
- [ ] Collapse state and order persist per guide **and** per group; collapsing in Korea leaves
      Denmark untouched.
- [ ] Every wide type spans `1 / -1`: sights, venues, days, infogrid, habitats, raids,
      tierlist, map, budget, divergences, lists > 5.
- [ ] Resize from 1600px to 360px: no row of panels leaves a gap taller than the gap value.
- [ ] `PRINT SHEET` force-expands every collapsed panel and hides all `[data-noprint]`.

## Gate 3 — notation

- [ ] Every resolved perishable fact carries a dot. Spot-check five per guide.
- [ ] The dot is focusable, opens on click, and its target measures ≥44px.
- [ ] The popover shows claim → checked date → staleness → source, in that order.
- [ ] A fact past its shelf life shows the ochre overdue reading; one inside its final third
      shows the ageing reading; a fresh one shows neither.
- [ ] Every gap in the guide JSON renders a gap block at Reading scale in a 2px ochre border,
      with a `WHAT TO DO INSTEAD` line, expanded by default.
- [ ] No number appears anywhere without either a dot or a flag chip.

## Gate 4 — hub and globe

- [ ] Cover auto-opens at 4200ms; any click, scroll, or wheel opens it immediately; it shows
      once per session.
- [ ] Wordmark FLIP lands exactly on the header wordmark — no settle, no jump.
- [ ] Globe holds 60fps while dragging with all four pin cards placed.
- [ ] Pin cards never overlap each other or any visible overlay panel at any zoom.
- [ ] Cards move by transform only — profile a drag and confirm no layout on the frame path.
- [ ] The solver does not run inside the frame loop.
- [ ] Overlays are `pointer-events: none` once faded below 0.15.
- [ ] Clicking a country with no guide offers to start one there.

## Gate 5 — table view

- [ ] Nothing animates in on this path.
- [ ] Search indexes all four guides in the background and matches on body text, not just
      titles; a result opens its guide **on the right tab**.
- [ ] The quick card's kicker matches today's date against the trip dates.
- [ ] Emergency numbers are live `tel:` links.

## Gate 6 — tools

- [ ] All five tools load their trip's data from **one** guard on the tools screen.
- [ ] Enter tools from all four routes — hub header, guide header, table view, mobile ☰ — and
      confirm each arrives with data.
- [ ] Seeded expenses are stamped `✓ FROM THE GUIDE` and rebuild once the budget section
      lands, rather than memoising an empty seed.
- [ ] Settlement figures match your TypeScript model's test fixtures exactly.
- [ ] Closures for Japan say the record is missing. They do not guess.
- [ ] Reminders contains no string that is not already in the guide JSON.
- [ ] Route order is labelled straight-line, never transit time.

## Gate 7 — mobile (402 × 874)

- [ ] `viewport-fit=cover` is set; the four insets resolve non-zero on a cutout device.
- [ ] Every fixed edge uses `max(reserved, var(--safe-*))`.
- [ ] Bottom bar: two content groups, ALL, TOOLS. The current group always holds a slot.
- [ ] Ranking counts are localStorage, per-device, keyed by full group name. No telemetry read.
- [ ] Tapping a promoted group does not move it.
- [ ] Scroll down 80px: chrome yields. Flick up 24px: it returns. A 3px settle rebound does
      nothing.
- [ ] Above y=140 chrome always shows; while any overlay is open it stands down entirely.
- [ ] A diagonal drag scrolls. A horizontal one past 24px tracks the finger at 0.9.
- [ ] At the first and last group the swipe rubber-bands (0.28, cap 56px) with no message.
- [ ] Groups sheet shows a resume line only when there is something remembered.
- [ ] No touch target under 44px anywhere.
- [ ] The motto is absent on mobile.

## Gate 8 — motion and access

- [ ] Every duration matches the motion table in SPEC-COMPONENTS.md §9.
- [ ] With reduced motion on: the cover cuts, the masthead cuts, reveals paint immediately,
      the globe does not spin — and press states still respond.
- [ ] Section reveals fire once, from one long-lived IntersectionObserver that is never
      disconnected mid-flight; anything in view on mount reveals on the next frame.
- [ ] Full keyboard pass: cover CTA, pins, tabs, panel collapse, drag handles, dots, popover,
      lightbox, sheets. Focus is always visible against both grounds.
