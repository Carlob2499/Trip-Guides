# Test Coverage — policy + the one open decision

_Snapshot 2026-07-19; P1–P5 of the original analysis are **implemented** (full detail in git
history of this file). 585+ tests; reproduce numbers with `npm run coverage`._

## The three test layers (what guards what)

| Layer | Tool | Runs in CI | Guards |
|---|---|---|---|
| **Unit** | Vitest (`npm test`) | `test.yml`, `deploy.yml` | Pure logic in `model/` + `src/lib/` + `scripts/__tests__/` |
| **Interaction / visual** | Playwright (`npm run test:visual`) | `visual.yml` | Built-page screenshots + real interaction flows + axe a11y |
| **Content facts** | audit/verify scripts | `content-audit.yml`, `recert.yml`, `graduate-guide.yml` | Link liveness, Commons photos, staleness, research gates |

The structural rule: each feature splits into a pure, heavily-tested `model/` and DOM-only
`ui/` that unit tests skip on purpose (Playwright covers some). Raw "19% lines" is dominated
by that intentional 0% — target *risk*, never the percentage.

## The coverage gate (wired into CI — regression gates, not aspirations)

`vitest.config.ts` sets per-glob thresholds a few points under measured reality;
`test.yml` runs `npm run coverage` so a regression in a gated glob blocks the PR:

```
"src/lib/**":               { statements: 90, branches: 80, functions: 95, lines: 95 }
"src/features/*/model/**":  { statements: 90, branches: 80, functions: 90, lines: 95 }
"scripts/audit/lib.mjs":    { statements: 65, branches: 65, functions: 60, lines: 65 }
```

Deliberately-open edge gaps (defensive "can't happen" branches in `money.ts`, `staleness.ts`,
`settle.ts` — the last needs an exact IEEE-754 boundary): **not worth flaky tests**; see git
history before reviving.

## P6 — the open decision: UI with no test at ANY layer

`share-panel.js`, `sos.js`, `voting.js`, hub `wizard.js` (209 ln), `palette.js`,
`gmaps-render.js`, `survey.js` have neither a `model/` nor a Playwright spec. Per feature,
whoever next touches one picks deliberately:

- **Preferred:** peel remaining pure logic into `model/` + unit tests (the silo pattern).
  The hub **wizard** is the top candidate — real multi-step branching/validation.
- **Otherwise:** a Playwright spec for the highest-risk flow (SOS is emergency-surfaced;
  a broken share link is user-visible).
