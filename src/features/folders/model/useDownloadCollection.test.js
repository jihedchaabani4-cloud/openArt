import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadCollectionAsZip } from "./useDownloadCollection";
import { api } from "@/shared/api/client";
import { downloadBlob } from "@/shared/lib/utils";
import { toast } from "sonner";

vi.mock("@/shared/api/client", () => ({
  api: {
    getBlob: vi.fn(),
  },
}));

vi.mock("@/shared/lib/utils", () => ({
  downloadBlob: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(() => "toast-id"),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("downloadCollectionAsZip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("downloads collection and sub-collections media files packed in a ZIP hierarchy", async () => {
    const mockBlob1 = new Blob(["image1"], { type: "image/png" });
    const mockBlob2 = new Blob(["video1"], { type: "video/mp4" });
    const mockBlob3 = new Blob(["sub-image"], { type: "image/png" });

    api.getBlob.mockImplementation(async (url) => {
      if (url === "https://example.com/img1.png") return mockBlob1;
      if (url === "https://example.com/vid1.mp4") return mockBlob2;
      if (url === "https://example.com/sub.png") return mockBlob3;
      throw new Error("Unknown URL");
    });

    const folders = [
      { id: "col-1", name: "Main Collection", parentId: null },
      { id: "sub-1", name: "Section A", parentId: "col-1" },
    ];

    const workflows = [
      {
        id: "wf-1",
        display_name: "Hero Photo",
        folder_id: "col-1",
        primary_media: { url: "https://example.com/img1.png", isVideo: false },
      },
      {
        id: "wf-2",
        title: "Teaser Clip",
        folder_id: "col-1",
        primary_media: { url: "https://example.com/vid1.mp4", isVideo: true },
      },
      {
        id: "wf-3",
        display_name: "Section Item",
        folder_id: "sub-1",
        primary_media: { url: "https://example.com/sub.png", isVideo: false },
      },
      {
        id: "wf-outside",
        folder_id: "other-folder",
        primary_media: { url: "https://example.com/other.png" },
      },
    ];

    const result = await downloadCollectionAsZip({
      collectionId: "col-1",
      collectionName: "Main Collection",
      folders,
      workflows,
    });

    expect(result.success).toBe(true);
    expect(result.totalFiles).toBe(3);
    expect(downloadBlob).toHaveBeenCalledTimes(1);
    expect(downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      "Main Collection.zip"
    );
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Downloaded "Main Collection.zip"'),
      expect.anything()
    );
  });

  it("notifies toast info and skips zip creation when collection has no media", async () => {
    const folders = [{ id: "col-empty", name: "Empty Col", parentId: null }];
    const workflows = [];

    const result = await downloadCollectionAsZip({
      collectionId: "col-empty",
      collectionName: "Empty Col",
      folders,
      workflows,
    });

    expect(result.success).toBe(false);
    expect(result.totalFiles).toBe(0);
    expect(downloadBlob).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith(
      expect.stringContaining("has no media to download")
    );
  });
});
