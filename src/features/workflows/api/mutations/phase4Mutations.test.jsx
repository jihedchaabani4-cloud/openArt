import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useSetPrimaryMedia } from "./useSetPrimaryMedia";
import { useDetachMedia } from "./useDetachMedia";
import { useAddImageToElement } from "@/features/elements/hooks/useAddImageToElement";
import { useAddMediaToCharacter } from "@/features/characters/hooks/useAddMediaToCharacter";
import { useSetCharacterSheetMedia } from "@/features/characters/hooks/useSetCharacterSheetMedia";
import { api } from "@/shared/api/client";
import { characterService } from "@/features/characters/services/characterService";

vi.mock("@/shared/api/client", () => ({
  api: {
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/features/characters/services/characterService", () => ({
  characterService: {
    addDetailMedia: vi.fn(),
    setSheetMedia: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Mock URL.createObjectURL and revokeObjectURL for jsdom
globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-preview-url");
globalThis.URL.revokeObjectURL = vi.fn();

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

describe("Phase 4 Optimistic Mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useSetPrimaryMedia", () => {
    it("optimistically updates primaryMediaId and primary_media_id in workflow", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialData = {
        projectContents: {
          workflows: [{ id: "wf-1", primaryMediaId: "m-old", metadata: { primaryMediaId: "m-old" } }],
        },
      };
      queryClient.setQueryData(pKey, initialData);

      api.patch.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useSetPrimaryMedia(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          workflowId: "wf-1",
          mediaId: "m-new",
          projectId: "proj-1",
        });
      });

      const updated = queryClient.getQueryData(pKey);
      expect(updated.projectContents.workflows[0].primaryMediaId).toBe("m-new");
      expect(updated.projectContents.workflows[0].primary_media_id).toBe("m-new");
      expect(updated.projectContents.workflows[0].metadata.primaryMediaId).toBe("m-new");
    });

    it("rolls back primary media on error", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialData = {
        projectContents: {
          workflows: [{ id: "wf-1", primaryMediaId: "m-old" }],
        },
      };
      queryClient.setQueryData(pKey, initialData);

      api.patch.mockRejectedValueOnce(new Error("Failed"));

      const { result } = renderHook(() => useSetPrimaryMedia(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            workflowId: "wf-1",
            mediaId: "m-new",
            projectId: "proj-1",
          });
        } catch {
          // Expected
        }
      });

      const restored = queryClient.getQueryData(pKey);
      expect(restored.projectContents.workflows[0].primaryMediaId).toBe("m-old");
    });
  });

  describe("useDetachMedia", () => {
    it("optimistically creates standalone workflow and reassigns media workflowId", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialData = {
        projectContents: {
          media: [{ id: "m-1", workflowId: "wf-original" }],
          workflows: [{ id: "wf-original", name: "Original Workflow" }],
        },
      };
      queryClient.setQueryData(pKey, initialData);

      api.post.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useDetachMedia(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          mediaId: "m-1",
          projectId: "proj-1",
          displayName: "Detached Shot",
        });
      });

      const updated = queryClient.getQueryData(pKey);
      expect(updated.projectContents.workflows).toHaveLength(2);
      expect(updated.projectContents.workflows[0].display_name).toBe("Detached Shot");
      expect(updated.projectContents.media[0].workflowId).toBe(updated.projectContents.workflows[0].id);
    });
  });

  describe("useAddImageToElement", () => {
    it("optimistically adds blob preview with status uploading and revokes URL on settle", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialData = {
        projectContents: {
          media: [],
          elements: [{ id: "el-1", workflow_id: "el-1" }],
        },
      };
      queryClient.setQueryData(pKey, initialData);

      api.post.mockResolvedValueOnce({ ok: true });

      const fakeFile = new Blob(["test"], { type: "image/png" });
      const { result } = renderHook(() => useAddImageToElement(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          elementId: "el-1",
          file: fakeFile,
          projectId: "proj-1",
        });
      });

      expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(fakeFile);
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-preview-url");
    });
  });

  describe("useAddMediaToCharacter", () => {
    it("optimistically appends detail media with uploading status", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialData = {
        projectContents: {
          media: [],
          characters: [{ id: "char-1" }],
        },
      };
      queryClient.setQueryData(pKey, initialData);

      characterService.addDetailMedia.mockResolvedValueOnce({ ok: true });

      const fakeFile = new Blob(["test"], { type: "image/png" });
      const { result } = renderHook(() => useAddMediaToCharacter(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          characterId: "char-1",
          file: fakeFile,
          projectId: "proj-1",
        });
      });

      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe("useSetCharacterSheetMedia", () => {
    it("optimistically updates character sheet media preview", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialData = {
        projectContents: {
          media: [],
          characters: [{ id: "char-1" }],
        },
      };
      queryClient.setQueryData(pKey, initialData);

      characterService.setSheetMedia.mockResolvedValueOnce({ ok: true });

      const fakeFile = new Blob(["test"], { type: "image/png" });
      const { result } = renderHook(() => useSetCharacterSheetMedia(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          characterId: "char-1",
          file: fakeFile,
          projectId: "proj-1",
        });
      });

      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
