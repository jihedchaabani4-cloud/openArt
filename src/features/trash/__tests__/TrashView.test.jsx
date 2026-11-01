import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TrashView } from "../ui/TrashView";
import { queryKeys } from "@/shared/api/queryKeys";
import { api } from "@/shared/api/client";
import { useFilteredWorkflows } from "@/features/workflows/model/useFilteredWorkflows";
import { useElementSheetWorkflows } from "@/features/elements/hooks/useElementSheetWorkflows";
import { useCharacterWorkflows } from "@/features/characters/hooks/useCharacterWorkflows";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/cinema-studio/proj-1/trash",
  useParams: () => ({ projectId: "proj-1" }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("react-photo-album", () => ({
  RowsPhotoAlbum: ({ photos, render }) => (
    <div data-testid="photo-album">
      {photos?.map((photo, i) =>
        render?.photo
          ? React.cloneElement(
              render.photo({}, { photo, width: photo.width || 300, height: photo.height || 300 }),
              { key: photo.key || i }
            )
          : null
      )}
    </div>
  ),
}));

vi.mock("@/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu", () => ({
  StudioItemDropdownMenu: ({ items, trigger }) => (
    <div data-testid="studio-item-menu">
      {trigger}
      <div data-testid="menu-items">
        {items?.map((item, idx) => (
          <button
            key={item.key || idx}
            role="menuitem"
            onClick={item.onClick}
            disabled={item.disabled}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  ),
  StudioContextMenuContent: () => null,
}));

vi.mock("@/shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/shared/api/auth", () => ({
  useAuthSession: () => ({ data: { id: "user-1" }, isLoading: false }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

describe("TrashView and Selector Isolation", () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    api.get.mockResolvedValue({ data: mockProjectPayload });
  });

  afterEach(() => {
    cleanup();
  });

  const mockProjectPayload = {
    projectName: "Test Studio Project",
    projectId: "proj-1",
    projectContents: {
      workflows: [
        {
          id: "wf-active-gen",
          name: "wf-active-gen",
          display_name: "Active Sunset",
          workflow_type: "GENERATION",
          items: [{ id: "m-active", url: "https://storage/active.png", status: "completed" }],
        },
      ],
      trashedWorkflows: [
        {
          id: "wf-trashed-gen",
          name: "wf-trashed-gen",
          display_name: "Trashed Sunrise",
          workflow_type: "GENERATION",
          deleted_at: "2026-10-25T12:00:00.000Z",
          primary_media_id: "m-trashed",
          items: [{ id: "m-trashed", url: "https://storage/trashed.png", status: "completed" }],
        },
      ],
      elements: [],
      characters: [],
      media: [
        {
          id: "m-active",
          workflowId: "wf-active-gen",
          url: "https://storage/active.png",
          status: "completed",
        },
      ],
    },
  };

  it("1. Trashed items show in Trash page and NEVER in Studio, Elements, or Characters selectors", () => {
    // Populate queryClient cache for proj-1
    queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), mockProjectPayload);

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Verify studio selector receives ONLY active workflows
    const { result: studioResult } = renderHook(() => useFilteredWorkflows("proj-1"), { wrapper });
    const studioList = studioResult.current.data?.filteredWorkflows || [];
    expect(studioList.some((w) => w.id === "wf-trashed-gen")).toBe(false);
    expect(studioList.some((w) => w.id === "wf-active-gen")).toBe(true);

    // Verify elements selector receives ONLY active elements
    const { result: elemResult } = renderHook(() => useElementSheetWorkflows("proj-1"), { wrapper });
    const elemList = elemResult.current.workflows || [];
    expect(elemList.some((e) => e.id === "wf-trashed-gen")).toBe(false);

    // Verify characters selector receives ONLY active characters
    const { result: charResult } = renderHook(() => useCharacterWorkflows("proj-1"), { wrapper });
    const charList = charResult.current.workflows || [];
    expect(charList.some((c) => c.id === "wf-trashed-gen")).toBe(false);

    // Render TrashView -> shows the trashed item
    render(
      <QueryClientProvider client={queryClient}>
        <TrashView projectId="proj-1" />
      </QueryClientProvider>
    );

    expect(screen.getByText("Trashed Sunrise")).toBeDefined();
  });

  it("2. Empty state renders when trashedWorkflows is empty", () => {
    queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), {
      ...mockProjectPayload,
      projectContents: {
        ...mockProjectPayload.projectContents,
        trashedWorkflows: [],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TrashView projectId="proj-1" />
      </QueryClientProvider>
    );

    expect(screen.getByText("La corbeille est vide")).toBeDefined();
  });

  it("3. Restore calls POST /api/trash/:workflowId/restore and invalidates project-data", async () => {
    api.post.mockResolvedValueOnce({ ok: true, workflow_id: "wf-trashed-gen", restored: true });

    queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), mockProjectPayload);

    render(
      <QueryClientProvider client={queryClient}>
        <TrashView projectId="proj-1" />
      </QueryClientProvider>
    );

    // Click Restaurer menu item
    const restoreMenuItem = await screen.findByRole("menuitem", { name: /restaurer/i });
    fireEvent.click(restoreMenuItem);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/trash/wf-trashed-gen/restore");
    });
  });

  it("4. Delete permanently opens ConfirmDeleteDialog and calls DELETE /api/workflows/workflows/:id", async () => {
    api.delete.mockResolvedValueOnce({ ok: true, workflowId: "wf-trashed-gen", deleted: true });

    queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), mockProjectPayload);

    render(
      <QueryClientProvider client={queryClient}>
        <TrashView projectId="proj-1" />
      </QueryClientProvider>
    );

    // Click Supprimer définitivement menu item
    const deleteMenuItem = await screen.findByRole("menuitem", { name: /supprimer définitivement/i });
    fireEvent.click(deleteMenuItem);

    // Confirm dialog should appear
    expect(await screen.findByText(/cette action est irréversible/i)).toBeDefined();

    // Click confirm button in dialog
    const confirmBtn = screen.getByRole("button", { name: "Supprimer définitivement" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/workflows/workflows/wf-trashed-gen");
    });
  });

  it("5. A failed restore handles error gracefully without throwing or crashing", async () => {
    api.post.mockRejectedValueOnce(new Error("Network connection error"));

    queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), mockProjectPayload);

    render(
      <QueryClientProvider client={queryClient}>
        <TrashView projectId="proj-1" />
      </QueryClientProvider>
    );

    const restoreMenuItem = await screen.findByRole("menuitem", { name: /restaurer/i });
    fireEvent.click(restoreMenuItem);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/trash/wf-trashed-gen/restore");
    });
  });

  it("6. Search filter filters trashed items by name and prompt via unified selector", async () => {
    const payloadWithMultipleTrash = {
      ...mockProjectPayload,
      projectContents: {
        ...mockProjectPayload.projectContents,
        trashedWorkflows: [
          {
            id: "wf-trashed-1",
            name: "wf-trashed-1",
            display_name: "Morning Dew",
            workflow_type: "GENERATION",
            deleted_at: "2026-10-25T12:00:00.000Z",
            items: [{ id: "m-1", url: "https://storage/dew.png", status: "completed" }],
          },
          {
            id: "wf-trashed-2",
            name: "wf-trashed-2",
            display_name: "Cyber Samurai",
            workflow_type: "CHARACTER",
            deleted_at: "2026-10-25T12:00:00.000Z",
            items: [{ id: "m-2", url: "https://storage/samurai.png", status: "completed" }],
          },
        ],
      },
    };

    queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), payloadWithMultipleTrash);

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <TrashView projectId="proj-1" />
      </QueryClientProvider>
    );

    expect(screen.getByText("Morning Dew")).toBeDefined();
    expect(screen.getByText("Cyber Samurai")).toBeDefined();

    // Set search query in store
    const { useWorkflowsStore } = await import("@/features/workflows");
    useWorkflowsStore.getState().setFilter("prompt", "samurai");

    rerender(
      <QueryClientProvider client={queryClient}>
        <TrashView projectId="proj-1" />
      </QueryClientProvider>
    );

    expect(screen.queryByText("Morning Dew")).toBeNull();
    expect(screen.getByText("Cyber Samurai")).toBeDefined();

    // Reset filter
    useWorkflowsStore.getState().setFilter("prompt", "");
  });

  it("7. Applies horizontal padding (px-6 sm:px-10 lg:px-14) to the Trash media grid scroll container so items do not hug the viewport edges", () => {
    queryClient.setQueryData(queryKeys.projectData.byProject("proj-1"), mockProjectPayload);

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <TrashView projectId="proj-1" />
      </QueryClientProvider>
    );

    const scrollContainer = container.querySelector('[data-scroll-container="true"]');
    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer.className).toContain("px-6");
    expect(scrollContainer.className).toContain("sm:px-10");
    expect(scrollContainer.className).toContain("lg:px-14");
    expect(scrollContainer.className).not.toContain("px-3");
  });
});
