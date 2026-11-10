import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadCollectionAsZip } from "./useDownloadCollection";
import { api } from "@/shared/api/client";
import { downloadBlob } from "@/shared/lib/utils";
import { toast } from "sonner";

vi.mock("@/shared/api/client", () => ({
  api: {
    get: vi.fn(),
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

  it("resolves media from projectData.projectContents.media when workflows do not have items array", async () => {
    const mockBlob = new Blob(["image-data"], { type: "image/png" });
    api.getBlob.mockResolvedValue(mockBlob);

    const mockQueryClient = {
      getQueryData: vi.fn((key) => {
        if (key[0] === "folders") {
          return [{ id: "col-cvcx", name: "cvcx", parentId: null }];
        }
        if (key[0] === "projectData") {
          return {
            projectContents: {
              workflows: [
                {
                  id: "wf-cvcx-1",
                  display_name: "Workflow in CVCX",
                  folder_id: "col-cvcx",
                },
              ],
              media: [
                {
                  id: "m-1",
                  workflow_id: "wf-cvcx-1",
                  url: "https://example.com/art1.png",
                  status: "completed",
                },
                {
                  id: "m-2",
                  workflow_id: "wf-cvcx-1",
                  url: "https://example.com/art2.png",
                  status: "completed",
                },
              ],
            },
          };
        }
        return null;
      }),
    };

    const result = await downloadCollectionAsZip({
      collectionId: "col-cvcx",
      projectId: "proj-1",
      queryClient: mockQueryClient,
    });

    expect(result.success).toBe(true);
    expect(result.totalFiles).toBe(2);
    expect(downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      "cvcx.zip"
    );
  });

  it("fetches folders and projectData from API when queryClient cache is empty", async () => {
    const mockBlob = new Blob(["image-data"], { type: "image/png" });
    api.getBlob.mockResolvedValue(mockBlob);

    api.get.mockImplementation(async (endpoint) => {
      if (endpoint === "/workflows/project-data/proj-remote") {
        return {
          result: {
            data: {
              json: {
                projectContents: {
                  collections: [{ id: "col-remote", name: "Remote Col", parentId: null }],
                  workflows: [
                    { id: "wf-remote-1", folder_id: "col-remote", title: "Fetched Art" },
                  ],
                  media: [
                    { id: "m-remote-1", workflow_id: "wf-remote-1", file_url: "https://example.com/remote.png" },
                  ],
                },
              },
            },
          },
        };
      }
      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });

    const mockQueryClient = {
      getQueryData: vi.fn(() => null),
      setQueryData: vi.fn(),
    };

    const result = await downloadCollectionAsZip({
      collectionId: "col-remote",
      projectId: "proj-remote",
      queryClient: mockQueryClient,
    });

    expect(result.success).toBe(true);
    expect(result.totalFiles).toBe(1);
    expect(api.get).toHaveBeenCalledWith("/workflows/project-data/proj-remote");
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), "Remote Col.zip");
  });

  it("handles direct folder-scoped media and deduplicates identical items", async () => {
    const mockBlob = new Blob(["direct-image"], { type: "image/png" });
    api.getBlob.mockResolvedValue(mockBlob);

    const folders = [{ id: "col-direct", name: "Direct Col", parentId: null }];
    const mockQueryClient = {
      getQueryData: vi.fn((key) => {
        if (key[0] === "folders") return folders;
        if (key[0] === "projectData") {
          return {
            projectContents: {
              workflows: [
                {
                  id: "wf-d-1",
                  folder_id: "col-direct",
                  items: [
                    { id: "m-shared-1", url: "https://example.com/shared.png" },
                  ],
                },
              ],
              media: [
                // Shared media already in wf.items -> should be deduplicated
                { id: "m-shared-1", workflow_id: "wf-d-1", url: "https://example.com/shared.png" },
                // Direct media in folder without workflow
                { id: "m-direct-2", folder_id: "col-direct", image: { url: "https://example.com/direct2.png" } },
              ],
            },
          };
        }
        return null;
      }),
    };

    const result = await downloadCollectionAsZip({
      collectionId: "col-direct",
      projectId: "proj-direct",
      folders,
      queryClient: mockQueryClient,
    });

    expect(result.success).toBe(true);
    expect(result.totalFiles).toBe(2);
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), "Direct Col.zip");
  });
});
