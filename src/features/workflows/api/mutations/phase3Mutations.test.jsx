import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useUpdateWorkflow } from "./useUpdateWorkflow";
import { useUpdateCharacter } from "@/features/characters/api/mutations/useUpdateCharacter";
import { useDeleteMedia } from "./useDeleteMedia";
import { useCreateFolder } from "@/features/folders/api/mutations/useCreateFolder";
import { api } from "@/shared/api/client";
import { characterService } from "@/features/characters/api/characterService";

vi.mock("@/shared/api/client", () => ({
  api: {
    patch: vi.fn(),
    delete: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/features/characters/api/characterService", () => ({
  characterService: {
    updateCharacter: vi.fn(),
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

describe("Phase 3 Optimistic Mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useUpdateWorkflow", () => {
    it("optimistically updates workflow, character, and element in projectData cache", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialData = {
        projectContents: {
          workflows: [{ id: "wf-1", display_name: "Old WF", metadata: { displayName: "Old WF" } }],
          characters: [{ id: "wf-1", name: "Old Char", workflow_id: "wf-1" }],
          elements: [{ id: "wf-1", name: "Old Elem", workflow_id: "wf-1" }],
        },
      };
      queryClient.setQueryData(pKey, initialData);

      api.patch.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useUpdateWorkflow(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          workflowId: "wf-1",
          workflowData: { display_name: "Renamed Entity" },
          projectId: "proj-1",
        });
      });

      const updated = queryClient.getQueryData(pKey);
      expect(updated.projectContents.workflows[0].display_name).toBe("Renamed Entity");
      expect(updated.projectContents.workflows[0].metadata.displayName).toBe("Renamed Entity");
      expect(updated.projectContents.characters[0].name).toBe("Renamed Entity");
      expect(updated.projectContents.elements[0].name).toBe("Renamed Entity");
    });

    it("rolls back on API failure", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialData = {
        projectContents: {
          workflows: [{ id: "wf-1", display_name: "Original WF" }],
          characters: [],
          elements: [],
        },
      };
      queryClient.setQueryData(pKey, initialData);

      api.patch.mockRejectedValueOnce(new Error("Server error"));

      const { result } = renderHook(() => useUpdateWorkflow(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            workflowId: "wf-1",
            workflowData: { display_name: "Fail Rename" },
            projectId: "proj-1",
          });
        } catch {
          // Expected
        }
      });

      const restored = queryClient.getQueryData(pKey);
      expect(restored.projectContents.workflows[0].display_name).toBe("Original WF");
    });
  });

  describe("useUpdateCharacter", () => {
    it("optimistically updates character and workflow in projectData", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialData = {
        projectContents: {
          characters: [{ id: "c-1", name: "Old Hero" }],
          workflows: [{ id: "c-1", display_name: "Old Hero", metadata: {} }],
        },
      };
      queryClient.setQueryData(pKey, initialData);

      characterService.updateCharacter.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useUpdateCharacter(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          characterId: "c-1",
          characterData: { name: "New Hero" },
          projectId: "proj-1",
        });
      });

      const updated = queryClient.getQueryData(pKey);
      expect(updated.projectContents.characters[0].name).toBe("New Hero");
      expect(updated.projectContents.workflows[0].display_name).toBe("New Hero");
    });
  });

  describe("useDeleteMedia", () => {
    it("optimistically removes media and cascade-removes empty workflow", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      const initialData = {
        projectContents: {
          media: [{ id: "m-1", workflowId: "wf-1" }],
          workflows: [{ id: "wf-1", name: "wf-1" }],
        },
      };
      queryClient.setQueryData(pKey, initialData);

      api.delete.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useDeleteMedia(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          mediaId: "m-1",
          projectId: "proj-1",
        });
      });

      const updated = queryClient.getQueryData(pKey);
      expect(updated.projectContents.media).toHaveLength(0);
      expect(updated.projectContents.workflows).toHaveLength(0);
    });
  });

  describe("useCreateFolder", () => {
    it("optimistically creates folder with temp id and replaces it on success", async () => {
      const { queryClient, wrapper } = createWrapper();
      const fKey = queryKeys.folders.byProject("proj-1");
      queryClient.setQueryData(fKey, [{ id: "existing-1", name: "Existing" }]);

      api.post.mockResolvedValueOnce({
        data: { id: "real-folder-42", name: "New Collection", projectId: "proj-1" },
      });

      const { result } = renderHook(() => useCreateFolder(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: "proj-1",
          name: "New Collection",
        });
      });

      const folders = queryClient.getQueryData(fKey);
      expect(folders).toHaveLength(2);
      expect(folders.some((f) => f.id === "real-folder-42")).toBe(true);
      expect(folders.some((f) => String(f.id).startsWith("temp-"))).toBe(false);
    });

    it("defaults to 'Untitled collection' when name is omitted or empty", async () => {
      const { queryClient, wrapper } = createWrapper();
      const fKey = queryKeys.folders.byProject("proj-1");
      queryClient.setQueryData(fKey, []);

      api.post.mockResolvedValueOnce({
        data: { id: "folder-default-1", name: "Untitled collection", projectId: "proj-1" },
      });

      const { result } = renderHook(() => useCreateFolder(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: "proj-1",
        });
      });

      expect(api.post).toHaveBeenCalledWith(
        "/projects/proj-1/folders",
        expect.objectContaining({ name: "Untitled collection" })
      );
      const folders = queryClient.getQueryData(fKey);
      expect(folders).toHaveLength(1);
      expect(folders[0].name).toBe("Untitled collection");
    });
  });
});
