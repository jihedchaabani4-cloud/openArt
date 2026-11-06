import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { Suspense, act } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CollectionDetailPage from "@/app/cinema-studio/[projectId]/collection/[collectionId]/page";
import { queryKeys } from "@/shared/api/queryKeys";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/cinema-studio/proj-1/collection/col-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ projectId: "proj-1", collectionId: "col-1" }),
}));

vi.mock("@/shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/shared/api/auth", () => ({
  useAuthSession: () => ({ data: { id: "user-1" }, isLoading: false }),
}));

const stableParams = Promise.resolve({ projectId: "proj-1", collectionId: "col-1" });
stableParams.status = "fulfilled";
stableParams.value = { projectId: "proj-1", collectionId: "col-1" };

vi.mock("@/features/prompt-bar/index.platform", () => ({
  GeneratedPromptBar: () => <div data-testid="mock-prompt-bar">Prompt Bar</div>,
  useRealBackendModels: () => ({ data: { models: [] }, isLoading: false }),
}));

vi.mock("@/features/prompt-bar/core/useRealBackendModels", () => ({
  useRealBackendModels: () => ({ data: { models: [] }, isLoading: false }),
}));

function TestWrapper() {
  return (
    <Suspense fallback={<div>Loading suspense...</div>}>
      <CollectionDetailPage params={stableParams} />
    </Suspense>
  );
}

describe("CollectionDetailPage Media Visibility & Rendering", () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1200);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
  });

  it("renders workflows and media that belong strictly to collection col-1", async () => {
    queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), {
      projectName: "Test Project",
      projectId: "proj-1",
      projectContents: {
        workflows: [
          {
            id: "wf-in-col",
            name: "wf-in-col",
            display_name: "Workflow Inside Collection",
            folder_id: "col-1",
            folderId: "col-1",
            workflow_type: "UPLOAD",
            create_time: "2026-10-20T10:00:00Z",
            items: [
              {
                id: "media-1",
                url: "https://example.com/test-image.jpg",
                status: "success",
                width: 1000,
                height: 1000,
                role: "original",
              },
            ],
          },
          {
            id: "wf-root",
            name: "wf-root",
            display_name: "Workflow at Root",
            folder_id: null,
            folderId: null,
            workflow_type: "UPLOAD",
            create_time: "2026-10-20T09:00:00Z",
            items: [
              {
                id: "media-2",
                url: "https://example.com/root-image.jpg",
                status: "success",
                width: 1000,
                height: 1000,
                role: "original",
              },
            ],
          },
        ],
        media: [
          {
            id: "media-1",
            workflow_id: "wf-in-col",
            url: "https://example.com/test-image.jpg",
            status: "success",
            width: 1000,
            height: 1000,
            role: "original",
          },
        ],
        elements: [],
        characters: [],
      },
    });

    queryClient.setQueryData(queryKeys.folders.byProject("proj-1"), [
      { id: "col-1", name: "My Collection", parentId: null },
    ]);

    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <TestWrapper />
        </QueryClientProvider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText("Loading suspense...")).toBeNull();
    });

    // Empty state must not appear
    expect(screen.queryByText(/This collection is empty/i)).toBeNull();

    // Collection workflow card must render
    expect(screen.getByText("Workflow Inside Collection")).toBeDefined();

    // Root workflow must not be present in collection view
    expect(screen.queryByText("Workflow at Root")).toBeNull();

    // Images rendered inside photo album
    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThan(0);
    expect(images.some((img) => img.src === "https://example.com/test-image.jpg")).toBe(true);
  });

  it("renders empty state when collection col-1 contains no workflows", async () => {
    queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), {
      projectName: "Test Project",
      projectId: "proj-1",
      projectContents: {
        workflows: [
          {
            id: "wf-root-only",
            name: "wf-root-only",
            display_name: "Workflow at Root",
            folder_id: null,
            workflow_type: "UPLOAD",
          },
        ],
        media: [],
        elements: [],
        characters: [],
      },
    });

    queryClient.setQueryData(queryKeys.folders.byProject("proj-1"), [
      { id: "col-1", name: "My Empty Collection", parentId: null },
    ]);

    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <TestWrapper />
        </QueryClientProvider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText("Loading suspense...")).toBeNull();
    });

    expect(screen.getByText(/This collection is empty/i)).toBeDefined();
  });
});
