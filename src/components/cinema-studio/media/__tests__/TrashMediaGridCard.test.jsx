import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { TrashMediaGridCard } from "../TrashMediaGridCard";

const mockMutateAsync = vi.fn().mockResolvedValue({});
vi.mock("@/features/trash/api/mutations/useRestoreWorkflow", () => ({
  useRestoreWorkflow: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

const mockHandleDelete = vi.fn();
vi.mock("@/features/workflows/model/useMediaActions", () => ({
  useWorkflowActions: () => ({
    handleDelete: mockHandleDelete,
    isVideo: false,
    url: "https://example.com/trashed.jpg",
    status: "completed",
    aspect: "1/1",
    item: { id: "media-1", url: "https://example.com/trashed.jpg" },
  }),
}));

describe("TrashMediaGridCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders trashed workflow media item without like or history buttons", () => {
    const mockWorkflow = {
      id: "wf-trash-1",
      display_name: "Deleted Concept",
      deleted_at: "2026-11-06T12:00:00Z",
      items: [{ id: "media-1" }],
    };

    render(
      <TrashMediaGridCard
        workflow={mockWorkflow}
        projectId="proj-1"
      />
    );

    expect(screen.getByText("Deleted Concept")).toBeDefined();
    // Trash cards must NOT render like or reuse history buttons
    expect(screen.queryByTitle(/Like/i)).toBeNull();
    expect(screen.queryByTitle(/History/i)).toBeNull();
  });

  it("opens permanent delete confirmation dialog on delete trigger", () => {
    const mockWorkflow = {
      id: "wf-trash-2",
      display_name: "Old Draft",
      deleted_at: "2026-11-06T12:00:00Z",
      items: [{ id: "media-1" }],
    };

    render(
      <TrashMediaGridCard
        workflow={mockWorkflow}
        projectId="proj-1"
      />
    );

    // ConfirmDeleteDialog is initially closed, title is not yet visible in DOM
    expect(screen.queryByText("Supprimer définitivement ?")).toBeNull();
  });
});
