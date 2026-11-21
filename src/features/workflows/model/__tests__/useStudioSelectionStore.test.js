import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";

const {
  mockToast,
  mockApiDelete,
  mockApiPatch,
  mockApiPost,
  mockApiGetBlob,
  mockDownloadBlob,
  mockDownloadMediaItem,
  mockZipFiles,
  mockZipGenerateAsync,
  mockAddReference,
  mockFocus,
  mockPromptBarService,
} = vi.hoisted(() => {
  const addRef = vi.fn();
  const focus = vi.fn();
  return {
    mockToast: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
      loading: vi.fn(() => "toast-1"),
    },
    mockApiDelete: vi.fn(),
    mockApiPatch: vi.fn(),
    mockApiPost: vi.fn(),
    mockApiGetBlob: vi.fn(),
    mockDownloadBlob: vi.fn(),
    mockDownloadMediaItem: vi.fn(),
    mockZipFiles: [],
    mockZipGenerateAsync: vi.fn(),
    mockAddReference: addRef,
    mockFocus: focus,
    mockPromptBarService: vi.fn(() => ({
      addReference: (...args) => addRef(...args),
      focus: (...args) => focus(...args),
    })),
  };
});

vi.mock("sonner", () => ({
  toast: mockToast,
}));

vi.mock("@/shared/api/client", () => ({
  api: {
    delete: (...args) => mockApiDelete(...args),
    patch: (...args) => mockApiPatch(...args),
    post: (...args) => mockApiPost(...args),
    getBlob: (...args) => mockApiGetBlob(...args),
  },
}));

vi.mock("@/shared/lib/utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    downloadBlob: (...args) => mockDownloadBlob(...args),
  };
});

vi.mock("@/features/media/api/lib/downloadMediaItem", () => ({
  downloadMediaItem: (...args) => mockDownloadMediaItem(...args),
}));

vi.mock("jszip", () => {
  class FakeFolder {
    constructor(prefix = "") {
      this.prefix = prefix;
    }
    file(name, data) {
      mockZipFiles.push({ path: this.prefix ? `${this.prefix}/${name}` : name, data });
      return this;
    }
    folder(name) {
      return new FakeFolder(this.prefix ? `${this.prefix}/${name}` : name);
    }
    generateAsync(opts) {
      return mockZipGenerateAsync(opts);
    }
  }
  return {
    default: FakeFolder,
  };
});

vi.mock("@/features/prompt-bar", () => ({
  promptBarService: (...args) => mockPromptBarService(...args),
}));

import {
  useStudioSelectionStore,
  makeSelectionKey,
  parseSelectionKey,
  getEntrySelectionKey,
} from "../useStudioSelectionStore";
import { useStudioBulkActions } from "../useStudioBulkActions";
import { useRemoveWorkflow } from "../../api/mutations/useRemoveWorkflow";

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

describe("Selection Key Helpers", () => {
  it("builds and parses canonical workflow and collection keys", () => {
    expect(makeSelectionKey("workflow", "wf-1")).toBe("workflow:wf-1");
    expect(makeSelectionKey("collection", "col-2")).toBe("collection:col-2");
    expect(makeSelectionKey("workflow", "")).toBeNull();
    expect(makeSelectionKey(null, "wf-1")).toBeNull();

    expect(parseSelectionKey("workflow:wf-1")).toEqual({ itemType: "workflow", id: "wf-1" });
    expect(parseSelectionKey("collection:col:nested")).toEqual({
      itemType: "collection",
      id: "col:nested",
    });
    expect(parseSelectionKey("invalid")).toEqual({ itemType: null, id: null });
    expect(parseSelectionKey("other:123")).toEqual({ itemType: null, id: null });
    expect(parseSelectionKey(null)).toEqual({ itemType: null, id: null });
  });

  it("resolves keys from normalized grid entries, photo objects, and raw workflows", () => {
    // Normalized grid entries
    expect(getEntrySelectionKey({ type: "collection", data: { id: "col-1" } })).toBe("collection:col-1");
    expect(getEntrySelectionKey({ type: "workflow", data: { id: "wf-1" } })).toBe("workflow:wf-1");

    // Photo objects
    expect(getEntrySelectionKey({ itemType: "collection", collection: { id: "col-2" } })).toBe(
      "collection:col-2"
    );
    expect(getEntrySelectionKey({ itemType: "workflow", workflow: { id: "wf-2" } })).toBe("workflow:wf-2");

    // Raw workflow objects
    expect(getEntrySelectionKey({ id: "wf-3", name: "My Workflow" })).toBe("workflow:wf-3");
    expect(getEntrySelectionKey({ name: "wf-named" })).toBe("workflow:wf-named");

    // Invalid inputs
    expect(getEntrySelectionKey(null)).toBeNull();
    expect(getEntrySelectionKey({})).toBeNull();
  });
});

describe("useStudioSelectionStore", () => {
  beforeEach(() => {
    useStudioSelectionStore.setState({
      scopeKey: null,
      selectedKeys: [],
      lastSelectedKey: null,
    });
  });

  it("resets selection when scope changes and no-ops when scope is unchanged", () => {
    useStudioSelectionStore.getState().setScope("assets:proj-1");
    useStudioSelectionStore.getState().toggleItem("workflow:wf-1");
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:wf-1"]);

    const listener = vi.fn();
    const unsub = useStudioSelectionStore.subscribe(listener);

    // Same scope -> no-op
    useStudioSelectionStore.getState().setScope("assets:proj-1");
    expect(listener).not.toHaveBeenCalled();
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:wf-1"]);

    // New scope -> clears selection
    useStudioSelectionStore.getState().setScope("elements:proj-1");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(useStudioSelectionStore.getState()).toMatchObject({
      scopeKey: "elements:proj-1",
      selectedKeys: [],
      lastSelectedKey: null,
    });

    unsub();
  });

  it("toggles single items and supports Shift-click range selection (forward & backward)", () => {
    const ordered = ["collection:c1", "workflow:w1", "workflow:w2", "workflow:w3", "workflow:w4"];

    useStudioSelectionStore.getState().toggleItem("workflow:w1", { orderedKeys: ordered });
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:w1"]);
    expect(useStudioSelectionStore.getState().lastSelectedKey).toBe("workflow:w1");

    // Forward Shift-click to w3 selects w1..w3
    useStudioSelectionStore.getState().toggleItem("workflow:w3", {
      shiftKey: true,
      orderedKeys: ordered,
    });
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "workflow:w1",
      "workflow:w2",
      "workflow:w3",
    ]);
    expect(useStudioSelectionStore.getState().lastSelectedKey).toBe("workflow:w3");

    // Backward Shift-click to c1 preserves existing & adds c1
    useStudioSelectionStore.getState().toggleItem("collection:c1", {
      shiftKey: true,
      orderedKeys: ordered,
    });
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "workflow:w1",
      "workflow:w2",
      "workflow:w3",
      "collection:c1",
    ]);
    expect(useStudioSelectionStore.getState().lastSelectedKey).toBe("collection:c1");

    // Untoggle last remaining item resets lastSelectedKey to null
    useStudioSelectionStore.getState().clearSelection();
    useStudioSelectionStore.getState().toggleItem("workflow:w1");
    useStudioSelectionStore.getState().toggleItem("workflow:w1");
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);
    expect(useStudioSelectionStore.getState().lastSelectedKey).toBeNull();
  });

  it("toggles groups additively and removes group when all are selected", () => {
    useStudioSelectionStore.getState().toggleItem("workflow:outside");

    // Partial -> adds missing
    useStudioSelectionStore.getState().toggleItem("workflow:g1");
    useStudioSelectionStore.getState().toggleGroup(["workflow:g1", "workflow:g2", "workflow:g3"]);
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "workflow:outside",
      "workflow:g1",
      "workflow:g2",
      "workflow:g3",
    ]);

    // All selected -> removes group, keeps outside
    useStudioSelectionStore.getState().toggleGroup(["workflow:g1", "workflow:g2", "workflow:g3"]);
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:outside"]);
  });

  it("selectAll deduplicates and pruneToVisible no-ops when nothing changed", () => {
    useStudioSelectionStore.getState().selectAll(["workflow:w1", "workflow:w2", "workflow:w1", null]);
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:w1", "workflow:w2"]);

    const listener = vi.fn();
    const unsub = useStudioSelectionStore.subscribe(listener);

    // All selected keys are still visible -> no-op
    useStudioSelectionStore.getState().pruneToVisible(["workflow:w1", "workflow:w2", "workflow:w3"]);
    expect(listener).not.toHaveBeenCalled();

    // w2 filtered out -> prunes to w1
    useStudioSelectionStore.getState().pruneToVisible(["workflow:w1", "workflow:w3"]);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:w1"]);

    unsub();
  });
});

describe("useRemoveWorkflow — Batch Optimistic Cache Update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("optimistically moves ALL batch-deleted active workflows into trashedWorkflows", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");

    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [
          { id: "wf-1", display_name: "First", metadata: {} },
          { id: "wf-2", display_name: "Second", metadata: {} },
          { id: "wf-3", display_name: "Third", metadata: {} },
        ],
        trashedWorkflows: [],
        characters: [],
        elements: [],
        media: [
          { id: "m-1", workflowId: "wf-1" },
          { id: "m-2", workflowId: "wf-2" },
          { id: "m-3", workflowId: "wf-3" },
        ],
      },
    });

    mockApiDelete.mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() => useRemoveWorkflow(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        workflowIds: ["wf-1", "wf-2"],
        projectId: "proj-1",
      });
    });

    const updated = queryClient.getQueryData(pKey);
    expect(updated.projectContents.workflows.map((w) => w.id)).toEqual(["wf-3"]);
    expect(updated.projectContents.trashedWorkflows.map((w) => w.id)).toEqual(["wf-1", "wf-2"]);
    expect(updated.projectContents.trashedWorkflows.every((w) => Boolean(w.deleted_at))).toBe(true);
    expect(updated.projectContents.media.map((m) => m.id)).toEqual(["m-3"]);
  });

  it("permanently deletes ALL batch-deleted trashed workflows without re-adding them", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");

    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [],
        trashedWorkflows: [
          { id: "t-1", deleted_at: "2026-01-01T00:00:00Z" },
          { id: "t-2", deleted_at: "2026-01-01T00:00:00Z" },
          { id: "t-3", deleted_at: "2026-01-01T00:00:00Z" },
        ],
        characters: [],
        elements: [],
        media: [],
      },
    });

    mockApiDelete.mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() => useRemoveWorkflow(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        workflowIds: ["t-1", "t-2"],
        projectId: "proj-1",
      });
    });

    const updated = queryClient.getQueryData(pKey);
    expect(updated.projectContents.trashedWorkflows.map((w) => w.id)).toEqual(["t-3"]);
  });
});

describe("useStudioBulkActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockZipFiles.length = 0;
    mockZipGenerateAsync.mockResolvedValue(new Blob(["zip-bytes"]));
    mockApiGetBlob.mockResolvedValue(new Blob(["media-bytes"]));
    mockAddReference.mockReturnValue({ ok: true });
    useStudioSelectionStore.setState({
      scopeKey: "assets:proj-1",
      selectedKeys: [],
      lastSelectedKey: null,
    });
  });

  it("computes capability flags accurately across scopes and compositions", () => {
    const { wrapper } = createQueryWrapper();

    const wfEntries = [
      { key: "workflow:w1", itemType: "workflow", id: "w1", workflow: { id: "w1", metadata: { favorited: true } } },
    ];
    const mixedEntries = [
      ...wfEntries,
      { key: "collection:c1", itemType: "collection", id: "c1", collection: { id: "c1", name: "Folder A" } },
    ];

    const { result: assetsWf } = renderHook(
      () => useStudioBulkActions({ projectId: "proj-1", scope: "assets", selectedEntries: wfEntries }),
      { wrapper }
    );
    expect(assetsWf.current).toMatchObject({
      hasWorkflows: true,
      hasCollections: false,
      workflowCount: 1,
      collectionCount: 0,
      canDownload: true,
      canMove: true,
      canLike: true,
      canAddToPrompt: true,
      isAllLiked: true,
      needsDeleteConfirm: true,
    });

    const { result: assetsMixed } = renderHook(
      () => useStudioBulkActions({ projectId: "proj-1", scope: "assets", selectedEntries: mixedEntries }),
      { wrapper }
    );
    expect(assetsMixed.current).toMatchObject({
      hasWorkflows: true,
      hasCollections: true,
      canDownload: true,
      canMove: true,
      canLike: false,
      canAddToPrompt: false,
      needsDeleteConfirm: true,
    });

    const { result: trashState } = renderHook(
      () => useStudioBulkActions({ projectId: "proj-1", scope: "trash", selectedEntries: wfEntries }),
      { wrapper }
    );
    expect(trashState.current).toMatchObject({
      canDownload: false,
      canMove: false,
      canLike: false,
      canAddToPrompt: false,
      needsDeleteConfirm: true,
    });
  });

  it("bulkDownload uses direct downloadMediaItem for 1 single-media workflow and JSZip for collections/multi-select", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");
    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [
          {
            id: "w-in-col",
            display_name: "Scene 1",
            folder_id: "c1",
            items: [{ id: "m-col", url: "https://cdn.example.com/scene1.png" }],
          },
        ],
        media: [],
        collections: [{ id: "c1", name: "Act One" }],
      },
    });

    // 1. Single workflow -> direct downloadMediaItem
    const singleEntry = [
      {
        key: "workflow:w1",
        itemType: "workflow",
        id: "w1",
        workflow: { id: "w1", display_name: "Hero Shot" },
        mediaUrl: "https://cdn.example.com/hero.png",
      },
    ];
    const { result: singleHook } = renderHook(
      () => useStudioBulkActions({ projectId: "proj-1", scope: "assets", selectedEntries: singleEntry }),
      { wrapper }
    );

    await act(async () => {
      await singleHook.current.bulkDownload();
    });
    expect(mockDownloadMediaItem).toHaveBeenCalledWith("https://cdn.example.com/hero.png", "Hero Shot.png");
    expect(mockDownloadBlob).not.toHaveBeenCalled();

    // 2. Collection + workflow -> JSZip archive
    const multiEntries = [
      ...singleEntry,
      { key: "collection:c1", itemType: "collection", id: "c1", collection: { id: "c1", name: "Act One" } },
    ];
    const { result: multiHook } = renderHook(
      () => useStudioBulkActions({ projectId: "proj-1", scope: "assets", selectedEntries: multiEntries }),
      { wrapper }
    );

    await act(async () => {
      await multiHook.current.bulkDownload();
    });
    expect(mockApiGetBlob).toHaveBeenCalledWith("https://cdn.example.com/hero.png");
    expect(mockApiGetBlob).toHaveBeenCalledWith("https://cdn.example.com/scene1.png");
    expect(mockZipFiles.map((f) => f.path)).toEqual(["Hero Shot.png", "Act One/Scene 1.png"]);
    expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
  });

  it("bulkToggleLike sends batch favorited toggle", async () => {
    const { wrapper } = createQueryWrapper();
    mockApiPatch.mockResolvedValueOnce({ ok: true });

    const entries = [
      { key: "workflow:w1", itemType: "workflow", id: "w1", workflow: { id: "w1", metadata: { favorited: false } } },
      { key: "workflow:w2", itemType: "workflow", id: "w2", workflow: { id: "w2", metadata: { favorited: true } } },
    ];
    const { result } = renderHook(
      () => useStudioBulkActions({ projectId: "proj-1", scope: "assets", selectedEntries: entries }),
      { wrapper }
    );

    await act(async () => {
      await result.current.bulkToggleLike();
    });

    expect(mockApiPatch).toHaveBeenCalledWith("/workflows/workflows/like", {
      workflow_ids: ["w1", "w2"],
      favorited: true,
    });
    expect(mockToast.success).toHaveBeenCalled();
  });

  it("bulkMoveToFolder moves workflows and folders while skipping moving a folder into itself", async () => {
    const { wrapper } = createQueryWrapper();
    mockApiPatch.mockResolvedValue({ ok: true });
    const clearSelection = vi.fn();

    const entries = [
      { key: "workflow:w1", itemType: "workflow", id: "w1" },
      { key: "collection:c-target", itemType: "collection", id: "c-target" },
      { key: "collection:c-other", itemType: "collection", id: "c-other" },
    ];
    const { result } = renderHook(
      () =>
        useStudioBulkActions({
          projectId: "proj-1",
          scope: "assets",
          selectedEntries: entries,
          clearSelection,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.bulkMoveToFolder("c-target");
    });

    expect(mockApiPatch).toHaveBeenCalledTimes(2);
    expect(mockApiPatch).toHaveBeenCalledWith("/assets/w1/folder", { folderId: "c-target" });
    expect(mockApiPatch).toHaveBeenCalledWith("/folders/c-other", { parentId: "c-target" });
    expect(clearSelection).toHaveBeenCalledTimes(1);
  });

  it("bulkDelete sends POST /workspace/bulk-delete for folders+workflows and keeps selection on error", async () => {
    const { wrapper } = createQueryWrapper();
    const clearSelection = vi.fn();

    mockApiPost.mockRejectedValueOnce(
      Object.assign(new Error("API error: 429 Too Many Requests"), { status: 429 })
    );

    const entries = [
      { key: "workflow:w1", itemType: "workflow", id: "w1" },
      { key: "collection:c-full", itemType: "collection", id: "c-full" },
    ];
    useStudioSelectionStore.getState().selectAll(["workflow:w1", "collection:c-full"]);

    const { result } = renderHook(
      () =>
        useStudioBulkActions({
          projectId: "proj-1",
          scope: "assets",
          selectedEntries: entries,
          clearSelection,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.bulkDelete();
    });

    expect(mockApiPost).toHaveBeenCalledWith("/workspace/bulk-delete", {
      folder_ids: ["c-full"],
      workflow_ids: ["w1"],
    });
    expect(mockToast.error).toHaveBeenCalledWith(
      "Too many bulk delete requests, please wait a moment",
      expect.any(Object)
    );
    expect(clearSelection).not.toHaveBeenCalled();
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "workflow:w1",
      "collection:c-full",
    ]);
  });

  it("bulkRestore restores trashed workflows and clears selection", async () => {
    const { wrapper } = createQueryWrapper();
    const clearSelection = vi.fn();
    mockApiPost.mockResolvedValue({ ok: true });

    const entries = [
      { key: "workflow:t1", itemType: "workflow", id: "t1" },
      { key: "workflow:t2", itemType: "workflow", id: "t2" },
    ];
    const { result } = renderHook(
      () =>
        useStudioBulkActions({
          projectId: "proj-1",
          scope: "trash",
          selectedEntries: entries,
          clearSelection,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.bulkRestore();
    });

    expect(mockApiPost).toHaveBeenCalledWith("/trash/t1/restore");
    expect(mockApiPost).toHaveBeenCalledWith("/trash/t2/restore");
    expect(clearSelection).toHaveBeenCalledTimes(1);
  });

  it("bulkAddToPrompt attaches only completed non-video workflows via public promptBarService", () => {
    const { wrapper } = createQueryWrapper();
    const clearSelection = vi.fn();

    const entries = [
      {
        key: "workflow:w-img",
        itemType: "workflow",
        id: "w-img",
        workflow: {
          id: "w-img",
          display_name: "Portrait",
          items: [{ id: "m1", url: "https://cdn.example.com/portrait.png", mediaMetadata: { status: "completed" } }],
        },
      },
      {
        key: "workflow:w-vid",
        itemType: "workflow",
        id: "w-vid",
        workflow: {
          id: "w-vid",
          items: [{ id: "m2", url: "https://cdn.example.com/clip.mp4", isVideo: true, mediaMetadata: { status: "completed" } }],
        },
      },
      {
        key: "workflow:w-pending",
        itemType: "workflow",
        id: "w-pending",
        workflow: {
          id: "w-pending",
          items: [{ id: "m3", url: null, mediaMetadata: { status: "processing" } }],
        },
      },
    ];

    const { result } = renderHook(
      () =>
        useStudioBulkActions({
          projectId: "proj-1",
          scope: "assets",
          selectedEntries: entries,
          clearSelection,
        }),
      { wrapper }
    );

    act(() => {
      result.current.bulkAddToPrompt();
    });

    expect(mockPromptBarService).toHaveBeenCalledWith({
      templateId: "generated-media",
      projectId: "proj-1",
    });
    expect(mockAddReference).toHaveBeenCalledTimes(1);
    expect(mockAddReference).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://cdn.example.com/portrait.png",
        workflow_id: "w-img",
      })
    );
    expect(mockFocus).toHaveBeenCalledTimes(1);
    expect(clearSelection).toHaveBeenCalledTimes(1);
  });
});
