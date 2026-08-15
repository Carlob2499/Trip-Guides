// Tests for scripts/lib/cli.mjs — the shared CLI plumbing. Only the part with a decision in it
// is worth pinning, and that is the step-output writer: $GITHUB_OUTPUT is LINE-DELIMITED, so a
// value carrying a newline is not a long value, it is a second output the runner accepts as if
// the step had written it. Every producer in this repo feeds it something a stranger can shape —
// a destination name typed into a public issue form, an issue title, a slug — so the boundary
// between "one value" and "one value plus whatever came after the newline" is a real one.

// @protects-file A workflow step cannot be made to emit an output it never wrote.

import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { outputLine, emitOutput, parseArgs } from "../lib/cli.mjs";

const dirs = [];
function outFile() {
  const dir = mkdtempSync(path.join(tmpdir(), "wp-out-"));
  dirs.push(dir);
  const file = path.join(dir, "github_output");
  writeFileSync(file, "");
  return file;
}

afterEach(() => {
  delete process.env.GITHUB_OUTPUT;
  while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true });
});

describe("outputLine", () => {
  it("writes one key=value line", () => {
    expect(outputLine("slug", "korea")).toBe("slug=korea\n");
    expect(outputLine("issue", 42)).toBe("issue=42\n");
  });

  it("treats null and undefined as empty, the way an optional output reads", () => {
    expect(outputLine("issue", null)).toBe("issue=\n");
    expect(outputLine("issue", undefined)).toBe("issue=\n");
  });

  it("REFUSES a value containing a newline — that is a second output, not a long value", () => {
    // The attack in one line: a country field of "France\nslug=other-guide" would hand the next
    // step a slug this step never resolved.
    expect(() => outputLine("country", "France\nslug=other-guide")).toThrow(/refusing to emit/);
    expect(() => outputLine("country", "France\nslug=other-guide")).toThrow(/country/);
  });

  it("refuses a carriage return too — CRLF is still a line break to the runner", () => {
    expect(() => outputLine("slug", "korea\r\nfoo=bar")).toThrow(/refusing to emit/);
    expect(() => outputLine("slug", "korea\rfoo=bar")).toThrow(/refusing to emit/);
  });

  it("rejects rather than strips", () => {
    // A trimmed value would look right and hide the upstream bug that produced it — every value
    // this repo emits is single-line by definition, so a newline means something is wrong.
    let line = null;
    try { line = outputLine("slug", "a\nb"); } catch { /* expected */ }
    expect(line).toBe(null);
  });

  it("leaves an ordinary value with punctuation alone", () => {
    expect(outputLine("title", 'change(korea): request #12 "now"')).toBe('title=change(korea): request #12 "now"\n');
  });
});

describe("emitOutput", () => {
  it("appends to $GITHUB_OUTPUT when running under Actions", () => {
    const file = outFile();
    process.env.GITHUB_OUTPUT = file;
    emitOutput("slug", "korea");
    emitOutput("issue", 7);
    expect(readFileSync(file, "utf8")).toBe("slug=korea\nissue=7\n");
  });

  it("validates even when there is no output file — a local run fails like CI would", () => {
    expect(() => emitOutput("country", "France\nslug=other")).toThrow(/refusing to emit/);
  });

  it("writes nothing at all when the value is refused", () => {
    const file = outFile();
    process.env.GITHUB_OUTPUT = file;
    expect(() => emitOutput("country", "France\nslug=other")).toThrow();
    expect(readFileSync(file, "utf8")).toBe("");
  });
});

describe("parseArgs", () => {
  it("pairs flags with values and collects positionals", () => {
    expect(parseArgs(["gate", "forks", "--slug", "korea"])).toEqual({ _: ["gate", "forks"], slug: "korea" });
  });
});
