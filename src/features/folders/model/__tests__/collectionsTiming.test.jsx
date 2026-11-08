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

describe("Collections vs Workflows Initial Load Timing Analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes the timing gap: workflows are immediately available from layout cache while folders are still in-flight", async () => {
    const { queryClient, wrapper } = createWrapper();

    // 1. Simulate StudioLayout having already fetched and cached projectData:
    queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), {
      projectName: "Test Project",
      projectId: "proj-1",
      projectContents: {
        workflows: [
          { id: "wf-1", name: "Workflow 1", workflow_type: "GENERATION" },
          { id: "wf-2", name: "Workflow 2", workflow_type: "GENERATION" },
        ],
        media: [],
      },
    });

    // 2. Folders API has latency (takes a delay to resolve):
    let resolveFolders;
    const foldersPromise = new Promise((resolve) => {
      resolveFolders = resolve;
    });
    api.get.mockReturnValueOnce(foldersPromise);

    // 3. Render both hooks as AssetsPage does:
    const { result: workflowsHook } = renderHook(() => useFilteredWorkflows("proj-1"), { wrapper });
    const { result: foldersHook } = renderHook(() => useProjectFolders("proj-1"), { wrapper });

    // VERIFICATION OF THE BUG:
    // Workflows are IMMEDIATELY ready (0ms) because StudioLayout pre-cached them:
    expect(workflowsHook.current.filteredCount).toBe(2);
    expect(workflowsHook.current.isLoading).toBe(false);

    // But folders are STILL LOADING because StudioLayout never fetched them:
    expect(foldersHook.current.isLoading).toBe(true);
    expect(foldersHook.current.data).toBeUndefined();

    // Resolve folders now:
    resolveFolders([
      { id: "col-1", name: "Collection 1", parentId: null },
    ]);

    await waitFor(() => {
      expect(foldersHook.current.isLoading).toBe(false);
      expect(foldersHook.current.data).toHaveLength(1);
    });
  });

  it("verifies the fix: when StudioLayout fetches both queries concurrently, both arrive together with 0ms delay", async () => {
    const { wrapper } = createWrapper();

    api.get.mockImplementation(async (url) => {
      if (url.includes("/workflows/project-data/")) {
        return {
          data: {
            projectName: "Test Project",
            projectId: "proj-1",
            projectContents: {
              workflows: [{ id: "wf-1", name: "Workflow 1", workflow_type: "GENERATION" }],
              media: [],
            },
          },
        };
      }
      if (url.includes("/folders")) {
        return [{ id: "col-1", name: "Collection 1", parentId: null }];
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

    // Wait until both queries resolve in parallel
    await waitFor(() => {
      expect(layoutQueries.current.isLoading).toBe(false);
    });

    // When layout finishes loading, BOTH datasets are completely populated simultaneously:
    expect(layoutQueries.current.project.data?.projectContents?.workflows).toHaveLength(1);
    expect(layoutQueries.current.folders.data).toHaveLength(1);

    // Now, any child page (like AssetsPage) reading from cache immediately gets both on frame 0:
    const { result: childWorkflows } = renderHook(() => useFilteredWorkflows("proj-1"), { wrapper });
    const { result: childFolders } = renderHook(() => useProjectFolders("proj-1"), { wrapper });

    expect(childWorkflows.current.isLoading).toBe(false);
    expect(childFolders.current.isLoading).toBe(false);
    expect(childWorkflows.current.filteredCount).toBe(1);
    expect(childFolders.current.data).toHaveLength(1);
  });
});
