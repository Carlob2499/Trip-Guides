// E2 (docs/PLAN_EVIDENCE_FIRST.md) — source drift detection. The answer to defect D8:
// "link check = liveness only". A 200 OK proves a server answered, not that the page still
// says what the guide says it says.
//
// THE CANONICAL SPECIMEN (regression case 12). The japan guide prices the Zao Okama crater
// at ¥3,000, sourced to zao-machi.com, and separately warns the ropeway "typically closes
// for the season in early November" — the trip visits on Nov 5. The URL is alive, so every
// existing gate is green, while the guide's actual exposure (is it OPEN that day?) is
// untested by the source that supposedly verifies it. If that page is ever replaced by a
// seasonal-closure notice, `checkLinks` still reports 200 and nothing notices. This module
// is what notices: it reads the page and asks whether the stated value is still ON it.
//
// DECOUPLED FROM `risk`, like E1 and E3. The packet specified this around the `evidence`
// snippets B1 added for R3/R4 rows — but no row in the corpus carries one, so an
// evidence-only check would examine nothing. The risk-independent half is stronger anyway
// and works on all 145 rows today: every fact already has a `value`, and "is the number
// still on the page" is exactly the 200-≠-verified question. `evidence`, where a research
// pass has supplied it, is simply a second and more precise way to satisfy the same check.
//
// POSTURE: advisory for one release (the plan's own instruction), then a blocker for R3/R4.
// That is not timidity — a real page can legitimately render a figure this checker cannot
// match (JS-rendered prices, a figure split across markup, a localized numeral). Advisory
// first means the false-positive rate is MEASURED on the real corpus before anything blocks,
// which is the B3 lesson applied ahead of time rather than after.
//
// NETWORK: injectable `fetchPage` so the tests are zero-network per repo doctrine. The live
// implementation honours research-efficiency.md's fetch discipline — two attempts total,
// with r.jina.ai as the SECOND attempt (never the first), and the citation never changes.

/** Digits-only signature of a money/number value: "¥11,410" → "11410". Returns "" when the
    value carries no digits at all (a non-numeric fact — nothing to match on). */
export function digitsOf(value) {
  return String(value ?? "").replace(/[^\d]/g, "");
}

/** The forms a page might legitimately render a value in. A page that quotes "¥11,410" may
    write it "11,410", "11410", or "11 410" — all the same fact. Matching only the guide's
    exact string would drift-flag correct pages constantly, so match the digit run with
    optional separators, anchored on digit boundaries so "410" never matches inside "3410". */
export function valuePattern(value) {
  const d = digitsOf(value);
  if (d.length < 2) return null; // 1-digit values match far too much to be evidence of anything
  const body = d.split("").join("[,.\\u00a0\\s]?");
  return new RegExp(`(?<!\\d)${body}(?!\\d)`);
}

/** Normalize page text for matching: collapse whitespace, drop tags. Deliberately crude —
    this asks "does the number appear at all", not "is the page well-formed". */
export function pageText(html) {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ");
}

/** Does this page still support the fact? `evidence` (a quoted locator phrase) wins when
    present because it is what the research pass actually read; the value is the fallback
    that works on every existing row. Returns which path satisfied it, so a report can say
    WHY something passed rather than just that it did. */
export function pageSupports(html, { value, evidence } = {}) {
  const text = pageText(html);
  if (evidence) {
    const needle = String(evidence).trim().replace(/\s+/g, " ");
    if (needle && text.toLowerCase().includes(needle.toLowerCase())) {
      return { supported: true, via: "evidence" };
    }
  }
  const rx = valuePattern(value);
  if (rx && rx.test(text)) return { supported: true, via: "value" };
  return { supported: false, via: null };
}

/**
 * Walk a guide's registry against its own sources.
 *
 * `fetchPage(url)` must resolve to `{ ok, text }` or `{ ok: false, status }`. Unreachable
 * keeps the EXISTING unreachable semantics (it is `checkLinks`' job to judge liveness, and
 * a blocked fetch is not evidence of drift) — this reports it and moves on rather than
 * inventing a finding, exactly as verification-rules.md §7 requires.
 */
export async function checkDrift(facts, { fetchPage, limit = Infinity } = {}) {
  const rows = Object.entries(facts ?? {}).filter(([, r]) => r?.source_url);
  if (!rows.length || typeof fetchPage !== "function") {
    return { status: "n/a", reason: "no sourced rows or no fetcher", findings: [], checked: 0 };
  }

  // One fetch per URL, not per row: korea cites one visitkorea page from five rows, and
  // re-fetching it five times would be five times the traffic for one answer.
  const byUrl = new Map();
  for (const [id, row] of rows) {
    if (!byUrl.has(row.source_url)) byUrl.set(row.source_url, []);
    byUrl.get(row.source_url).push([id, row]);
  }

  const findings = [];
  let checked = 0;
  let unreachable = 0;
  for (const [url, group] of [...byUrl.entries()].slice(0, limit)) {
    const res = await fetchPage(url);
    if (!res?.ok) {
      unreachable++;
      findings.push({
        code: "source-unreachable",
        ids: group.map(([id]) => id),
        url,
        msg: `could not read ${url} (${res?.status ?? "no response"}) — liveness is checkLinks' verdict; drift is simply untested here`,
      });
      continue;
    }
    checked++;
    for (const [id, row] of group) {
      const { supported, via } = pageSupports(res.text, row);
      if (supported) continue;
      // A row this checker cannot search for is NOT drift — say precisely why instead of
      // reporting a false positive. Two distinct causes, and conflating them misleads:
      // a genuinely non-numeric value, versus a value so short (1 digit, e.g. "$5") that
      // matching it would prove nothing. Both are fixed the same way — an `evidence` snippet.
      if (!valuePattern(row.value) && !row.evidence) {
        const why = digitsOf(row.value).length
          ? `its value ${JSON.stringify(row.value)} is a single digit, which would match almost any page`
          : `it has no numeric value to search for`;
        findings.push({
          code: "drift-uncheckable",
          ids: [id],
          url,
          msg: `fact "${id}" cannot be drift-checked — ${why}; add an \`evidence\` snippet to make it checkable`,
        });
        continue;
      }
      findings.push({
        code: "drifted",
        ids: [id],
        url,
        risk: Number(row.risk),
        msg: `fact "${id}" states ${JSON.stringify(row.value)} but that value${row.evidence ? " (and its evidence snippet)" : ""} no longer appears on ${url} — the link is alive, the claim is not confirmed`,
      });
      void via;
    }
  }

  const drifted = findings.filter((f) => f.code === "drifted");
  return {
    // Advisory for one release by instruction. `blockers` names the rows that WILL block
    // once enforced (R3/R4), so the report can show the future consequence today.
    status: findings.length ? "advisory" : "pass",
    findings,
    checked,
    unreachable,
    blockers: drifted.filter((f) => f.risk >= 3).map((f) => f.ids[0]),
  };
}

/** Live fetcher honouring research-efficiency.md's fetch discipline: two attempts total,
    r.jina.ai as the SECOND one only, and the citation never changes — the mirror is how the
    page is READ, never where the fact came from. */
export function liveFetchPage({ timeoutMs = 10000, fetchImpl = fetch } = {}) {
  const get = async (url) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, {
        redirect: "follow",
        signal: ctrl.signal,
        headers: { "user-agent": "waypoint-content-audit/1.0 (+https://github.com/Carlob2499/Trip-Guides)" },
      });
      if (!res.ok) return { ok: false, status: res.status };
      return { ok: true, text: await res.text() };
    } finally {
      clearTimeout(t);
    }
  };
  return async (url) => {
    try {
      const first = await get(url);
      if (first.ok) return first;
      const mirrored = await get(`https://r.jina.ai/${url}`);
      return mirrored.ok ? mirrored : first;
    } catch (err) {
      try {
        return await get(`https://r.jina.ai/${url}`);
      } catch {
        return { ok: false, status: null, error: String(err?.message || err) };
      }
    }
  };
}
