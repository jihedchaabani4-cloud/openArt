import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useMoveAssetToFolder } from "./useMoveAssetToFolder";
import { useCreateFolder } from "./useCreateFolder";
import { useUpdateFolder } from "./useUpdateFolder";
import { useDeleteFolder } from "./useDeleteFolder";
import { api } from "@/shared/api/client";

vi.mock("@/shared/api/client", () => ({
  api: {
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("Folder optimistic mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMoveAssetToFolder", () => {
    it("optimistically patches all 4 folder_id variants in projectData workflows", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialProjectData = {
        projectContents: {
          workflows: [
            { id: "wf-1", folder_id: null, folderId: null, metadata: {} },
            { id: "wf-2", folder_id: "other", folderId: "other", metadata: {} },
          ],
        },
      };
      queryClient.setQueryData(pKey, initialProjectData);

      api.patch.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useMoveAssetToFolder(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          assetId: "wf-1",
          folderId: "folder-target",
          projectId: "proj-1",
        });
      });

      const updated = queryClient.getQueryData(pKey);
      const moved = updated.projectContents.workflows.find((w) => w.id === "wf-1");

      expect(moved.folder_id).toBe("folder-target");
      expect(moved.folderId).toBe("folder-target");
      expect(moved.metadata.folder_id).toBe("folder-target");
      expect(moved.metadata.folderId).toBe("folder-target");
    });

    it("rolls back workflow folder on API failure", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialProjectData = {
        projectContents: {
          workflows: [{ id: "wf-1", folder_id: "folder-old", folderId: "folder-old", metadata: {} }],
        },
      };
      queryClient.setQueryData(pKey, initialProjectData);

      api.patch.mockRejectedValueOnce(new Error("Move forbidden"));

      const { result } = renderHook(() => useMoveAssetToFolder(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            assetId: "wf-1",
            folderId: "folder-new",
            projectId: "proj-1",
          });
        } catch {
          // Expected failure
        }
      });

      const restored = queryClient.getQueryData(pKey);
      expect(restored.projectContents.workflows[0].folder_id).toBe("folder-old");
    });
  });

  describe("useUpdateFolder", () => {
    it("optimistically renames folder and moves parentId in folders cache", async () => {
      const { queryClient, wrapper } = createWrapper();
      const fKey = queryKeys.folders.byProject("proj-1");

      const initialFolders = [
        { id: "f-1", name: "Old Name", parent_id: null, parentId: null },
      ];
      queryClient.setQueryData(fKey, initialFolders);

      api.patch.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useUpdateFolder(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          folderId: "f-1",
          patch: { name: "Renamed Folder", parentId: "p-target" },
          projectId: "proj-1",
        });
      });

      const updated = queryClient.getQueryData(fKey);
      expect(updated[0].name).toBe("Renamed Folder");
      expect(updated[0].parentId).toBe("p-target");
      expect(updated[0].parent_id).toBe("p-target");
    });

    it("rolls back on cycle error", async () => {
      const { queryClient, wrapper } = createWrapper();
      const fKey = queryKeys.folders.byProject("proj-1");

      const initialFolders = [{ id: "f-1", name: "Root", parentId: null, parent_id: null }];
      queryClient.setQueryData(fKey, initialFolders);

      api.patch.mockRejectedValueOnce(new Error("FOLDER_CYCLE"));

      const { result } = renderHook(() => useUpdateFolder(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            folderId: "f-1",
            patch: { parentId: "sub-1" },
            projectId: "proj-1",
          });
        } catch {
          // Expected
        }
      });

      const restored = queryClient.getQueryData(fKey);
      expect(restored[0].parentId).toBeNull();
      expect(restored[0].parent_id).toBeNull();
    });
  });

  describe("useDeleteFolder", () => {
    it("optimistically removes folder from cache immediately", async () => {
      const { queryClient, wrapper } = createWrapper();
      const fKey = queryKeys.folders.byProject("proj-1");

      const initialFolders = [
        { id: "f-1", name: "Keep" },
        { id: "f-2", name: "Delete Me" },
      ];
      queryClient.setQueryData(fKey, initialFolders);

      api.delete.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useDeleteFolder(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          folderId: "f-2",
          projectId: "proj-1",
        });
      });

      const updated = queryClient.getQueryData(fKey);
      expect(updated).toHaveLength(1);
      expect(updated[0].id).toBe("f-1");
    });

    it("rolls back and restores folder if backend returns FOLDER_NOT_EMPTY", async () => {
      const { queryClient, wrapper } = createWrapper();
      const fKey = queryKeys.folders.byProject("proj-1");

      const initialFolders = [{ id: "f-1", name: "Non Empty" }];
      queryClient.setQueryData(fKey, initialFolders);

      api.delete.mockRejectedValueOnce(new Error("FOLDER_NOT_EMPTY"));

      const { result } = renderHook(() => useDeleteFolder(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            folderId: "f-1",
            projectId: "proj-1",
          });
        } catch {
          // Expected
        }
      });

      const restored = queryClient.getQueryData(fKey);
      expect(restored).toHaveLength(1);
      expect(restored[0].name).toBe("Non Empty");
    });
  });

  describe("useCreateFolder (POST /api/projects/:projectId/folders)", () => {
    it("creates collection with custom color, description, and parentId", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialProject = {
        projectContents: {
          collections: [],
          workflows: [],
          media: [],
        },
      };
      queryClient.setQueryData(pKey, initialProject);

      api.post.mockResolvedValueOnce({
        id: "col-new-1",
        name: "Summer Drop 2026",
        color: "#3B82F6",
        description: "Hero images and b-rolls",
        parentId: null,
        assetCount: 0,
      });

      const { result } = renderHook(() => useCreateFolder(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: "proj-1",
          name: "Summer Drop 2026",
          color: "#3B82F6",
          description: "Hero images and b-rolls",
          parentId: null,
        });
      });

      expect(api.post).toHaveBeenCalledWith("/projects/proj-1/folders", {
        name: "Summer Drop 2026",
        color: "#3B82F6",
        description: "Hero images and b-rolls",
        parentId: null,
      });

      const updated = queryClient.getQueryData(pKey);
      expect(updated.projectContents.collections).toHaveLength(1);
      expect(updated.projectContents.collections[0].color).toBe("#3B82F6");
      expect(updated.projectContents.collections[0].description).toBe("Hero images and b-rolls");
    });
  });

  describe("useUpdateFolder (PATCH /api/folders/:folderId dynamic patch)", () => {
    it("dynamically updates color and description in projectData and folders cache", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialProject = {
        projectContents: {
          collections: [
            {
              id: "col-1",
              name: "Social Media Assets",
              color: null,
              description: null,
              parentId: null,
            },
          ],
        },
      };
      queryClient.setQueryData(pKey, initialProject);

      api.patch.mockResolvedValueOnce({
        id: "col-1",
        name: "Social Media Assets",
        color: "#EC4899",
        description: "High resolution visual assets for Instagram and TikTok",
      });

      const { result } = renderHook(() => useUpdateFolder(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          folderId: "col-1",
          patch: {
            color: "#EC4899",
            description: "High resolution visual assets for Instagram and TikTok",
          },
          projectId: "proj-1",
        });
      });

      expect(api.patch).toHaveBeenCalledWith("/folders/col-1", {
        color: "#EC4899",
        description: "High resolution visual assets for Instagram and TikTok",
      });

      const updated = queryClient.getQueryData(pKey);
      expect(updated.projectContents.collections[0].color).toBe("#EC4899");
      expect(updated.projectContents.collections[0].description).toBe(
        "High resolution visual assets for Instagram and TikTok"
      );
    });

    it("resets / clears color and description when null is passed", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialProject = {
        projectContents: {
          collections: [
            {
              id: "col-1",
              name: "Social Media Assets",
              color: "#EC4899",
              description: "Previous note",
            },
          ],
        },
      };
      queryClient.setQueryData(pKey, initialProject);

      api.patch.mockResolvedValueOnce({
        id: "col-1",
        color: null,
        description: null,
      });

      const { result } = renderHook(() => useUpdateFolder(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          folderId: "col-1",
          patch: { color: null, description: null },
          projectId: "proj-1",
        });
      });

      expect(api.patch).toHaveBeenCalledWith("/folders/col-1", {
        color: null,
        description: null,
      });

      const updated = queryClient.getQueryData(pKey);
      expect(updated.projectContents.collections[0].color).toBeNull();
      expect(updated.projectContents.collections[0].description).toBeNull();
    });
  });
});
