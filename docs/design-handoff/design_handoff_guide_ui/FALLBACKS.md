# Fallbacks — what to do when something is missing, fails, or contradicts

This product's whole claim is that it does not fill holes. Every rule below resolves to the same
principle: **say what is true, including "we do not know", and never fabricate.**

---

## 1. Absent data — build every one of these

| Absent | Do | Never |
| --- | --- | --- |
| Cover photograph | plate keeps size, frame, all four ticks; `NO COVER PHOTOGRAPH YET` + one line | collapse the plate, reflow the text into the space, or substitute stock imagery |
| `learnings` record | **do not draw the Field log station** | draw an empty station |
| Trip not started / finished | no present band, no `now` chip | invent a present moment |
| No day walked | `0 of N`, day 1 selected because it is first | a progress bar at zero, or "day 1 · now" |
| No ticks | `0 of 6`, denominator visible | hide the count |
| No expenses | `$0.00`, nets `—`, no transfers, bars hidden, ledger says so | `+0.00` (claims a positive balance), a bare table header, or seeded rows |
| No section memory | **omit the resume line** | "start here" |
| No sourced FX rate | omit the rate line | `1.00`, or silently using the live rate as if it were sourced |
| No holiday record for a country | the tool **says so** | guess a country's holidays |
| No coordinates on a stop | omit `MAPS ↗` for that stop; the whole-day link chains what exists | a maps link to a place name string |
| No emergency numbers | omit the chips | a generic 112/911 |
| A fact with no source | render `NO PUBLIC SOURCE` in the popover | omit the dot, which implies the claim was checked |
| Research came up short | **the gap block**, at reading scale, in 2px ochre | prose that reads like an answer |

## 2. Runtime failure

| Fails | Do |
| --- | --- |
| Live FX fetch | fall back to the table in `live-data/model/rate.ts`, then to the guide's sourced rate, then omit. **Never** silently relabel a fallback as live |
| Weather / holidays fetch | hide the block. Fetch-once, cache, degrade — never break the page |
| A photo 404s | the existing pipeline's plain-version fallback. A failed image never breaks a build or a page |
| Google Maps unreachable | the leg still renders; the link is a plain `<a>` and needs no JS |
| `localStorage` unavailable (private mode, quota) | every read is `try/catch`ed and returns the default. **No feature may be gated on storage succeeding** |
| GSAP fails to load | collapse falls back to an instant toggle. The Panel must still open and close |
| `IntersectionObserver` unsupported | reveal everything immediately |
| `container-type` unsupported | the phone model is the fallback; it is the narrowest and loses nothing structural |
| `color-mix()` unsupported | the halo ring falls back to a flat `rgba(156,68,33,.22)`. Provide both |
| Offline | the PWA serves the cached guide. Live values show their cached value with its timestamp, never a spinner that never resolves |

## 3. Contradictions

- **A doc in this bundle vs. a doc in `docs/`** — this bundle wins; amend the repo doc in the
  same PR.
- **A doc in this bundle vs. a prototype** — the doc wins.
- **Two docs in this bundle** — `SUPERSEDES.md` > `TOKENS.md`/`COMPONENTS.md` > prose.
- **A gate fails on a value this bundle specifies** — the gate wins, and you raise it. Do not
  weaken a gate to make a design pass. `type-scale.test.ts` in particular will likely fail first,
  because the prototypes use inline `font` shorthand it has never seen; the fix is to add the
  size to the scale deliberately, not to exempt the file.
- **You cannot find a source for something you are about to build** — stop and ask. Do not write
  a colour, a spacing value, a component layout or an icon you cannot point to in a file.

## 4. Scope guards

If implementing this seems to require any of the following, **stop and raise it** — none is in
scope and each is a sign of a misread:

- editing any file under `src/content/guides/`
- adding a field to `src/content.config.ts`
- a new npm dependency
- a device check, a user-agent branch, or a `window.innerWidth` switch
- a third theme
- re-implementing settlement, jetlag, holidays or ranking in the UI layer
