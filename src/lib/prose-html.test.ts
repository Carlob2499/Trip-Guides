import { describe, it, expect } from "vitest";
import { findUnsafeHtml, ALLOWED_TAGS } from "./prose-html";
import { PANELS } from "../pages/panel-preview/_lib/fixtures";

/* The lib's own contract. The schema-level walk (content.config.test.ts) still covers
   guide JSON end-to-end; these pin the extracted function directly so a regression is
   named at its home, not three layers up. */
describe("prose-html — the shared allowlist", () => {
  it("passes clean allowlisted HTML", () => {
    expect(
      findUnsafeHtml('<p>Take the <b>AREX</b> to <a href="https://example.com">Seoul</a>.</p><ul><li>ok</li></ul>'),
    ).toBeNull();
  });

  it("rejects a tag outside the allowlist", () => {
    expect(findUnsafeHtml("<p>fine</p><script>alert(1)</script>")).toMatch(/disallowed tag <script>/);
  });

  it("rejects an event-handler attribute on an allowed tag", () => {
    expect(findUnsafeHtml('<b onclick="x()">bold</b>')).toMatch(/event handler/);
  });

  it("rejects a javascript: href", () => {
    expect(findUnsafeHtml('<a href="javascript:alert(1)">x</a>')).toMatch(/javascript: href/);
  });

  it("permits the single-attribute data-addr-kr span shape and nothing else on span", () => {
    expect(findUnsafeHtml('<span data-addr-kr="서울">addr</span>')).toBeNull();
    expect(findUnsafeHtml('<span class="x">nope</span>')).toMatch(/disallowed <span> shape/);
    expect(findUnsafeHtml('<span data-addr-kr="서울" onclick="x()">nope</span>')).toMatch(/disallowed <span> shape/);
  });

  it("allowlist stays the documented CLAUDE.md set", () => {
    expect([...ALLOWED_TAGS].sort()).toEqual(["a", "b", "br", "i", "li", "ol", "p", "ul"]);
  });
});

/* The gap this file exists to close: the panel-preview fixtures render raw HTML via
   set:html on a route that ships in dist/, but as a plain TS module they bypass the
   guide collection schema — the one HTML-bearing surface with no gate. Walk every
   fixture body through the SAME check the guides ride. A future fixture with a
   disallowed tag now fails the suite instead of shipping. */
describe("panel-preview fixtures ride the prose allowlist", () => {
  for (const p of PANELS) {
    it(`fixture "${p.id}" body is allowlist-clean`, () => {
      expect(findUnsafeHtml(p.body)).toBeNull();
    });
  }
});
