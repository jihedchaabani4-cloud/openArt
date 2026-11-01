import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavbarRestoreAllButton } from "../ui/NavbarRestoreAllButton";
import { queryKeys } from "@/shared/api/queryKeys";
import { api } from "@/shared/api/client";
import { toast } from "sonner";
import { useWorkflowsStore } from "@/features/workflows";

let mockPathname = "/cinema-studio/proj-1/assets";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ projectId: "proj-1" }),
}));

vi.mock("@/shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

describe("NavbarRestoreAllButton", () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    mockPathname = "/cinema-studio/proj-1/assets";
    useWorkflowsStore.setState({
      selectedProjectId: "proj-1",
      activeStudioTab: "assets",
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("1. Does not render on non-trash tabs (assets, elements, characters)", () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <NavbarRestoreAllButton />
      </QueryClientProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it("2. Renders on trash tab and is disabled when trash is empty", () => {
    mockPathname = "/cinema-studio/proj-1/trash";
    useWorkflowsStore.setState({
      selectedProjectId: "proj-1",
      activeStudioTab: "trash",
    });

    queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), {
      projectName: "Test",
      projectContents: {
        workflows: [],
        trashedWorkflows: [],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <NavbarRestoreAllButton />
      </QueryClientProvider>
    );

    const btn = screen.getByRole("button", { name: /tout restaurer/i });
    expect(btn).toBeDefined();
    expect(btn.disabled).toBe(true);
  });

  it("3. Enabled when items exist in trash and calls restoreAll on click", async () => {
    mockPathname = "/cinema-studio/proj-1/trash";
    useWorkflowsStore.setState({
      selectedProjectId: "proj-1",
      activeStudioTab: "trash",
    });

    api.post.mockResolvedValueOnce({
      ok: true,
      restored: true,
      count: 2,
      workflow_ids: ["wf-1", "wf-2"],
    });

    queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), {
      projectName: "Test",
      projectContents: {
        workflows: [],
        trashedWorkflows: [
          { id: "wf-1", name: "wf-1", display_name: "Trashed 1" },
          { id: "wf-2", name: "wf-2", display_name: "Trashed 2" },
        ],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <NavbarRestoreAllButton />
      </QueryClientProvider>
    );

    const btn = screen.getByRole("button", { name: /tout restaurer/i });
    expect(btn.disabled).toBe(false);

    fireEvent.click(btn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/trash/restore-all", { projectId: "proj-1" });
      expect(toast.success).toHaveBeenCalledWith("Tous les éléments ont été restaurés avec succès.");
    });
  });
});
