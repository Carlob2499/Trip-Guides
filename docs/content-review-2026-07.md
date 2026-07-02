# Content & QA review — Korea + Denmark (Jul 2026)

Scope: functional testing (links + buttons), a line-level usefulness/prose critique of the
two fully-researched guides, a text-density pass, a titling pass, and an imaging analysis.
Written to be self-critical: where an earlier note in this repo flagged a "problem" that
turned out not to be one on close reading, that is called out as a **correction** below.

The binding constraint throughout: `CLAUDE.md`. No fact (venue, price, hour, address) was
invented or altered. This environment has **no web access**, so anything that would require
verifying a *new* fact is flagged for a networked research pass rather than written blind.

---

## 1. Functional testing — links & buttons

**Result: pass.** 25 headless (Playwright/Chromium) checks, all green:

- Home: curated cards render, each links to its guide; "Guides-to-be" grid renders;
  dark-mode toggle persists; "＋ Make a new guide" modal opens and builds the correct
  GitHub Issue URL (`issues/new?template=new-guide.yml&labels=new-guide&country=…`).
- Korea guide: share modal opens; GPX/iCal download links return 200 with correct
  content-types (`application/gpx+xml`, `text/calendar`); "copy summary" writes to
  clipboard; tab bar switches panels; checklist ticks persist to `localStorage`; budget
  math renders; jet-lag + local-time pills compute from the **IANA** zone (DST-correct).
- Draft guide (Japan): renders with no console errors and no horizontal scroll on mobile
  widths.

**Link audit (static):** Korea 71 unique hrefs, Denmark 35 — 0 insecure `http://`, 0
malformed. Two soft flags on Korea, both intentional: the KRW-rate and "find nearest
branch" links are *searches*, not deep links, and are labelled as such in the copy.

⚠ **Not testable offline:** external URL *reachability* (that each of the ~100 links still
resolves). These were correct when authored (guide verified 28 Jun 2026). Re-run a link
checker with network before the trips — this is the one perishable QA item.

---

## 2. Headline finding — the guides are strong; the risk is over-editing

Both guides are dense, primary-sourced, and correctly flagged (`≈` = checked-approximate,
`⚠` = unconfirmed). Korea is the **richest** guide in the repo (58 sections), not a thin
one. The most damaging thing a content pass could do here is either (a) fabricate Korean
"options" to hit a quota — forbidden by `CLAUDE.md` and impossible to verify offline — or
(b) churn already-good prose and introduce a transcription error into a price or address.
So this pass made **one** structural edit (§4), proven fact-safe by an automated invariant,
and otherwise recommends leaving the content alone.

### Correction to earlier notes
An earlier working note flagged several sections as title/content mismatches or "reads like
a status log." On close reading these are **false positives**:

- **#4 "Pre-flight countdown — specific actions by date"** — the body genuinely *is* dated,
  ordered actions (Now → Jul 5 → Jul 6 → Jul 6–7 → Jul 8). Title matches content. Keep.
- **#46 "Quick reference — when you're unsure what to do"** — already a scannable `<ul>` of
  decision-shortcuts. Title matches content. Keep.
- **#27 "Solo in Seoul … (a menu, not a plan)"** — the "menu" framing is deliberate and the
  body is well-grouped into `<ul>` blocks (recharge / nature / art / games / eat / evening).
  Keep.

No title changes are warranted in either guide. See §5.

---

## 3. Korea — section-by-section verdict

Legend: **Keep** (earns its space) · **Keep, minor** (fine; optional tightening) ·
**Restructured** (changed this pass) · **Flag** (needs a networked research pass).

| # | Title | Verdict |
|---|-------|---------|
| 0–3 | Land / essentials / entry / booking (panels) | Keep — tight, high-utility. |
| 4 | Pre-flight countdown | Keep — dated actions; the 72 h e-Arrival warning is exactly the kind of easily-omitted caveat that belongs up front. |
| 5 | Jet-lag protocol | Keep — long (400 w) but every line is actionable and it cites its sources (Frontiers, PMC, CDC, Huberman). This is reference material, read once; length is justified. |
| 6–8 | Phone/data · weather · holidays | Keep. |
| 9 | Rainy-day fallback | Keep — monsoon is the trip's biggest weather risk; a dedicated fallback is right. |
| 10–15 | Final checks · weather · holidays · money · budget · health | Keep. |
| 16 | Etiquette & language | Keep — the pink-priority-seat / no-tipping / two-hand rules are high-value and correctly specific. |
| 17 | Navigating Seoul as first-timers | **Keep, minor** — small overlap with #25 on Naver/Kakao maps; not worth the risk of merging. |
| 18 | What to wear (July) | Keep — the cotton-vs-linen and AC-layer points are the ones people actually get wrong. |
| 19 | Language guide | **Keep, minor** — overlaps #16's phrase list, but #19 is the fuller reference (greetings/food/shopping/transit/emergency) and #16 is the etiquette primer. Acceptable duplication; a reader uses one or the other. If trimming ever needed, drop the 6 phrases from #16 and point to #19. |
| 20–24 | Staff phrases · signs · routes · Incheon · map | Keep. |
| 25 | Tips & tricks | Keep — 9 discrete, practical tips; the T-money tap-out and Google-Maps-doesn't-work points prevent real mistakes. |
| 26–27 | Day-by-day · Solo in Seoul | Keep. |
| 28–38 | Sights · nightlife · Daejeon · shopping · food intro | Keep — well-grouped, mostly `<ul>`. |
| 39 | Ordering mechanics | Keep — kiosk/banchan/call-button mechanics are exactly what a first-timer needs. |
| **40** | **Where to eat** | **Restructured this pass** — see §4. |
| 41–45 | Breakfast · late-night · shopping · souvenirs · merch | Keep. |
| 46 | Quick reference | Keep. |
| 47–57 | Events (Road of Legends, GO Fest, priority targets, sources) | Keep — dense but this is the trip's purpose; the `⚠ re-verify in the final week` note on #49 is the correct hedge for Niantic's late roster changes. |

**Korea trim opportunities (all optional, none applied):** the only genuine redundancy is
the map-app advice appearing in #16, #17, and #25, and the phrase overlap between #16 and
#19. Both are *reference* duplications a reader benefits from finding wherever they land.
Recommend leaving as-is; if density ever becomes a complaint, consolidate the map advice
into #25 and cross-link.

## 3b. Denmark — verdict

Structurally a step ahead of Korea: **#29 "Where to eat" already uses grouped `<ul>`
lists** (this is the model §4 brings Korea up to). All 39 sections earn their space;
`⚠`/`≈` flags are used correctly (e.g. Jabby's hours "not widely published — verify").
No changes warranted. The largest prose blocks (#29 622 w, #23 488 w) are already
list-structured and scan well.

---

## 4. Text density — the one block-of-text fix applied

The clearest reading-experience problem across both guides was **Korea #40 "Where to eat"**
(903 words). Unlike Denmark #29, it used flat per-venue paragraphs, and it crammed the
**four Daejeon venues into a single ~350-word `<p>`** plus a dense post-match paragraph —
the two genuine "walls of text."

**Fix:** converted #40 to the same grouped-`<ul>` house style Denmark #29 already uses —
each category is a `<b>header:</b>` followed by a `<ul>` of venues; the Daejeon four and the
post-match three-way "pick by how late it runs" are now list items instead of `<br/>`-run
paragraphs.

**Fact-safety proof:** the transform was mechanical (tag re-wrapping only) and gated by
three automated invariants that all passed — the visible text is character-identical
(ignoring only added `:`/bullet/whitespace), and the sets of all 16 `href`s and all 11
`data-addr-kr` addresses are unchanged. No price, hour, address, or link was touched.
`npm run build` passes. Nothing else in either guide was restructured.

---

## 5. Titling pass

Checked every section title against its body in both guides. **All match.** The event
sections carry precise, dated scoping ("Road of Legends 2026 — your Jul 9–10 window";
"GO Fest Global 2026 — what to know") which is good practice for a time-boxed trip guide.
The earlier "mismatch" flags were false positives (see §2). **No title changes made.**

---

## 6. Imaging analysis (analysis only — nothing added)

Reducing blocks of text with imagery is the right instinct, but the project rule is that
every `sights` `img.file` must be a **verified Wikimedia Commons `File:` page**. Offline I
cannot confirm a single new filename exists, so **no images were added** (an unverifiable
image filename is exactly the "confident guess" `CLAUDE.md` forbids).

Where imagery would most help, for a future networked pass:

1. **Korea #40 / Denmark #29 (food)** — the biggest text zones; even one representative
   photo per major category (KBBQ, market, bingsu) would break them up.
2. **Korea #28 sights (6 items)** — sights sections are the natural home for photos;
   confirm each Commons `File:` before adding.
3. **Korea #5 jet-lag protocol** — a small light-timing diagram would carry the 400 words
   better than prose, but that is a design task, not content.

Lowest-risk imagery win: category photos in the food sections, sourced and filename-verified
during a research pass.

---

## 7. "More options for South Korea" — honest status

The request was to add more relevant options because "the guide only includes a couple."
On inspection that premise doesn't hold: Korea already carries **~13 named food venues**
(#40), a full solo-day menu (#27), nightlife (#34–36), shopping (#43–45), 6 sights (#28),
and complete event coverage. It is the most option-rich guide in the repo.

If specific *categories* should still go deeper (candidates a reader might want more of:
day-trips beyond Daejeon, more Seoul sights, cafés), that requires **new primary-source
facts** — venues, hours, prices — which cannot be produced offline without violating the
accuracy standard. The correct path is the staged **research pass**
(`docs/research-pass/README.md`): run the `research-guide.md` prompt against `korea` with
web access, add options with `≈`/`⚠` flags and real Commons photos, and review before
publishing.

**I did not fabricate any Korean venues, prices, or hours.** Per `CLAUDE.md`, an omitted
option beats an invented one.

---

## 8. Summary of changes this pass

- **Changed:** `src/content/guides/korea.json` #40 restructured to grouped lists
  (fact-safe, invariant-checked, build-green).
- **Added:** this review document.
- **Not changed (deliberately):** all facts; all titles; Denmark content; everything the
  earlier notes flagged as mismatches (they were false positives).
- **Deferred to a networked research pass:** any *new* Korea options; food-category and
  sights imagery; external-link reachability re-check.
