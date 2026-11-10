import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MoveToDialog } from "@/shared/ui/MoveToDialog";

const mockMoveItem = vi.fn();
vi.mock("@/features/folders/model/useFolderMove", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useFolderMove: () => ({
      moveItem: mockMoveItem,
      isPending: false,
    }),
  };
});

const mockCreateFolder = vi.fn();
vi.mock("@/features/folders/api/mutations/useCreateFolder", () => ({
  useCreateFolder: () => ({
    mutateAsync: mockCreateFolder,
    isPending: false,
  }),
}));

const mockFolders = [
  { id: "f-root-1", name: "Alpha Folder", parentId: null, color: "#9B51E0" },
  { id: "f-child-1", name: "Beta Child", parentId: "f-root-1", color: null },
  { id: "f-root-2", name: "Gamma Folder", parentId: null, color: "#219653" },
];

vi.mock("@/features/folders/api/queries/useProjectFolders", () => ({
  useProjectFolders: () => ({
    data: mockFolders,
    isLoading: false,
  }),
}));

function renderWithClient(ui) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("MoveToDialog Component", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders when open with search, destination list, cancel and move buttons", () => {
    renderWithClient(
      <MoveToDialog
        open={true}
        onOpenChange={vi.fn()}
        projectId="proj-123"
        item={{ id: "f-root-2", name: "Gamma Folder", parentId: null }}
      />
    );

    expect(screen.getByText("Move to")).toBeDefined();
    expect(screen.getByPlaceholderText("Find folder..")).toBeDefined();
    expect(screen.getByText("Workspace Root (Top level)")).toBeDefined();
    expect(screen.getByText("Alpha Folder")).toBeDefined();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Move" })).toBeDefined();

    // Feedback Loop Assertion: Dialog must NOT have collapsed width
    const dialogContent = document.querySelector('[data-slot="dialog-content"]');
    expect(dialogContent).toBeDefined();
    expect(dialogContent.className).toMatch(/\bw-112\b|\bw-96\b/);
  });

  it("displays project title as the root destination when projectTitle is provided", () => {
    renderWithClient(
      <MoveToDialog
        open={true}
        onOpenChange={vi.fn()}
        projectId="proj-123"
        projectTitle="My Awesome Movie"
        item={{ id: "f-root-2", name: "Gamma Folder", parentId: null }}
      />
    );

    expect(screen.getByText("My Awesome Movie (Top level)")).toBeDefined();
  });

  it("disables destination if target is the folder itself or descendant (cycle prevention)", () => {
    renderWithClient(
      <MoveToDialog
        open={true}
        onOpenChange={vi.fn()}
        projectId="proj-123"
        item={{ id: "f-root-1", name: "Alpha Folder", parentId: null }}
      />
    );

    // Alpha Folder and its child Beta Child both show "Cannot move here"
    const cannotMoveBadges = screen.getAllByText("Cannot move here");
    expect(cannotMoveBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("filters folders by search query", () => {
    renderWithClient(
      <MoveToDialog
        open={true}
        onOpenChange={vi.fn()}
        projectId="proj-123"
        item={{ id: "f-root-2", name: "Gamma Folder", parentId: null }}
      />
    );

    const input = screen.getByPlaceholderText("Find folder..");
    fireEvent.change(input, { target: { value: "Alpha" } });

    expect(screen.getByText("Alpha Folder")).toBeDefined();
    expect(screen.queryByText("Workspace Root (Top level)")).toBeNull();
  });

  it("calls moveItem when selecting valid destination and clicking Move", async () => {
    mockMoveItem.mockResolvedValueOnce({ success: true });
    const onOpenChange = vi.fn();

    renderWithClient(
      <MoveToDialog
        open={true}
        onOpenChange={onOpenChange}
        projectId="proj-123"
        item={{ id: "f-root-2", name: "Gamma Folder", parentId: null }}
      />
    );

    // Click on Alpha Folder row
    const alphaItem = screen.getByText("Alpha Folder");
    fireEvent.click(alphaItem);

    // Move button should be enabled
    const moveBtn = screen.getByRole("button", { name: "Move" });
    expect(moveBtn.disabled).toBe(false);

    fireEvent.click(moveBtn);

    await waitFor(() => {
      expect(mockMoveItem).toHaveBeenCalledWith(
        expect.objectContaining({
          itemType: "collection",
          targetFolderId: "f-root-1",
        })
      );
    });
  });
});
