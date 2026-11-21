import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";

const { mockToast, mockApiPost } = vi.hoisted(() => ({
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(() => "toast-1"),
  },
  mockApiPost: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

vi.mock("@/shared/api/client", () => ({
  api: {
    post: (...args) => mockApiPost(...args),
    delete: vi.fn(),
    patch: vi.fn(),
    getBlob: vi.fn(),
  },
}));

vi.mock("@/features/prompt-bar", () => ({
  promptBarService: vi.fn(() => ({
    addReference: vi.fn(() => ({ ok: true })),
    focus: vi.fn(),
  })),
}));

import {
  useWorkspaceBulkDelete,
  chunkWorkspaceBulkDeletePayload,
} from "../../api/mutations/useWorkspaceBulkDelete";
import {
  useTrashDelete,
  chunkIds,
} from "@/features/trash/api/mutations/useTrashDelete";
import {
  useStudioBulkActions,
  classifyWorkspaceDeleteEntries,
} from "../useStudioBulkActions";

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper };
}

describe("chunkWorkspaceBulkDeletePayload", () => {
  it("returns empty array when no IDs are provided", () => {
    expect(chunkWorkspaceBulkDeletePayload({})).toEqual([]);
    expect(
      chunkWorkspaceBulkDeletePayload({
        folder_ids: [],
        workflow_ids: [null, ""],
        character_ids: [],
        element_ids: [],
      })
    ).toEqual([]);
  });

  it("deduplicates IDs, strips workflows/ prefix, and packs <= 100 IDs into one payload", () => {
    const chunks = chunkWorkspaceBulkDeletePayload({
      folder_ids: ["f1", "f1", "f2"],
      workflow_ids: ["workflows/w1", "w1", "w2"],
      character_ids: ["c1"],
      element_ids: ["e1"],
    });

    expect(chunks).toEqual([
      {
        folder_ids: ["f1", "f2"],
        workflow_ids: ["w1", "w2"],
        character_ids: ["c1"],
        element_ids: ["e1"],
      },
    ]);
  });

  it("splits > 100 total IDs into sequential chunks preserving folder_ids first", () => {
    const folder_ids = Array.from({ length: 60 }, (_, i) => `f-${i + 1}`);
    const workflow_ids = Array.from({ length: 70 }, (_, i) => `w-${i + 1}`);
    const character_ids = Array.from({ length: 10 }, (_, i) => `c-${i + 1}`);
    const element_ids = Array.from({ length: 5 }, (_, i) => `e-${i + 1}`);

    const chunks = chunkWorkspaceBulkDeletePayload(
      { folder_ids, workflow_ids, character_ids, element_ids },
      100
    );

    expect(chunks).toHaveLength(2);
    expect(chunks[0].folder_ids).toHaveLength(60);
    expect(chunks[0].workflow_ids).toHaveLength(40);
    expect(chunks[0].character_ids).toBeUndefined();
    expect(chunks[0].element_ids).toBeUndefined();

    expect(chunks[1].folder_ids).toBeUndefined();
    expect(chunks[1].workflow_ids).toHaveLength(30);
    expect(chunks[1].character_ids).toHaveLength(10);
    expect(chunks[1].element_ids).toHaveLength(5);

    for (const chunk of chunks) {
      const total =
        (chunk.folder_ids?.length || 0) +
        (chunk.workflow_ids?.length || 0) +
        (chunk.character_ids?.length || 0) +
        (chunk.element_ids?.length || 0);
      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThanOrEqual(100);
    }
  });
});

describe("chunkIds", () => {
  it("deduplicates, strips workflows/ prefix, and chunks into <= 100 arrays", () => {
    expect(chunkIds([])).toEqual([]);
    const raw = [
      "workflows/t-1",
      "t-1",
      ...Array.from({ length: 249 }, (_, i) => `t-${i + 2}`),
    ];
    const chunks = chunkIds(raw, 100);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(100);
    expect(chunks[1]).toHaveLength(100);
    expect(chunks[2]).toHaveLength(50);
    expect(chunks[0][0]).toBe("t-1");
  });
});

describe("useWorkspaceBulkDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes chunks sequentially, aggregates results, updates caches, and invalidates queries", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");
    const fKey = queryKeys.folders.byProject("proj-1");

    queryClient.setQueryData(fKey, [
      { id: "f-del", name: "Deleted Folder", children: [{ id: "f-child", name: "Child" }] },
      { id: "f-keep", name: "Surviving Folder" },
    ]);
    queryClient.setQueryData(pKey, {
      projectContents: {
        collections: [{ id: "f-del" }, { id: "f-child" }, { id: "f-keep" }],
        folders: [{ id: "f-del" }, { id: "f-child" }, { id: "f-keep" }],
        workflows: [
          { id: "w-1", folder_id: "f-del", display_name: "Trashed One" },
          { id: "w-survive-in-deleted-folder", folder_id: "f-del", display_name: "Detached" },
          { id: "w-keep", folder_id: "f-keep", display_name: "Kept" },
        ],
        trashedWorkflows: [],
        characters: [
          { id: "char-orphan", workflow_id: null },
          { id: "char-keep", workflow_id: "w-keep" },
        ],
        elements: [
          { id: "el-orphan", workflow_id: null },
          { id: "el-keep", workflow_id: "w-keep" },
        ],
        media: [
          { id: "m-1", workflowId: "w-1" },
          { id: "m-keep", workflowId: "w-keep" },
        ],
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const manyWorkflowIds = Array.from({ length: 105 }, (_, i) => `w-${i + 1}`);

    mockApiPost
      .mockResolvedValueOnce({
        ok: true,
        deleted_folder_ids: ["f-del", "f-child"],
        trashed_workflow_ids: ["w-1"],
        already_trashed_workflow_ids: [],
        deleted_orphan_character_ids: [],
        deleted_orphan_element_ids: [],
      })
      .mockResolvedValueOnce({
        ok: true,
        deleted_folder_ids: [],
        trashed_workflow_ids: ["w-105"],
        already_trashed_workflow_ids: ["w-already"],
        deleted_orphan_character_ids: ["char-orphan"],
        deleted_orphan_element_ids: ["el-orphan"],
      });

    const { result } = renderHook(() => useWorkspaceBulkDelete(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({
        projectId: "proj-1",
        folder_ids: ["f-del"],
        workflow_ids: manyWorkflowIds,
        character_ids: ["char-orphan"],
        element_ids: ["el-orphan"],
      });
    });

    expect(mockApiPost).toHaveBeenCalledTimes(2);
    expect(mockApiPost.mock.calls[0][0]).toBe("/workspace/bulk-delete");
    expect(mockApiPost.mock.calls[0][1].folder_ids).toEqual(["f-del"]);
    expect(mockApiPost.mock.calls[0][1].workflow_ids).toHaveLength(99);
    expect(mockApiPost.mock.calls[1][0]).toBe("/workspace/bulk-delete");
    expect(mockApiPost.mock.calls[1][1].workflow_ids).toHaveLength(6);
    expect(mockApiPost.mock.calls[1][1].character_ids).toEqual(["char-orphan"]);
    expect(mockApiPost.mock.calls[1][1].element_ids).toEqual(["el-orphan"]);

    expect(response).toEqual({
      ok: true,
      deleted_folder_ids: ["f-del", "f-child"],
      trashed_workflow_ids: ["w-1", "w-105"],
      already_trashed_workflow_ids: ["w-already"],
      deleted_orphan_character_ids: ["char-orphan"],
      deleted_orphan_element_ids: ["el-orphan"],
    });

    // Folder cache updated
    expect(queryClient.getQueryData(fKey)).toEqual([{ id: "f-keep", name: "Surviving Folder" }]);

    // Project cache updated: trashed removed, surviving workflow in deleted folder cleared, orphans removed
    const updatedProject = queryClient.getQueryData(pKey);
    expect(updatedProject.projectContents.collections).toEqual([{ id: "f-keep" }]);
    expect(updatedProject.projectContents.workflows.map((w) => w.id)).toEqual([
      "w-survive-in-deleted-folder",
      "w-keep",
    ]);
    expect(updatedProject.projectContents.workflows[0].folder_id).toBeNull();
    expect(updatedProject.projectContents.trashedWorkflows.map((w) => w.id)).toEqual(["w-1"]);
    expect(updatedProject.projectContents.characters.map((c) => c.id)).toEqual(["char-keep"]);
    expect(updatedProject.projectContents.elements.map((e) => e.id)).toEqual(["el-keep"]);
    expect(updatedProject.projectContents.media.map((m) => m.id)).toEqual(["m-keep"]);

    // Invalidations triggered
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: pKey });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: fKey });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.trash.all() });
  });

  it("invalidates projectData & folders on 404/400 stale ID error and surfaces user-friendly message", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const err404 = Object.assign(new Error("API error: 404 Not Found"), { status: 404 });
    mockApiPost.mockRejectedValueOnce(err404);

    const { result } = renderHook(() => useWorkspaceBulkDelete(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ projectId: "proj-1", workflow_ids: ["stale-1"] })
      ).rejects.toThrow(/refreshed/i);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projectData.byProject("proj-1"),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.folders.byProject("proj-1"),
    });
    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringMatching(/refreshed/i),
      expect.any(Object)
    );
  });

  it("surfaces exact 429 rate-limit message", async () => {
    const { wrapper } = createQueryWrapper();
    const err429 = Object.assign(new Error("API error: 429 Too Many Requests"), { status: 429 });
    mockApiPost.mockRejectedValueOnce(err429);

    const { result } = renderHook(() => useWorkspaceBulkDelete(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ projectId: "proj-1", workflow_ids: ["w-1"] })
      ).rejects.toThrow("Too many bulk delete requests, please wait a moment");
    });

    expect(mockToast.error).toHaveBeenCalledWith(
      "Too many bulk delete requests, please wait a moment",
      expect.any(Object)
    );
  });

  it("handles plain Error messages from apiRequest without status/errorCode (not found & rate limit)", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    // Plain 404 message from apiRequest (no .status property)
    mockApiPost.mockRejectedValueOnce(new Error("Folder not found"));
    const { result } = renderHook(() => useWorkspaceBulkDelete(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ projectId: "proj-1", folder_ids: ["f-gone"] })
      ).rejects.toThrow("Folder not found");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projectData.byProject("proj-1"),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.folders.byProject("proj-1"),
    });

    // Plain 429 message from apiRequest (no .status property)
    mockApiPost.mockRejectedValueOnce(new Error("Rate limit exceeded"));
    await act(async () => {
      await expect(
        result.current.mutateAsync({ projectId: "proj-1", workflow_ids: ["w-1"] })
      ).rejects.toThrow("Too many bulk delete requests, please wait a moment");
    });
  });
});

describe("useTrashDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Mode A chunks workflow_ids <= 100, never sends all, aggregates totals, and updates cache", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");
    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [],
        trashedWorkflows: [
          { id: "t-1", deleted_at: "2026-01-01T00:00:00Z" },
          { id: "t-101", deleted_at: "2026-01-01T00:00:00Z" },
          { id: "t-keep", deleted_at: "2026-01-01T00:00:00Z" },
        ],
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const ids = Array.from({ length: 105 }, (_, i) => `t-${i + 1}`);
    mockApiPost
      .mockResolvedValueOnce({
        ok: true,
        deleted_workflow_ids: ids.slice(0, 100),
        count: 100,
        deleted_media_count: 120,
        storage_failures: [],
      })
      .mockResolvedValueOnce({
        ok: true,
        deleted_workflow_ids: ids.slice(100),
        count: 5,
        deleted_media_count: 8,
        storage_failures: [{ key: "bad-key" }],
      });

    const { result } = renderHook(() => useTrashDelete(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({ projectId: "proj-1", workflowIds: ids });
    });

    expect(mockApiPost).toHaveBeenCalledTimes(2);
    expect(mockApiPost.mock.calls[0]).toEqual(["/trash/delete", { workflow_ids: ids.slice(0, 100) }]);
    expect(mockApiPost.mock.calls[1]).toEqual(["/trash/delete", { workflow_ids: ids.slice(100) }]);
    expect("all" in mockApiPost.mock.calls[0][1]).toBe(false);

    expect(response).toEqual({
      ok: true,
      deleted_workflow_ids: ids,
      count: 105,
      deleted_media_count: 128,
      storage_failures: [{ key: "bad-key" }],
    });

    expect(queryClient.getQueryData(pKey).projectContents.trashedWorkflows.map((w) => w.id)).toEqual([
      "t-keep",
    ]);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: pKey });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.trash.all() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.library.all() });
  });

  it("Mode B sends { all: true, project_id } without workflow_ids and clears trashedWorkflows", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");
    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [{ id: "active-1" }],
        trashedWorkflows: [{ id: "t-1" }, { id: "t-2" }],
      },
    });

    mockApiPost.mockResolvedValueOnce({
      ok: true,
      deleted_workflow_ids: ["t-1", "t-2"],
      count: 2,
      deleted_media_count: 4,
      storage_failures: 0,
    });

    const { result } = renderHook(() => useTrashDelete(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({
        projectId: "proj-1",
        workflowIds: ["should-be-ignored"],
        all: true,
      });
    });

    expect(mockApiPost).toHaveBeenCalledTimes(1);
    expect(mockApiPost).toHaveBeenCalledWith("/trash/delete", {
      all: true,
      project_id: "proj-1",
    });
    expect("workflow_ids" in mockApiPost.mock.calls[0][1]).toBe(false);
    expect(response).toMatchObject({
      ok: true,
      deleted_workflow_ids: ["t-1", "t-2"],
      count: 2,
      deleted_media_count: 4,
      storage_failures: 0,
    });
    expect(queryClient.getQueryData(pKey).projectContents.trashedWorkflows).toEqual([]);
  });

  it("handles 400 WORKFLOW_NOT_IN_TRASH by invalidating caches and surfacing clear message", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const err = Object.assign(new Error("WORKFLOW_NOT_IN_TRASH"), {
      status: 400,
      errorCode: "WORKFLOW_NOT_IN_TRASH",
    });
    mockApiPost.mockRejectedValueOnce(err);

    const { result } = renderHook(() => useTrashDelete(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ projectId: "proj-1", workflowIds: ["active-wf"] })
      ).rejects.toThrow(/no longer in Trash/i);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projectData.byProject("proj-1"),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.trash.all() });
    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringMatching(/no longer in Trash/i),
      expect.any(Object)
    );
  });

  it("surfaces exact 429 rate-limit message on Trash delete", async () => {
    const { wrapper } = createQueryWrapper();
    const err429 = Object.assign(new Error("API error: 429"), { status: 429 });
    mockApiPost.mockRejectedValueOnce(err429);

    const { result } = renderHook(() => useTrashDelete(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ projectId: "proj-1", all: true })
      ).rejects.toThrow("Too many bulk delete requests, please wait a moment");
    });

    expect(mockToast.error).toHaveBeenCalledWith(
      "Too many bulk delete requests, please wait a moment",
      expect.any(Object)
    );
  });

  it("handles plain Error messages from apiRequest without status/errorCode (not in trash, not found, rate limit)", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useTrashDelete(), { wrapper });

    // Plain "Workflow is not in trash"
    mockApiPost.mockRejectedValueOnce(new Error("Workflow is not in trash"));
    await act(async () => {
      await expect(
        result.current.mutateAsync({ projectId: "proj-1", workflowIds: ["w-active"] })
      ).rejects.toThrow(/no longer in Trash/i);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projectData.byProject("proj-1"),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.trash.all() });

    invalidateSpy.mockClear();

    // Plain "Item not found"
    mockApiPost.mockRejectedValueOnce(new Error("Item not found"));
    await act(async () => {
      await expect(
        result.current.mutateAsync({ projectId: "proj-1", workflowIds: ["w-gone"] })
      ).rejects.toThrow("Item not found");
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projectData.byProject("proj-1"),
    });

    // Plain "Rate limit exceeded"
    mockApiPost.mockRejectedValueOnce(new Error("Rate limit exceeded"));
    await act(async () => {
      await expect(
        result.current.mutateAsync({ projectId: "proj-1", all: true })
      ).rejects.toThrow("Too many bulk delete requests, please wait a moment");
    });
  });
});

describe("useStudioBulkActions — Explicit-Intent Bulk Delete wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("classifies collections, workflow-backed chars/elements, and orphan chars/elements accurately", () => {
    const entries = [
      { key: "collection:f-1", itemType: "collection", id: "f-1" },
      {
        key: "workflow:wf-gen",
        itemType: "workflow",
        id: "workflows/wf-gen",
        workflow: { id: "wf-gen", category: "generation" },
      },
      {
        key: "workflow:wf-char",
        itemType: "workflow",
        id: "wf-char",
        workflow: {
          id: "wf-char",
          category: "character",
          workflow_type: "CHARACTER",
          character: { id: "c-backed", workflow_id: "wf-char" },
        },
      },
      {
        key: "workflow:c-orphan",
        itemType: "workflow",
        id: "c-orphan",
        workflow: { id: "c-orphan", category: "character", workflow_id: null },
      },
      {
        key: "workflow:e-orphan",
        itemType: "workflow",
        id: "e-orphan",
        workflow: { id: "e-orphan", category: "element", workflow_id: null },
      },
    ];

    expect(classifyWorkspaceDeleteEntries(entries, "assets")).toEqual({
      folder_ids: ["f-1"],
      workflow_ids: ["wf-gen", "wf-char"],
      character_ids: ["c-orphan"],
      element_ids: ["e-orphan"],
    });
  });

  it("invokes onNavigateUp when currentFolderId is inside deleted_folder_ids", async () => {
    const { wrapper } = createQueryWrapper();
    const clearSelection = vi.fn();
    const onNavigateUp = vi.fn();

    mockApiPost.mockResolvedValueOnce({
      ok: true,
      deleted_folder_ids: ["f-parent", "f-current"],
      trashed_workflow_ids: ["w-1"],
      already_trashed_workflow_ids: [],
      deleted_orphan_character_ids: [],
      deleted_orphan_element_ids: [],
    });

    const entries = [
      { key: "collection:f-parent", itemType: "collection", id: "f-parent" },
      { key: "workflow:w-1", itemType: "workflow", id: "w-1" },
    ];

    const { result } = renderHook(
      () =>
        useStudioBulkActions({
          projectId: "proj-1",
          scope: "collection",
          selectedEntries: entries,
          clearSelection,
          currentFolderId: "f-current",
          onNavigateUp,
        }),
      { wrapper }
    );

    expect(result.current.needsDeleteConfirm).toBe(true);

    await act(async () => {
      await result.current.bulkDelete();
    });

    expect(mockApiPost).toHaveBeenCalledWith("/workspace/bulk-delete", {
      folder_ids: ["f-parent"],
      workflow_ids: ["w-1"],
    });
    expect(onNavigateUp).toHaveBeenCalledWith(["f-parent", "f-current"]);
    expect(clearSelection).toHaveBeenCalledTimes(1);
    expect(mockToast.success).toHaveBeenCalledWith(
      "Deleted 2 folders and moved 1 item to Trash"
    );
  });

  it("calls POST /trash/delete on trash scope and switches to Mode B when allTrashSelected && > 100", async () => {
    const { wrapper } = createQueryWrapper();
    const clearSelection = vi.fn();
    const manyEntries = Array.from({ length: 101 }, (_, i) => ({
      key: `workflow:t-${i + 1}`,
      itemType: "workflow",
      id: `t-${i + 1}`,
    }));

    mockApiPost.mockResolvedValueOnce({
      ok: true,
      deleted_workflow_ids: manyEntries.map((e) => e.id),
      count: 101,
      deleted_media_count: 101,
      storage_failures: [],
    });

    const { result } = renderHook(
      () =>
        useStudioBulkActions({
          projectId: "proj-1",
          scope: "trash",
          selectedEntries: manyEntries,
          clearSelection,
          allTrashSelected: true,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.bulkDelete();
    });

    expect(mockApiPost).toHaveBeenCalledWith("/trash/delete", {
      all: true,
      project_id: "proj-1",
    });
    expect(clearSelection).toHaveBeenCalledTimes(1);
    expect(mockToast.success).toHaveBeenCalledWith("Permanently deleted 101 items");
  });
});
