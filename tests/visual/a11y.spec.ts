/* Accessibility gate — axe-core over the hub + both guides, light AND dark, with every tab panel
   forced open (not just the default-visible one). GATE: zero serious/critical/moderate VIOLATIONS,
   plus a closed allowlist for `results.incomplete` — axe's "couldn't prove it" bucket, which is
   unproven, not passing. An unallowlisted incomplete node fails the gate; that is exactly how two
   real contrast bugs (broken-photo fallback captions) hid here undetected before this file existed. */
// @protects-file Anyone can read every screen — text stays legible and controls stay usable, in both light and dark.

import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { SANITY } from "../../src/features/live-data/model/rate";
import { FALLBACK_RATES } from "../../src/data/countries.mjs";

const FIXED_TIME = new Date("2026-09-01T10:00:00+09:00");

/* A fluid size is unaudited at every width this gate does not visit — and that is not
   hypothetical. --text-h3 was briefly made fluid and fell under WCAG's 24px large-text line at
   phone widths, silently re-grading three <h2>s (weight 400, so 24px is their boundary, not
   18.7px) from a 3:1 requirement to 4.5:1. Nothing here could see it, because the gate only
   ever looked at 1280px. It looks at both ends now: any size that changes with viewport gets
   audited where it changes. */
const VIEWPORTS = [
  { label: "desktop", width: 1280, height: 800 },
  { label: "mobile", width: 375, height: 812 },
] as const;

/* Structural, not `(typeof VIEWPORTS)[number]`: the nine-device matrix at the foot of this
   file passes its own entries to prep(), and a device is a viewport with a name. */
type Viewport = { readonly label: string; readonly width: number; readonly height: number };

/* Flattened so the test body's nesting (and therefore this file's diff) stays as it was. */
const COMBOS = (["light", "dark"] as const).flatMap((scheme) => VIEWPORTS.map((vp) => ({ scheme, vp })));

/* ⌁ A page that is not there passes every audit ever written. When R5 deleted the standalone
   Tools route, this file's own page list kept pointing at it, and four combos went on scanning
   Astro's 404 page and reporting "trip tools" green. The status code is the cheapest possible
   proof that the thing being audited exists — checked before anything else looks at the DOM. */
async function assertRealPage(res: Awaited<ReturnType<Page["goto"]>>, path: string) {
  expect(res, `${path}: no response at all`).not.toBeNull();
  expect(
    res!.status(),
    `${path} returned ${res!.status()} — this gate is about to audit an error page and pass. ` +
      `Either the route moved (fix the path) or it was deleted (remove the entry).`,
  ).toBeLessThan(400);
}

async function prep(page: Page, path: string, scheme: "light" | "dark", vp: Viewport) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  /* Everything off-origin is aborted — except the rate endpoint, which is SERVED a canned
     response (design-reconciliation §C5). Blanket-aborting it was a real coverage hole at the
     time: rate.js's failure ladder used to end at applyFallback() never unhiding #liveRatePill
     (fixed 2026-08-14 — the pill now shows a clearly-marked seed rate on fallback too), so the
     stats-bar rate pill — a genuine control, field-tools.js gives it role="button"/tabindex="0"
     and a click handler that opens the currency converter — was `hidden` in every run this gate
     ever made. It was measured at 36px by hand. Serving the endpoint here still matters: it
     exercises the LIVE path specifically, same principle as the SOS sheet below — a surface
     that only exists after a condition still has to pass, so the gate has to create the condition.
     Fulfilled rather than seeded into localStorage so it stays currency-agnostic — the reply
     echoes whatever `symbols` the guide asked for, so adding a guide in any currency to
     TARGET_PAGES needs no table here. The date matches FIXED_TIME's own UTC day, which is what
     rate.js compares its cache against.
     The VALUE is derived from the product's own sanity band rather than picked, and that is not
     fussiness — a flat 1389.2 for every currency passed korea (KRW's band is 500-3000) and was
     rejected on the japan guide (since deleted, 2026-08-15), because model/rate.ts's inBand()
     correctly reads 1389 yen to the dollar as bad data. The reasoning outlives that guide: any
     future non-KRW guide re-creates the same trap.
     The canned rate has to be plausible for the currency actually asked for, so it
     comes from SANITY's midpoint where a hand-tuned band exists and from the guide's own seed
     rate otherwise (a seed is in its own derived band by construction). */
  const RATE_DAY = FIXED_TIME.toISOString().slice(0, 10);
  const plausibleRate = (code: string) => {
    const band = SANITY[code];
    if (band) return (band[0] + band[1]) / 2;
    const seed = (FALLBACK_RATES as Record<string, number>)[code];
    return typeof seed === "number" && seed > 0 ? seed : 1;
  };
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("http://localhost:4322")) return route.continue();
    if (url.startsWith("https://api.frankfurter.dev/")) {
      const code = new URL(url).searchParams.get("symbols") ?? "";
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ amount: 1, base: "USD", date: RATE_DAY, rates: { [code]: plausibleRate(code) } }),
      });
    }
    return route.abort();
  });
  // REDUCED MOTION IS LOAD-BEARING, not a nicety. reveal.js marks content .reveal-pending
  // (opacity:0) and only un-hides it via a 4s setTimeout safety rail — and the fixed clock below
  // means that timer NEVER fires. Without this line the whole page sits at opacity 0 while axe
  // scans, axe skips invisible elements, and the gate reports zero violations on a page it never
  // actually saw. It passed that way for months. Reduced motion short-circuits the reveal in both
  // reveal.js (`if (reducedMotion()) return`) and overview.css (`.reveal-pending{opacity:1}`), so
  // the content is up immediately and the audit no longer depends on animation timing at all.
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
  await page.clock.setFixedTime(FIXED_TIME);
  const res = await page.goto(path, { waitUntil: "networkidle" });
  await assertRealPage(res, path);
  // Every tab panel, not just the default-visible one — the gate used to only ever see panel 1 of
  // up to 16, so nothing behind a second tab was ever audited. .guide-tabs additionally clips its
  // own overflow tabs at scroll-left:0; forcing it open converts genuinely-visible-once-scrolled
  // tabs from unverified "incomplete" to an actual scanned pass (verified: 3 of Korea's 4 clipped
  // tool-tabs resolve this way — the 4th still clips against the page's own overflow-x:clip at this
  // viewport width and is accounted for in the incomplete allowlist below, not silently dropped).
  await page.addStyleTag({
    content: `[role=region]{display:block !important}.guide-tabs{overflow:visible !important}`,
  });

  /* Open the SOS sheet if this page has one (Stage F, 2026-08-09). It is `hidden` until
     tapped and axe does not scan hidden nodes, so the most important number in the product
     had never been audited once — and was sitting at 2.16:1 in dark mode, under even the
     3:1 large-text floor, behind a hardcoded #b3261e. A surface that only exists after a
     gesture still has to pass; the gate has to make the gesture. */
  const sos = page.locator(".topbar-sos, .sos-btn");
  if (await sos.count()) {
    await sos.first().click();
    await expect(page.locator(".sos-sheet")).toBeVisible();
  }

  await page.waitForTimeout(400);
}

/* Guard the guard. An audit of an invisible page is worse than no audit — it reports success. This
   asserts the content axe is about to scan is actually rendered, so if anything ever hides it from
   the harness again, THIS fails loudly instead of the gate quietly going green. */
async function assertContentVisible(page: Page, name: string) {
  const seen = await page.evaluate(() => {
    const cumulativeOpacity = (el: Element | null) => {
      let o = 1;
      for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
        o *= parseFloat(getComputedStyle(n).opacity || "1");
      }
      return o;
    };
    // Sample real content, not chrome: headings, cards and links are what the audit is FOR.
    // R4: h1 + .itk-ask + .itk-card joined the sample for the /new intake page, whose main
    // carries a flow of screens rather than cards/links — same vacuous-pass guard, new shape.
    // Stage C flip: `.hubcard` (the retired hub's grid card) gave way to `.atlas-sheet`,
    // the Atlas hub's server-rendered sheet row — same job for this guard, new markup.
    const sample = [...document.querySelectorAll("main a, main h2, main h1, main .card, main .itk-ask, main .itk-card, .atlas-sheet")].slice(0, 40);
    return {
      sampled: sample.length,
      invisible: sample.filter((el) => cumulativeOpacity(el) === 0).length,
      stillPending: document.querySelectorAll(".reveal-pending").length,
    };
  });
  expect(seen.sampled, `${name}: found no content to audit`).toBeGreaterThan(0);
  expect(
    seen.invisible,
    `${name}: ${seen.invisible}/${seen.sampled} sampled elements are at opacity 0 ` +
      `(${seen.stillPending} still .reveal-pending) — axe would skip them and pass vacuously`,
  ).toBe(0);
}

type Baseline = { max: number; why: string };

// Keyed by "<rule id>/<messageKey>" (messageKey is color-contrast's own sub-reason for why it
// couldn't resolve pass/fail; other rules that lack one use "default"). Each entry is a MAX, not a
// fixed count — the number may only SHRINK as more real fixes land; if it ever needs to grow, that
// growth must be reviewed and re-justified here, not silently absorbed — with exactly one
// documented exception, LAYOUT_JITTER below. Every entry below was verified against the real
// rendered page, not assumed from the selector name or node count alone.
const PSEUDO_CONTENT_WHY =
  "Real, sizeable ancestor pseudo-elements axe's ancestor+size heuristic flags conservatively " +
  "without testing real geometric overlap: ol.steps li::before (a real ~23px numbered-step badge, " +
  "positioned in the li's left gutter, not over the flagged inline text) and — desktop only, " +
  "since R3's horizon — " +
  ".gtab:not(.gtab-tool)::after, the 11px journey-line station dot centred in each tab's bottom " +
  "padding band (bottom:9px), below the label's text box. Verified live: the flagged " +
  "<b>/checklist/link text and the tab labels do not sit inside any of " +
  "these pseudos' actual painted areas.";
const bgOverlapWhy = (fixedCaptionBugs: string) =>
  `Two real bugs already found and fixed here this way: ${fixedCaptionBugs}. What remains is (a) ` +
  ".cat-num, a decorative aria-hidden watermark numeral behind a heading — by design, not a gap, " +
  "and (b) sight-card on-photo captions/credit, where axe's OWN stacking-order reimplementation " +
  "(not real elementsFromPoint) disagrees with real paint order under position:absolute siblings + " +
  "isolation-like stacking — a genuine tooling limitation (verified: real rendering puts the caption " +
  "on top; axe's custom grid says otherwise) for the one case that can't be made deterministic: a " +
  "REAL, successfully-loaded photo, whose brightness this repo cannot control or sample at scan time. " +
  "And, on guide pages only, (c) EVERY .gtab tab button, which gained an inline <svg class=gtab-ico> " +
  "sibling to its label — the same axe stacking-order reimplementation as (b), defeated the same way " +
  "but by an in-flow SVG rather than an absolute caption. Counted, not guessed: denmark grew by " +
  "exactly its 8 tabs and korea by exactly its 11, identically on CI and locally, and the tabs' own " +
  "colour rules were untouched by the change that added the icons. Measured the real composited " +
  "contrast rather than trusting that: worst case 4.77:1 (denmark, light, the active tab) against " +
  "the 4.5:1 required at 13.12px/600.";
const SHORT_TEXT_CONTENT_WHY =
  "Single-glyph text axe can't confidently rate a font's rendered ink coverage for (the .sun-sep " +
  "itinerary separator, single-digit stat counters). Verified via the same --muted/--ink tokens " +
  "already proven safe on their real surfaces elsewhere in this repo's own token tests.";
const NON_BMP_WHY =
  "Decorative aria-hidden glyphs (arrows, chevrons — including R5's .day-leg-arrow '→', which " +
  "uses var(--accent-ink), the >=4.5:1-by-construction token, one per day card with a computed " +
  "leg) plus two real dismiss buttons (.cold-open-x, .nav-hint-x) that are already named via " +
  "aria-label, so a screen reader is unaffected regardless of this rule. Verified live: both real " +
  "buttons use var(--muted) on var(--card)/transparent, the same pair already proven >=4.5:1 on " +
  "every surface it paints. The .prov-dot '●' source-info buttons are the same case and now sit " +
  "on SIGHTS items as well as venues (the notation-layer pass), which is what grew this key. " +
  "Their glyph is deliberately var(--muted), not the var(--rule2) the ring uses: painting the ● " +
  "in the hairline token measured 2.24:1 light / 1.96:1 dark, under WCAG 1.4.11's 3:1 for a UI " +
  "component, so the glyph carries the visibility (7.18:1 light / 5.41:1 dark, measured) and the " +
  "ring stays decorative framing.";
const ELM_PARTIALLY_OBSCURED_WHY =
  "A guide-tabs tool-tab whose real width exceeds this scan's 1280px viewport even once the tab " +
  "strip's own overflow is forced open above — clipped by the page's own overflow-x:clip (a real, " +
  "load-bearing rule preventing an accidental horizontal scrollbar elsewhere on the page), not by " +
  "anything specific to this element. Verified by scrolling it into view and measuring its real " +
  "computed contrast once visible: 5.90:1, comfortably passing.";
const JLINE_CLIPPED_WHY =
  "R5's Days journey-line timeline lives in .anch-scroll{overflow-x:auto} at mobile widths (a " +
  "real, load-bearing rule — the figure is wider than a 375px column and must pan, not squash; " +
  "desktop sets overflow:visible and reports zero nodes of this key). Stops at the panned-out " +
  "edge are genuinely part-clipped at scan time, so axe declines to rate them — the same " +
  "clipped-by-a-real-overflow mechanism as the korea tool-tab entry above. The text itself uses " +
  "only the proven tokens: .jl-word var(--ink), .jl-date var(--muted), .jl-now var(--accent-ink) " +
  "— each already >=4.5:1 on this surface everywhere else it paints.";
const DAY_SWIPE_CLIPPED_WHY =
  "The phone swipe-deck (planner.css, .planner-days{overflow-x:auto;scroll-snap-type:x mandatory} " +
  "below 640px — a real, load-bearing rule, the same category as JLINE_CLIPPED_WHY above) leaves " +
  "day-1's card straddling the viewport edge on load: day-0 sits fully in view, day-2+ are fully " +
  "clipped (axe reports neither), and day-1 alone is genuinely PART-clipped. Its .d date label's " +
  "midpoint then falls somewhere axe's internal rect-stack grid cannot index — not a colour " +
  "judgement at all; axe throws 'Element midpoint exceeds the grid bounds' inside its own " +
  "color-contrast#evaluate before it ever samples a pixel, hence messageKey 'default' rather than " +
  "elmPartiallyObscured. Confirmed identical in both themes (rules out a colour cause) and at " +
  "exactly day-1 on all four guides the suite then covered — korea and denmark plus the since-" +
  "deleted japan and us — regardless of content (rules out a content cause) — a scan-time " +
  "geometry artifact of the Panel migration's nesting (Atlas Phase 2 added a .pnl-body-in{overflow:" +
  "hidden} ancestor the deck did not have before), not a rendering bug. The text itself uses " +
  ".d{color:var(--accent-ink)} on .day{background:var(--bg2)} — accent-tokens.ts derives --accent-" +
  "ink to be >=4.5:1 against --bg2 BY CONSTRUCTION (accent-tokens.test.ts), so the real colour pair " +
  "is provably safe independent of what axe could or couldn't measure here. Desktop reports zero " +
  "nodes of this key (no swipe-deck above 640px).";
const MAST_BG_GRADIENT_WHY =
  "The masthead h1 gained a CSS gradient in its background chain when R4 layered the living cover " +
  "(Painted Atlas sky + .pa-shade scrim — byte-identical to the photo scrim — under every hero); " +
  "axe declines to resolve text over any gradient. Measured the real composited contrast instead " +
  "(pixel-sampled the h1's box with its ink hidden; worst pixel vs the text colour): the worst " +
  "case in the whole surface family is the Painted Atlas's LIGHTEST sky, daytime — 4.64:1 " +
  "(denmark, identical in both schemes) against the 3:1 required at 76.8px/620; korea's variants " +
  "measure >=15:1. The scrim pins the h1's zone dark by design on every variant, photo or painted.";
const MAST_DEK_OBSCURING_WHY =
  "The masthead .dek sits above R4's stacked media layers (photo/video/Painted Atlas), and axe's " +
  "elmPartiallyObscuring is its conservative 'an overlapping sibling might change the background' " +
  "case — the same stacking-order reimplementation family as bgOverlap above. Measured the real " +
  "composited worst case the same pixel-sampled way: 5.91:1 (denmark, daytime sky, both schemes) " +
  "against the 4.5:1 required at 17.92px/400; korea measures >=14:1.";
/* ⌁ This entry REPLACES a `color-contrast/bgGradient` baseline of 1, and the swap is the whole
   story — it is the fourth instance of the family this file's header describes, and the first
   where the gate's own ceiling is what surfaced a shipped bug.

   axe 4.13.0 (bumped in c507b91) relabelled these same nodes from `bgOverlap` to `bgGradient`,
   1:1, no node added or removed. bgOverlap's ceiling was 65/47 and absorbed them silently;
   bgGradient's was 1, so they finally showed. Measuring them then found a REAL defect:
   `.sight-media-grad` — the dark scrim that makes near-white text legible over photo pixels —
   was suppressed only under `.media-fail`, so in the DEFAULT still-loading state it painted over
   the LIGHT loading skeleton while the caption below was dark `var(--ink)`. Light mode measured
   1.75:1 on .sight-name--onphoto and 2.47:1 on .tag--onphoto. Not harness-only: .cardimg is
   loading="lazy", and a lazy image that never starts loading never errors either, so a blocked or
   slow network parks a card in that state indefinitely (sights.css records this).

   Fixed at the scrim (`.sight-media:not(.media-ok) .sight-media-grad{display:none}`) — it paints
   only when there is a photo to make legible. With it gone from the chain axe walks one layer
   further and reaches `.cardimg` itself, so the key moves to imgNode: axe declines to rate text
   with an image node behind it. It still cannot resolve; the difference is that the number behind
   it now passes.

   Counts: 3 nodes per photo card (.tag--onphoto, .sight-name--onphoto, .imgcredit--onphoto) ×
   14 korea / 10 denmark cards = 42 / 30, identical on all four scheme × viewport combos.

   Measured 2026-08-16 in the default/loading state both guides render here, animations settled,
   element opacity composited, against the skeleton's own resolved stops — all need 4.5:1:
     .sight-name--onphoto  20.8px/640  12.28:1 light · 12.86:1 dark
     .tag--onphoto         12px/400    11.19:1 light · 12.86:1 dark  (opacity .95 accounted)
     .imgcredit--onphoto   9.6px/400   18.52:1 both  (its own rgba(10,13,16,.68) pill, not the
                                                     skeleton — unaffected by the scrim either way)
   Identical on denmark, which is the tell that this is sights.css and not per-guide content. */
const SIGHT_ONPHOTO_IMGNODE_WHY =
  "The sight photo cards' on-media text (.tag--onphoto / .sight-name--onphoto / .imgcredit--" +
  "onphoto, 3 per card) sits over .sight-media, whose child .cardimg is an image node — axe " +
  "declines to rate text with an image behind it and reports fgColor/bgColor null, ratio 0. It " +
  "is declining to compute, not disagreeing with a value. Measured the real composited contrast " +
  "instead, in the still-loading state these render in here (images aborted), both schemes, " +
  "opacity composited: .sight-name--onphoto 12.28:1 light / 12.86:1 dark at 20.8px/640; " +
  ".tag--onphoto 11.19:1 / 12.86:1 at 12px/400; .imgcredit--onphoto 18.52:1 on its own pill at " +
  "9.6px/400 — all against 4.5:1. The dark scrim that used to break this pair now paints only " +
  "under .media-ok (sights.css), so no state composites dark ink onto it. See the block comment " +
  "above for the bug this baseline replaced.";
const DAY_SCRUB_STICKY_RANGE_WHY =
  "docs/archive/INDEX.md → PLAN_ATLAS_MIGRATION Stage A.1 fixed .day-scrub's position:sticky (planner.css), dead " +
  "before because .pnl-body-in{overflow:hidden} (unconditional) neutralised it — the same " +
  "ancestor DAY_SWIPE_CLIPPED_WHY already documents as changing axe's clipping geometry when " +
  "its overflow value changes. Fixed, .pnl-body-in only stays overflow:hidden while a Panel is " +
  "collapsed/collapsing (see styles.css); the day-scrub bar's sticky containing block now " +
  "legitimately reaches the real scrolling ancestor, exactly as intended. This gate's own " +
  "[role=region]{display:block!important} override (forcing every .catblock tab group open at " +
  "once, so hidden tabs still get audited) puts MULTIPLE .day-scrub bars from DIFFERENT tab " +
  "groups in the same forced-open page simultaneously — something a real visitor can never " +
  "produce, since only one .catblock is ever un-hidden at a time. axe's sticky heuristic then " +
  "conservatively flags distant unrelated content (verified: a GO Fest 2026 panel's .card-lead " +
  "list, a different tab group entirely) as potentially under a sticky bar's reach. Confirmed via " +
  "live geometry (not assumed): in the static unscrolled snapshot the flagged .day-scrub sits at " +
  "y~21461-21522 while the flagged list sits at y~28821+, no real overlap. Measured the real " +
  "composited contrast regardless: .card-lead text rgb(232,236,227) on the Panel's rgb(36,44,52) " +
  "= 11.82:1, the same --ink-on---card pair proven safe everywhere else. Mobile-only because the " +
  "single-column stack makes the forced-open page far taller than desktop's multi-column layout, " +
  "giving the sticky bar's flagged reach more distant content to fall across.";
const AB_CONTOUR_WHY =
  "/about/'s decorative .ab-contours layer in the background chain — the same mechanism already " +
  "documented for the hub and /new. Composite measured by sampling the layer with all other " +
  "content hidden: worst real pixel #2b3130 dark / #dfe4d8 light, weakest text pair --accent-ink " +
  "at 4.81:1 dark and 6.54:1 light. That measurement is what caught the layer being too bright " +
  "in dark mode (3.84:1) and is why about.css halves its opacity.";
const FRAME_TESTED_WHY =
  "axe-core hardcodes `isViolation:false` for this check (confirmed in the installed package's own " +
  "source) — it can never resolve pass/fail for a cross-origin OpenStreetMap iframe it has no way to " +
  "inject its test script into. Structurally permanent, not a code gap; frame-title-unique (a " +
  "DIFFERENT, genuinely fixable rule) was fixed separately and is not in this allowlist.";

const PILL_ROW_CLIPPED_WHY =
  "R5 gave the PHONE a rail. The spine's phone model is a horizontally scrolling pill row " +
  "(guide-rail/styles.css, .grail-track{overflow-x:auto} — a real, load-bearing rule, the same " +
  "category as JLINE_CLIPPED_WHY and DAY_SWIPE_CLIPPED_WHY above), so on a 390px screen only the " +
  "first few stops are in view and the rest sit past the scroller's right edge. axe declines a " +
  "partially-clipped element's contrast because it cannot sample a midpoint that falls outside " +
  "the visible box — a geometry artifact, not a colour judgement. Identified NODE BY NODE on an " +
  "instrumented local run rather than absorbed as jitter: exactly #gtab-4 through #gtab-12's " +
  ".grail-label (Sights, Daejeon & MSI, Gaming & anime, Food & shopping, Pokemon GO, Tokyo, " +
  "Sources, Field log, Tools) — the nine of korea's thirteen stops that do not fit 390px. Stops " +
  "0-3 are fully visible and axe measures them normally. The count is therefore a function of the " +
  "guide's own station count, which is why it is korea (13 stops) that needs the entry. " +
  "The real colour pair is provably safe independent of what axe could measure: an inactive pill " +
  "is .grail-stop{color:var(--ink)} on the rail's .grail{background:var(--bg)}, and the active " +
  "one is var(--on-aink) on var(--accent) — both pinned by src/styles/atlas-tokens.test.ts, the " +
  "first at 15.60:1 in the R5 lifted Day palette. Desktop reports zero nodes of this key: the " +
  "spine lays all thirteen stops out at once, so nothing is clipped.";
/* ⌁ A composite GUIDE_TIMELINE_CLIPPED_WHY used to live here, concatenating the three constants
   above (PILL_ROW_CLIPPED_WHY's phone rail, DAY_SCRUB_STICKY_RANGE_WHY's forced-open multi-panel
   sticky reach, JLINE_CLIPPED_WHY's panned journey-line). It existed only for the japan and us
   guides, whose elmPartiallyObscured/elmPartiallyObscuring counts hit all three at once; both
   guides were deleted (us in 6ca5568, japan in 33beeff on 2026-08-15) and it went with their
   baselines. The finding it recorded is reusable and worth keeping: those three are ONE
   already-proven family, and a guide that trips all three reports a count that is a function of
   its own stop/day count, not a new kind of node. A guide added to the full-scan list below with
   a long journey line will need that composite entry back — rebuild it from the three constants
   rather than baselining its counts as something new. */

/* A color-contrast incomplete COUNT is a function of text reflow, not of correctness. axe flags one
   node per text node whose ancestor carries a sizeable pseudo-element, so re-wrapping the same prose
   across a different number of lines changes the tally without changing a single colour. Measured on
   the Korea guide, same build, only the viewport differing: 28 nodes at 1280px, 30 at 1100px. CI
   counts 29 where this machine counts 28 — same mechanism, different glyph advances under Linux font
   metrics. Pinning these to one machine's exact observed count therefore gates CI on the font stack
   of whoever last ran the suite, which is precisely how `pseudoContent: 29 > max 28` turned the
   Accessibility workflow red on a push containing no accessibility change at all.
   So colour-contrast keys carry a small tolerance, sized one above the largest reflow swing actually
   measured (2). Everything else stays exact — frame-tested counts iframes, which reflow cannot move.
   This does not blunt the gate that matters: `unrecognised` below still fails at ZERO tolerance on
   any node of a kind not already justified here, and that novelty check — not a count creeping by
   one — is the mechanism that surfaces a real bug like the broken-photo caption pair. */
const LAYOUT_JITTER = 3;
const ceilingFor = (key: string, max: number) =>
  key.startsWith("color-contrast/") ? max + LAYOUT_JITTER : max;

const INCOMPLETE_BASELINE: Record<string, Record<string, Baseline>> = {
  hub: {
    "color-contrast/pseudoContent": { max: 8, why: PSEUDO_CONTENT_WHY },
    "color-contrast/bgOverlap": {
      max: 2,
      why: bgOverlapWhy(
        "N/A on this page — hub's 2 are .stat-n counters near the fold at scan time, using " +
          "--accent-ink, the same >=4.5:1-by-construction token",
      ),
    },
    "color-contrast/shortTextContent": { max: 1, why: SHORT_TEXT_CONTENT_WHY },
    // Stage C flip: the mobile FAB's ☰/✕ glyph. Same decorative-glyph mechanism as the
    // guide pages' NON_BMP_WHY entries, and the button carries an aria-label ("Map menu"),
    // so a screen reader is unaffected by this rule either way. Its colours are
    // var(--cta-ink) on var(--cta) — the ONE token pair in this system with a machine-
    // enforced contrast floor: src/styles/atlas-tokens.test.ts asserts >=4.5:1 ink-on-
    // ground in BOTH themes, so this pair cannot silently drift below the bar.
    "color-contrast/nonBmp": { max: 1, why: NON_BMP_WHY },
    // axe: "Skip link target should become visible on activation". It cannot see that
    // activation DOES make it visible, because the mechanism is a JS click handler
    // (index.astro) rather than static markup: the hub's JS default is world mode, which
    // hides .atlas-table-wrap, so the handler switches to table mode before the jump.
    // This was a REAL bug when the flip landed (the link jumped to a display:none element
    // and did nothing) — it is baselined here only because the fix is verified, not because
    // it was waved through. Verified end-to-end against the production preview: focus
    // .skip-link, press Enter -> data-atlas-mode flips world->table, .atlas-table-wrap goes
    // none->block, #atlasTable has real on-screen geometry, location.hash is "#atlasTable".
    // No-JS visitors never hit this at all: table is the markup default (D4).
    "skip-link/default": {
      max: 1,
      why: "Mode switch happens in a JS click handler axe can't see; activation verified to reveal #atlasTable — see block comment.",
    },
    /* Desktop only (pin cards don't render under 620px). Two grounds axe declines to rate
       because an image node is in the background chain, both measured rather than assumed
       (2026-08-08, values via src/lib/contrast.ts's formula):
       (a) HEADER TEXT over the fixed .page-contours SVG ground — the same mechanism already
           documented for /new's .itk-contours. The only stroke is --muted at 16% over the
           page, worst-case pixel #c8cdc2 light / #252a2b dark. Against that worst pixel:
           .atlas-brand-name 10.48 light / 12.14 dark; .atlas-brand-sub and
           .atlas-header-btn--tools (both --muted) 4.67 light / 5.56 dark. All clear 4.5:1
           even if a glyph sat entirely on a 1.1px contour line, which it cannot.
       (b) PIN CARD TEXT, flagged because each card contains a cover photo. The photo is a
           SIBLING above the text, not behind it: the text's own ground is .atlas-pincard's
           solid var(--card). Measured on card: title 16.13 light / 13.56 dark; the --aink
           cc + cta 8.05 light / 5.90 dark. */
    "color-contrast/imgNode": {
      max: 14,
      why: "Header text over the decorative contour ground and pin-card text over its solid --card (photo is a sibling, not the backdrop); every pair measured >=4.67:1 — see block comment above.",
    },
    // R3 (2026-08-05): the imgNode entry (max 1, .hubcard-featured-tag) is gone WITH its
    // element — the featured guide now renders once, as the hero grid cell, so no tag
    // floats over a photo. The zero-tolerance novelty gate below still catches any new one.
  },
  "new intake": {
    // R4: /new sits on the fixed survey-contour ground (.itk-contours, an inline SVG behind
    // z-index:1 content). Axe declines to rate any text with an image node in its background
    // chain (imgNode: wordmark, eyebrow, h1, footer + its link) and its stacking-order
    // reimplementation reads the fixed layer as partially obscuring two paragraphs
    // (elmPartiallyObscuring: .itk-dek, .itk-sub) — the same two documented mechanisms as the
    // hub/guide entries above. Measured the real composite instead (scratch run vs
    // src/lib/contrast.ts, 2026-08-05): the ONLY stroke on this page is the far tint
    // (--muted at 16% over --bg), giving a worst-case pixel of #c8cdc2 light / #252a2b dark;
    // the weakest text/pixel pair is --muted ON a stroke pixel at 4.67:1 (light) and 5.56:1
    // (dark) — every pair clears 4.5:1 even if a glyph sat entirely on a stroke, which a
    // 1.1px contour line cannot make it do.
    "color-contrast/imgNode": {
      max: 5,
      why: "Text over the decorative contour-SVG ground; composite measured, worst pair 4.67:1 — see block comment above.",
    },
    "color-contrast/elmPartiallyObscuring": {
      max: 2,
      why: "The fixed .itk-contours layer sits BEHIND content (z-index 0 vs 1) — real paint order is fine; measured composite as above.",
    },
  },
  "korea guide": {
    "color-contrast/bgOverlap": {
      // 54 -> 65: +11, korea's 11 tab buttons, per (c) in the why. Recorded from CI's own runner,
      // which reported 65 on desktop and 58 on mobile — mobile renders fewer, so desktop is the
      // ceiling, exactly as MOBILE_DELTA's note below describes.
      max: 65,
      why: bgOverlapWhy(
        "sight-card captions/credit under a still-loading OR explicitly-failed photo (sights.css's " +
          ".media-ok/.media-fail split) and the masthead's broken-cover-photo fallback (masthead.css)",
      ),
    },
    // 28 -> 32: R3's station dot puts every one of korea's 11 non-tool tabs into this key at
    // desktop (#gtab-0..10 counted in the observed list) while 7 old prose-reflow nodes left;
    // net +4, identified node-by-node, not absorbed as jitter. Mobile renders 20 (no station
    // pseudo below the horizon breakpoint), so desktop is the ceiling.
    // 32 -> 36: revision #27 (revise-guide smoke) lengthened Sights/itinerary prose and added
    // <b> tokens inside day-checklist text — the observed list is still only the two recorded
    // kinds (#gtab-0..10 station-dot tabs + li > .check > .check-txt > b prose nodes under the
    // checkbox pseudo), verified node-by-node with an instrumented local run; CI's Linux font
    // metrics counted 36 on desktop (both schemes), mobile fewer, so desktop is the ceiling.
// 36 -> 45: +9 net. R5's spine rail clamps each station label to two lines
    // (-webkit-line-clamp, COMPONENTS.md §2), and axe reports a clamped box as pseudo content.
    // Counted node-by-node: 13 .grail-label (korea's own station count) + 5 .gtab-txt +
    // 24 <b> + 2 span[lang="ko"] + 1 #mastCredit = 45; the 13 are new and the four labels the
    // retired tab strip contributed are gone, hence +9 rather than +13. Same mechanism, and the
    // colour is .grail-stop{color:var(--muted)} on var(--bg) — pinned by atlas-tokens.test.ts.
    "color-contrast/pseudoContent": { max: 45, why: PSEUDO_CONTENT_WHY },
    "color-contrast/shortTextContent": { max: 16, why: SHORT_TEXT_CONTENT_WHY },
    // 15 -> 19: R5's .day-leg-arrow '→' on each of korea's 8 day cards, minus 4 glyphs the arc
    // converted to real SVG (Icon.astro). Counted: 19 on desktop AND mobile.
    // 19 -> 28: +9, session #30b's repository-breadth venues each carry a .prov-dot '●'
    // source-info button (Daejeon ×4, Busan/Gangneung ×4, Yookji Hongdae ×1 — identified
    // node-by-node with an instrumented local run, not absorbed as jitter). Same mechanism the
    // why already covers: a real button named via aria-label using var(--muted) on transparent,
    // the pair proven >=4.5:1. CI counted 28 on all four scheme×viewport combos.
    // 28 -> 43: the notation-layer pass put a .prov-dot on SIGHTS items too, not just
    // venues. Counted node-by-node on an instrumented run rather than absorbed: 24
    // prov-dots + 10 .next-cta-arrow + 8 .day-leg-arrow + 1 dismiss ✕ = 43, all four
    // kinds already covered by the why above; no new kind of node appeared.
    // 43 -> 51: +8, R5's fold marks — one .fold-mark '▾' per day card on korea's 8 days
    // (COMPONENTS.md §5). Counted node-by-node on an instrumented run, not absorbed as jitter:
    // the tally is 10 .next-cta-arrow + 8 .day-leg-arrow + 8 .fold-mark + 20 .prov-dot +
    // 4 photo-prov-dot + 1 .cold-open-x = 51, and only the .fold-mark group is new. Same
    // mechanism the why already covers: an aria-hidden decorative glyph in a span that takes
    // colour from var(--aink), a pair proven >=4.5:1 by atlas-tokens.test.ts.
    "color-contrast/nonBmp": { max: 51, why: NON_BMP_WHY },
    "color-contrast/elmPartiallyObscured": { max: 1, why: ELM_PARTIALLY_OBSCURED_WHY },
    // 1 = the masthead h1 / the masthead .dek, counted per page on both schemes (desktop; mobile
    // renders the same masthead so the same max covers it).
    "color-contrast/bgGradient": { max: 1, why: MAST_BG_GRADIENT_WHY },
    "color-contrast/elmPartiallyObscuring": { max: 1, why: MAST_DEK_OBSCURING_WHY },
    // 42 = 3 on-media nodes × korea's 14 photo cards. See SIGHT_ONPHOTO_IMGNODE_WHY and the
    // block comment above it for the scrim bug this replaced.
    "color-contrast/imgNode": { max: 42, why: SIGHT_ONPHOTO_IMGNODE_WHY },
    // Atlas Phase 2 (own-cards-panels): day-1's date label in the phone swipe-deck, mobile only
    // (desktop reports 0). See DAY_SWIPE_CLIPPED_WHY.
    "color-contrast/default": { max: 1, why: DAY_SWIPE_CLIPPED_WHY },
    "frame-tested/default": { max: 3, why: FRAME_TESTED_WHY },
  },
  /* Stage F feature 5 — /about/'s first audit. Every one of these is the decorative
     .ab-contours layer in the background chain: axe declines to rate text with an image node
     behind it (imgNode), reads the absolutely-positioned layer as an overlapping sibling
     (bgOverlap on the wordmark pill, elmPartiallyObscuring on the hero prose), and won't rate
     a single tabular digit's ink coverage (shortTextContent on the stat numerals).

     Measured rather than assumed, and the measurement CHANGED THE CODE: sampling the contour
     layer with everything else hidden showed the overlapping polyline sets compound to a
     worst-case dark pixel of #3b403d, where --accent-ink sat at 3.84:1 and --muted at 4.04:1
     — under 4.5, invisibly. The layer now runs the hub's recipe at half opacity (see
     about.css), worst real pixel #2b3130 dark / #dfe4d8 light, and the weakest pair on the
     page is --accent-ink at 4.81:1 dark, 6.54:1 light. Everything else clears 5.8:1 or better. */
  about: {
    "color-contrast/imgNode": { max: 11, why: AB_CONTOUR_WHY },
    "color-contrast/bgOverlap": { max: 1, why: AB_CONTOUR_WHY },
    "color-contrast/elmPartiallyObscuring": { max: 3, why: AB_CONTOUR_WHY },
    "color-contrast/shortTextContent": { max: 3, why: AB_CONTOUR_WHY },
  },
  "denmark guide": {
    "color-contrast/bgOverlap": {
      // 39 -> 47: +8, denmark's 8 tab buttons, per (c) in the why. CI reported 47 desktop / 43
      // mobile; this machine reported 47 too, which is what rules OUT the "baselines calibrated to
      // a different machine" theory recorded in docs/archive/PLAN_MODERNIZE.md — the two agree exactly.
      max: 47,
      why: bgOverlapWhy(
        "sight-card captions/credit under a still-loading OR explicitly-failed photo (sights.css's " +
          ".media-ok/.media-fail split) and the masthead's broken-cover-photo fallback (masthead.css)",
      ),
    },
    // 19 -> 26: the same R3 station-dot mechanism as korea — denmark's 8 non-tool tabs
    // (#gtab-0..7 counted in the observed list) minus one departed prose node; desktop only.
    // 26 -> 34: Atlas Phase 2 (own-cards-panels) moved Transit's checklist sections onto
    // Panels, whose body column is narrower than the old full-width .catblock — the SAME
    // ol.steps li::before mechanism now wraps the SAME checklist prose across more lines,
    // putting more <b>/<a> tokens near the pseudo. Verified node-by-node: still exactly the
    // 8 #gtab-N station-dot tabs + .steps > li > .check > .check-txt > b/a nodes inside
    // #pnl-body-How-to-get-everywhere-on-this-trip and #pnl-body-Step-by-step-routes-... —
    // no new kind of node, same two mechanisms PSEUDO_CONTENT_WHY already covers. Mobile
    // renders fewer (its own max stands unchanged), so desktop is the ceiling.
    // 34 -> 41: denmark's 10 clamped .grail-label station labels, same mechanism as korea.
    "color-contrast/pseudoContent": { max: 41, why: PSEUDO_CONTENT_WHY },
    "color-contrast/shortTextContent": { max: 18, why: SHORT_TEXT_CONTENT_WHY },
    // 12 -> 10: SHRUNK (the rule these maxes live by) — the arc converted glyphs to real SVG;
    // denmark's 2 day-leg arrows arrive but more left. Counted: 10 desktop.
    // 10 -> 19: +9, session #30b's repository-breadth venues each carry a .prov-dot '●'
    // source-info button (Oslo food/shopping ×8, Tambayan CPH ×1 — identified node-by-node with
    // an instrumented local run). Same aria-label'd var(--muted)-on-transparent mechanism the
    // why documents. CI counted 19 desktop AND mobile.
    // 19 -> 27: same cause as korea's raise above — the notation-layer pass put a
    // .prov-dot on SIGHTS items too. Counted node-by-node: 17 prov-dots +
    // 7 .next-cta-arrow + 2 .day-leg-arrow + 1 dismiss ✕ = 27, every kind already
    // documented in the why; no new kind appeared.
    // 27 -> 37: the same two R5 mechanisms as korea above, at DENMARK's own counts — its fold
    // marks and arrows, not a shared constant. Measured 37; the guide has its own day count.
    "color-contrast/nonBmp": { max: 37, why: NON_BMP_WHY },
    // Same two masthead nodes as korea's entries above — denmark is the measured worst case
    // (Painted Atlas daytime sky: h1 4.64:1 vs 3:1 needed; .dek 5.91:1 vs 4.5:1 needed).
    "color-contrast/bgGradient": { max: 1, why: MAST_BG_GRADIENT_WHY },
    "color-contrast/elmPartiallyObscuring": { max: 1, why: MAST_DEK_OBSCURING_WHY },
    // 30 = the same 3 on-media nodes as korea at DENMARK's 10 photo cards. The measured ratios in
    // SIGHT_ONPHOTO_IMGNODE_WHY are identical on both guides — the tell that this is sights.css,
    // not per-guide content.
    "color-contrast/imgNode": { max: 30, why: SIGHT_ONPHOTO_IMGNODE_WHY },
    // 4 = the timeline stops clipped at the .anch-scroll edge, mobile only (counted: 2 .jl-date +
    // .jl-word/.jl-date of the Tue stop at 375px; desktop renders 0 of this key).
    "color-contrast/elmPartiallyObscured": { max: 4, why: JLINE_CLIPPED_WHY },
    "frame-tested/default": { max: 1, why: FRAME_TESTED_WHY },
    // Atlas Phase 2 (own-cards-panels): day-1's date label in the phone swipe-deck, mobile only
    // (desktop reports 0). See DAY_SWIPE_CLIPPED_WHY.
    "color-contrast/default": { max: 1, why: DAY_SWIPE_CLIPPED_WHY },
  },
  /* ⌁ "japan guide" and "us guide" entries stood here and are REMOVED WITH THEIR GUIDES, not
     relocated (us in 6ca5568, japan in 33beeff on 2026-08-15 — japan is being rebuilt from
     scratch). Their maxes were real, instrumented measurements, but of content that no longer
     exists: a rebuilt japan is different content and would have to be re-measured anyway, so
     keeping the numbers would only invite someone to trust a stale ceiling. What is worth
     carrying forward is that every key they held was an already-proven mechanism from the
     korea/denmark entries above at that guide's own node counts — adding a guide back means
     re-measuring counts, not discovering new kinds of node. Note also what their removal COSTS:
     they were the only pages here exercising a guide whose trip is in the FUTURE relative to
     FIXED_TIME (see TARGET_PAGES near the foot of this file for what that gated). */
};

/* Narrow viewports reflow the same prose across more lines, and a colour-contrast incomplete
   is counted PER TEXT NODE — so mobile legitimately reports more of the identical mechanism.
   These are raises over the desktop numbers above, seeded from measurement rather than guessed,
   and only where mobile genuinely renders more. Where mobile renders FEWER, the desktop max
   stands as a (looser but safe) ceiling rather than being tracked twice. */

const MOBILE_DELTA: Record<string, Record<string, Baseline>> = {
  hub: {
    // R3b (2026-08-05): the page-wide survey ground (.page-contours) put an inline SVG behind
    // the WHOLE page; at 375px the stats beat's labels/counters land on contour rings, so axe
    // declines them via the same two mechanisms documented on the "new intake" entry: imgNode
    // (an image node in the background chain) and elmPartiallyObscuring (its stacking reimpl
    // reads the fixed layer as covering content that z-index:1 actually paints over). Desktop
    // renders the stats clear of the rings — mobile-only, hence a delta. Same measured
    // composite as "new intake": far-tint stroke pixel #c8cdc2/#252a2b, weakest pair
    // (--muted on a stroke pixel) 4.67:1 light / 5.56:1 dark — clears 4.5:1; .stat-n uses
    // --ink/--accent-ink, higher still.
    "color-contrast/imgNode": {
      max: 5,
      why: "Stats-beat text over the decorative contour ground; composite measured 4.67:1 worst — see block comment.",
    },
    "color-contrast/elmPartiallyObscuring": {
      max: 3,
      why: "Fixed .page-contours behind z-index:1 content — real paint order fine; measured as above.",
    },
  },
  "korea guide": {
    // Measured 9 at 390px against 0 at 1280px — every stop past the pill row's right edge.
    // Nine is korea's own overflow at this width (13 stops), not a shared constant; a guide with
    // fewer stops clips fewer. Node-by-node identification is in PILL_ROW_CLIPPED_WHY.
    "color-contrast/elmPartiallyObscured": { max: 9, why: PILL_ROW_CLIPPED_WHY },
  },
  "denmark guide": {
    // Measured 24 at 375px against 19 at 1280px — the same ol.steps li::before mechanism
    // already justified above, simply spread over more wrapped lines in a narrow column.
    // Korea needs no entry: its desktop max of 28 already covers what mobile renders.
    "color-contrast/pseudoContent": { max: 24, why: PSEUDO_CONTENT_WHY },
    // Stage A.1's day-scrub sticky fix (see DAY_SCRUB_STICKY_RANGE_WHY) — mobile-only, measured
    // 16 on both colour schemes; desktop's shorter forced-open page stays within the base max: 4.
    "color-contrast/elmPartiallyObscured": { max: 16, why: DAY_SCRUB_STICKY_RANGE_WHY },
  },
  /* ⌁ The "japan guide" / "us guide" deltas that stood here went with their INCOMPLETE_BASELINE
     entries above when the guides were deleted. The pattern they established still holds and is
     why korea and denmark carry deltas at all: the timeline/rail clipping keys grow sharply from
     desktop to mobile (japan measured 27 -> 57) because a single-column layout renders more of
     the same mechanism, so a guide-page delta is expected, not a smell. */
};

/* iOS Safari zooms the page in when a text-entry control under 16px takes focus, and does not
   zoom back out. src/styles/type-scale.test.ts guards this too, but only by reading selectors
   out of the stylesheet — so it can only see controls it has been told about, and a new class
   name escapes silently. This one asks the rendered DOM instead, which knows what an <input>
   actually is. Runs at mobile, where the bug is felt. */
for (const [name, path] of [
  ["hub", "/Trip-Guides/"],
  ["korea guide", "/Trip-Guides/guides/korea/"],
  ["new intake", "/Trip-Guides/new/"], // R4: THE form page — the zoom-trap test's whole reason
] as const) {
  test(`form controls are >=16px so iOS never zoom-traps — ${name}`, async ({ page }) => {
    await prep(page, path, "light", VIEWPORTS[1]);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("input, select, textarea")]
        .filter((el) => {
          const t = (el as HTMLInputElement).type;
          /* Only TEXT-ENTRY controls. The zoom trap is triggered by focusing something you
             type into; a checkbox, slider or file picker opens a native control instead and
             never zooms, so including them would report noise that cannot be "fixed". */
          return !["hidden", "checkbox", "radio", "range", "color", "submit", "button", "file", "image", "reset"].includes(t);
        })
        .map((el) => ({ sel: el.className || el.tagName, px: parseFloat(getComputedStyle(el).fontSize) }))
        .filter((r) => r.px < 16)
        .map((r) => `${r.sel} = ${r.px}px`),
    );
    expect(
      small,
      `${name}: a text-entry control renders under 16px. iOS Safari will zoom the page in on ` +
        `focus and will not zoom back out, stranding the reader on a magnified page after one ` +
        `tap. Give it var(--text-body). Non-text controls (checkbox, radio, range…) are excluded ` +
        `because the zoom behaviour does not apply to them`,
    ).toEqual([]);
  });
}

// Every page shape the site builds: the hub, and EVERY guide the repo ships. Korea and
// Denmark differ in ways axe can see — Denmark has no learnings block (so no reality
// layer), Korea carries four extra content groups and a habitats/raids grid — so
// covering one guide leaves the other's markup ungated. The standing rule is EVERY guide,
// not a representative sample, and it was earned: design-reconciliation §C5 found the list
// had silently only ever covered two of the four guides then shipping, and extending it to
// Japan and US immediately surfaced a real, previously-shipping landmark-unique bug on
// Japan's Etiquette & language tab (Panel.astro's implicit role="region" colliding with its
// own tab-group ancestor) — fixed at the shared component, see Panel.astro. Those two guides
// have since been deleted (us in 6ca5568, japan in 33beeff on 2026-08-15) and their entries
// went with them, so the list is two guides again by content, not by policy: ADD A GUIDE
// HERE THE DAY IT SHIPS. Both colour schemes: the accent-token dark-mode remap has its own
// failure modes light mode can't surface.
for (const [name, path] of [
  ["hub", "/Trip-Guides/"],
  ["korea guide", "/Trip-Guides/guides/korea/"],
  ["denmark guide", "/Trip-Guides/guides/denmark/"],
  ["new intake", "/Trip-Guides/new/"], // R4: the composed intake — gated from birth
  /* ⌁ `["trip tools", "/Trip-Guides/tools/korea/"]` was here and is REMOVED, not relocated.
     R5 deleted that route and this entry kept pointing at it — so for four combos the gate
     was scanning Astro's own 404 page, finding nothing, and reporting a pass under the name
     "trip tools". The tools are audited as part of the korea guide now: prep() forces every
     [role=region] open, and the Tools station is one. See assertRealPage below for the guard
     that stops a dead URL passing quietly again. */
  // Stage F feature 5. Two whole pages this gate had simply never visited — /about/ is the
  // page the product explains itself on, /health/ is the one that tells the maker what is
  // and isn't working, and neither had been audited once.
  ["about", "/Trip-Guides/about/"],
  ["health", "/Trip-Guides/health/"],
] as const) {
  for (const { scheme, vp } of COMBOS) {
    test(`every page passes an automated accessibility scan — ${name} (${scheme}, ${vp.label})`, async ({ page }) => {
      await prep(page, path, scheme, vp);
      await assertContentVisible(page, name);
      const results = await new AxeBuilder({ page }).analyze();

      // Gate on moderate+ (was serious/critical). The landmark + full tablist ARIA work cleared
      // every moderate finding, so this locks that in: only true `minor` stays non-blocking.
      const BLOCKING = new Set(["moderate", "serious", "critical"]);
      const bad = results.violations.filter((v) => BLOCKING.has(v.impact ?? ""));
      const minor = results.violations.filter((v) => !BLOCKING.has(v.impact ?? ""));
      if (minor.length) {
        console.log(`[a11y] ${name} (${scheme}): ${minor.length} minor finding(s) (non-blocking):`);
        for (const v of minor) console.log(`  · ${v.id} (${v.impact}) — ${v.nodes.length} node(s): ${v.help}`);
      }
      expect(
        bad.map((v) => `${v.id} (${v.impact}) — ${v.help}\n  ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join("\n  ")}`),
        "moderate+ accessibility violations",
      ).toEqual([]);

      // Incomplete: every node's (rule, messageKey) must be in the baseline for THIS page, and the
      // observed count must not EXCEED the recorded max. Anything else fails loudly — an
      // unrecognised incomplete node is exactly how two real contrast bugs hid here before.
      const baseline = {
        ...(INCOMPLETE_BASELINE[name] ?? {}),
        ...(vp.label === "mobile" ? (MOBILE_DELTA[name] ?? {}) : {}),
      };
      const counts: Record<string, number> = {};
      const unrecognised: string[] = [];
      for (const v of results.incomplete) {
        for (const n of v.nodes) {
          const messageKey = (n.any?.[0]?.data as { messageKey?: string } | undefined)?.messageKey ?? "default";
          const key = `${v.id}/${messageKey}`;
          counts[key] = (counts[key] ?? 0) + 1;
          if (!baseline[key]) unrecognised.push(`${key} — ${n.target.join(" ")}`);
        }
      }
      expect(
        unrecognised,
        `${name} (${scheme}, ${vp.label}):incomplete node(s) with no baseline entry — a NEW, undocumented ` +
          `"couldn't resolve" case appeared. Either it's a real bug (fix it) or genuinely fine ` +
          `(add a verified INCOMPLETE_BASELINE entry explaining why, per the pattern in this file)`,
      ).toEqual([]);
      const grown = Object.entries(counts)
        .filter(([key, count]) => count > ceilingFor(key, baseline[key]?.max ?? 0))
        .map(
          ([key, count]) =>
            `${key}: ${count} > ${ceilingFor(key, baseline[key]?.max ?? 0)} ` +
            `(baseline max ${baseline[key]?.max}${key.startsWith("color-contrast/") ? ` + ${LAYOUT_JITTER} jitter` : ""})`,
        );
      expect(
        grown,
        `${name} (${scheme}, ${vp.label}):a documented incomplete case grew past its recorded baseline — new ` +
          `nodes are hitting an already-known "couldn't resolve" mechanism, by more than reflow alone ` +
          `can explain (see LAYOUT_JITTER). Re-verify they're really the same mechanism (not a new bug ` +
          `wearing the same messageKey) before raising the max`,
      ).toEqual([]);
    });
  }
}

/* ---- ACCENT-INK CARRIER RESOLUTION (issue #38) ------------------------------------
   A custom property substitutes its var()s on the element that DECLARES it, so :root's
   `--accent-ink:var(--accent-ink-light)` resolves once against :root's own candidates
   and descendants inherit that RESOLVED value. Every hub card therefore carried its
   per-guide ink candidates inline and painted the house ink — same rendered colour on
   every card, which axe cannot flag because the house ink passes contrast too. The
   carrier rules in base.css re-declare --accent-ink on any element with inline
   candidates; this asserts, per carrier and in both themes, that the resolved ink IS
   that element's own candidate. Sameness across cards was the symptom; per-element
   equality is the contract. The source-side partner (accent text may only come from
   --accent-ink/--aink) lives in scripts/__tests__/accent-ink-contract.test.mjs. */
/* The hub USED to be the descendant-carrier case (one inline candidate pair per guide card).
   The Atlas migration's Stage C flip retired those cards along with the rest of the old hub:
   Atlas paints one house accent (oxide) rather than per-guide card tints — D3 explicitly
   retires the V3 per-guide tint — so the hub now emits zero inline candidates and there is
   nothing on it for this gate to assert. Verified against built output, not assumed. The
   guide page below still exercises the contract, and the source-side partner
   (scripts/__tests__/accent-ink-contract.test.mjs) is unchanged. If a future surface
   reintroduces per-element accent candidates, add it here — the `many` branch below still
   carries the multi-carrier assertions for exactly that case. */
for (const [who, pagePath, many] of [
  /* The guide page's carrier shape: <html> itself holds the inline candidates, where the
     :root-level swap (not the descendant partner) must resolve. `many` marks a page with
     SEVERAL carriers, which additionally must resolve to DIFFERENT inks; a single-carrier
     page can't say anything about per-element difference. */
  ["guide page", "/Trip-Guides/guides/denmark/", false],
] as const)
for (const scheme of ["light", "dark"] as const) {
  test(`each guide uses its own readable accent colour, not another guide's — ${who} (${scheme})`, async ({ page }) => {
    await prep(page, pagePath, scheme, VIEWPORTS[0]);
    const carriers = await page.evaluate((dark) => {
      return Array.from(document.querySelectorAll('[style*="--accent-ink-light"]')).map((el) => {
        const cs = getComputedStyle(el);
        return {
          who: (el.className && String(el.className).split(" ")[0]) || el.tagName,
          candidate: cs.getPropertyValue(dark ? "--accent-ink-dark" : "--accent-ink-light").trim(),
          resolved: cs.getPropertyValue("--accent-ink").trim(),
        };
      });
    }, scheme === "dark");
    expect(carriers.length, `${who} stopped emitting inline accent candidates — update this gate`).toBeGreaterThanOrEqual(many ? 2 : 1);
    for (const c of carriers) {
      expect(c.resolved, `${c.who} (${scheme}): inherited an ink instead of resolving its own candidate`).toBe(c.candidate);
    }
    /* The original symptom, asserted directly: per-guide inks must actually differ.
       Only meaningful where a page has several carriers. */
    if (many) expect(new Set(carriers.map((c) => c.resolved)).size).toBeGreaterThan(1);
  });
}

/* The What's-Next banner, on every guide, in both themes.

   It is `hidden` in the markup and only unhidden by guide-ui.js inside the trip's own date
   range, so the whole-page gate has never scanned it once — the same blind spot as the SOS
   sheet and the share panel, but on a surface that appears exactly when the traveller is
   actually travelling. It was shipping at 1.09:1 (light) and 1.53:1 (dark): the text was
   there, in near-white on near-white, and nobody could have seen it to report it.

   Scanned per guide because --accent and --accent-ink are extracted PER GUIDE, and the bug it
   replaces was one that only denmark's lighter accent exposed — so this list is EVERY guide the
   repo ships, not a sample. (japan was here until its guide was deleted, 2026-08-15; add the
   next guide the day it ships.) */
for (const guide of ["denmark", "korea"] as const) {
  for (const scheme of ["light", "dark"] as const) {
    test(`what's-next banner is legible — ${guide} (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.goto(`/Trip-Guides/guides/${guide}/`, { waitUntil: "networkidle" });

      const pairs = await page.evaluate(() => {
        const banner = document.getElementById("whatsNext");
        if (!banner) return null;
        banner.removeAttribute("hidden");
        const text = document.getElementById("wnText")!;
        text.textContent = "Gyeongbokgung Palace, 14:00";
        const srgb = (v: string) => {
          const n = (v.match(/[\d.]+/g) || []).map(Number);
          // getComputedStyle may answer in rgb(0-255) or color(srgb 0-1) once color-mix is involved.
          return v.startsWith("color(") ? n.slice(0, 3) : n.slice(0, 3).map((c) => c / 255);
        };
        const lum = (v: string) =>
          srgb(v).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
            .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
        const ground = lum(getComputedStyle(banner).backgroundColor);
        const ratio = (el: Element) => {
          const l = lum(getComputedStyle(el).color);
          return (Math.max(l, ground) + 0.05) / (Math.min(l, ground) + 0.05);
        };
        return { text: ratio(text), label: ratio(banner.querySelector(".wn-label")!) };
      });

      expect(pairs, "no #whatsNext banner in this guide's markup").not.toBeNull();
      expect(pairs!.text, "wn-text on the banner ground").toBeGreaterThanOrEqual(4.5);
      expect(pairs!.label, "wn-label on the banner ground").toBeGreaterThanOrEqual(4.5);
    });
  }
}

/* ── ACCEPTANCE §6.1–6.4 — the keyboard, and the thumb ────────────────────────────────────────
   axe cannot see any of what follows. Every control in a closed sheet is perfectly accessible
   in axe's terms: labelled, contrasted, in the tree. The defect is that it is somewhere nobody
   can look, and only counting tab stops finds that. Same for target size, which axe reports
   only for a handful of rule sets and never across a device matrix. */

/* prep() deliberately OPENS the SOS sheet so axe can audit it — the whole reason that gesture
   is in prep at all. These two tests are about the CLOSED state, so they undo it first, the way
   a reader does. Closing it here is not setup noise: it is the only place in the suite that
   proves the SOS sheet actually returns to a clean closed state after being opened. */
async function closeAnyOpenSheet(page: Page) {
  const sos = page.locator(".sos-sheet");
  if (await sos.count() && await sos.isVisible()) {
    await page.keyboard.press("Escape");
    await expect(sos).toBeHidden();
  }
}

const SHEETS_CLOSED_WHY =
  "the journey sheet slides away on a transform, which cannot remove its ~90 links from the " +
  "tab order — it ships and closes `inert` instead. If this count jumps, a sheet is animating " +
  "out while leaving its controls behind, which is ACCEPTANCE 6.1 and regression pin 9.3.";

test("⌁ with every sheet closed, nothing inside one is focusable", async ({ page }) => {
  await prep(page, "/Trip-Guides/guides/korea/", "light", VIEWPORTS[1]);
  await closeAnyOpenSheet(page);
  const leaked = await page.evaluate(() => {
    const F = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
    // Every dismissable surface on a guide, whichever mechanism it uses to hide.
    return [".sheet", ".sos-sheet", "#shareModal", ".share-modal"].flatMap((sel) => {
      const el = document.querySelector(sel);
      if (!el) return [];
      const cs = getComputedStyle(el);
      const out = cs.display === "none" || cs.visibility === "hidden"
        || el.hasAttribute("hidden") || el.hasAttribute("inert")
        ? 0 : el.querySelectorAll(F).length;
      return out ? [`${sel}: ${out} focusable control(s) in a closed sheet`] : [];
    });
  });
  expect(leaked, SHEETS_CLOSED_WHY).toEqual([]);
});

test("⌁ an open sheet traps focus, Escape closes it, and focus comes back to the opener", async ({ page }) => {
  // ACCEPTANCE 6.2 + 6.3 in one walk, because they are one gesture: a dialog that traps focus
  // and then strands it on close is not better than one that never trapped it.
  await prep(page, "/Trip-Guides/guides/korea/", "light", VIEWPORTS[1]);
  await closeAnyOpenSheet(page);
  const opener = page.locator("#sheetOpen");
  await opener.click();
  const sheet = page.locator(".sheet");
  await expect(sheet).toHaveClass(/\bopen\b/);
  await expect(sheet).not.toHaveAttribute("inert", /.*/);

  // Focus is inside, and tabbing past the last control wraps rather than escaping to the page.
  expect(await page.evaluate(() => document.querySelector(".sheet")!.contains(document.activeElement))).toBe(true);
  for (let i = 0; i < 40; i++) await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => document.querySelector(".sheet")!.contains(document.activeElement)),
    "40 tabs escaped the open sheet — the trap is not holding",
  ).toBe(true);

  await page.keyboard.press("Escape");
  await expect(sheet).not.toHaveClass(/\bopen\b/);
  await expect(sheet).toHaveAttribute("inert", "");
  await expect(opener).toBeFocused();
});

/* A fragment-only jump is not enough for keyboard and assistive-technology users: after using
   the first focusable Skip link, focus must land on the actual reading region. The production
   field pass reproduced the failure on Denmark when #content was a non-focusable <main> — URL
   changed, but the reader's keyboard position did not. */
test("⌁ Skip to content moves keyboard focus to the guide reading region", async ({ page }) => {
  await page.setViewportSize({ width: VIEWPORTS[1].width, height: VIEWPORTS[1].height });
  const res = await page.goto("/Trip-Guides/guides/denmark/", { waitUntil: "domcontentloaded" });
  await assertRealPage(res, "denmark guide Skip-link focus");
  const skip = page.locator(".skip-link");
  await skip.focus();
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#content$/);
  await expect(page.locator("#content")).toBeFocused();
});

/* The nine devices SCREENS.md names, not a phone and a desktop. A 44px floor holds trivially at
   1280px and is exactly where it fails at 375 — and the Fold's 673px portrait is the width no
   breakpoint in this product is written for, which is why it is in the list. */
const DEVICES = [
  { label: "iPhone SE", width: 375, height: 667 },
  { label: "iPhone 15/16", width: 390, height: 844 },
  { label: "iPhone 17 Pro", width: 402, height: 874 },
  { label: "iPhone Pro Max", width: 440, height: 956 },
  { label: "Pixel", width: 412, height: 915 },
  { label: "Fold unfolded", width: 673, height: 841 },
  { label: "iPad mini", width: 744, height: 1133 },
  { label: 'iPad Pro 11"', width: 834, height: 1194 },
  { label: 'iPad Pro 13"', width: 1024, height: 1366 },
  /* A desktop width in a TOUCH-target list looks wrong until you notice what the nine above
     cannot reach: 1024px is this list's ceiling, and the reading spine does not exist below
     1100px, so `.spine-tick` — a real, keyboard-focusable <button>, one per section group on
     every guide — had never been measured by anything (design-reconciliation §C5). Any
     control gated behind a desktop breakpoint was structurally invisible here. This entry is
     the ≥1100px window, not a tenth device; SCREENS.md still names the nine. */
  { label: "Desktop 1280", width: 1280, height: 800 },
] as const;

/* A ceiling, not a permission. Every entry is a real control under the 44px line whose raise is a
   design decision rather than a fix, and every one carries the measurement that made it a
   decision. The counts may only fall.
   `.transit-link` RESOLVED (design-reconciliation §C2b, CONTEXT.md §H1 "raise" ruling): its own
   width already cleared 44px everywhere measured (min 88.2px); only height was short, so a
   padding-block increase alone reached the floor with no width growth and no row-wrap change.
   Measured 0 violations, both target pages, all nine devices — exception removed, not shrunk to
   zero, so a future regression here is a real failure again.
   Two more RAISED the same way in §C5 rather than landing here, both height-only: `.jl-toggle`
   (34.9px, already width:100%) and the `.guide-stats` stat tiles carrying `#liveRatePill`
   (86.7x36.0). `.spine-tick` is the one §C5 control that could not be raised — see its entry. */
const TARGET_BASELINE: Record<string, { max: number; why: string }> = {
  "dchip": {
    max: 8,
    why: "The day scrubber's inactive chips. COMPONENTS §4 asks for every day of the trip in " +
      "one row with the active day EXPANDED, and .scrub-fit gives the inactive ones flex:1 1 0 " +
      "with min-width:0 to make that fit — so the same spec that defines this control is what " +
      "pushes it under the line. They are 44px TALL and the row is the full width of the page; " +
      "the miss costs a neighbouring day, not a wrong destination. Re-measured after the C2a " +
      "pill->underline shape fix (design-reconciliation §C2a/§H2): the shape change touches " +
      "border/fill/radius only, not the flex-basis math that narrows these, so the width miss " +
      "is unchanged — max shrunk from 12 to the real observed ceiling (8, iPad Pro 11\" korea " +
      "guide) but the violation itself persists. Resolving it means choosing between 'the whole " +
      "trip at a glance' and a 44px floor, which is the creator's call.",
  },
  "anchor-btn": {
    max: 78,
    why: "The copy-link control beside every panel title — one per panel, so it scales with " +
      "the guide. It is deliberately quiet: at 44px it competes with the title it belongs to.",
  },
  "spine-tick": {
    max: 13,
    why: "The desktop reading spine's ticks (field-tools.css:66, spine.js) — one per section " +
      "group, 5x30px inactive / 7x30px active, ≥1100px only. Found by hand in " +
      "design-reconciliation §C5 and baselined on a MEASURED constraint, not an aesthetic one: " +
      "widening the hit area is what the 44px floor would need here (height is nearly there, " +
      "width is 5px), and there is nowhere to put it. At the 1100px activation width the " +
      "content column's left edge measures 17.6px while the rail occupies 14.4-21.4px — the " +
      "gutter is NEGATIVE, the rail already floats over content. A 44px-wide hit area, visible " +
      "or transparent, would therefore sit on top of the page and swallow clicks meant for it. " +
      "Growing it vertically instead fails differently: the ticks pitch at 37.2px (30px + a " +
      "7.2px gap), so 44px hit areas would OVERLAP their neighbours by 6.8px and manufacture " +
      "wrong-destination misclicks — strictly worse than a small target. What holds the line " +
      "meanwhile: this control only exists at ≥1100px, where the input is a pointer and not " +
      "the thumb this floor is written for; every tick is a REDUNDANT shortcut to a .gtab tab " +
      "button that is always present and already clears 44px (spine.js forwards the click to " +
      "it); and it is keyboard-reachable with a focus ring plus a .spine-tip tooltip naming the " +
      "destination. As with .dchip, the miss costs a neighbouring section, not a wrong " +
      "destination. Ceiling is korea's 13 groups — the most of any guide that ships (denmark " +
      "has 10); it may only fall. The two guides that also fed this number are gone (japan 11, " +
      "us 9, deleted 2026-08-15 and in 6ca5568), and neither was the ceiling, so it stands.",
  },
};

/* More than one page. This sweep only ever visited a guide, so the hub — the page every
   visitor lands on first, and the one carrying the most chips and pills per screen — had no
   touch-target coverage at all at any of these widths. Kept as separate tests per page
   rather than one test loading both, so the TARGET_BASELINE ceilings below stay PER PAGE and
   a regression on one page can never be absorbed by headroom on the other. */
const TARGET_PAGES = [
  ["korea guide", "/Trip-Guides/guides/korea/"],
  /* ⌁ A KNOWN, CURRENTLY-OPEN HOLE, stated rather than quietly closed. `["japan guide",
     "/Trip-Guides/guides/japan/"]` sat here from design-reconciliation §C5 and was not a third
     sample of the same thing: it was the only page in this sweep whose trip was in the FUTURE
     relative to FIXED_TIME. guide-ui.js:165-178 hides the jet-lag calculator once a trip has
     ended, and BOTH remaining guides' trips are past it (korea Jul 2026, denmark Jun 2026), so
     with japan deleted (2026-08-15) `.jl-toggle` — a real control that came up short here and
     had to be raised in §C5 — is once again measured by nothing at all. The general hole is the
     same one §C5 named: a guide whose CONTENT differs (an upcoming trip, a different currency, a
     different tab count) renders controls korea simply does not have. One upcoming-trip guide
     in this list closes it again; add the rebuilt japan here when it ships. */
  ["hub", "/Trip-Guides/"],
] as const;

for (const [pageName, path] of TARGET_PAGES) {
for (const d of DEVICES) {
  test(`every visible target clears 44px — ${pageName}, ${d.label}`, async ({ page }) => {
    await prep(page, path, "light", d);
    /* The measurement below silently skips anything rendering at 0x0, which is exactly how
       #liveRatePill hid from this gate for its whole life. Now that prep() serves the rate,
       assert the pill actually came up — otherwise a future change to rate.js's ladder could
       re-hide it and this sweep would go back to reporting green on a control it never saw.
       Guarded on presence: the hub has no pill, and a USD guide deliberately never mounts one. */
    const pill = page.locator("#liveRatePill");
    if (await pill.count()) {
      await expect(
        pill,
        `${pageName}: #liveRatePill never un-hid, so this sweep is about to skip it. That is the ` +
          `blind spot §C5 closed — fix the rate path, do not delete this assertion.`,
      ).toBeVisible();
    }
    const small = await page.evaluate(() => {
      const F = 'a[href],button:not([disabled]),input:not([disabled]),select,[role="button"]';
      return [...document.querySelectorAll(F)]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return false;            // not rendered
          if (getComputedStyle(el).visibility === "hidden") return false;
          /* INLINE LINKS ARE EXCLUDED, deliberately. A `tel:` link inside a sentence is text
             that happens to be tappable; forcing it to 44px would break the line it sits in.
             The rule is about CONTROLS — anything that presents itself as a button, chip, pill
             or tab. Detected by asking whether the element is its own block, which is what
             every control in this system is and no inline link is. */
          const disp = getComputedStyle(el).display;
          if (disp === "inline" || el.closest("p, li, .prose, .body")) return false;

          /* NOTATION IS EXCLUDED TOO, and this is the line worth defending. The provenance
             dot, the ≈/⚠ flag chips, the stale pill and a photo credit are MARKS — DESIGN.md's
             notation family, sized to the type they annotate. A 44px provenance dot beside a
             13px figure is not a better target, it is a blot: it would dominate the fact it is
             meant to footnote, and there are dozens per page. They are reachable by keyboard
             and they sit inside larger rows a thumb can hit. `.bactual` is an <input> the
             16px zoom-trap gate above already covers on its own terms.

             The rule this preserves: a control the reader is meant to AIM at clears 44px. A
             mark the reader is meant to READ is sized to its text. */
          /* `.mast-credit` joined this list in design-reconciliation §C5, and it is the SAME
             entry as `.imgcredit`, not a new licence. CONTEXT.md's 2026-08-11 ruling names "a
             photo credit" in the notation family outright, and masthead.css's own comment
             calls .mast-credit the "same badge-on-photo pattern as sights.css's
             .imgcredit--onphoto" — which renders as `class="imgcredit imgcredit--onphoto"` and
             has therefore been excluded here all along. The masthead copy was never measured
             only because this gate's env aborts off-origin images, which sets .mast-media-fail
             and `display:none`s it; the first run that actually loaded a cover photo found it
             at 143.6x24.2. Padding it to 44px would put a chunky lozenge on the hero AND render
             the same datum at two different sizes on two surfaces — the exact split the
             uniform-surfaces guardrail forbids. It is notation on both. */
          return !el.closest(".prov-dot, .flag-chip, .stale-pill, .imgcredit, .mast-credit") && !el.matches("input");
        })
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { sel: (el.className || el.tagName).toString().trim().slice(0, 44), w: Math.round(r.width), h: Math.round(r.height) };
        })
        .filter((r) => Math.min(r.w, r.h) < 44)
        .map((r) => `${r.sel} = ${r.w}x${r.h}`);
    });
    /* Two classes are UNDER the line and stay there for now, each for a stated reason, and
       each counted so the number can only shrink — the same paydown shape as drift-baseline
       and the comment-density ceiling. Neither is a mute: both are real controls, and both
       are named in the handoff as awaiting a density decision the creator has not made. */
    const unexplained = small.filter((row) => !Object.keys(TARGET_BASELINE).some((k) => row.startsWith(k)));
    expect(
      unexplained,
      `${pageName} — ${d.label} (${d.width}px): a control renders under 44px in its smallest ` +
        `dimension. That is the floor a thumb needs; below it the reader misses and hits the thing ` +
        `beside it. If it is genuinely notation rather than a control, exclude it above with a ` +
        `reason — never widen TARGET_BASELINE to make a new one pass.`,
    ).toEqual([]);
    for (const [cls, entry] of Object.entries(TARGET_BASELINE)) {
      const n = small.filter((row) => row.startsWith(cls)).length;
      expect(
        n,
        `${pageName} — ${d.label}: ${cls} is at ${n}, over its ceiling of ${entry.max}. ${entry.why}`,
      ).toBeLessThanOrEqual(entry.max);
    }
  });
}
}
