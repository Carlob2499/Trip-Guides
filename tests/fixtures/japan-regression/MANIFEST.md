# Japan regression fixture — the 12 defect cases

> **Frozen 2026-08-13 (packet A1 of `docs/PLAN_EVIDENCE_FIRST.md`). Do not edit these files
> to make a checker pass.** They are byte-identical copies of Japan's shipped artifacts,
> captured because Japan is the corpus's only live specimen of every defect class the
> evidence-first program exists to catch. A checker that disagrees with a case below is a
> checker bug — fix it in its owning packet, never by editing the fixture.
>
> **The live guide is never repaired either** (creator ruling 2026-08-13, `CONTEXT.md`).
> `src/content/guides/japan/` failing the new hygiene gates is the EXPECTED state, not a bug
> queue. Gates that must be corpus-wide green need a japan exemption, not a japan cleanup.

## What is frozen

| Fixture path | Copied from | Carries cases |
|---|---|---|
| `guide/facts.json` | `src/content/guides/japan/facts.json` | 9, 10, 12 |
| `guide/_guide.json` | `src/content/guides/japan/_guide.json` | 2, 3, 4, 5 |
| `guide/01-plan.json` | `src/content/guides/japan/01-plan.json` | 5 |
| `guide/03-sights.json` | `src/content/guides/japan/03-sights.json` | 4, 12 |
| `guide/06-days.json` | `src/content/guides/japan/06-days.json` | 1b, 3, 4, 5, 7, 11, 12 |
| `guide/08-health-and-safety.json` | `src/content/guides/japan/08-health-and-safety.json` | 6 |
| `intake/japan.md` | `guides-intake/japan.md` | 1a, 1b, 2, 7 |
| `intake/japan.state.json` | `guides-intake/japan.state.json` | 8 |

Line numbers below are valid in **both** the fixture copy and the source file — the copies are
byte-identical, and a `diff -q` assertion in `japan-regression.test.mjs` keeps them that way.

---

## Case 1 — Birthday attribution ⚠️ **REWRITTEN 2026-08-13; NOT what the plan first said**

The plan (`PLAN_EVIDENCE_FIRST.md` §8, packet C2) described this case as *"conflicting birthday
info"* — Sept 25 vs Oct 24 — and assigned C2 to flag it as a contradiction. **Verified against
the file during A1: there is no contradiction.** The party is two people (`intake/japan.md:8`,
"Two 27-year-olds"), and they have two birthdays:

- `intake/japan.md:16` — "**His** birthday is Sept 25 — **before the trip, not during it**"
- `intake/japan.md:28` — "**Traveler's own** birthday, Oct 24, **also** falls inside the trip
  window and is a **second** fixed in-trip date"

"also" and "second" are additive. The guide acted on both correctly, building two distinct
celebrations — a belated one for the Sept 25 birthday and an on-the-day one for Oct 24. The
intake is coherent; the architect session misread one party's two birthdays as one person's
contradictory one.

This splits the case in two.

### Case 1a — **NEGATIVE case. C2 must NOT fire.**

A false-positive guard, and the reason this case was not simply deleted. C2's date extraction
must attribute dates to **people**, and flag only when the *same* person carries two different
values. If C2 fires on `intake/japan.md`, C2 is wrong.

Without this guard, C2 would flag every legitimate multi-traveler guide whose travellers have
different birthdays — and H1 would have locked that behaviour in as correct.

**Expected finding: none. Silence is the pass condition.**

### Case 1b — **POSITIVE case, newly found during A1: the guide never says whose birthday is whose.**

The defect the original framing was groping at, found by the creator on 2026-08-13. The intake
distinguishes two people's birthdays; the guide **flattens that distinction and never restores
it**. Both day entries name a birthday, neither names a person:

- `guide/06-days.json:102` — `"title": "Birthday — Sapporo city day"`, body opens *"A birthday
  that actually lands during the trip"* (this is the Oct 24 one — the traveler's own)
- `guide/06-days.json:258` — `"title": "Zao Onsen — belated birthday, the ryokan splurge"`,
  body opens *"the belated celebration for the birthday that fell before the trip started"*
  (this is the Sept 25 one — the companion's)

A reader sees two birthday days and cannot tell they belong to two different travellers; it
reads plausibly as one person's birthday being celebrated twice. Note that
*"A birthday that **actually** lands during the trip"* implicitly contrasts with the other,
which sharpens the confusion rather than resolving it.

This is a defect class the plan has no other case for: **an intake distinction the guide
flattened.** It fails the *Personal* pillar quietly — the facts are all correct and every date
is right, yet the traveller can't tell whose moment is whose.

**Honest note on detectability:** no deterministic checker in the B/C/E packets catches this,
and A1 does not pretend otherwise. "Did the guide preserve a person-attribution the intake
made?" is an authoring-discipline question, and its home is the D2 skill rewrite (research
protocol), not a gate. It is recorded here as frozen evidence so D2 has a concrete specimen to
write against, and so a future session does not rediscover it from scratch. **H1 asserts 1a
(silence) mechanically; 1b is documentation, not an assertion.**

---

## Case 2 — Unconfirmed start date recorded as a flat value

The traveller stated an unnarrowed range; the scaffold recorded a single bare date.

- `intake/japan.md:10` — "the Oct 15 start above is the wider end of a range the traveler is
  still narrowing (**Oct 15 or Oct 22**, both ending around Nov 10) — treat the exact start
  date as unconfirmed and flag it rather than treating Oct 15 as locked"
- `intake/japan.md:25` — `- **Exact dates (start–end):** 2026-10-15 – 2026-11-10` ← **a flat
  value.** Nothing in the schema can express "target, not fixed", which is the C1 gap.

The guide *does* disclose this honestly (`intake/japan.md:125`, and the `_guide.json` verified
stamp), so this is a **structural** defect, not a dishonesty one: the uncertainty survives only
as prose an author remembered to write, with no field carrying it.

**Detected by:** C1 (certainty states make it representable) + C2 (flags the range-vs-flat-value
mismatch) + E3(b).

---

## Case 3 — Plan-critical anchor detail unresolved, tracked only in prose

The Wild Area venue and ticket sales are unannounced, and the guide says so
(`guide/06-days.json:271`: *"exact venue and ticket sales…"*; `guide/_guide.json:12` lists it
among what could not be confirmed). But no `facts.json` row tracks the open question, so nothing
re-checks it when the announcement lands — an R3 plan-critical unknown with no structural home.

**Detected by:** E1(a) — R3 plan-critical claim without a primary-tier fact row.

---

## Case 4 — Forecast-class dates live in prose with no fact rows

`facts.json` contains **zero koyo/foliage rows** (verified: `grep -i 'koyo\|foliage'` over
`guide/facts.json` returns nothing). The dates live inline across three files:

- `guide/06-days.json:177` — "Sapporo's official koyo average peak (**Oct 28–Nov 5**)"
- `guide/03-sights.json:28` — "a reliable **mid-Oct–early-Nov** foliage peak"
- `guide/_guide.json:12` — JMC's 2026 forecast "publishes ~mid-September 2026"

The prose disclosure is genuinely honest (`guide/06-days.json:195`: *"⚠ Every koyo date in this
guide is a multi-year average, not a locked 2026 forecast"*). The defect is structural: forecast
dates carry no `state: "approx"`, no `source_url`, and no `verified_on`, so nothing expires them
when JMC publishes the real 2026 forecast.

**Detected by:** E3(c) — forecast-class facts must be `state: approx` with a dated source.

---

## Case 5 — Mid-trip regulatory change tracked only in prose

Japan's tax-free system switches from instant-discount to refund-at-departure on **Nov 1, 2026**
— inside this trip.

- `guide/01-plan.json:30` — "Purchases through **Oct 31, 2026** use the current instant-discount…"
- `guide/06-days.json:195` — "today is the last day Japan's simple instant-discount tax-free
  system applies"
- `guide/_guide.json:12` — the cutover named in the verified stamp

There is one related row (`guide/facts.json:15–21`, `entry-documents-5-000`, the ¥5,000
threshold, sourced to `mlit.go.jp`) but **no row for the cutover date itself** — the
plan-critical datum is prose-only.

**Detected by:** E1(b) + D1 (destination config names the rule-change source).

---

## Case 6 — R4 advisory unverified, surfaced honestly but unstructured

- `guide/08-health-and-safety.json:8` — "**US State Dept travel advisory:** could not be
  independently confirmed — its page is bot-gated against automated fetches and needs a live
  browser", with a `⚠` on the field above it.

The guide is honest here — this is the *Honest* pillar working. The defect is that an R4
safety-class claim's unresolved state is invisible to any gate: nothing enforces that a travel
advisory be surfaced, and nothing re-attempts it.

**Detected by:** E1(c) — R4 rows must be surfaced; the unconfirmed state must be structural.

---

## Case 7 — Anchor-adjacent venue on weak, self-flagged support

The Oct 24 birthday dinner (`guide/06-days.json:102`, Jingisukan Daruma Honten) rests on Pass B
convergence alone. The ledger says so in its own words:

- `intake/japan.md:95` — "Sapporo birthday dinner | **— (not researched in A)** | Jingisukan
  Daruma Honten — 3 independent write-ups converge | Included as the Oct 24 birthday dinner,
  **⚠ not directly fetched** | **B-only**, verified by multi-source convergence, flagged for a
  direct re-check"

A celebration-anchor venue with no primary source and no Pass A counterpart, shipped with a
recorded intent to re-check that nothing tracks.

**Detected by:** E3 — single weak source on an R3-adjacent claim.

---

## Case 8 — "Independent" research stages stamped 71 ms apart

`intake/japan.state.json` records the three research stages as effectively simultaneous:

| Stage | Timestamp |
|---|---|
| `passA` | `2026-07-29T10:32:26.640Z` |
| `passB` | `2026-07-29T10:32:26.675Z` (+35 ms) |
| `reconcile` | `2026-07-29T10:32:26.711Z` (+36 ms) |

Pass A and Pass B are architecturally required to be *structurally independent* research acts,
and reconcile consumes both. Three such stages cannot complete in 71 ms of wall clock. The
stamps are a batched write at the end of a run, so the state file cannot evidence that Pass B
independence actually happened — the property the design depends on is unfalsifiable from the
artifact.

`check-run-integrity.mjs` already knows this shape (`BATCHED_COMMIT` / `BURST`, `MIN_GAP` 120 s);
this fixture pins the specimen.

**Detected by:** E3(d) — ledger rows with no genuine Pass A/reconcile counterpart.

---

## Case 9 — One value, two different sources (misattribution)

The same figure, ¥11,410, is attributed to a **railway** and an **airline**:

| Row | Line | Claim | `source_url` |
|---|---|---|---|
| `day-by-day-11-410` | `guide/facts.json:70–77` | "Day by day → Sendai → Tokyo → home — ¥11,410" | `https://www.jreast.co.jp/e/` (line **73**) |
| `budget-daily-costs-11-410` | `guide/facts.json:125–133` | "Budget & daily costs → **Domestic flights** (Tokyo→Fukuoka→Sapporo→Sendai) — ¥11,410" | `https://www.ana.co.jp/en/us/` (line **128**) |

At most one can be right: a rail fare filed under domestic flights, or a flight cost sourced to
JR East. The identical value makes accidental convergence implausible — this is one figure
re-attributed on rediscovery.

This is also the **D1 per-fact-rediscovery cluster**. Five rows carry the *byte-identical* claim
string "Budget & daily costs → Domestic flights (Tokyo→Fukuoka→Sapporo→Sendai)" with five
different values — `$90` (line 102), `$60` (110), `$80,` (118), `¥11,410` (126), `$75` (134) —
plus the sixth row above sharing the value. One entity, researched six times, never reconciled.

**Detected by:** B3 (misattribution + duplicate-row flags) + E1.

---

## Case 10 — Malformed values (trailing punctuation)

`migrate-facts.mjs`'s `MONEY_RE` includes `[\d.,]*`, which swallows the trailing separator:

| Line | Row | Value |
|---|---|---|
| **25** | `phone-data-19` | `"$19,"` |
| **88** | `money-currency-1` | `"$1,"` |
| **119** | `budget-daily-costs-80` | `"$80,"` |

`"$1,"` is the most revealing: it is a fragment of a larger number (an FX rate line), truncated
mid-figure. These render to the reader verbatim.

**Detected by:** B2 (the regex fix) + B3(b) (the hygiene flag).

---

## Case 11 — Routing/duration assumptions unverified

Inter-stop transit durations are stated as estimates with no verifiable source, e.g.
`guide/06-days.json:258` — "JR Senzan Line to Yamagata (**≈70–90 min**) then a local bus
(**≈35–40 min**)". The `≈` is honest notation, but nothing checks the leg against an authority.

**Detected by:** the §4 Google Routes check — **advisory only**, since Routes is config-gated and
default OFF (creator decision 2026-08-13). With no key the check degrades to advisory and never
fails, so H1 must assert the advisory finding, not a blocker.

---

## Case 12 — Seasonal closure risk asserted, not sourced

- `guide/06-days.json:258` — "**Okama Crater, if it's still open:** the Zao Ropeway + hike to the
  crater rim **typically** closes for the season in early November"

The visit is Nov 5 — inside the stated risk window. "typically" is an assumption doing
load-bearing work on a scheduled day. The related row `top-sights-zao-3-000`
(`guide/facts.json:47–53`, ¥3,000, `state: approx`, sourced to `zao-machi.com`) prices the
crater but says nothing about seasonal closure, so a 200 OK on that URL "verifies" a fact
adjacent to the actual risk.

This is the canonical **"200 ≠ verified"** specimen: the source is alive, and the guide's real
exposure is untested by it.

**Detected by:** E2 (drift / value-absence) + the S1 Places status gate.

---

## Case→packet coverage summary

| # | Case | Kind | Detected by | H1 asserts |
|---|---|---|---|---|
| 1a | Two travellers' birthdays are not a contradiction | **negative** | C2 | fires **no** finding |
| 1b | Guide never attributes either birthday to a person | positive | D2 (authoring, not a gate) | documented only |
| 2 | Flat start date hides a stated range | positive | C1 + C2 + E3(b) | finding |
| 3 | Unresolved anchor venue, prose-only | positive | E1(a) | blocker |
| 4 | Forecast dates with no fact rows | positive | E3(c) | finding |
| 5 | Tax-free cutover prose-only | positive | E1(b) + D1 | blocker |
| 6 | R4 advisory unconfirmed/unstructured | positive | E1(c) | blocker |
| 7 | B-only support on a celebration anchor | positive | E3 | finding |
| 8 | Research stages 71 ms apart | positive | E3(d) | finding |
| 9 | ¥11,410 attributed to two sources; 6-row cluster | positive | B3 + E1 | finding |
| 10 | `$19,` / `$1,` / `$80,` | positive | B2 + B3(b) | finding |
| 11 | Unverified leg durations | positive | Routes (advisory) | advisory |
| 12 | Unsourced seasonal closure on a scheduled day | positive | E2 + S1 | finding |
