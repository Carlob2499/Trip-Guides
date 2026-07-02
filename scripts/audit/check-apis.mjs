// API canary — one real call to each third-party service the live site depends on,
// validating response status AND shape (not just "did it 200"). Catches an
// Amadeus-style silent deprecation before a guide page shows a dead widget.
// Endpoints/shapes mirror the actual call sites — keep in sync if those change:
//   src/scripts/guide-ui.js  (Frankfurter, Open-Meteo)
//   scripts/fetch-holidays.mjs (Nager.Date)

import { isMain } from "./lib.mjs";

const UA = { "user-agent": "waypoint-content-audit/1.0 (+https://github.com/Carlob2499/Trip-Guides)" };

async function checkFrankfurter() {
  const url = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=KRW";
  const res = await fetch(url, { headers: UA });
  if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
  const data = await res.json();
  const rate = data?.rates?.KRW;
  if (typeof rate !== "number" || !isFinite(rate)) return { ok: false, detail: "missing/non-numeric rates.KRW" };
  return { ok: true, detail: `1 USD = ${rate} KRW` };
}

async function checkOpenMeteo() {
  // Seoul coords — arbitrary known-good point, matches what the site queries per-guide.
  const url = "https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780" +
    "&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=3&timezone=auto";
  const res = await fetch(url, { headers: UA });
  if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
  const data = await res.json();
  const d = data?.daily;
  if (!d || !Array.isArray(d.time) || !Array.isArray(d.temperature_2m_max) || !Array.isArray(d.weathercode)) {
    return { ok: false, detail: "malformed `daily` shape" };
  }
  return { ok: true, detail: `${d.time.length} days returned` };
}

async function checkNager() {
  const year = new Date().getUTCFullYear();
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/KR`;
  const res = await fetch(url, { headers: UA });
  if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) return { ok: false, detail: "empty or non-array payload" };
  const first = data[0];
  if (!first?.date || !first?.localName) return { ok: false, detail: "missing expected fields (date/localName)" };
  return { ok: true, detail: `${data.length} holidays returned` };
}

export async function checkApis() {
  const checks = [
    { name: "Frankfurter (currency)", fn: checkFrankfurter },
    { name: "Open-Meteo (weather)", fn: checkOpenMeteo },
    { name: "Nager.Date (holidays)", fn: checkNager },
  ];
  const results = [];
  for (const { name, fn } of checks) {
    try {
      const r = await fn();
      results.push({ name, ...r });
    } catch (err) {
      results.push({ name, ok: false, detail: String(err.message || err) });
    }
  }
  return { results, allOk: results.every((r) => r.ok) };
}

if (isMain(import.meta.url)) {
  const { results } = await checkApis();
  for (const r of results) console.log(`[apis] ${r.ok ? "✓" : "✗"} ${r.name} — ${r.detail}`);
}
