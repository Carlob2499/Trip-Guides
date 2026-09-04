import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

describe("D6 visual-fidelity mechanical contracts", () => {
  it("keeps Korean system fallbacks in the shared type roles", () => {
    const css = read("src/styles/base.css");
    expect(css).toContain("'Apple SD Gothic Neo'");
    expect(css).toContain("'Malgun Gothic'");
    expect(css).toContain("'Noto Sans CJK KR'");
    expect(css).toContain("'Noto Serif CJK KR'");
  });

  it("does not allow Guide destination headings to break inside ordinary words", () => {
    const css = read("src/styles/guide-dest.css");
    expect(css).not.toContain("overflow-wrap:anywhere");
    expect(css).toMatch(/\.gd-card-name\{[^}]*overflow-wrap:normal[^}]*word-break:normal/s);
    expect(css).toMatch(/\.gd-chapter-title\{[^}]*overflow-wrap:normal[^}]*word-break:normal/s);
  });

  it("keeps creator-review canary screenshots separate from regression baselines", () => {
    const spec = read("tests/visual/design-canary.spec.ts");
    expect(spec).toContain("390, height: 844");
    expect(spec).toContain("1440, height: 1000");
    expect(spec).toContain("v1-trip-active-mobile-dark.png");
    expect(spec).toContain("v1-itinerary-desktop-dark.png");
    expect(spec).not.toContain("toHaveScreenshot");
    expect(spec).not.toContain("updateSnapshots");
  });
});
