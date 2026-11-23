import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";

const { mockToast, mockApiDelete, mockApiPost, mockApiPatch } = vi.hoisted(() => ({
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(() => "toast-id"),
  },
  mockApiDelete: vi.fn(),
  mockApiPost: vi.fn(),
  mockApiPatch: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/cinema-studio/proj-1/assets",
}));

vi.mock("@/shared/api/client", () => ({
  api: {
    delete: (...args) => mockApiDelete(...args),
    post: (...args) => mockApiPost(...args),
    patch: (...args) => mockApiPatch(...args),
    getBlob: vi.fn(),
  },
}));

vi.mock("@/features/prompt-bar", () => ({
  promptBarService: vi.fn(() => ({
    addReference: vi.fn(() => ({ ok: true })),
    animateMedia: vi.fn(() => ({ ok: true })),
    attachMedia: vi.fn(() => ({ ok: true })),
    reuseGeneration: vi.fn(() => ({ ok: true })),
    focus: vi.fn(),
  })),
  usePromptBarSnapshot: () => false,
  useRealBackendModels: () => ({ data: { models: [] } }),
  resolveReusableGeneration: () => null,
  hasGeneratedPrimaryMedia: () => true,
  withPrimaryMediaFallback: (wf) => wf,
}));

import {
  MEDIA_IN_FLIGHT_STATUSES,
  MEDIA_FAILED_STATUSES,
  isMediaInFlight,
  hasInFlightMedia,
  areAllWorkflowMediaFailed,
  isMediaProcessingConflictError,
} from "../lib/mediaStatusHelpers";
import { useWorkflowActions } from "../model/useMediaActions";
import { useStudioBulkActions } from "../model/useStudioBulkActions";
import { useRemoveWorkflow } from "../api/mutations/useRemoveWorkflow";
import { useDeleteMedia } from "../api/mutations/useDeleteMedia";
import { useDeleteFolder } from "@/features/folders/api/mutations/useDeleteFolder";
import { useRemoveAsset } from "@/features/media/api/mutations/useRemoveAsset";
import { useDeleteMediaItem } from "@/features/elements/api/mutations/useDeleteMediaItem";
import { useRemoveMediaFromCharacter } from "@/features/characters/api/mutations/useRemoveMediaFromCharacter";
import { useDeleteProject } from "@/features/projects/api/projectsApi";
import { useStudioDropExecutor } from "@/features/studio/model/useStudioDropExecutor";
import { useStudioItemDrag } from "@/features/studio/model/useStudioItemDrag";
import { useWorkflowUiStore } from "../model/useWorkflowUiStore";

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

describe("1. Canonical Media & Workflow Status Helpers", () => {
  it("recognizes all 6 in-flight statuses across strings, raw objects, and nested mediaMetadata", () => {
    expect(MEDIA_IN_FLIGHT_STATUSES).toEqual([
      "processing",
      "pending",
      "queued",
      "uploading",
      "in_progress",
      "starting",
    ]);

    for (const status of MEDIA_IN_FLIGHT_STATUSES) {
      expect(isMediaInFlight(status)).toBe(true);
      expect(isMediaInFlight(status.toUpperCase())).toBe(true);
      expect(isMediaInFlight({ status })).toBe(true);
      expect(isMediaInFlight({ media_status: status })).toBe(true);
      expect(isMediaInFlight({ raw: { status } })).toBe(true);
      expect(isMediaInFlight({ mediaMetadata: { status } })).toBe(true);
    }

    expect(isMediaInFlight("completed")).toBe(false);
    expect(isMediaInFlight("ready")).toBe(false);
    expect(isMediaInFlight("failed")).toBe(false);
    expect(isMediaInFlight(null)).toBe(false);
  });

  it("hasInFlightMedia detects in-flight state on workflow.status, targetItem, workflow.items, or workflow.media", () => {
    for (const status of MEDIA_IN_FLIGHT_STATUSES) {
      expect(hasInFlightMedia({ id: "w1", status })).toBe(true);
      expect(hasInFlightMedia({ id: "w1" }, { id: "m1", status })).toBe(true);
      expect(
        hasInFlightMedia({
          id: "w1",
          items: [
            { id: "m1", status: "completed", url: "https://cdn.example.com/1.png" },
            { id: "m2", status },
          ],
        })
      ).toBe(true);
      expect(
        hasInFlightMedia({
          id: "w1",
          media: [{ id: "m1", raw: { status } }],
        })
      ).toBe(true);
    }

    expect(
      hasInFlightMedia({
        id: "w-done",
        status: "completed",
        items: [{ id: "m1", status: "completed", url: "https://cdn.example.com/1.png" }],
      })
    ).toBe(false);
  });

  it("areAllWorkflowMediaFailed returns true only when >= 1 media item (or explicit failed status) exists and ALL are failed", () => {
    expect(MEDIA_FAILED_STATUSES).toEqual(["failed", "error", "rejected"]);

    for (const failedStatus of MEDIA_FAILED_STATUSES) {
      expect(
        areAllWorkflowMediaFailed({
          id: "wf-failed",
          items: [{ id: "m1", status: failedStatus }],
        })
      ).toBe(true);
      expect(
        areAllWorkflowMediaFailed({ id: "wf-no-items" }, { id: "m1", status: failedStatus })
      ).toBe(true);
      expect(areAllWorkflowMediaFailed({ id: "wf-explicit", status: failedStatus })).toBe(true);
    }

    // Multiple failed items -> true
    expect(
      areAllWorkflowMediaFailed({
        id: "wf-multi-failed",
        items: [
          { id: "m1", status: "failed" },
          { id: "m2", status: "rejected" },
          { id: "m3", status: "error" },
        ],
      })
    ).toBe(true);

    // Mixed failed + completed -> false
    expect(
      areAllWorkflowMediaFailed({
        id: "wf-mixed",
        items: [
          { id: "m1", status: "failed" },
          { id: "m2", status: "completed", url: "https://cdn.example.com/ok.png" },
        ],
      })
    ).toBe(false);

    // Mixed failed + in-flight -> false
    expect(
      areAllWorkflowMediaFailed({
        id: "wf-mixed-inflight",
        items: [
          { id: "m1", status: "failed" },
          { id: "m2", status: "queued" },
        ],
      })
    ).toBe(false);

    // Empty with non-failed status -> false
    expect(areAllWorkflowMediaFailed({ id: "wf-empty", items: [] })).toBe(false);
    expect(
      areAllWorkflowMediaFailed({ id: "wf-empty-completed", status: "completed", items: [] })
    ).toBe(false);
    expect(areAllWorkflowMediaFailed(null)).toBe(false);
  });

  it("isMediaProcessingConflictError detects 409 status, statusCode, and MEDIA_PROCESSING errorCode/code", () => {
    expect(isMediaProcessingConflictError({ status: 409 })).toBe(true);
    expect(isMediaProcessingConflictError({ statusCode: 409 })).toBe(true);
    expect(isMediaProcessingConflictError({ errorCode: "MEDIA_PROCESSING" })).toBe(true);
    expect(isMediaProcessingConflictError({ code: "MEDIA_PROCESSING" })).toBe(true);
    expect(isMediaProcessingConflictError({ status: 404, errorCode: "NOT_FOUND" })).toBe(false);
    expect(isMediaProcessingConflictError(null)).toBe(false);
  });
});

describe("2. useWorkflowActions — In-Flight Delete Guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(MEDIA_IN_FLIGHT_STATUSES)(
    "sets canDelete=false and makes handleDelete a no-op when primary media status is '%s'",
    (inFlightStatus) => {
      const { wrapper } = createQueryWrapper();
      const wf = {
        id: `wf-${inFlightStatus}`,
        projectId: "proj-1",
        items: [{ id: "m-1", status: inFlightStatus, url: null }],
      };

      const { result } = renderHook(() => useWorkflowActions(wf), { wrapper });

      expect(result.current.canDelete).toBe(false);

      act(() => {
        result.current.handleDelete();
      });

      expect(mockApiDelete).not.toHaveBeenCalled();
    }
  );

  it.each(MEDIA_IN_FLIGHT_STATUSES)(
    "sets canDelete=false when secondary item in workflow.items has status '%s' even if primary item is completed",
    (inFlightStatus) => {
      const { wrapper } = createQueryWrapper();
      const wf = {
        id: "wf-mixed-inflight",
        projectId: "proj-1",
        primary_media_id: "m-done",
        items: [
          {
            id: "m-done",
            is_primary: true,
            status: "completed",
            url: "https://cdn.example.com/done.png",
          },
          {
            id: "m-inflight",
            status: inFlightStatus,
            url: null,
          },
        ],
      };

      const { result } = renderHook(() => useWorkflowActions(wf), { wrapper });

      expect(result.current.canDelete).toBe(false);

      act(() => {
        result.current.handleDelete();
      });

      expect(mockApiDelete).not.toHaveBeenCalled();
    }
  );
});

describe("3. Single Workflow Delete (useRemoveWorkflow)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rolls back optimistic cache removal 100% and shows error toast on 409 MEDIA_PROCESSING", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");
    const gKey = queryKeys.generations.byProject("proj-1");

    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [
          {
            id: "wf-proc",
            name: "wf-proc",
            items: [{ id: "m-1", status: "completed", url: "https://cdn.example.com/1.png" }],
          },
        ],
        trashedWorkflows: [],
        media: [{ id: "m-1", workflowId: "wf-proc", status: "completed" }],
      },
    });
    queryClient.setQueryData(gKey, [{ id: "wf-proc", name: "wf-proc" }]);

    const conflictErr = Object.assign(
      new Error("Cannot delete while media is still processing"),
      { status: 409, errorCode: "MEDIA_PROCESSING" }
    );
    mockApiDelete.mockRejectedValueOnce(conflictErr);

    const { result } = renderHook(() => useRemoveWorkflow(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ workflowId: "wf-proc", projectId: "proj-1" })
      ).rejects.toThrow("Cannot delete while media is still processing");
    });

    const restoredProject = queryClient.getQueryData(pKey);
    expect(restoredProject.projectContents.workflows).toHaveLength(1);
    expect(restoredProject.projectContents.workflows[0].id).toBe("wf-proc");
    expect(restoredProject.projectContents.trashedWorkflows).toHaveLength(0);
    expect(restoredProject.projectContents.media).toHaveLength(1);
    expect(queryClient.getQueryData(gKey)).toHaveLength(1);

    expect(mockToast.error).toHaveBeenCalledTimes(1);
    expect(mockToast.error).toHaveBeenCalledWith(
      "Cannot delete while media is still processing"
    );
  });

  it("moves succeeded workflow ({ ok: true, trashed: true }) to Trash and shows 'Moved to Trash'", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");

    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [
          {
            id: "wf-ok",
            name: "wf-ok",
            items: [{ id: "m-ok", status: "completed", url: "https://cdn.example.com/ok.png" }],
          },
        ],
        trashedWorkflows: [],
        media: [{ id: "m-ok", workflowId: "wf-ok", status: "completed" }],
      },
    });

    mockApiDelete.mockResolvedValueOnce({ ok: true, trashed: true });

    const { result } = renderHook(() => useRemoveWorkflow(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ workflowId: "wf-ok", projectId: "proj-1" });
    });

    const updated = queryClient.getQueryData(pKey);
    expect(updated.projectContents.workflows).toHaveLength(0);
    expect(updated.projectContents.trashedWorkflows).toHaveLength(1);
    expect(updated.projectContents.trashedWorkflows[0].id).toBe("wf-ok");
    expect(mockToast.success).toHaveBeenCalledWith("Moved to Trash");
  });

  it("moves mixed failed + completed workflow ({ ok: true, trashed: true }) to Trash", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");

    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [
          {
            id: "wf-mixed",
            name: "wf-mixed",
            items: [
              { id: "m-fail", status: "failed" },
              { id: "m-done", status: "completed", url: "https://cdn.example.com/done.png" },
            ],
          },
        ],
        trashedWorkflows: [],
        media: [
          { id: "m-fail", workflowId: "wf-mixed", status: "failed" },
          { id: "m-done", workflowId: "wf-mixed", status: "completed" },
        ],
      },
    });

    mockApiDelete.mockResolvedValueOnce({ ok: true, trashed: true });

    const { result } = renderHook(() => useRemoveWorkflow(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ workflowId: "wf-mixed", projectId: "proj-1" });
    });

    const updated = queryClient.getQueryData(pKey);
    expect(updated.projectContents.workflows).toHaveLength(0);
    expect(updated.projectContents.trashedWorkflows.map((w) => w.id)).toEqual(["wf-mixed"]);
    expect(mockToast.success).toHaveBeenCalledWith("Moved to Trash");
  });

  it("permanently deletes failed-only workflow ({ ok: true, deleted_media_count: 1 } without trashed), removes from active cache, NEVER adds to Trash cache, and shows 'Deleted permanently'", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");
    const gKey = queryKeys.generations.byProject("proj-1");
    const tKey = queryKeys.trash.all();

    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [
          {
            id: "wf-failed-only",
            name: "wf-failed-only",
            items: [{ id: "m-fail-1", status: "failed" }],
          },
          {
            id: "wf-survivor",
            name: "wf-survivor",
            items: [{ id: "m-surv", status: "completed", url: "https://cdn.example.com/s.png" }],
          },
        ],
        trashedWorkflows: [],
        media: [
          { id: "m-fail-1", workflowId: "wf-failed-only", status: "failed" },
          { id: "m-surv", workflowId: "wf-survivor", status: "completed" },
        ],
      },
    });
    queryClient.setQueryData(gKey, [
      { id: "wf-failed-only", name: "wf-failed-only" },
      { id: "wf-survivor", name: "wf-survivor" },
    ]);
    queryClient.setQueryData(tKey, []);

    let inFlightState = null;
    mockApiDelete.mockImplementationOnce(async () => {
      inFlightState = queryClient.getQueryData(pKey);
      return { ok: true, deleted_media_count: 1 };
    });

    const { result } = renderHook(() => useRemoveWorkflow(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        workflowId: "wf-failed-only",
        projectId: "proj-1",
      });
    });

    // Neither during in-flight nor after settle is wf-failed-only ever in trashedWorkflows or trash cache
    expect(inFlightState.projectContents.workflows.map((w) => w.id)).toEqual(["wf-survivor"]);
    expect(inFlightState.projectContents.trashedWorkflows).toEqual([]);

    const finalProject = queryClient.getQueryData(pKey);
    expect(finalProject.projectContents.workflows.map((w) => w.id)).toEqual(["wf-survivor"]);
    expect(finalProject.projectContents.trashedWorkflows).toEqual([]);
    expect(finalProject.projectContents.media.map((m) => m.id)).toEqual(["m-surv"]);
    expect(queryClient.getQueryData(gKey).map((w) => w.id)).toEqual(["wf-survivor"]);
    expect(queryClient.getQueryData(tKey)).toEqual([]);

    expect(mockToast.success).toHaveBeenCalledWith("Deleted permanently");
    expect(mockToast.success).not.toHaveBeenCalledWith("Moved to Trash");
  });
});

describe("4. Bulk Workspace Delete & Drag-to-Trash (useStudioBulkActions, useWorkspaceBulkDelete, useStudioDropExecutor)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkflowUiStore.setState({ activeStudioTab: "assets", activeCollectionId: null });
  });

  it("blocks bulkDelete upfront with error toast and zero API/cache calls when any selected workflow or folder contains in-flight media", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");
    const clearSelection = vi.fn();

    queryClient.setQueryData(pKey, {
      projectContents: {
        collections: [{ id: "folder-1", name: "Folder 1" }],
        workflows: [
          {
            id: "wf-in-folder",
            folder_id: "folder-1",
            items: [{ id: "m-in-flight", status: "in_progress" }],
          },
        ],
        trashedWorkflows: [],
        media: [{ id: "m-in-flight", workflowId: "wf-in-folder", status: "in_progress" }],
      },
    });

    // Case A: selected folder contains an in-flight workflow
    const folderSelection = [
      { key: "collection:folder-1", itemType: "collection", id: "folder-1" },
    ];
    const { result: folderBulk } = renderHook(
      () =>
        useStudioBulkActions({
          projectId: "proj-1",
          scope: "assets",
          selectedEntries: folderSelection,
          clearSelection,
        }),
      { wrapper }
    );

    await act(async () => {
      await folderBulk.current.bulkDelete();
    });

    expect(mockApiPost).not.toHaveBeenCalled();
    expect(clearSelection).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledWith(
      "Cannot delete while media is still processing"
    );
    expect(queryClient.getQueryData(pKey).projectContents.workflows).toHaveLength(1);

    // Case B: selected workflow directly has in-flight media
    vi.clearAllMocks();
    const wfSelection = [
      {
        key: "workflow:wf-starting",
        itemType: "workflow",
        id: "wf-starting",
        workflow: { id: "wf-starting", status: "starting" },
      },
    ];
    const { result: wfBulk } = renderHook(
      () =>
        useStudioBulkActions({
          projectId: "proj-1",
          scope: "assets",
          selectedEntries: wfSelection,
          clearSelection,
        }),
      { wrapper }
    );

    await act(async () => {
      await wfBulk.current.bulkDelete();
    });

    expect(mockApiPost).not.toHaveBeenCalled();
    expect(clearSelection).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledWith(
      "Cannot delete while media is still processing"
    );
  });

  it("rolls back cache state and shows error toast when server returns 409 MEDIA_PROCESSING during bulk delete", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");
    const clearSelection = vi.fn();

    const initialProject = {
      projectContents: {
        workflows: [
          {
            id: "wf-1",
            items: [{ id: "m-1", status: "completed", url: "https://cdn.example.com/1.png" }],
          },
        ],
        trashedWorkflows: [],
        media: [{ id: "m-1", workflowId: "wf-1", status: "completed" }],
      },
    };
    queryClient.setQueryData(pKey, initialProject);

    mockApiPost.mockRejectedValueOnce(
      Object.assign(new Error("MEDIA_PROCESSING"), {
        status: 409,
        errorCode: "MEDIA_PROCESSING",
      })
    );

    const selectedEntries = [
      {
        key: "workflow:wf-1",
        itemType: "workflow",
        id: "wf-1",
        workflow: initialProject.projectContents.workflows[0],
      },
    ];

    const { result } = renderHook(
      () =>
        useStudioBulkActions({
          projectId: "proj-1",
          scope: "assets",
          selectedEntries,
          clearSelection,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.bulkDelete();
    });

    expect(clearSelection).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledTimes(1);
    expect(mockToast.error).toHaveBeenCalledWith(
      "Cannot delete while media is still processing",
      expect.any(Object)
    );
    expect(queryClient.getQueryData(pKey).projectContents.workflows).toHaveLength(1);
    expect(queryClient.getQueryData(pKey).projectContents.trashedWorkflows).toHaveLength(0);
  });

  it("removes both trashed_workflow_ids and deleted_workflow_ids from active cache, only puts trashed_workflow_ids in Trash, and shows 'Deleted permanently' vs 'Moved to Trash'", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");
    const gKey = queryKeys.generations.byProject("proj-1");
    const clearSelection = vi.fn();

    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [
          {
            id: "wf-completed",
            items: [{ id: "m-c", status: "completed", url: "https://cdn.example.com/c.png" }],
          },
          {
            id: "wf-failed",
            items: [{ id: "m-f", status: "failed" }],
          },
          {
            id: "wf-keep",
            items: [{ id: "m-k", status: "completed", url: "https://cdn.example.com/k.png" }],
          },
        ],
        trashedWorkflows: [],
        characters: [],
        elements: [],
        media: [
          { id: "m-c", workflowId: "wf-completed", status: "completed" },
          { id: "m-f", workflowId: "wf-failed", status: "failed" },
          { id: "m-k", workflowId: "wf-keep", status: "completed" },
        ],
      },
    });
    queryClient.setQueryData(gKey, [
      { id: "wf-completed" },
      { id: "wf-failed" },
      { id: "wf-keep" },
    ]);

    // 1. Delete only failed workflow -> "Deleted permanently", never in trashedWorkflows
    mockApiPost.mockResolvedValueOnce({
      ok: true,
      deleted_folder_ids: [],
      trashed_workflow_ids: [],
      deleted_workflow_ids: ["wf-failed"],
      already_trashed_workflow_ids: [],
      deleted_orphan_character_ids: [],
      deleted_orphan_element_ids: [],
    });

    const failedSelection = [
      {
        key: "workflow:wf-failed",
        itemType: "workflow",
        id: "wf-failed",
        workflow: { id: "wf-failed", items: [{ id: "m-f", status: "failed" }] },
      },
    ];

    const { result: failedBulk } = renderHook(
      () =>
        useStudioBulkActions({
          projectId: "proj-1",
          scope: "assets",
          selectedEntries: failedSelection,
          clearSelection,
        }),
      { wrapper }
    );

    await act(async () => {
      await failedBulk.current.bulkDelete();
    });

    let cached = queryClient.getQueryData(pKey);
    expect(cached.projectContents.workflows.map((w) => w.id)).toEqual([
      "wf-completed",
      "wf-keep",
    ]);
    expect(cached.projectContents.trashedWorkflows).toEqual([]);
    expect(cached.projectContents.media.map((m) => m.id)).toEqual(["m-c", "m-k"]);
    expect(queryClient.getQueryData(gKey).map((w) => w.id)).toEqual([
      "wf-completed",
      "wf-keep",
    ]);
    expect(mockToast.success).toHaveBeenCalledWith("Deleted permanently");

    // 2. Delete completed workflow -> "Moved to Trash", placed in trashedWorkflows
    vi.clearAllMocks();
    mockApiPost.mockResolvedValueOnce({
      ok: true,
      deleted_folder_ids: [],
      trashed_workflow_ids: ["wf-completed"],
      deleted_workflow_ids: [],
      already_trashed_workflow_ids: [],
      deleted_orphan_character_ids: [],
      deleted_orphan_element_ids: [],
    });

    const completedSelection = [
      {
        key: "workflow:wf-completed",
        itemType: "workflow",
        id: "wf-completed",
        workflow: {
          id: "wf-completed",
          items: [{ id: "m-c", status: "completed", url: "https://cdn.example.com/c.png" }],
        },
      },
    ];

    const { result: completedBulk } = renderHook(
      () =>
        useStudioBulkActions({
          projectId: "proj-1",
          scope: "assets",
          selectedEntries: completedSelection,
          clearSelection,
        }),
      { wrapper }
    );

    await act(async () => {
      await completedBulk.current.bulkDelete();
    });

    cached = queryClient.getQueryData(pKey);
    expect(cached.projectContents.workflows.map((w) => w.id)).toEqual(["wf-keep"]);
    expect(cached.projectContents.trashedWorkflows.map((w) => w.id)).toEqual(["wf-completed"]);
    expect(mockToast.success).toHaveBeenCalledWith("Moved to Trash");
  });

  it("blocks drag-to-trash for in-flight workflows in useStudioItemDrag and useStudioDropExecutor", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");

    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [
          {
            id: "wf-queued",
            items: [{ id: "m-q", status: "queued" }],
          },
        ],
        trashedWorkflows: [],
        media: [{ id: "m-q", workflowId: "wf-queued", status: "queued" }],
      },
    });

    // 1. useStudioItemDrag refuses to start drag for an in-flight workflow
    const { result: dragResult } = renderHook(() =>
      useStudioItemDrag({
        itemType: "workflow",
        item: { id: "wf-queued", status: "queued" },
        itemId: "wf-queued",
        isDraggable: true,
      })
    );

    act(() => {
      dragResult.current.handlePointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        target: document.createElement("div"),
      });
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 140, clientY: 140 }));
    });
    expect(dragResult.current.isDragging).toBe(false);

    // 2. useStudioDropExecutor blocks studio:drop-to-trash when targeted workflow has in-flight media
    const { unmount } = renderHook(() => useStudioDropExecutor("proj-1"), { wrapper });

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("studio:drop-to-trash", {
          detail: {
            itemType: "workflow",
            itemId: "wf-queued",
          },
        })
      );
    });

    expect(mockApiPost).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledWith(
      "Cannot delete while media is still processing"
    );

    unmount();
  });
});

describe("5. Folder, Asset, Media, Character, Element & Project Delete Rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useDeleteFolder excludes failed-only workflows from Trash cache while removing them from active workflows, and rolls back on 409 MEDIA_PROCESSING", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");
    const fKey = queryKeys.folders.byProject("proj-1");

    queryClient.setQueryData(fKey, [{ id: "f-1", name: "Folder 1" }]);
    queryClient.setQueryData(pKey, {
      projectContents: {
        collections: [{ id: "f-1", name: "Folder 1" }],
        folders: [{ id: "f-1", name: "Folder 1" }],
        workflows: [
          {
            id: "wf-folder-ok",
            folder_id: "f-1",
            items: [{ id: "m-ok", status: "completed", url: "https://cdn.example.com/ok.png" }],
          },
          {
            id: "wf-folder-failed",
            folder_id: "f-1",
            items: [{ id: "m-fail", status: "rejected" }],
          },
          {
            id: "wf-outside",
            folder_id: null,
            items: [{ id: "m-out", status: "completed", url: "https://cdn.example.com/out.png" }],
          },
        ],
        trashedWorkflows: [],
        media: [
          { id: "m-ok", workflowId: "wf-folder-ok", status: "completed" },
          { id: "m-fail", workflowId: "wf-folder-failed", status: "rejected" },
          { id: "m-out", workflowId: "wf-outside", status: "completed" },
        ],
      },
    });

    // First test 409 rollback
    mockApiDelete.mockRejectedValueOnce(
      Object.assign(new Error("Cannot delete folder while media is processing"), {
        status: 409,
        errorCode: "MEDIA_PROCESSING",
      })
    );

    const { result } = renderHook(() => useDeleteFolder(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ folderId: "f-1", projectId: "proj-1" })
      ).rejects.toThrow("Cannot delete folder while media is processing");
    });

    expect(queryClient.getQueryData(fKey)).toHaveLength(1);
    expect(queryClient.getQueryData(pKey).projectContents.workflows).toHaveLength(3);
    expect(queryClient.getQueryData(pKey).projectContents.trashedWorkflows).toHaveLength(0);
    expect(mockToast.error).toHaveBeenCalledWith(
      "Cannot delete folder while media is processing"
    );

    // Now test successful folder deletion: failed-only workflow skips Trash
    vi.clearAllMocks();
    mockApiDelete.mockResolvedValueOnce({ ok: true });

    await act(async () => {
      await result.current.mutateAsync({ folderId: "f-1", projectId: "proj-1" });
    });

    const updatedProject = queryClient.getQueryData(pKey);
    expect(updatedProject.projectContents.workflows.map((w) => w.id)).toEqual(["wf-outside"]);
    expect(updatedProject.projectContents.trashedWorkflows.map((w) => w.id)).toEqual([
      "wf-folder-ok",
    ]);
    expect(updatedProject.projectContents.media.map((m) => m.id)).toEqual(["m-out"]);
  });

  it("rolls back optimistic cache and surfaces 409 MEDIA_PROCESSING toast across asset, media, character, element, and project delete mutations", async () => {
    const { queryClient, wrapper } = createQueryWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");
    const projKey = queryKeys.projects.all();

    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [{ id: "wf-1", name: "wf-1" }],
        media: [{ id: "m-1", name: "m-1", workflowId: "wf-1", workflow_id: "wf-1" }],
      },
    });
    queryClient.setQueryData(projKey, [{ id: "proj-1", project_id: "proj-1", name: "P1" }]);

    const make409 = () =>
      Object.assign(new Error("MEDIA_PROCESSING"), {
        status: 409,
        errorCode: "MEDIA_PROCESSING",
      });

    // 1. useRemoveAsset
    mockApiDelete.mockRejectedValueOnce(make409());
    const { result: removeAsset } = renderHook(() => useRemoveAsset(), { wrapper });
    await act(async () => {
      await expect(
        removeAsset.current.mutateAsync({ assetId: "m-1", projectId: "proj-1" })
      ).rejects.toThrow();
    });
    expect(queryClient.getQueryData(pKey).projectContents.media).toHaveLength(1);
    expect(mockToast.error).toHaveBeenLastCalledWith(
      "Cannot delete while media is still processing"
    );

    // 2. useDeleteMedia
    mockApiDelete.mockRejectedValueOnce(make409());
    const { result: deleteMedia } = renderHook(() => useDeleteMedia(), { wrapper });
    await act(async () => {
      await expect(
        deleteMedia.current.mutateAsync({ mediaId: "m-1", projectId: "proj-1" })
      ).rejects.toThrow();
    });
    expect(queryClient.getQueryData(pKey).projectContents.media).toHaveLength(1);
    expect(mockToast.error).toHaveBeenLastCalledWith(
      "Cannot delete while media is still processing"
    );

    // 3. useDeleteMediaItem (element media)
    mockApiDelete.mockRejectedValueOnce(make409());
    const { result: deleteElemMedia } = renderHook(() => useDeleteMediaItem(), { wrapper });
    await act(async () => {
      await expect(
        deleteElemMedia.current.mutateAsync({
          elementId: "el-1",
          mediaId: "m-1",
          projectId: "proj-1",
        })
      ).rejects.toThrow();
    });
    expect(queryClient.getQueryData(pKey).projectContents.media).toHaveLength(1);
    expect(mockToast.error).toHaveBeenLastCalledWith(
      "Cannot delete while media is still processing"
    );

    // 4. useRemoveMediaFromCharacter
    mockApiDelete.mockRejectedValueOnce(make409());
    const { result: removeCharMedia } = renderHook(() => useRemoveMediaFromCharacter(), {
      wrapper,
    });
    await act(async () => {
      await expect(
        removeCharMedia.current.mutateAsync({
          characterId: "wf-1",
          mediaId: "m-1",
          projectId: "proj-1",
        })
      ).rejects.toThrow();
    });
    expect(queryClient.getQueryData(pKey).projectContents.media).toHaveLength(1);
    expect(mockToast.error).toHaveBeenLastCalledWith(
      "Cannot delete while media is still processing"
    );

    // 5. useDeleteProject
    mockApiDelete.mockRejectedValueOnce(make409());
    const { result: deleteProj } = renderHook(() => useDeleteProject(), { wrapper });
    await act(async () => {
      await expect(deleteProj.current.mutateAsync("proj-1")).rejects.toThrow();
    });
    expect(queryClient.getQueryData(projKey)).toHaveLength(1);
    expect(mockToast.error).toHaveBeenLastCalledWith(
      "Cannot delete while media is still processing"
    );
  });
});
