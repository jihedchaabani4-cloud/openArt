/**
 * Contract tests for commandResult helper (Task C3).
 */

import { describe, it, expect } from "vitest";
import { ok, fail, REASONS } from "../core/commandResult.js";

describe("C3: commandResult Contract", () => {
  it("exports frozen REASONS object with all required reason keys", () => {
    expect(Object.isFrozen(REASONS)).toBe(true);
    expect(REASONS.NOT_MOUNTED).toBe("NOT_MOUNTED");
    expect(REASONS.PROJECT_MISMATCH).toBe("PROJECT_MISMATCH");
    expect(REASONS.NO_ELIGIBLE_MODEL).toBe("NO_ELIGIBLE_MODEL");
    expect(REASONS.NO_SLOT_FOR_ROLE).toBe("NO_SLOT_FOR_ROLE");
    expect(REASONS.MAX_MEDIA_REACHED).toBe("MAX_MEDIA_REACHED");
    expect(REASONS.DUPLICATE_MEDIA).toBe("DUPLICATE_MEDIA");
    expect(REASONS.TYPE_NOT_ALLOWED).toBe("TYPE_NOT_ALLOWED");
    expect(REASONS.UNKNOWN_MODEL).toBe("UNKNOWN_MODEL");
    expect(REASONS.INVALID_ARGUMENT).toBe("INVALID_ARGUMENT");
  });

  it("ok() constructs exact success payload shape", () => {
    const res1 = ok();
    expect(res1).toEqual({ ok: true, patch: {} });

    const res2 = ok({ prompt: "Test prompt" }, { source: "action" });
    expect(res2).toEqual({
      ok: true,
      patch: { prompt: "Test prompt" },
      source: "action",
    });
  });

  it("fail() constructs exact failure payload shape", () => {
    const res1 = fail(REASONS.NOT_MOUNTED);
    expect(res1).toEqual({
      ok: false,
      reason: "NOT_MOUNTED",
      details: {},
    });

    const res2 = fail(REASONS.MAX_MEDIA_REACHED, { max: 4, attempted: 5 });
    expect(res2).toEqual({
      ok: false,
      reason: "MAX_MEDIA_REACHED",
      details: { max: 4, attempted: 5 },
    });
  });

  it("fail() throws on unknown reasons in test/development mode", () => {
    expect(() => fail("NON_EXISTENT_REASON")).toThrow(/Unknown command failure reason/);
  });
});
