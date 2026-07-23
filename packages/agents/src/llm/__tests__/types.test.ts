import { describe, it, expect } from "vitest";
import { extractJson, retryPrompt } from "../types.js";

describe("extractJson", () => {
  it("parses a fenced json block", () => {
    expect(extractJson('Here you go:\n```json\n{"ok": true}\n```')).toEqual({ ok: true });
  });

  it("parses bare braces", () => {
    expect(extractJson('{"a": 1, "b": {"c": 2}}')).toEqual({ a: 1, b: { c: 2 } });
  });

  it("prefers the fenced block over surrounding braces", () => {
    expect(extractJson('```json\n{"inner": true}\n```')).toEqual({ inner: true });
  });

  it("throws when no json is present", () => {
    expect(() => extractJson("no json here")).toThrow(/No JSON found/);
  });
});

describe("retryPrompt", () => {
  it("appends the validation error to the original prompt", () => {
    const p = retryPrompt("Generate X", "missing field y");
    expect(p).toContain("Generate X");
    expect(p).toContain("missing field y");
    expect(p).toContain("ONLY the JSON object");
  });
});
