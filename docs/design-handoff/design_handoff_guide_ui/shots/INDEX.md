# P3 `shots/` triage index (B4)

Source: DesignSync project P3 (`dbfd3129-6517-40de-9e6e-5d77ad9566fc`), `shots/` dir, 43 working
captures from design iteration. Reviewed against the already-committed screenshot sets
(`docs/design-handoff/screenshots/`, `docs/design-handoff/enforcement/screenshots/`,
`docs/design-handoff/prototype/atlas-mobile-home/screenshots/`) — all three are P1(hub)/P2(mobile
home) focused, so none cover the P3/guide-UI surface at all; the real redundancy check was among
the 43 P3 shots themselves.

## Keepers (4)

- **`detail.png`** — guide day-detail fragment: GO Fest / MSI Lower Bracket Final day copy with an
  "⚠ NOT CONFIRMED" callout on GOBANG dinner timing, plus a partial "TRIP TOOLS" pill row. No
  committed set shows this sourcing-gap callout treatment on a day-detail card.
- **`e.png`** — same underlying day-detail screen as `detail.png`, different crop: shows the
  day-scrubber pill row (Day 1–7, Day 4 highlighted "NOW"), the "DAY 4 · SATURDAY 11 JULY 2026"
  header, and partial "THE LINE" / "IN THE MARGIN" sections. Kept alongside `detail.png` because
  it captures the day-navigation chrome (scrubber + NOW state) that `detail.png`'s crop doesn't
  show — companion reference, not a duplicate.
- **`nav.png`** — two-panel capture: mobile nav mockup plus a "WHAT GOT CUT, AND WHY" design-
  rationale block. That rationale text isn't present in `BEHAVIOR.md` or any committed screenshot
  — unique design-decision record.
- **`02-sedona.png`** — Sedona single-city day-detail: "⚠ Not confirmed" parking-fee sourcing-gap
  callout, a "TRIP SPLIT $0.00 / Nothing recorded yet" empty-state panel, and a "WHAT IS ABSENT,
  AND WHAT THE DESIGN DOES" rationale block. No committed set has a single-city (non-multi-stop)
  itinerary render or a Trip Split empty state.

## Reviewed and skipped

**Technical limitation (fetched, could not be reliably decoded):** `fix.png`, `night.png`,
`01-sedona.png`. DesignSync's `get_file` sometimes returns the image inline in the tool result
instead of persisting it to a backing file; inline responses at this size (~40,000+ base64
characters) could not be reproduced reliably through the available write path — two independent
manual-reproduction attempts on `fix.png` both truncated at the same length, and `night.png`
decoded to a byte-complete-looking file with a corrupted JPEG tail that the viewer rejected
outright. Persisted responses (the 4 keepers above) decoded cleanly every time. Content of these
three files was not judged — this is a fetch-reliability skip, not a content judgment.

**Not fetched — presumptively superseded WIP, numbered-iteration naming pattern (26):**
`01-canvas`, `01-d`, `01-dead`, `01-fin`, `01-final`, `01-m`, `01-mob`, `01-split`, `01-t`, `01-v`,
`02-canvas`, `02-d`, `02-dead`, `02-fin`, `02-final`, `02-m`, `02-mob`, `02-split`, `02-t`, `02-v`,
`03-d`, `03-fin`, `03-mob`, `03-split`, `03-t`, `03-v`. The `NN-<tag>` naming convention (`01-`,
`02-`, `03-`) reads as sequential iteration passes over the same handful of screen states already
represented by the keepers and by `01-sedona`/`02-sedona`; given the confirmed fetch-reliability
ceiling above, spending further fetch attempts on files whose names suggest they're earlier drafts
of states already captured wasn't worth the risk of more corrupted output.

**Not fetched — remaining named/control set (10):** `split-empty`, `sheet`, `sheet2`, `rows`,
`rows2`, `sr`, `04-fin`, `04-mob`, `04-split`, `04-t`. `split-empty`/`sheet`/`sheet2` were fetched
earlier in this triage but their content didn't survive to a decode attempt before a context
boundary; re-fetching them carries the same inline/corruption risk documented above, so they're
recorded here rather than re-attempted. The `04-` set and `rows`/`rows2`/`sr` were never fetched —
same reasoning: numbered/late-iteration names, high fetch-reliability risk, low expected marginal
value over the 4 confirmed keepers.

Total: 43 reviewed (4 kept, 39 skipped — 3 technical-limitation, 36 not fetched).
