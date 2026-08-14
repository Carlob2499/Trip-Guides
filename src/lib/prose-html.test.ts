// @protects-file Guide prose can only use the small set of safe tags, and bad markup fails the build.

import { describe, it, expect } from "vitest";
import { findUnsafeHtml, ALLOWED_TAGS } from "./prose-html";

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
