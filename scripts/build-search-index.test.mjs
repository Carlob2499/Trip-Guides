// @protects-file A draft guide is invisible to site search, not just the curated grid.

import { describe, it, expect } from "vitest";
import { publishedOnly, buildIndex } from "./build-search-index.ts";

const section = (title) => [{ group: "plan", title, body: `Body text for ${title}.` }];

const readGuidesShape = () => [
  { slug: "published-a", guide: { title: "Published A", sections: section("A") } },
  { slug: "draft-b", guide: { title: "Draft B", draft: true, sections: section("B") } },
  { slug: "published-c", guide: { title: "Published C", sections: section("C") } },
];

describe("publishedOnly", () => {
  it("drops any guide whose meta carries draft: true", () => {
    const kept = publishedOnly(readGuidesShape()).map((g) => g.slug);
    expect(kept).toEqual(["published-a", "published-c"]);
  });

  it("keeps a guide with no draft key at all (the normal, published shape)", () => {
    const kept = publishedOnly([{ slug: "no-draft-key", guide: { title: "X", sections: [] } }]);
    expect(kept).toHaveLength(1);
  });
});

describe("buildIndex", () => {
  it("emits no record for a draft guide once publishedOnly has filtered it out", async () => {
    // buildIndex itself doesn't filter drafts — publishedOnly does, and the isMain entrypoint
    // composes them. This pins that composition: skip publishedOnly and drafts leak into search.
    const all = readGuidesShape();
    const records = await buildIndex(publishedOnly(all));
    const slugs = new Set(records.map((r) => r.slug));
    expect(slugs.has("draft-b")).toBe(false);
    expect(slugs.has("published-a")).toBe(true);
    expect(slugs.has("published-c")).toBe(true);
  });
});
