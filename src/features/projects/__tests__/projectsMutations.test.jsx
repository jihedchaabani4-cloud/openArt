import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useCreateProject, useDeleteProject, useUpdateProject } from "../api/projectsApi";
import { api } from "@/shared/api/client";
import { toast } from "sonner";

vi.mock("@/shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/shared/api/auth", () => ({
  useAuthSession: () => ({ data: { id: "u1" }, isLoading: false }),
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

describe("Phase 7: Optimistic Project Mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useCreateProject", () => {
    it("optimistically adds temp project to cache and replaces ID on success", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projects.all();
      queryClient.setQueryData(pKey, [
        { id: "p1", project_id: "p1", name: "Existing Project" },
      ]);

      api.post.mockResolvedValueOnce({
        ok: true,
        data: { id: "real-p-id", name: "New Story" },
      });

      const { result } = renderHook(() => useCreateProject(), { wrapper });

      let created;
      await act(async () => {
        created = await result.current.mutateAsync({ name: "New Story" });
      });

      expect(created.project_id).toBe("real-p-id");
      const list = queryClient.getQueryData(pKey);
      expect(list).toHaveLength(2);
      expect(list[0].id).toBe("real-p-id");
    });

    it("rolls back temp project and displays toast on API error", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projects.all();
      const initial = [{ id: "p1", name: "Existing Project" }];
      queryClient.setQueryData(pKey, initial);

      api.post.mockRejectedValueOnce(new Error("Creation quota exceeded"));

      const { result } = renderHook(() => useCreateProject(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ name: "Failed Project" });
        } catch {
          // expected
        }
      });

      expect(toast.error).toHaveBeenCalled();
      const list = queryClient.getQueryData(pKey);
      expect(list).toEqual(initial);
    });
  });

  describe("useDeleteProject", () => {
    it("optimistically removes project immediately", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projects.all();
      queryClient.setQueryData(pKey, [
        { id: "p1", project_id: "p1", name: "P1" },
        { id: "p2", project_id: "p2", name: "P2" },
      ]);

      api.delete.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useDeleteProject(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("p1");
      });

      const list = queryClient.getQueryData(pKey);
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe("p2");
    });

    it("restores project and triggers error toast on API failure", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projects.all();
      const initial = [
        { id: "p1", project_id: "p1", name: "P1" },
        { id: "p2", project_id: "p2", name: "P2" },
      ];
      queryClient.setQueryData(pKey, initial);

      api.delete.mockRejectedValueOnce(new Error("Network failed"));

      const { result } = renderHook(() => useDeleteProject(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync("p1");
        } catch {
          // expected
        }
      });

      expect(toast.error).toHaveBeenCalled();
      const restored = queryClient.getQueryData(pKey);
      expect(restored).toEqual(initial);
    });
  });

  describe("useUpdateProject", () => {
    it("optimistically updates project name immediately", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projects.all();
      queryClient.setQueryData(pKey, [
        { id: "p1", project_id: "p1", project_name: "Old Name", name: "Old Name" },
      ]);

      api.patch.mockResolvedValueOnce({
        ok: true,
        data: { id: "p1", project_name: "Renamed", name: "Renamed" },
      });

      const { result } = renderHook(() => useUpdateProject(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: "p1",
          projectData: { project_name: "Renamed" },
        });
      });

      const list = queryClient.getQueryData(pKey);
      expect(list[0].project_name).toBe("Renamed");
      expect(list[0].name).toBe("Renamed");
    });

    it("restores original project name and displays toast on API error", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projects.all();
      const initial = [
        { id: "p1", project_id: "p1", project_name: "Old Name", name: "Old Name" },
      ];
      queryClient.setQueryData(pKey, initial);

      api.patch.mockRejectedValueOnce(new Error("Update failed"));

      const { result } = renderHook(() => useUpdateProject(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            projectId: "p1",
            projectData: { project_name: "Renamed" },
          });
        } catch {
          // expected
        }
      });

      expect(toast.error).toHaveBeenCalled();
      const restored = queryClient.getQueryData(pKey);
      expect(restored).toEqual(initial);
    });
  });
});
