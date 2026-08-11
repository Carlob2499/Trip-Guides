# Tokens — exact values

Nothing on this page is approximate. Do not re-derive any value from a screenshot; the
screenshotter re-renders the DOM and does not reproduce colour management faithfully.

Declare all of these once, at `:root` and on the two theme selectors, in
`src/styles/base.css`. `src/styles/var-defined.test.ts` fails any `var()` nothing declares —
CSS does not error on those; the declaration is simply invalid at computed-value time and
silently falls back, which is exactly the bug that gate exists to catch.

---

## 1. Colour

### Day — the default. `:root, [data-field="day"]`

| Token | Value | Used for |
| --- | --- | --- |
| `--bg` | `#e3e7dc` | the page ground |
| `--card` | `#fbfcf6` | every Panel |
| `--sunken` | `#ced5c4` | the plate bed, the active day chip |
| `--ink` | `#0f141a` | body and display text |
| `--muted` | `#3c4534` | secondary text, inactive stations |
| `--rule` | `#a9b39b` | hairlines, Panel borders |
| `--rule2` | `#8a9480` | stronger hairlines, control borders, the plate frame |
| `--accent` | `#9c4421` | oxide. Identity: ticks, pins, the active station, the plate line, kickers |
| `--aink` | `#80371b` | oxide text on `--bg` / `--card` |
| `--on-aink` | `#f0d2c7` | text on an oxide fill |
| `--green` | `#396345` | COMPLETE, confirmed |
| `--on-green` | `#ffffff` | text on a green fill |
| `--ochre` | `#7f4a07` | the gap block, staleness, advisory |
| `--crit` | `#b3261e` | SOS and emergency only |
| `--cta` | `#0f1317` | the primary pill's ground |
| `--cta-ink` | `#f8faf3` | text on `--cta` |
| `--rw` | `1px` | the hairline width, as a token so a theme could thicken it |
| `--photo` | `1` | photography opacity, as a token so a theme could suppress it |

### Night — the chart room. `[data-field="night"]`

| Token | Value |
| --- | --- |
| `--bg` | `#0f1317` |
| `--card` | `#242c34` |
| `--sunken` | `#1a2129` |
| `--ink` | `#e8ece3` |
| `--muted` | `#9aa392` |
| `--rule` | `#38414b` |
| `--rule2` | `#4e5865` |
| `--accent` | `#9c4421` — **unchanged. Does not re-map.** |
| `--aink` | `#c78f78` |
| `--on-aink` | `#f0d2c7` |
| `--green` | `#6aab76` |
| `--on-green` | `#0f1317` |
| `--ochre` | `#d9923f` |
| `--crit` | `#ef8a83` |
| `--cta` | `#e8ece3` |
| `--cta-ink` | `#0f1317` |
| `--rw` | `1px` |
| `--photo` | `1` |

**There is no third theme.** `[data-field="glare"]` must not exist in the shipped CSS.

### The four tokens that must NOT re-map between themes

`--on-aink`, `--on-accent`, `--crit-fill`, `--on-crit`. Ink on a coloured **fill** is never
`--accent-ink` or `--ink`; it is the `--on-*` of that fill. `atlas-tokens.test.ts` pins this.

### The two that MUST re-map

`--on-green`, and the `--cta` / `--cta-ink` pair.

---

## 2. Type

Two faces. **No third face and no monospace.**

| Role | Face | Token |
| --- | --- | --- |
| Display + body — the reading voice | **Literata** (variable, opsz 7–72; weights 400 500 600 700) | `--fd` |
| Data, labels, all notation — the notation voice | **Source Sans 3** (400 600 700) | `--fs` |

```css
--fd: Literata, Georgia, "Times New Roman", serif;
--fs: "Source Sans 3", system-ui, -apple-system, "Segoe UI", sans-serif;
```

**Named Rule.** Uppercase + tracking = data. Sentence case = prose. A label set in Literata, or a
paragraph set in Source Sans, is a category error rather than a style choice.

### The scale — `src/styles/type-scale.test.ts` fails a raw `font-size` outside it

| Name | Size | Weight | Tracking | Face | Where |
| --- | --- | --- | --- | --- | --- |
| Guide title | `clamp(2.5rem, 6vw, 4.8rem)` / .98 | 500 | −.02em | `--fd` | masthead only |
| Reading | `clamp(1.5rem, 1.2rem + 2.4vw, 2.6rem)`, **floor 24px** | 600 | — | `--fs` | plate line, gaps, totals |
| Panel title | `1.45rem` / 1.2 | 500 | — | `--fd` | every Panel |
| Day title | `1.9rem` / 1.12 desktop · `1.5rem` / 1.15 phone | 500 | −.015em | `--fd` | the day card |
| Lead | `1.05rem` / 1.6 desktop · `.95rem` / 1.55 phone | 400 | — | `--fs` | the always-visible two lines |
| Body | `.95rem` / 1.6 | 400 | — | `--fs` | Panel bodies |
| Stop name | `1rem` / 1.35 | 600 | — | `--fd` | a stop on the line |
| Stamp | `0.82rem` | 640 | .08em | `--fs` | check dates, source links |
| Kicker | `10px` / 1 | 700 | .22em | `--fs` | every Panel, in `--aink` |
| Micro-label | `9px` / 1.3 | 600 | .16em–.2em | `--fs` | day state, station sub-lines |

**Reading scale floors at 24px and never goes below it**, at any viewport, in any theme.
Slide-scale minimums do not apply here; this is a document.

**Tabular numerals** (`font-variant-numeric: tabular-nums`) on every figure that can change:
clocks, money, distances, counts, coordinates.

---

## 3. Radius — binary, nothing between

| Value | On |
| --- | --- |
| `0` | anything holding content or evidence: Panels, plates, gap blocks, the ledger, tables |
| `999px` | anything you press: pills, buttons, chips, the thumb bar's slots |

There is no 4px, 8px or 12px anywhere in this product. A rounded card is the single fastest way
to make this design stop looking like itself.

The one exception, already in the system: the phone's thumb-bar slots use `14px` because they
are a pressed *area* rather than a pill, and a 999px radius on a 52px-tall full-width slot reads
as a lozenge. Do not extend this exception anywhere else.

## 4. Border weight

| Weight | Reserved for |
| --- | --- |
| `1px var(--rule)` | the default hairline. Everything not listed below |
| `1px var(--rule2)` | control borders, the plate frame |
| `2px var(--accent)` | **exactly four things**: the quick card, the plate line, corner ticks, the spine rail's line |
| `2px var(--ochre)` | the gap block. Nothing else |
| `2px var(--crit)` | an SOS number's own frame. Nothing else |

If you reach for a third weight, the answer is a different colour, not a thicker line.

## 5. Spacing and the grid

One gutter, both directions, everywhere: **16px on phone, 18px on tablet, 20px on desktop.**
The R4 mix of 16/18 gaps is folded into that single scale.

Panel padding: `16px 20px 18px` open · `12px 16px` collapsed.
Panel grid:

```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); /* 460px above 1100px */
grid-auto-flow: row dense;
gap: var(--gutter);
align-items: stretch;
```

**Sort order is load-bearing: full-width → open → collapsed.** A collapsed title bar beside a
full-height Panel is exactly what creates the ragged dead space this redesign removed.

**Span `1 / -1`:** `sights`, `venues`, `days`, `infogrid`, `habitats`, `raids`, `tierlist`,
`map`, `budget`, `divergences`, any `list` over five items, and the add-expense form (it is
internally gridded, which is what the span rule is for).

## 6. Safe areas

Declared once at `:root` from `env()`, then **every** fixed or sticky edge pads with
`max(reserved, var(--safe-*))` — never bare `env()`, because an environment reporting zero must
still leave the reserved gap.

```css
:root {
  --safe-t: env(safe-area-inset-top, 0px);
  --safe-r: env(safe-area-inset-right, 0px);
  --safe-b: env(safe-area-inset-bottom, 0px);
  --safe-l: env(safe-area-inset-left, 0px);
}
```

`viewport-fit=cover` is **required** in the viewport meta, or every inset resolves to zero.

Reserved minimums: top 54px (status bar + Dynamic Island), bottom 26px (home indicator).
The phone's scrolling region starts **below** the status-bar zone — content must not run under
the clock, the battery or the island. This was a real defect in review.

## 7. Container query breakpoints

```css
.guide-body { container-type: inline-size; container-name: guide; }
@container guide (min-width: 744px)  { /* tablet model */ }
@container guide (min-width: 1180px) { /* desktop model */ }
```

No device check, no user-agent sniffing, no `window.innerWidth` branch. A folding phone that is
673px unfolded gets the phone model in portrait and the tablet model in landscape, and that falls
out of the query with no code.

Viewport media queries stay for **page chrome only** (the site header, print rules).
