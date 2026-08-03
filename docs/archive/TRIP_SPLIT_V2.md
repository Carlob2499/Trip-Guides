# Trip Split — assessment and V2 proposal

> **Creator's ruling, 2026-08-02, after this was written:** the guide's estimated budget and
> the calculator stay **unconnected**. "The budgets don't matter as much, only the splitting of
> costs." Plan vs Actual — §5's original anchor — is therefore **dropped**, along with per-day
> rollups and budget-target comparisons. Spend **categories survive** on their own merits as a
> spend analysis ("categorising based on what we paid"), not as a bridge to the guide's budget
> section. Tier 0 plus items 1, 4 and 5 of Tier 1 and item 8 of Tier 2 are **built and
> shipped**; see the status marks in §5. Everything else stands as proposal.

**Date:** 2026-08-02 · **Status:** partly shipped — see the ruling above
**Scope:** `src/features/trip-split/` (the Budget tab), its relationship to the guide's own
`budget` section, and the Group Vote panel it shares a stylesheet with.

Method: every claim below is either (a) read out of the code, (b) measured in the running
preview with seeded data, or (c) sourced to a competitor's own documentation. Where a claim is
a competitor's *user opinion* rather than a documented fact, it says so. Nothing here is
recalled from training data.

---

## 1. The one-paragraph verdict

Trip Split is a good **calculator** and an incomplete **travel** tool. Its settlement maths is
sound, tested, and better than its UI suggests; its zero-setup shared room genuinely beats every
competitor's onboarding. But it does not know what currency you are spending, what day it is,
what the money was for, or who *you* are — and it sits inside a product that already knows all
four. The V2 thesis is not "add features to catch up with Splitwise." It is: **stop building a
worse Splitwise and start building the thing Splitwise structurally cannot — a splitter that
knows the itinerary it is attached to.**

---

## 2. What it gets right (keep, and defend)

1. **Zero-setup shared state.** No account, no room code, no invite flow: the guide URL is the
   identity, and every device on that guide edits one budget (`roomId` salted per guide,
   anonymous auth, `rules.json` gating on a 16–40 char code). *Calibrated honestly:* Splid and
   KittySplit are also account-free, and Tricount nearly so — account-free is not itself rare.
   What is rare is that there is **no create-a-group step at all**: the room is derived from the
   guide, so everyone reading it is already in the same budget. V2 must not trade that away.
2. **Correct minimum-transfer settlement**, as a pure tested function (`model/settle.ts`) rather
   than tangled into the view. The greedy creditor/debtor match is right, and `EPS` handling
   means cents noise doesn't invent transfers.
3. **Subset participants.** An expense shared by two of three (the jimjilbang case) divides by
   *those two*, and it is a visible chip row rather than a buried "split differently" control
   (KittySplit is confirmed to support the same thing behind such a control).
4. **Offline degradation that tells the truth** — the status line says "changes are saved on this
   device only" rather than pretending to sync.
5. **The post-trip lock.** Turning a live scratchpad into a read-only record after the trip is
   something no competitor researched here does; Splitwise's own users have been asking for
   group archiving since 2015 and still only get auto-hide-after-40-days.
6. **The summary PDF** (shipped today) — a real, sendable artifact.
7. **An honest privacy notice** that states the room is readable by anyone with the link.

---

## 3. Adversarial findings

Each is stated as a defect with its evidence. Severity: **S1** breaks correctness, **S2** blocks
a core job, **S3** is friction.

### S1 — Correctness

**F1. Adding a person retroactively re-splits expenses they were never part of.**
`opAddExpense` never records `participants`, and `sharersOf`/`settle` treat an absent list as
"the whole group *as it is now*". Verified with a probe: a day-1 dinner of $90 split three ways
(30/30/30) becomes 22.50 each the moment a fourth person is added on day 5 — the newcomer owes
$22.50 for a meal they did not attend, and everyone else's share silently drops. No warning, no
signal, real money. **This is a bug, not a design gap.** Participants must be snapshotted at
creation.

**F2. The repo ships float money while a correct minor-unit engine sits unused.**
`model/money.ts` exports `computeSplits` (EQUAL / EXACT / PERCENTAGE / SHARES, integer minor
units, guaranteed to sum exactly to the total) with ~30 passing tests, is re-exported from
`index.ts` — and is **called by nothing**. The shipped path is `evenSplit()`: `total / n` through
`toFixed(2)`, so $100 three ways stores 33.33 × 3 = $99.99 and a cent evaporates. We wrote the
right engine and shipped the wrong one.

**F3. The split method is one global boolean for the entire trip.**
`state.customSplit` is trip-wide. You cannot have dinner split evenly and a hotel split 70/30 —
flipping the toggle reinterprets *every* expense at once (verified: the same two expenses settle
to −80 and −30 for the same person depending only on the flag). Every competitor makes split
method a property of the expense. This is the deepest flaw because it lives in the data model,
not the UI.

### S2 — Core job

**F4. It does not know what currency you are spending.**
`fmtUSD()` hardcodes `"$"`. On a Korea guide — which carries `curCode: "KRW"` and a live ECB rate
in the same config island, on the same page, which the new PDF already reads — every expense must
be converted to dollars in your head before you type it. This is the largest functional gap and
the most embarrassing one, because the data is already there.

**F5. Expenses have no date.**
`model/records.ts` has no date field. The host product is a **day-structured itinerary**. The
calculator cannot answer "what did day 3 cost", the PDF cannot group by day, and the guide's own
per-day Plan⇄Actual surface has no actuals to show.

**F6. Expenses have no category** — so "where did it go" is unanswerable, and the summary sheet
can itemise but never summarise.

**F7. There is no settlement lifecycle.** No "mark as paid", no payment record. `txns` are
recomputed from balances forever, so after Riley actually hands Sam the cash the panel still says
Riley owes. The post-trip lock then freezes a "record" that asserts debts which were settled in
real life. Splitwise's own documented failure mode is people paying in cash and forgetting to tap
Settle Up — **we don't even have the button to forget to tap.**

**F8. Nobody is "you".** There is no device identity, so the UI can only say "Carlo owes $11.63",
never "you owe $11.63". Splitwise's entire information design rests on *you*. This is a real
consequence of the zero-setup choice, but it is fixable without giving that choice up.

### S3 — Scale, trust, friction

**F9. It collapses at realistic trip length.** Seeded with 40 expenses (an ordinary 8-day trip for
three) the panel measures **8,426px — 10.4 phone screens** — with the results card 5,504px below
the top and each row costing 176px. There is no search, no filter, no grouping, no collapse.
*Self-criticism:* today's restack fixed the clipping but made each row taller, so it improved
legibility and worsened scale. Both need solving together.

**F10. The trust model has no mitigations.** Anyone with the public guide link can edit or delete
anyone's expense — one tap, no confirmation, no undo, no activity log, no identity. Splitwise
chose the same open "wiki" model *deliberately*, and documents it, but ships change
notifications and a Recent Activity log as counterweights; its users still run long-standing
threads titled, in essence, *how can someone else delete an entry I made?* We took the same
liability without the counterweights.

**F11. Payment handles are the only PII here and they sit in a link-readable room.** I excluded
them from the PDF precisely because a file gets forwarded — which exposes the inconsistency:
protected in the artifact, exposed on the page.

**F12. Entry friction.** Payer defaults to the first member rather than to you (there is no you);
no quick-add, no recently-used descriptions, no per-expense date; the amount field is the third
control rather than the first.

---

## 4. Market position

Surveyed against Splitwise, Tricount, Settle Up, Splid and KittySplit, verified against their own
documentation and App Store listings on 2026-08-02.

### Where we stand

| Capability | The market | Trip Split today |
|---|---|---|
| Equal / exact / shares splitting | All five | Engine exists, **not wired**; UI offers even + one global custom mode |
| Debt-minimising settlement | All five, default-on | ✅ Have it, and it is correct |
| Multi-currency | Free in Tricount, Settle Up, Splid; **paywalled** in Splitwise and KittySplit | ❌ USD only |
| Historical / entry-time FX rate | **Only KittySplit** (expense-date rate). Splitwise explicitly refuses historical rates — current-rate only, by design | ❌ None |
| No account required | Splid, KittySplit fully; Tricount nearly; Splitwise requires one | ✅ Stronger — no group-creation step either |
| Dated expenses, categories, search | Effectively universal | ❌ None of the three |
| Mark-as-settled | Universal | ❌ Missing |
| Export | Splid PDF free · Settle Up CSV free · KittySplit XLSX · **Tricount removed in-app export entirely** (email-only) · Splitwise JSON backup (Pro) | ✅ Two-page PDF, free |
| Free-tier usage cap | **Splitwise alone** caps daily expense entry on free accounts | ✅ No cap |
| Post-trip read-only record | Nobody. Splitwise users have requested group archiving since 2015 and get auto-hide-after-40-days | ✅ Unique |
| Attached, verified itinerary | Nobody — it is not their business | ✅ Structurally unique |

Read plainly: we are **behind on table stakes** (currency, dates, categories, search, settle) and
**ahead on two things no one else has** (a post-trip record, and the itinerary). The V2 ordering
in §5 follows exactly that — close the table-stakes gap, then spend everything on the itinerary.

### Three openings nobody has closed

1. **Nobody explains a simplified debt.** Splitwise's own KB documents that Simplify Debts
   produces transfers between people who never transacted, and answers it with a help article
   rather than UI — it even warns that disabling it after payments were made leaves paths that
   "may no longer line up." Tricount's own FAQ separately admits its suggestions "may seem
   counterintuitive." **Two vendors concede the problem in their own documentation and neither
   solves it in the interface.** A tap-to-expand "why do I owe Sam?" trace is cheap and genuinely
   novel.
2. **Rate provenance.** Only KittySplit ties a rate to the expense's date, and it is paywalled.
   Capturing the rate *at entry* and printing its provenance on the summary sheet would put us in
   a category of two — and it is the same sourced-approximate discipline the rest of Waypoint
   already runs on.
3. **Accessibility is an industry-wide blind spot** — no competitor researched publishes an
   accessibility statement or VPAT, and no third-party validation exists for any of them. Waypoint
   already runs axe across light/dark × mobile/desktop in CI.

---

## 5. The V2 proposal

Ordering is deliberate: correctness first (it is wrong today), then the trip-native features
that justify the tool's existence, then scale and trust.

### Tier 0 — Fix what is wrong (no new surface) · ✅ SHIPPED

| Change | Fixes | Justification |
|---|---|---|
| Snapshot `participants` at creation | F1 | Money silently changing under a user is the worst class of bug this tool can have. |
| Wire `computeSplits` minor-unit engine into the UI; store integer minor units | F2 | The correct engine is already written and tested. Shipping floats beside it is indefensible. |
| Move split method onto the expense (`method` + `participants[]`) | F3 | A trip-wide mode cannot express a real trip. Enables EXACT/PERCENTAGE/SHARES that the engine already supports. |

Deleted by this tier: the global **÷ Even / Custom** toggle in the card header, and the
`state.customSplit` flag.

**Migration, as built.** One shape change, so saved trips convert once. Per-record conversion
(float dollars → minor units, method/currency defaults) lives in `normalizeExpense`; the
trip-wide `customSplit` flag is converted where it is actually in scope — `migrate()` for a
local save, and `bindRoom()` for a shared room, which still *reads* `meta.customSplit` so a
room that used Custom amounts is not silently re-read as an even split. **Nothing is ever
written back to Firebase by the migration** — the server's records are read through the
normalizer and left as they are. On-device, the pre-migration blob is copied to
`tg-split-<guide>-pre-v2` before the upgraded shape overwrites it, because a trip's expense
history is not reproducible from memory three weeks later.

### Tier 1 — Become a *travel* splitter
*(items 1, 4 and 5 shipped; items 2 and 3 dropped by the creator's ruling above)*

1. **Native currency entry.** Enter ₩45,000, not $31.16. Store `{ amountMinor, currency,
   rate, rateDate }` — the rate captured *at entry*, so a later rate move never rewrites
   history. Display local with the USD equivalent beneath. Justification: the guide already
   carries `curCode` and a live ECB rate; this is wiring, not new infrastructure, and it removes
   the single biggest daily friction. It also lands on the right side of §4's opening #2 —
   Splitwise refuses per-expense historical rates on principle and KittySplit charges for them,
   so pinning a rate per expense puts us in a field of two, using machinery we already own.
2. ~~**Dated expenses bound to the itinerary.**~~ **DROPPED** (creator's ruling). Dates remain
   worth revisiting purely as a way to *find* an expense in a long list — see Tier 2 item 7 —
   but not as a feature in their own right.
3. ~~**Plan vs Actual.**~~ **DROPPED** (creator's ruling): the guide's estimated budget and the
   calculator stay separate. Recorded here rather than deleted, because the reasoning that made
   it attractive — the guide's `budget` section is a complete structured plan — is still true,
   and a future self should be able to see that it was considered and declined, not overlooked.
4. **Spend categories** ✅ **SHIPPED** — free text with a suggestion list, rolled up biggest-first
   into a "Where it went" breakdown in the results card and a table on the printed sheet.
   Deliberately NOT drawn from the guide's budget items, per the ruling: this is an analysis of
   what was actually paid, standing on its own. Hidden until at least one expense is
   categorised, because an all-"Uncategorised" chart teaches nothing.
5. **"I'm ___" device identity.** One tap, stored per device, no account. Unlocks "you owe",
   "your share", defaulting the payer to you, and sorting balances with you first — the whole
   second-person voice, without surrendering zero-setup.

### Tier 2 — Survive a real trip

6. **Collapse rows** ✅ **SHIPPED, partially effective — read the numbers.** Category, split
   rule, sharers and weights now sit behind a per-row disclosure, with a summary line carrying
   anything non-default. Desktop rows went **176px → 82px**. Mobile only went **176px → 157px**,
   because 94px of a mobile row is two 44px touch targets stacked, and shrinking those would
   trade an accessibility floor for scroll. A 40-expense trip is still **7,875px / 9.7 phone
   screens**. Honest conclusion: the row is near its floor, and the remaining scale problem is
   not row height — it is rendering forty editable rows at all. That is item 7's job.
7. **Search and filter** by person and category, and/or a read-only compact list that expands
   into an editable row. **This is now the highest-value unbuilt item**, on the measurement above.
8. **Mark-as-settled with a payments log** ✅ **SHIPPED.** Settlement is a recorded event, not a
   perpetually recomputed suggestion: "Mark paid" writes a payment, the transfer leaves the
   list, the person shows as settled, and the log carries a dated Undo. The post-trip lock now
   freezes something true.
9. **Undo for delete** (and a lightweight activity strip: "Sam removed 'Taxi' · 2m ago"). The
   cheapest possible answer to F10, matching what Splitwise found necessary. *Partially served:*
   payments have an Undo; expense and member deletion still do not.

### Tier 3 — Trust and polish

10. **Handles become explicitly public-or-omitted**, surfaced only at the settle step.
11. **"Why do I owe Sam?"** — expand a transfer to show the chain it was simplified from. The
    documented market-wide gap.

### Explicitly refused, with reasons

- **Accounts / login.** Would destroy the one advantage no competitor can copy.
- **Receipt OCR.** Only Splitwise Pro confirmably has real OCR, and it is paywalled there for a
  reason: it needs a paid vision API and photo storage. It would also put images of receipts —
  card digits, addresses — into a link-readable room. Refused on cost and on privacy.
- **In-app payments.** No researched competitor does it; it is a regulated business, not a feature.
- **Recurring expenses.** A trip is finite. This is a household-budget feature.
- **Removing debt simplification.** It is correct and it reduces transfers; the fix is explaining
  it (item 11), not deleting it.

---

## 6. Open decisions for the creator

1. **Scope.** Tier 0 alone (correctness, ~1 session), Tier 0+1 (the differentiator, ~2–3), or
   the full arc?
2. **Migration.** Existing budgets are float-USD with no dates. Convert on read (assume USD,
   leave dates blank) or leave old trips as-is and apply the new model to new guides?
3. **Currency display default** — local first with USD beneath, or the reverse?
4. **Identity prompt placement** — ask on first open of the tab, or leave it as a quiet control
   that only appears once a second person joins?

Nothing in Tier 0 depends on these answers; it can start regardless.

---

## 7. Evidence and its limits

**Measured here, in the running preview:** the 40-expense scale figures (8,426px / 10.4 screens /
176px per row / results 5,504px down), the row-width numbers behind F9 and today's UI pass, and
grid alignment. **Read from this repo:** F1–F3, F5–F8, F10–F12, and the `budget` schema that makes
Plan vs Actual buildable. **Probed with a throwaway vitest file** (not committed): the retroactive
participant bug, the lost cent, and the global split-flag reinterpretation — each asserted against
`settle()` directly so §3 states behaviour rather than suspicion.

**Competitor claims** were verified against vendors' own KB pages, help centres and App Store
listings on 2026-08-02. Known gaps in that research, carried here rather than smoothed over:
Splitwise's current Pro price could not be read from its own pricing page (JavaScript-rendered;
only App Store IAP figures were confirmed), Splitwise's export formats beyond a JSON backup are
unconfirmed, and the FX-rate timing for Tricount, Settle Up and Splid is unverified. User
complaints cited anywhere above are *opinion signal* from review aggregators and vendor feedback
boards, not verified fact; the two vendor self-admissions in §4 are the exception and come from
the vendors' own documentation.

No competitor pricing figure is used to justify any decision in §5, so those gaps do not affect
the proposal.
