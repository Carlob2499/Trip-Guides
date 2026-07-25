/* Accessibility gate — axe-core over the hub + both guides, light AND dark, with every tab panel
   forced open (not just the default-visible one). GATE: zero serious/critical/moderate VIOLATIONS,
   plus a closed allowlist for `results.incomplete` — axe's "couldn't prove it" bucket, which is
   unproven, not passing. An unallowlisted incomplete node fails the gate; that is exactly how two
   real contrast bugs (broken-photo fallback captions) hid here undetected before this file existed. */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const FIXED_TIME = new Date("2026-09-01T10:00:00+09:00");

async function prep(page: Page, path: string, scheme: "light" | "dark") {
  await page.route("**/*", (route) =>
    route.request().url().startsWith("http://localhost:4322") ? route.continue() : route.abort(),
  );
  // REDUCED MOTION IS LOAD-BEARING, not a nicety. reveal.js marks content .reveal-pending
  // (opacity:0) and only un-hides it via a 4s setTimeout safety rail — and the fixed clock below
  // means that timer NEVER fires. Without this line the whole page sits at opacity 0 while axe
  // scans, axe skips invisible elements, and the gate reports zero violations on a page it never
  // actually saw. It passed that way for months. Reduced motion short-circuits the reveal in both
  // reveal.js (`if (reducedMotion()) return`) and overview.css (`.reveal-pending{opacity:1}`), so
  // the content is up immediately and the audit no longer depends on animation timing at all.
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(path, { waitUntil: "networkidle" });
  // Every tab panel, not just the default-visible one — the gate used to only ever see panel 1 of
  // up to 16, so nothing behind a second tab was ever audited. .guide-tabs additionally clips its
  // own overflow tabs at scroll-left:0; forcing it open converts genuinely-visible-once-scrolled
  // tabs from unverified "incomplete" to an actual scanned pass (verified: 3 of Korea's 4 clipped
  // tool-tabs resolve this way — the 4th still clips against the page's own overflow-x:clip at this
  // viewport width and is accounted for in the incomplete allowlist below, not silently dropped).
  await page.addStyleTag({
    content: `[role=tabpanel]{display:block !important}.guide-tabs{overflow:visible !important}`,
  });
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
    const sample = [...document.querySelectorAll("main a, main h2, main .card, .hubcard")].slice(0, 40);
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
  "positioned in the li's left gutter, not over the flagged inline text) and .overture::after (the " +
  "hub hero's 22vh gradient fade at the very bottom). Verified live: the flagged <b>/checklist/link " +
  "text and .overture's wordmark/eyebrow/etc. do not sit inside either pseudo's actual painted area.";
const bgOverlapWhy = (fixedCaptionBugs: string) =>
  `Two real bugs already found and fixed here this way: ${fixedCaptionBugs}. What remains is (a) ` +
  ".cat-num, a decorative aria-hidden watermark numeral behind a heading — by design, not a gap, " +
  "and (b) sight-card on-photo captions/credit, where axe's OWN stacking-order reimplementation " +
  "(not real elementsFromPoint) disagrees with real paint order under position:absolute siblings + " +
  "isolation-like stacking — a genuine tooling limitation (verified: real rendering puts the caption " +
  "on top; axe's custom grid says otherwise) for the one case that can't be made deterministic: a " +
  "REAL, successfully-loaded photo, whose brightness this repo cannot control or sample at scan time.";
const SHORT_TEXT_CONTENT_WHY =
  "Single-glyph text axe can't confidently rate a font's rendered ink coverage for (the .sun-sep " +
  "itinerary separator, single-digit stat counters). Verified via the same --muted/--ink tokens " +
  "already proven safe on their real surfaces elsewhere in this repo's own token tests.";
const NON_BMP_WHY =
  "Decorative aria-hidden glyphs (arrows, chevrons, the pencil icon) plus two real dismiss buttons " +
  "(.cold-open-x, .nav-hint-x) that are already named via aria-label, so a screen reader is " +
  "unaffected regardless of this rule. Verified live: both real buttons use var(--muted) on " +
  "var(--card)/transparent, the same pair already proven >=4.5:1 on every surface it paints.";
const IMG_NODE_WHY =
  ".hubcard-featured-tag sits over a photo. Computed its own worst case by hand: a 72%-opacity " +
  "near-black pill is dark enough to clear 4.5:1 against a pure-white photo pixel (5.47:1), so it " +
  "passes regardless of what the photo actually shows.";
const ELM_PARTIALLY_OBSCURED_WHY =
  "A guide-tabs tool-tab whose real width exceeds this scan's 1280px viewport even once the tab " +
  "strip's own overflow is forced open above — clipped by the page's own overflow-x:clip (a real, " +
  "load-bearing rule preventing an accidental horizontal scrollbar elsewhere on the page), not by " +
  "anything specific to this element. Verified by scrolling it into view and measuring its real " +
  "computed contrast once visible: 5.90:1, comfortably passing.";
const FRAME_TESTED_WHY =
  "axe-core hardcodes `isViolation:false` for this check (confirmed in the installed package's own " +
  "source) — it can never resolve pass/fail for a cross-origin OpenStreetMap iframe it has no way to " +
  "inject its test script into. Structurally permanent, not a code gap; frame-title-unique (a " +
  "DIFFERENT, genuinely fixable rule) was fixed separately and is not in this allowlist.";

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
    "color-contrast/imgNode": { max: 1, why: IMG_NODE_WHY },
  },
  "korea guide": {
    "color-contrast/bgOverlap": {
      max: 54,
      why: bgOverlapWhy(
        "sight-card captions/credit under a still-loading OR explicitly-failed photo (sights.css's " +
          ".media-ok/.media-fail split) and the masthead's broken-cover-photo fallback (masthead.css)",
      ),
    },
    "color-contrast/pseudoContent": { max: 28, why: PSEUDO_CONTENT_WHY },
    "color-contrast/shortTextContent": { max: 16, why: SHORT_TEXT_CONTENT_WHY },
    "color-contrast/nonBmp": { max: 15, why: NON_BMP_WHY },
    "color-contrast/elmPartiallyObscured": { max: 1, why: ELM_PARTIALLY_OBSCURED_WHY },
    "frame-tested/default": { max: 3, why: FRAME_TESTED_WHY },
  },
  "denmark guide": {
    "color-contrast/bgOverlap": {
      max: 39,
      why: bgOverlapWhy(
        "sight-card captions/credit under a still-loading OR explicitly-failed photo (sights.css's " +
          ".media-ok/.media-fail split) and the masthead's broken-cover-photo fallback (masthead.css)",
      ),
    },
    "color-contrast/pseudoContent": { max: 19, why: PSEUDO_CONTENT_WHY },
    "color-contrast/shortTextContent": { max: 18, why: SHORT_TEXT_CONTENT_WHY },
    "color-contrast/nonBmp": { max: 12, why: NON_BMP_WHY },
    "frame-tested/default": { max: 1, why: FRAME_TESTED_WHY },
  },
};

// Every page shape the site builds: the hub, and BOTH guides. Korea and Denmark
// differ in ways axe can see — Denmark has no learnings block (so no reality
// layer), Korea carries four extra content groups and a habitats/raids grid — so
// covering one guide leaves the other's markup ungated. Both colour schemes: the
// accent-token dark-mode remap has its own failure modes light mode can't surface.
for (const [name, path] of [
  ["hub", "/Trip-Guides/"],
  ["korea guide", "/Trip-Guides/guides/korea/"],
  ["denmark guide", "/Trip-Guides/guides/denmark/"],
] as const) {
  for (const scheme of ["light", "dark"] as const) {
    test(`a11y — ${name} (${scheme})`, async ({ page }) => {
      await prep(page, path, scheme);
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
      const baseline = INCOMPLETE_BASELINE[name] ?? {};
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
        `${name} (${scheme}): incomplete node(s) with no baseline entry — a NEW, undocumented ` +
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
        `${name} (${scheme}): a documented incomplete case grew past its recorded baseline — new ` +
          `nodes are hitting an already-known "couldn't resolve" mechanism, by more than reflow alone ` +
          `can explain (see LAYOUT_JITTER). Re-verify they're really the same mechanism (not a new bug ` +
          `wearing the same messageKey) before raising the max`,
      ).toEqual([]);
    });
  }
}
