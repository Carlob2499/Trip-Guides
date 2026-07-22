import { describe, it, expect } from "vitest";
import { jsonEmbed } from "./json-embed";

describe("jsonEmbed", () => {
  it("round-trips a clean payload", () => {
    const data = { a: 1, b: "hello" };
    expect(JSON.parse(jsonEmbed(data))).toEqual(data);
  });

  it("neutralizes a </script> breakout payload", () => {
    const evil = { note: '</script><img src=x onerror="alert(1)">' };
    const embedded = jsonEmbed(evil);
    expect(embedded).not.toContain("</script>");
    expect(embedded).not.toContain("<img");
    // still valid, semantically-equivalent JSON once parsed
    expect(JSON.parse(embedded)).toEqual(evil);
  });
});
