import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("writes one structured record with level, event and fields", () => {
    logger.info("folder_moved", { folderId: "f1" });
    expect(console.info).toHaveBeenCalledTimes(1);
    const record = console.info.mock.calls[0][0];
    expect(record).toMatchObject({ level: "info", event: "folder_moved", folderId: "f1" });
    expect(typeof record.ts).toBe("string");
  });

  it("reduces Error objects to name and message only (no stack)", () => {
    const err = new Error("boom");
    logger.error("x_failed", { error: err });
    const record = console.error.mock.calls[0][0];
    expect(record.error).toEqual({ name: "Error", message: "boom" });
    expect(record.error.stack).toBeUndefined();
  });

  it("accepts missing fields", () => {
    logger.error("no_fields");
    expect(console.error.mock.calls[0][0]).toMatchObject({ level: "error", event: "no_fields" });
  });
});
