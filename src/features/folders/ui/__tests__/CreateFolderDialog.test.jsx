import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateFolderDialog } from "@/shared/ui/CreateFolderDialog";

const mockMutateAsync = vi.fn();
vi.mock("@/features/folders/api/mutations/useCreateFolder", () => ({
  useCreateFolder: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

const mockUpdateMutateAsync = vi.fn();
vi.mock("@/features/folders/api/mutations/useUpdateFolder", () => ({
  useUpdateFolder: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
}));

const mockSetActiveCollectionId = vi.fn();
vi.mock("@/features/workflows/model/useWorkflowsStore", () => ({
  useWorkflowsStore: (selector) =>
    selector({
      selectedProjectId: "proj-123",
      setActiveCollectionId: mockSetActiveCollectionId,
    }),
}));

function renderWithClient(ui) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("CreateFolderDialog Component", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders when open and displays default fields with correct full width", () => {
    const { container } = renderWithClient(
      <CreateFolderDialog open={true} onOpenChange={vi.fn()} projectId="proj-123" />
    );

    expect(screen.getByText("New folder")).toBeDefined();
    expect(screen.getByLabelText("Folder name")).toBeDefined();
    expect(screen.getByText("Description")).toBeDefined();
    expect(screen.getByText("Color")).toBeDefined();
    expect(screen.getByRole("button", { name: "Create" })).toBeDefined();

    // Feedback Loop Assertion: Dialog must NOT have collapsed width or missing width class
    const dialogContent = document.querySelector('[data-slot="dialog-content"]');
    expect(dialogContent).toBeDefined();
    expect(dialogContent.className).toMatch(/\bw-96\b|\bmin-w-\b|\bw-\[\d+px\]/);
  });

  it("allows toggling description textarea expansion", () => {
    renderWithClient(
      <CreateFolderDialog open={true} onOpenChange={vi.fn()} projectId="proj-123" />
    );

    expect(screen.queryByLabelText("Folder description")).toBeNull();

    const expandBtn = screen.getByLabelText("Expand description");
    fireEvent.click(expandBtn);

    const textarea = screen.getByLabelText("Folder description");
    expect(textarea).toBeDefined();

    fireEvent.change(textarea, { target: { value: "Folder notes" } });
    expect(textarea.value).toBe("Folder notes");
  });

  it("submits with custom name, selected color, and description", async () => {
    mockMutateAsync.mockResolvedValueOnce({ id: "new-folder-1" });
    const onOpenChange = vi.fn();

    renderWithClient(
      <CreateFolderDialog
        open={true}
        onOpenChange={onOpenChange}
        projectId="proj-123"
        parentId="parent-folder"
      />
    );

    const nameInput = screen.getByLabelText("Folder name");
    fireEvent.change(nameInput, { target: { value: "Marketing 2026" } });

    // Select Cyan color option
    const cyanBtn = screen.getByLabelText("Folder color Cyan");
    fireEvent.click(cyanBtn);

    // Expand & enter description
    fireEvent.click(screen.getByLabelText("Expand description"));
    fireEvent.change(screen.getByLabelText("Folder description"), {
      target: { value: "Marketing campaign files" },
    });

    // Submit
    const submitBtn = screen.getByRole("button", { name: "Create" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        projectId: "proj-123",
        name: "Marketing 2026",
        color: "#67e8f9",
        description: "Marketing campaign files",
        parentId: "parent-folder",
      });
      expect(mockSetActiveCollectionId).toHaveBeenCalledWith("new-folder-1");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("handles edit mode: pre-populates data, disables Update until modified, and sends only changed patch", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({ id: "f-123", name: "Updated Name" });
    const onOpenChange = vi.fn();

    const existingFolder = {
      id: "f-123",
      name: "Original Name",
      description: "Original Description",
      color: "#d1fe17", // Lime
    };

    renderWithClient(
      <CreateFolderDialog
        open={true}
        onOpenChange={onOpenChange}
        projectId="proj-123"
        folder={existingFolder}
      />
    );

    // Initial state check
    expect(screen.getByText("Edit folder")).toBeDefined();
    const nameInput = screen.getByLabelText("Folder name");
    expect(nameInput.value).toBe("Original Name");

    const descInput = screen.getByLabelText("Folder description");
    expect(descInput.value).toBe("Original Description");

    // Update button is initially disabled (no changes yet)
    const updateBtn = screen.getByRole("button", { name: "Update" });
    expect(updateBtn.disabled).toBe(true);

    // Modify only the name
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });
    expect(updateBtn.disabled).toBe(false);

    // Revert name back to original -> disabled again
    fireEvent.change(nameInput, { target: { value: "Original Name" } });
    expect(updateBtn.disabled).toBe(true);

    // Modify color to Cyan (#67e8f9)
    const cyanBtn = screen.getByLabelText("Folder color Cyan");
    fireEvent.click(cyanBtn);
    expect(updateBtn.disabled).toBe(false);

    // Also modify name
    fireEvent.change(nameInput, { target: { value: "Final Collection" } });

    // Submit
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        folderId: "f-123",
        projectId: "proj-123",
        patch: {
          name: "Final Collection",
          color: "#67e8f9",
          // description did NOT change, so it's not sent!
        },
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
