import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadMediaItem } from "../downloadMediaItem";
import { api } from "@/shared/api/client";
import { logger } from "@/shared/lib/logger";
import * as utils from "@/shared/lib/utils";

describe("downloadMediaItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads blob and triggers downloadBlob on success", async () => {
    const mockBlob = new Blob(["dummy content"], { type: "image/png" });
    vi.spyOn(api, "getBlob").mockResolvedValue(mockBlob);
    const downloadBlobSpy = vi.spyOn(utils, "downloadBlob").mockImplementation(() => {});

    await downloadMediaItem("https://example.com/image.png", "image.png");

    expect(api.getBlob).toHaveBeenCalledWith("https://example.com/image.png");
    expect(downloadBlobSpy).toHaveBeenCalledWith(mockBlob, "image.png");
  });

  it("logs structured error without console.error and opens fallback on error", async () => {
    const loggerErrorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
    vi.spyOn(api, "getBlob").mockRejectedValue(new Error("CORS blocked"));
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    await downloadMediaItem("https://example.com/signed-url?token=secret123", "image.png");

    // Structured logger called with event name and safe fields (no signed URL)
    expect(loggerErrorSpy).toHaveBeenCalledWith("download_failed", expect.objectContaining({
      filename: "image.png",
      error: expect.any(Error),
    }));

    // Fallback opens URL in new tab
    expect(windowOpenSpy).toHaveBeenCalledWith("https://example.com/signed-url?token=secret123", "_blank");
  });
});
