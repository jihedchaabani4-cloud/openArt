import { describe, it, expect, vi, beforeEach } from "vitest";
import { notifyOptimisticError } from "./notifyOptimisticError";
import { logger } from "@/shared/lib/logger";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("notifyOptimisticError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(logger, "error").mockImplementation(() => {});
  });

  it("shows error toast with provided message and logs via structured logger", () => {
    const err = new Error("Network timeout");
    const msg = notifyOptimisticError(err, "Failed to move item", { assetId: "a1" });

    expect(msg).toBe("Failed to move item");
    expect(toast.error).toHaveBeenCalledWith("Failed to move item");
    expect(logger.error).toHaveBeenCalledWith("optimistic_mutation_failed", {
      message: "Failed to move item",
      error: err,
      assetId: "a1",
    });
  });

  it("extracts error message from error object if customMessage is omitted", () => {
    const err = new Error("Folder cannot be deleted");
    const msg = notifyOptimisticError(err);

    expect(msg).toBe("Folder cannot be deleted");
    expect(toast.error).toHaveBeenCalledWith("Folder cannot be deleted");
    expect(logger.error).toHaveBeenCalledWith("optimistic_mutation_failed", {
      message: "Folder cannot be deleted",
      error: err,
    });
  });

  it("falls back to default error message if error has no message and customMessage is omitted", () => {
    const msg = notifyOptimisticError(null);

    expect(msg).toBe("Action failed. Changes were reverted.");
    expect(toast.error).toHaveBeenCalledWith("Action failed. Changes were reverted.");
    expect(logger.error).toHaveBeenCalledWith("optimistic_mutation_failed", {
      message: "Action failed. Changes were reverted.",
      error: null,
    });
  });
});
