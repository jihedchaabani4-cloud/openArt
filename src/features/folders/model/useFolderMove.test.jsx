import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  useFolderMove,
  getParentFolderId,
  resolveMoveOutTarget,
  parseTransferPayload,
} from "./useFolderMove";
import { api } from "@/shared/api/client";

vi.mock("@/shared/api/client", () => ({
  api: {
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

describe("useFolderMove - 2-Layer Move Architecture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Pure helpers: getParentFolderId & resolveMoveOutTarget", () => {
    const folders = [
      { id: "col-root", name: "Root Collection", parentId: null, parent_id: null },
      { id: "col-child", name: "Child Collection", parentId: "col-root", parent_id: "col-root" },
      { id: "col-grandchild", name: "Grandchild", parentId: "col-child", parent_id: "col-child" },
    ];

    it("returns null when folder has no parent (top-level collection)", () => {
      expect(getParentFolderId(folders, "col-root")).toBeNull();
    });

    it("returns parent id when folder is nested", () => {
      expect(getParentFolderId(folders, "col-child")).toBe("col-root");
      expect(getParentFolderId(folders, "col-grandchild")).toBe("col-child");
    });

    it("returns null for unknown folder or empty folder list", () => {
      expect(getParentFolderId(folders, "non-existent")).toBeNull();
      expect(getParentFolderId([], "col-child")).toBeNull();
      expect(getParentFolderId(null, "col-child")).toBeNull();
    });

    it("resolves move-out target using currentFolderId", () => {
      expect(resolveMoveOutTarget({ folders, currentFolderId: "col-child" })).toBe("col-root");
      expect(resolveMoveOutTarget({ folders, currentFolderId: "col-root" })).toBeNull();
    });

    describe("parseTransferPayload helper", () => {
      it("parses HTML5 DataTransfer mock correctly", () => {
        const mockDataTransfer = {
          getData: vi.fn((key) => {
            if (key === "itemType") return "workflow";
            if (key === "workflowId") return "wf-data-1";
            return "";
          }),
        };

        const parsed = parseTransferPayload(mockDataTransfer);
        expect(parsed).toEqual({ itemType: "workflow", itemId: "wf-data-1" });
      });

      it("parses custom event payload correctly", () => {
        const payload = { itemType: "collection", itemId: "col-99" };
        const parsed = parseTransferPayload(payload);
        expect(parsed).toEqual({ itemType: "collection", itemId: "col-99" });
      });

      it("falls back to fallbackDraggedItem when payload is empty", () => {
        const fallback = { type: "workflow", id: "wf-dragged" };
        const parsed = parseTransferPayload(null, fallback);
        expect(parsed).toEqual({ itemType: "workflow", itemId: "wf-dragged" });
      });
    });
  });

  describe("Layer 2: useFolderMove Hook", () => {
    const folders = [
      { id: "col-root", name: "Root Col", parentId: null, parent_id: null },
      { id: "col-child", name: "Child Col", parentId: "col-root", parent_id: "col-root" },
    ];

    it("moveItem: moves workflow to target collection (Move IN)", async () => {
      const { queryClient, wrapper } = createWrapper();
      queryClient.setQueryData(queryKeys.folders.byProject("proj-1"), folders);
      queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), {
        projectContents: {
          workflows: [{ id: "wf-1", folder_id: null, folderId: null }],
        },
      });

      api.patch.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useFolderMove("proj-1"), { wrapper });

      await act(async () => {
        await result.current.moveItem({
          itemType: "workflow",
          itemId: "wf-1",
          targetFolderId: "col-child",
        });
      });

      expect(api.patch).toHaveBeenCalledWith("/assets/wf-1/folder", {
        folderId: "col-child",
      });

      const updated = queryClient.getQueryData(queryKeys.projectData.byProject("proj-1"));
      expect(updated.projectContents.workflows[0].folder_id).toBe("col-child");
    });

    it("moveItem: moves collection into another collection", async () => {
      const { queryClient, wrapper } = createWrapper();
      queryClient.setQueryData(queryKeys.folders.byProject("proj-1"), folders);

      api.patch.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useFolderMove("proj-1"), { wrapper });

      await act(async () => {
        await result.current.moveItem({
          itemType: "collection",
          itemId: "col-child",
          targetFolderId: "col-other",
        });
      });

      expect(api.patch).toHaveBeenCalledWith("/folders/col-child", {
        parentId: "col-other",
      });
    });

    it("moveItemOut: moves workflow out of child collection to parent collection", async () => {
      const { queryClient, wrapper } = createWrapper();
      queryClient.setQueryData(queryKeys.folders.byProject("proj-1"), folders);
      queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), {
        projectContents: {
          workflows: [{ id: "wf-1", folder_id: "col-child", folderId: "col-child" }],
        },
      });

      api.patch.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useFolderMove("proj-1"), { wrapper });

      let moveRes;
      await act(async () => {
        moveRes = await result.current.moveItemOut({
          itemType: "workflow",
          itemId: "wf-1",
          currentFolderId: "col-child",
        });
      });

      expect(moveRes.destinationFolderId).toBe("col-root");
      expect(moveRes.isRoot).toBe(false);
      expect(api.patch).toHaveBeenCalledWith("/assets/wf-1/folder", {
        folderId: "col-root",
      });

      const updated = queryClient.getQueryData(queryKeys.projectData.byProject("proj-1"));
      expect(updated.projectContents.workflows[0].folder_id).toBe("col-root");
    });

    it("moveItemOut: moves workflow out of root collection to null (Root)", async () => {
      const { queryClient, wrapper } = createWrapper();
      queryClient.setQueryData(queryKeys.folders.byProject("proj-1"), folders);
      queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), {
        projectContents: {
          workflows: [{ id: "wf-1", folder_id: "col-root", folderId: "col-root" }],
        },
      });

      api.patch.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useFolderMove("proj-1"), { wrapper });

      let moveRes;
      await act(async () => {
        moveRes = await result.current.moveItemOut({
          itemType: "workflow",
          itemId: "wf-1",
          currentFolderId: "col-root",
        });
      });

      expect(moveRes.destinationFolderId).toBeNull();
      expect(moveRes.isRoot).toBe(true);
      expect(api.patch).toHaveBeenCalledWith("/assets/wf-1/folder", {
        folderId: null,
      });

      const updated = queryClient.getQueryData(queryKeys.projectData.byProject("proj-1"));
      expect(updated.projectContents.workflows[0].folder_id).toBeNull();
    });

    it("moveItemOut: moves collection out of nested collection to parent", async () => {
      const { queryClient, wrapper } = createWrapper();
      queryClient.setQueryData(queryKeys.folders.byProject("proj-1"), folders);

      api.patch.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useFolderMove("proj-1"), { wrapper });

      let moveRes;
      await act(async () => {
        moveRes = await result.current.moveItemOut({
          itemType: "collection",
          itemId: "col-child",
          currentFolderId: "col-child",
        });
      });

      expect(moveRes.destinationFolderId).toBe("col-root");
      expect(api.patch).toHaveBeenCalledWith("/folders/col-child", {
        parentId: "col-root",
      });
    });

    it("matches parent workflow optimistically even when itemId is a nested media ID", async () => {
      const { queryClient, wrapper } = createWrapper();
      queryClient.setQueryData(queryKeys.folders.byProject("proj-1"), folders);
      queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), {
        projectContents: {
          workflows: [
            {
              id: "wf-parent",
              name: "workflows/wf-parent",
              folder_id: null,
              items: [{ id: "media-123", name: "workflows/wf-parent/items/media-123" }],
            },
          ],
        },
      });

      api.patch.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useFolderMove("proj-1"), { wrapper });

      await act(async () => {
        await result.current.moveItem({
          itemType: "workflow",
          itemId: "media-123",
          targetFolderId: "col-root",
        });
      });

      const updated = queryClient.getQueryData(queryKeys.projectData.byProject("proj-1"));
      expect(updated.projectContents.workflows[0].folder_id).toBe("col-root");
    });

    it("executeMoveFromPayload: moves workflow to targetFolderId", async () => {
      const { queryClient, wrapper } = createWrapper();
      queryClient.setQueryData(queryKeys.folders.byProject("proj-1"), folders);
      queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), {
        projectContents: {
          workflows: [{ id: "wf-payload-1", folder_id: null }],
        },
      });

      api.patch.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useFolderMove("proj-1"), { wrapper });

      await act(async () => {
        await result.current.executeMoveFromPayload({
          payload: { itemType: "workflow", itemId: "wf-payload-1" },
          targetFolderId: "col-root",
        });
      });

      expect(api.patch).toHaveBeenCalledWith("/assets/wf-payload-1/folder", {
        folderId: "col-root",
      });
    });

    it("executeMoveFromPayload: moves out when isMoveOut is true", async () => {
      const { queryClient, wrapper } = createWrapper();
      queryClient.setQueryData(queryKeys.folders.byProject("proj-1"), folders);
      queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), {
        projectContents: {
          workflows: [{ id: "wf-payload-2", folder_id: "col-root" }],
        },
      });

      api.patch.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useFolderMove("proj-1"), { wrapper });

      await act(async () => {
        await result.current.executeMoveFromPayload({
          payload: { itemType: "workflow", itemId: "wf-payload-2" },
          currentFolderId: "col-root",
          isMoveOut: true,
        });
      });

      expect(api.patch).toHaveBeenCalledWith("/assets/wf-payload-2/folder", {
        folderId: null,
      });
    });
  });
});
