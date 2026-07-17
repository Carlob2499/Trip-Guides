// Link-rot checker — every http(s) href cited across guide content, checked once.
// Pure network I/O, no LLM. Run standalone (`node scripts/audit/check-links.mjs`)
// or via run-audit.mjs. Never throws on a broken link — that's the finding, not
// a failure; only an unexpected script error should exit non-zero.
//
// IMPORTANT calibration note (found by testing against the real 103 links in this
// repo): many "official-looking" travel/booking sites 403 an automated request
// even with a full browser User-Agent (tested — didn't help; likely TLS/IP-based
// bot detection, not UA sniffing). A 403 is NOT reliable evidence a page is dead —
// only that this checker got blocked. Results are bucketed by confidence so the
// report doesn't cry wolf on sites that work fine for an actual visitor:
//   dead    — 404/410, high confidence the page is genuinely gone
//
// Second calibration note (2026-07-17): a 404 is only trusted after checkUrl()
// re-probes with GET. A HEAD-only 404 means nothing on some servers —
// english.visitseoul.net answers HEAD 404 / GET 200 on every URL, which had this
// report calling three live citations dead. Distinct from the 403 case above:
// that's the site blocking us, this is HEAD being answered wrong. See lib.mjs.
//   blocked — 401/403/429, likely bot-detection; needs a human to check in a browser
//   error   — network/DNS/timeout failure, retried once before counting
//   other   — any other non-2xx/3xx (5xx etc.)

import { readGuides, extractLinks, checkUrl, isMain } from "./lib.mjs";

function bucketOf(result) {
  if (result.status === 404 || result.status === 410) return "dead";
  if (result.status === 401 || result.status === 403 || result.status === 429) return "blocked";
  if (result.status == null) return "error";
  return "other";
}

export async function checkLinks() {
  const guides = await readGuides();

  // Map each unique URL to the guide(s) that cite it, so one broken link on a
  // shared reference (e.g. an airline site cited by two guides) reports once
  // with both sources, not as two separate findings.
  const byUrl = new Map();
  for (const { slug, raw } of guides) {
    for (const url of extractLinks(raw)) {
      if (!byUrl.has(url)) byUrl.set(url, new Set());
      byUrl.get(url).add(slug);
    }
  }

  const urls = [...byUrl.keys()];
  const findings = { dead: [], blocked: [], error: [], other: [] };
  const CONCURRENCY = 8;
  let i = 0;
  async function worker() {
    while (i < urls.length) {
      const url = urls[i++];
      let result = await checkUrl(url);
      // A single retry ONLY for network-level failures (timeout/DNS/reset) — these
      // are the class of error most likely to be a transient CI/network fluke, not
      // a real finding. 403-class blocks won't change on retry, so don't waste one.
      if (!result.ok && result.status == null) result = await checkUrl(url);
      if (!result.ok) {
        findings[bucketOf(result)].push({ url, guides: [...byUrl.get(url)], status: result.status, error: result.error });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));

  return { checked: urls.length, ...findings };
}

// Allow standalone invocation for local testing.
if (isMain(import.meta.url)) {
  const { checked, dead, blocked, error, other } = await checkLinks();
  console.log(`[links] checked ${checked} unique URLs — ${dead.length} dead, ${blocked.length} blocked (low confidence), ${error.length} network errors, ${other.length} other`);
  const show = (label, list) => list.forEach((b) => console.log(`  ${label} ${b.url} — ${b.status ?? b.error} (cited by: ${b.guides.join(", ")})`));
  show("✗ DEAD  ", dead);
  show("? blocked", blocked);
  show("? error  ", error);
  show("? other  ", other);
}
