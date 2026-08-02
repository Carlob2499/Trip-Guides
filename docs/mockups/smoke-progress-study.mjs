/* Interaction smoke for the /progress/ design study (PREVIEW-ONLY tooling).
 *   node docs/mockups/smoke-progress-study.mjs [--port 4399]
 * Proves the three things a screenshot cannot: the state switcher really re-renders, the
 * elapsed clock really ticks, and Departures' split-flap really turns on a real transition
 * (and really does NOT under prefers-reduced-motion). */
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const i = argv.indexOf("--port");
const PORT = i >= 0 ? argv[i + 1] : "4399";
const ORIGIN = `http://localhost:${PORT}/Trip-Guides/progress-preview`;
const IDENT = "country=South+Korea&slug=south-korea";

const browser = await chromium.launch();
const fails = [];
const ok = (cond, msg) => { console.log((cond ? "  PASS  " : "  FAIL  ") + msg); if (!cond) fails.push(msg); };

/* 1. The elapsed clock ticks, on every option. */
for (const option of ["first-light", "departures", "neatline", "two-passes"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${ORIGIN}/${option}/?${IDENT}&state=mid`, { waitUntil: "networkidle" });
  const sel = { "first-light": "#flElapsed", departures: "#dpElapsed", neatline: "#nlElapsed", "two-passes": "#tpElapsed" }[option];
  const a = await page.textContent(sel);
  await page.waitForTimeout(2100);
  const b = await page.textContent(sel);
  ok(a !== b && /\d/.test(b), `${option}: elapsed ticks (${a} -> ${b})`);
  ok(errs.length === 0, `${option}: no page errors`);

  /* 2. The state switcher really re-renders from a different fixture. */
  const before = await page.textContent("body");
  await page.click('[data-pv-state="done"]');
  await page.waitForTimeout(400);
  const after = await page.textContent("body");
  ok(before !== after, `${option}: state switcher re-renders`);
  const cta = { "first-light": "#flDone", departures: "#dpDone", neatline: "#nlDone", "two-passes": "#tpDone" }[option];
  ok(await page.locator(cta).isVisible(), `${option}: done state exposes the guide link`);

  /* 3. The fill/graph never claims more than the data. */
  await page.click('[data-pv-state="scaffold"]');
  await page.waitForTimeout(400);
  const txt = await page.textContent("body");
  ok(/1 of 6|1\s*OF\s*6/i.test(txt.replace(/\s+/g, " ")), `${option}: one cleared stage reads as 1 of 6`);

  await ctx.close();
}

/* 4. Departures' flap turns on a real transition, and stands still under reduced motion. */
for (const motion of ["no-preference", "reduce"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: motion });
  const page = await ctx.newPage();
  await page.goto(`${ORIGIN}/departures/?${IDENT}&state=scaffold`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);
  await page.click('[data-pv-state="mid"]');
  await page.waitForTimeout(90);
  const flippingMid = await page.locator(".dp-cell.is-flipping").count();
  await page.waitForTimeout(1600);
  const settled = (await page.locator(".dp-row").nth(2).locator(".dp-status").getAttribute("aria-label"));
  const flippingAfter = await page.locator(".dp-cell.is-flipping").count();
  if (motion === "reduce") {
    ok(flippingMid === 0, "departures/reduced: no cell ever enters the flipping state");
  } else {
    ok(flippingMid > 0, `departures/motion: cells flip on a real transition (${flippingMid} mid-flip)`);
  }
  ok(settled === "CLEARED", `departures/${motion}: row 3 settles on the true status (${settled})`);
  ok(flippingAfter === 0, `departures/${motion}: nothing is still flipping once settled`);
  await ctx.close();
}

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILURE(S)` : "\nAll interaction checks passed.");
process.exitCode = fails.length ? 1 : 0;
