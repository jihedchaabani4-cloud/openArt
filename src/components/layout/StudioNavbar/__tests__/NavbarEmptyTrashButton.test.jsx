import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { NavbarEmptyTrashButton } from "../NavbarEmptyTrashButton";
import { useStudioSelectionStore } from "@/features/workflows/model/useStudioSelectionStore";

let mockPathname = "/cinema-studio/proj-1/trash";
let mockStoreState = {
  activeStudioTab: "trash",
  selectedProjectId: "proj-1",
};
let mockProjectData = {
  projectContents: {
    trashedWorkflows: [{ id: "wf-1" }, { id: "wf-2" }],
  },
};
const mockMutateAsync = vi.fn();
let mockIsPending = false;

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/features/workflows", () => ({
  useWorkflowsStore: (selector) => selector(mockStoreState),
}));

vi.mock("@/features/workflows/api/queries/useProjectData", () => ({
  useProjectData: () => ({ data: mockProjectData }),
}));

vi.mock("@/features/trash/api/mutations/useTrashDelete", () => ({
  useTrashDelete: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending,
  }),
}));

describe("NavbarEmptyTrashButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/cinema-studio/proj-1/trash";
    mockStoreState = {
      activeStudioTab: "trash",
      selectedProjectId: "proj-1",
    };
    mockProjectData = {
      projectContents: {
        trashedWorkflows: [{ id: "wf-1" }, { id: "wf-2" }],
      },
    };
    mockIsPending = false;
    mockMutateAsync.mockResolvedValue({
      ok: true,
      deleted_workflow_ids: ["wf-1", "wf-2"],
      count: 2,
      deleted_media_count: 2,
      storage_failures: [],
    });
    useStudioSelectionStore.setState({
      scopeKey: "trash:proj-1",
      selectedKeys: ["workflow:wf-1"],
      lastSelectedKey: "workflow:wf-1",
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("is hidden outside the Trash tab", () => {
    mockPathname = "/cinema-studio/proj-1/assets";
    mockStoreState = {
      activeStudioTab: "assets",
      selectedProjectId: "proj-1",
    };

    const { container } = render(<NavbarEmptyTrashButton />);
    expect(container.firstChild).toBeNull();
  });

  it("is hidden when Trash is empty", () => {
    mockProjectData = {
      projectContents: {
        trashedWorkflows: [],
      },
    };

    const { container } = render(<NavbarEmptyTrashButton />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when Trash has items, opens confirmation modal with exact copy, empties trash, and clears selection", async () => {
    render(<NavbarEmptyTrashButton />);

    const triggerBtn = screen.getByRole("button", { name: /Empty Trash/i });
    expect(triggerBtn).toBeDefined();

    fireEvent.click(triggerBtn);
    expect(mockMutateAsync).not.toHaveBeenCalled();

    expect(
      await screen.findByText(
        "Empty Trash? All trashed items will be permanently deleted."
      )
    ).toBeDefined();

    const emptyButtons = screen.getAllByRole("button", { name: "Empty Trash" });
    fireEvent.click(emptyButtons[emptyButtons.length - 1]);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        projectId: "proj-1",
        all: true,
      });
    });

    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);
    expect(toast.success).toHaveBeenCalledWith(
      "Trash emptied (2 items permanently deleted)."
    );
  });

  it("handles count === 0 gracefully with an info toast", async () => {
    mockMutateAsync.mockResolvedValue({
      ok: true,
      deleted_workflow_ids: [],
      count: 0,
      deleted_media_count: 0,
      storage_failures: [],
    });

    render(<NavbarEmptyTrashButton />);

    fireEvent.click(screen.getByRole("button", { name: /Empty Trash/i }));
    const emptyButtons = await screen.findAllByRole("button", { name: "Empty Trash" });
    fireEvent.click(emptyButtons[emptyButtons.length - 1]);

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith("Trash is already empty.");
    });
  });

  it("surfaces error toast cleanly when empty trash request fails", async () => {
    mockMutateAsync.mockRejectedValue(new Error("Too many requests"));

    render(<NavbarEmptyTrashButton />);

    fireEvent.click(screen.getByRole("button", { name: /Empty Trash/i }));
    const emptyButtons = await screen.findAllByRole("button", { name: "Empty Trash" });
    fireEvent.click(emptyButtons[emptyButtons.length - 1]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Too many requests", {
        id: "trash-delete-error",
      });
    });
  });
});
