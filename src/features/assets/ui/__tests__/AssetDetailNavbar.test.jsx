import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AssetDetailNavbar from "../AssetDetailNavbar";
import { queryKeys } from "@/shared/api/queryKeys";

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });
}

describe("AssetDetailNavbar Reactive Query Synchronization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders 'Media Viewer' fallback when data is unavailable or loading, and renders userSlot when provided", () => {
    const queryClient = createTestClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AssetDetailNavbar
          workflowId="wf-loading"
          userSlot={<div data-testid="user-dropdown">UserDropdown</div>}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText("Media Viewer")).toBeDefined();
    expect(screen.getByTestId("user-dropdown")).toBeDefined();
    expect(screen.getByRole("link", { name: "Back to assets" })).toBeDefined();
  });

  it("renders display_name reactively from query cache", () => {
    const queryClient = createTestClient();
    queryClient.setQueryData(queryKeys.library.detail("wf-1"), {
      workflow: { id: "wf-1", display_name: "Cinematic Portrait" },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AssetDetailNavbar workflowId="wf-1" />
      </QueryClientProvider>
    );

    expect(screen.getByText("Cinematic Portrait")).toBeDefined();
  });

  it("reactively updates display_name when query cache is updated", async () => {
    const queryClient = createTestClient();
    queryClient.setQueryData(queryKeys.library.detail("wf-2"), {
      workflow: { id: "wf-2", display_name: "Original Title" },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AssetDetailNavbar workflowId="wf-2" />
      </QueryClientProvider>
    );

    expect(screen.getByText("Original Title")).toBeDefined();

    act(() => {
      queryClient.setQueryData(queryKeys.library.detail("wf-2"), {
        workflow: { id: "wf-2", display_name: "Updated Title After Rename" },
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Updated Title After Rename")).toBeDefined();
    });
  });
});
