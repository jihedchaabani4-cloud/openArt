import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useProjectFolders } from "@/features/folders/api/queries/useProjectFolders";
import { useFilteredWorkflows } from "@/features/workflows/model/useFilteredWorkflows";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { api } from "@/shared/api/client";

vi.mock("@/shared/api/client", () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock("@/shared/api/auth", () => ({
  useAuthSession: () => ({ data: { id: "user-1" }, isLoading: false }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("Collections Centralized Data Architecture (GET /api/workflows/project-data/:projectId)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies centralized loading: collections and workflows arrive simultaneously from project-data with no separate /folders request", async () => {
    const { wrapper } = createWrapper();

    api.get.mockImplementation(async (url) => {
      if (url.includes("/workflows/project-data/")) {
        return {
          data: {
            projectName: "Test Project",
            projectId: "proj-1",
            projectContents: {
              collections: [
                {
                  id: "col-1",
                  name: "Collection 1",
                  color: "#EC4899",
                  description: "Test description",
                  parentId: null,
                  assetCount: 1,
                },
              ],
              workflows: [{ id: "wf-1", name: "Workflow 1", workflow_type: "GENERATION" }],
              media: [],
            },
          },
        };
      }
      return null;
    });

    // StudioLayout coordinated query hook
    const { result: layoutQueries } = renderHook(
      () => {
        const project = useProjectData("proj-1");
        const folders = useProjectFolders("proj-1");
        const isLoading = project.isLoading || folders.isLoading;
        return { project, folders, isLoading };
      },
      { wrapper }
    );

    // Initially loading
    expect(layoutQueries.current.isLoading).toBe(true);

    // Wait until project-data resolves
    await waitFor(() => {
      expect(layoutQueries.current.isLoading).toBe(false);
    });

    // Verify BOTH datasets are populated from a single network call:
    expect(layoutQueries.current.project.data?.projectContents?.workflows).toHaveLength(1);
    expect(layoutQueries.current.folders.data).toHaveLength(1);
    expect(layoutQueries.current.folders.data[0].color).toBe("#EC4899");
    expect(layoutQueries.current.folders.data[0].assetCount).toBe(1);

    // Verify that NO standalone /folders API call was made
    const calls = api.get.mock.calls.map(([url]) => url);
    expect(calls.some((url) => url.includes("/projects/proj-1/folders"))).toBe(false);

    // Child components reading from cache immediately get both on frame 0:
    const { result: childWorkflows } = renderHook(() => useFilteredWorkflows("proj-1"), { wrapper });
    const { result: childFolders } = renderHook(() => useProjectFolders("proj-1"), { wrapper });

    expect(childWorkflows.current.isLoading).toBe(false);
    expect(childFolders.current.isLoading).toBe(false);
    expect(childWorkflows.current.filteredCount).toBe(1);
    expect(childFolders.current.data).toHaveLength(1);
    expect(childFolders.current.data[0].name).toBe("Collection 1");
  });

  it("instant cache hydration: when projectData is already in cache, useProjectFolders returns collections on frame 0", () => {
    const { queryClient, wrapper } = createWrapper();

    queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), {
      projectName: "Test Project",
      projectId: "proj-1",
      projectContents: {
        collections: [
          {
            id: "col-1",
            name: "Collection 1",
            color: "#3B82F6",
            description: "Instant cache collection",
            parentId: null,
            assetCount: 5,
          },
        ],
        workflows: [{ id: "wf-1", name: "Workflow 1" }],
        media: [],
      },
    });

    const { result: foldersHook } = renderHook(() => useProjectFolders("proj-1"), { wrapper });

    expect(foldersHook.current.isLoading).toBe(false);
    expect(foldersHook.current.data).toHaveLength(1);
    expect(foldersHook.current.data[0].id).toBe("col-1");
    expect(foldersHook.current.data[0].color).toBe("#3B82F6");
  });
});
