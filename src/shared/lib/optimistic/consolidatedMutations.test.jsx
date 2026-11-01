import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useRemoveWorkflow } from "@/features/workflows/api/mutations/useRemoveWorkflow";
import { useRestoreWorkflow } from "@/features/trash/api/mutations/useRestoreWorkflow";
import { useWorkflowDelete } from "@/features/workflows/model/useWorkflowDelete";
import { useRemoveAsset } from "@/features/media/api/mutations/useRemoveAsset";
import { useToggleWorkflowLike } from "@/features/workflows/api/mutations/useToggleWorkflowLike";
import { useToggleLike } from "@/features/workflows/api/mutations/useToggleLike";
import { notifyOptimisticError } from "./notifyOptimisticError";
import { logger } from "@/shared/lib/logger";
import { api } from "@/shared/api/client";
import { toast } from "sonner";

vi.mock("@/shared/api/client", () => ({
  api: {
    delete: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
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

describe("Consolidated Optimistic Mutations & Tracker Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useRemoveWorkflow", () => {
    it("optimistically removes workflow and media, rolls back on error with toast", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");
      queryClient.setQueryData(pKey, {
        projectContents: {
          workflows: [{ id: "wf-1", name: "Workflow 1" }],
          media: [{ id: "m-1", workflowId: "wf-1" }],
        },
      });

      api.delete.mockRejectedValueOnce(new Error("Delete forbidden"));

      const { result } = renderHook(() => useRemoveWorkflow(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ workflowId: "wf-1", projectId: "proj-1" });
        } catch {
          // expected
        }
      });

      // Toast must be shown via notifyOptimisticError
      expect(toast.error).toHaveBeenCalled();
      // Cache restored
      const restored = queryClient.getQueryData(pKey);
      expect(restored.projectContents.workflows).toHaveLength(1);
      expect(restored.projectContents.media).toHaveLength(1);
    });

    it("optimistically moves active workflow to trashedWorkflows and rolls back on error", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");
      queryClient.setQueryData(pKey, {
        projectContents: {
          workflows: [{ id: "wf-active", name: "Active Workflow" }],
          trashedWorkflows: [],
          media: [],
        },
      });

      let intermediateCacheState = null;
      api.delete.mockImplementationOnce(async () => {
        // Inspect optimistic cache during in-flight mutation
        intermediateCacheState = queryClient.getQueryData(pKey);
        throw new Error("Network error during move to trash");
      });

      const { result } = renderHook(() => useRemoveWorkflow(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ workflowId: "wf-active", projectId: "proj-1" });
        } catch {
          // expected
        }
      });

      // While in-flight: workflow was optimistically removed from active and moved to trash
      expect(intermediateCacheState.projectContents.workflows).toHaveLength(0);
      expect(intermediateCacheState.projectContents.trashedWorkflows).toHaveLength(1);
      expect(intermediateCacheState.projectContents.trashedWorkflows[0].id).toBe("wf-active");
      expect(intermediateCacheState.projectContents.trashedWorkflows[0].deleted_at).toBeDefined();

      // After rejection: cache rolled back to original state
      const finalState = queryClient.getQueryData(pKey);
      expect(finalState.projectContents.workflows).toHaveLength(1);
      expect(finalState.projectContents.workflows[0].id).toBe("wf-active");
      expect(finalState.projectContents.trashedWorkflows).toHaveLength(0);
      expect(toast.error).toHaveBeenCalled();
    });

    it("optimistically deletes item already in trashedWorkflows permanently and rolls back on error", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");
      queryClient.setQueryData(pKey, {
        projectContents: {
          workflows: [],
          trashedWorkflows: [{ id: "wf-trash-1", name: "Trashed Item", deleted_at: "2026-10-26T12:00:00Z" }],
          media: [],
        },
      });

      let intermediateCacheState = null;
      api.delete.mockImplementationOnce(async () => {
        intermediateCacheState = queryClient.getQueryData(pKey);
        throw new Error("Permanent delete failed");
      });

      const { result } = renderHook(() => useRemoveWorkflow(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ workflowId: "wf-trash-1", projectId: "proj-1" });
        } catch {
          // expected
        }
      });

      // During in-flight: removed from trashedWorkflows optimistically
      expect(intermediateCacheState.projectContents.trashedWorkflows).toHaveLength(0);

      // After failure: rolled back to include trashed item
      const finalState = queryClient.getQueryData(pKey);
      expect(finalState.projectContents.trashedWorkflows).toHaveLength(1);
      expect(finalState.projectContents.trashedWorkflows[0].id).toBe("wf-trash-1");
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("useRestoreWorkflow", () => {
    it("optimistically moves workflow from trashedWorkflows back to workflows and rolls back on error", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");
      queryClient.setQueryData(pKey, {
        projectContents: {
          workflows: [],
          trashedWorkflows: [{ id: "wf-trash-2", name: "Item to Restore", deleted_at: "2026-10-26T12:00:00Z" }],
        },
      });

      let intermediateCacheState = null;
      api.post.mockImplementationOnce(async () => {
        intermediateCacheState = queryClient.getQueryData(pKey);
        throw new Error("Restore failed");
      });

      const { result } = renderHook(() => useRestoreWorkflow(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ workflowId: "wf-trash-2", projectId: "proj-1" });
        } catch {
          // expected
        }
      });

      // In flight: restored to active workflows, removed from trash
      expect(intermediateCacheState.projectContents.trashedWorkflows).toHaveLength(0);
      expect(intermediateCacheState.projectContents.workflows).toHaveLength(1);
      expect(intermediateCacheState.projectContents.workflows[0].id).toBe("wf-trash-2");
      expect(intermediateCacheState.projectContents.workflows[0].deleted_at).toBeNull();

      // On error: rolled back to trash
      const finalState = queryClient.getQueryData(pKey);
      expect(finalState.projectContents.trashedWorkflows).toHaveLength(1);
      expect(finalState.projectContents.workflows).toHaveLength(0);
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("useWorkflowDelete", () => {
    it("confirmDelete triggers optimistic mutation with toast and rollback on error", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");
      queryClient.setQueryData(pKey, {
        projectContents: {
          workflows: [{ id: "wf-10", name: "Target WF" }],
          media: [{ id: "m-10", workflowId: "wf-10" }],
        },
      });

      api.delete.mockRejectedValueOnce(new Error("Server error"));

      const { result } = renderHook(() => useWorkflowDelete(), { wrapper });

      act(() => {
        result.current.promptDelete({ id: "wf-10", projectId: "proj-1" });
      });

      await act(async () => {
        result.current.confirmDelete("proj-1");
      });

      // After rejection, rollback occurs and toast is notified
      expect(toast.error).toHaveBeenCalled();
      const restored = queryClient.getQueryData(pKey);
      expect(restored.projectContents.workflows).toHaveLength(1);
    });
  });

  describe("useRemoveAsset", () => {
    it("rolls back and shows toast on error", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");
      queryClient.setQueryData(pKey, {
        projectContents: {
          workflows: [{ id: "wf-1", name: "wf-1" }],
          media: [{ id: "asset-1", workflowId: "wf-1" }],
        },
      });

      api.delete.mockRejectedValueOnce(new Error("Asset delete failed"));

      const { result } = renderHook(() => useRemoveAsset(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ assetId: "asset-1", projectId: "proj-1" });
        } catch {
          // expected
        }
      });

      expect(toast.error).toHaveBeenCalled();
      const restored = queryClient.getQueryData(pKey);
      expect(restored.projectContents.media).toHaveLength(1);
      expect(restored.projectContents.workflows).toHaveLength(1);
    });
  });

  describe("useToggleWorkflowLike", () => {
    it("optimistically toggles favorited and rolls back with toast on error", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");
      queryClient.setQueryData(pKey, {
        projectContents: {
          workflows: [{ id: "wf-fav", metadata: { favorited: false } }],
        },
      });

      api.patch.mockRejectedValueOnce(new Error("Like failed"));

      const { result } = renderHook(() => useToggleWorkflowLike(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ workflowId: "wf-fav", projectId: "proj-1" });
        } catch {
          // expected
        }
      });

      expect(toast.error).toHaveBeenCalled();
      const restored = queryClient.getQueryData(pKey);
      expect(restored.projectContents.workflows[0].metadata.favorited).toBe(false);
    });
  });

  describe("useToggleLike", () => {
    it("optimistically toggles is_liked and rolls back with toast on error", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");
      queryClient.setQueryData(pKey, {
        projectContents: {
          media: [{ id: "m-like", is_liked: false, is_Like: false }],
        },
      });

      api.patch.mockRejectedValueOnce(new Error("Item like failed"));

      const { result } = renderHook(() => useToggleLike(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ itemId: "m-like", projectId: "proj-1" });
        } catch {
          // expected
        }
      });

      expect(toast.error).toHaveBeenCalled();
      const restored = queryClient.getQueryData(pKey);
      expect(restored.projectContents.media[0].is_liked).toBe(false);
    });
  });

  describe("notifyOptimisticError privacy redaction", () => {
    it("redacts sensitive fields like prompt, token, secret from variables in logs", () => {
      const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

      notifyOptimisticError(new Error("test"), "Failed", {
        variables: {
          id: "123",
          prompt: "A secret user prompt that must not be logged",
          userToken: "secret-token-123",
          apiKey: "sk-1234567890",
        },
      });

      expect(loggerSpy).toHaveBeenCalledWith(
        "optimistic_mutation_failed",
        expect.objectContaining({
          variables: {
            id: "123",
            prompt: "[REDACTED]",
            userToken: "[REDACTED]",
            apiKey: "[REDACTED]",
          },
        })
      );
    });
  });
});
