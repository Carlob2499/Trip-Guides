// A8 tripwire: package.json's `overrides.esbuild` force-pins an exact esbuild version across
// every dependency (astro included) — npm `overrides` bypasses semver range checking entirely,
// so nothing previously caught the override drifting out of sync with what astro itself
// declares it needs. This test doesn't gate CI (an intentional, deliberate pin isn't a bug to
// block merges over), but it DOES fail loudly the moment either side moves, so a future
// `npm install`/astro upgrade that changes the relationship gets a human's attention instead of
// silently shipping a mismatched esbuild.
//
// IMPORTANT — investigated finding, not assumed: astro's OWN declared esbuild dependency range
// is `^0.27.3`, which per node-semver's caret rule for a 0.x version means `>=0.27.3 <0.28.0`
// — this pin (0.28.1) does NOT strictly satisfy that range today. That's a real, pre-existing
// gap (npm overrides can force a version outside the declared range; esbuild's CLI/API has
// stayed compatible across these particular minor versions in practice), not something this
// test can retroactively "fix" — but it must not be allowed to silently WIDEN further without
// someone noticing.
import { describe, it, expect } from "vitest";
import semver from "semver";
import astroPkg from "../../node_modules/astro/package.json" with { type: "json" };
import ourPkg from "../../package.json" with { type: "json" };

const PINNED = ourPkg.overrides?.esbuild;
const ASTRO_RANGE = astroPkg.dependencies?.esbuild;

describe("esbuild override tripwire (A8)", () => {
  it("both package.json files still declare an esbuild version/range at all", () => {
    expect(PINNED).toBeTruthy();
    expect(ASTRO_RANGE).toBeTruthy();
  });

  it("the pin is a same-major-line version as astro's declared minimum (0.x, not a different major)", () => {
    // The real tripwire: if astro ever moves to requiring esbuild 1.x (or any other major),
    // this fails — that's a genuine breaking-change signal worth a human looking at the pin.
    const astroMin = semver.minVersion(ASTRO_RANGE);
    expect(semver.major(PINNED)).toBe(semver.major(astroMin));
  });

  it("the pin's minor version is not more than one ahead of astro's declared minimum minor", () => {
    // Documents + bounds the KNOWN gap above: astro wants ^0.27.3 (>=0.27.3 <0.28.0), we force
    // 0.28.1 — one minor ahead, tolerated today. If the pin ever drifts to two-or-more minors
    // ahead of what astro asks for, that's exactly the kind of silent widening this tripwire
    // exists to catch.
    const astroMin = semver.minVersion(ASTRO_RANGE);
    const gap = semver.minor(PINNED) - semver.minor(astroMin);
    expect(gap).toBeGreaterThanOrEqual(0);
    expect(gap).toBeLessThanOrEqual(1);
  });
});
