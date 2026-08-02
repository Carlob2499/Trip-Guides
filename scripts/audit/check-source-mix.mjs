// Standard S5 — source-mix measurement (creator-approved 2026-08-02).
//
// The tier ladder guarantees quality PER FACT; nothing measured the mix PER GUIDE. A guide
// could draw 90% of its citations from one domain and pass every gate — monoculture sourcing
// is exactly how an aggregator's systematic error becomes a guide's systematic error. And the
// research doctrine calls native-language sources a tactic ("the local-language official page
// is often the true T0") without ever measuring whether a guide consulted any.
//
// Three measurements per guide, from the same raw text the link sweep scans:
//   · distinct registrable domains cited
//   · the top domain's share of all citation occurrences
//   · destination-language presence: any cited domain on the destination's ccTLD
//     (countries.mjs iso2 — a heuristic, stated as one; official sites on .com exist)
//
// POSTURE (repo doctrine, vitest.config.ts: "real regression gates, not aspirational targets
// that break the build on day one"): the row is ADVISORY in verify — reported every run,
// blocking only past MAX_SHARE_BLOCK, a ceiling set ABOVE the current worst guide so it is a
// ratchet against regression, not a retro-fail. Measured 2026-08-02 across all four guides:
// denmark 31 domains / top 12% · japan 28 / 9% · korea 66 / 17% · us 7 / 25% (a domestic
// trip leaning on .gov — legitimately concentrated). Worst real share is 25%, so the block
// threshold at 60% catches only a genuine monoculture, never a healthy guide leaning on its
// destination's canon.

import { extractLinks, flatten } from "./lib.mjs";
import { isMain, readGuides } from "./lib.mjs";
import { COUNTRIES } from "../../src/data/countries.mjs";

export const MAX_SHARE_BLOCK = 0.6;

/** Registrable-ish domain: last two labels, three for known two-label public suffixes.
    Not a full PSL — this feeds a report, and co.jp/co.kr/com.au cover this repo's reality. */
export function domainOf(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const parts = host.split(".");
    if (parts.length <= 2) return host;
    const twoLabelSuffix = /^(co|com|or|go|ne|ac|gr)\.(jp|kr|uk|au|nz|th|id)$/;
    return twoLabelSuffix.test(parts.slice(-2).join(".")) ? parts.slice(-3).join(".") : parts.slice(-2).join(".");
  } catch {
    return null;
  }
}

/** Pure: the mix report for one guide's raw text. */
export function sourceMix(raw, country) {
  const counts = new Map();
  for (const url of extractLinks(raw)) {
    const d = domainOf(url);
    if (d) counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked[0] ?? null;
  const iso2 = COUNTRIES[country]?.iso2?.toLowerCase() ?? null;
  const ccTld = iso2 ? `.${iso2}` : null;
  // The US ccTLD (.us) is essentially unused by real US institutions — .gov/.com carry them —
  // so the native-language heuristic is only meaningful for destinations whose web actually
  // lives on the ccTLD. Report "n/a" rather than a fake miss.
  const ccMeaningful = ccTld && iso2 !== "us";
  const hasCc = ccMeaningful ? ranked.some(([d]) => d.endsWith(ccTld)) : null;
  return {
    domains: ranked.length,
    citations: total,
    top: top ? { domain: top[0], share: total ? top[1] / total : 0 } : null,
    ccTld: ccMeaningful ? ccTld : null,
    hasDestinationTld: hasCc,
    status: top && top[1] / total > MAX_SHARE_BLOCK ? "fail" : "pass",
  };
}

if (isMain(import.meta.url)) {
  const guides = await readGuides();
  for (const { slug, raw, guide } of guides) {
    const m = sourceMix(raw, guide.country);
    const cc = m.ccTld ? (m.hasDestinationTld ? `has ${m.ccTld} sources` : `NO ${m.ccTld} source cited`) : "ccTLD n/a";
    console.log(`[sources] ${slug}: ${m.status} — ${m.domains} domains / ${m.citations} citations · top ${m.top?.domain} ${(100 * (m.top?.share ?? 0)).toFixed(0)}% · ${cc}`);
  }
}
