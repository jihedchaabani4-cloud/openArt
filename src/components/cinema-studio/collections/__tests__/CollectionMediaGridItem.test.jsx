import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CollectionMediaGridItem } from "../CollectionMediaGridItem";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockToggleFavorite = vi.fn();
const mockSetActiveCollectionId = vi.fn();
vi.mock("@/features/workflows/model/useWorkflowsStore", () => ({
  useWorkflowsStore: (selector) =>
    selector({
      selectedProjectId: "proj-1",
      activeCollectionId: null,
      setActiveCollectionId: mockSetActiveCollectionId,
      favoriteFolderIds: {},
      toggleFavoriteFolder: mockToggleFavorite,
    }),
}));

const mockDownloadCollection = vi.fn();
const mockDeleteFolder = vi.fn();
let mockIsDeleting = false;
vi.mock("@/features/folders", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUpdateFolder: () => ({ mutateAsync: vi.fn() }),
    useDeleteFolder: () => ({ mutateAsync: mockDeleteFolder, isPending: mockIsDeleting }),
    useFolderMove: () => ({ moveItem: vi.fn(), executeMoveFromPayload: vi.fn() }),
    useDownloadCollection: () => ({ downloadCollection: mockDownloadCollection, isDownloading: false }),
  };
});

vi.mock("@/features/studio", () => ({
  usePromptStore: Object.assign(
    (selector) => selector({ isDraggingGalleryItem: false, draggedItem: null }),
    {
      getState: () => ({
        isDraggingGalleryItem: false,
        draggedItem: null,
        setIsDraggingGalleryItem: vi.fn(),
        setDraggedItem: vi.fn(),
      }),
    }
  ),
  useStudioItemDrag: () => ({
    handlePointerDown: vi.fn(),
    isDragging: false,
    justDraggedRef: { current: false },
  }),
}));

describe("CollectionMediaGridItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders collection title and folder action controls", () => {
    const mockCollection = {
      id: "folder-123",
      name: "Landscapes",
    };

    render(
      <CollectionMediaGridItem
        collection={mockCollection}
        projectId="proj-1"
      />
    );

    expect(screen.getByText("Landscapes")).toBeDefined();
    expect(screen.getByTitle("Like collection")).toBeDefined();
  });

  it("calls toggleFavoriteFolder when like action button is clicked", () => {
    const mockCollection = {
      id: "folder-456",
      name: "Characters",
    };

    render(
      <CollectionMediaGridItem
        collection={mockCollection}
        projectId="proj-1"
      />
    );

    const likeBtn = screen.getByTitle("Like collection");
    fireEvent.click(likeBtn);

    expect(mockToggleFavorite).toHaveBeenCalledWith("folder-456");
  });

  it("navigates to collection view on card click", () => {
    const mockCollection = {
      id: "folder-789",
      name: "Architecture",
    };

    const handleClick = vi.fn();
    render(
      <CollectionMediaGridItem
        collection={mockCollection}
        projectId="proj-1"
        onClick={handleClick}
      />
    );

    const titleEl = screen.getByText("Architecture");
    fireEvent.click(titleEl);

    expect(handleClick).toHaveBeenCalledWith(mockCollection, expect.anything());
  });

  it("awaits deleteFolder and closes dialog on successful deletion", async () => {
    mockDeleteFolder.mockResolvedValueOnce({ success: true });

    render(
      <CollectionMediaGridItem
        collection={{ id: "folder-del-1", name: "Landscapes" }}
        projectId="proj-1"
      />
    );

    // Right-click to trigger context menu
    const trigger = document.querySelector(".group");
    fireEvent.contextMenu(trigger);

    // Click Delete option in context menu
    const deleteOption = await screen.findByText("Delete");
    fireEvent.click(deleteOption);

    // Confirm dialog should be open
    const confirmBtn = await screen.findByRole("button", { name: "Supprimer" });
    fireEvent.click(confirmBtn);

    expect(mockDeleteFolder).toHaveBeenCalledWith({
      folderId: "folder-del-1",
      projectId: "proj-1",
    });
  });

  it("preserves dialog when deleteFolder fails", async () => {
    mockDeleteFolder.mockRejectedValueOnce(new Error("Network delete error"));

    render(
      <CollectionMediaGridItem
        collection={{ id: "folder-del-2", name: "Landscapes Fail" }}
        projectId="proj-1"
      />
    );

    // Right-click to trigger context menu
    const trigger = document.querySelector(".group");
    fireEvent.contextMenu(trigger);

    // Click Delete option in context menu
    const deleteOption = await screen.findByText("Delete");
    fireEvent.click(deleteOption);

    // Confirm dialog should be open
    const confirmBtn = await screen.findByRole("button", { name: "Supprimer" });
    fireEvent.click(confirmBtn);

    expect(mockDeleteFolder).toHaveBeenCalledWith({
      folderId: "folder-del-2",
      projectId: "proj-1",
    });

    // Dialog remains rendered
    expect(screen.getByText('Are you sure you want to delete collection "Landscapes Fail"?')).toBeDefined();
  });

  it("renders title inside collection-title-container and keeps a single outer rounded-xxxs boundary", () => {
    const { container } = render(
      <CollectionMediaGridItem
        collection={{ id: "folder-style-1", name: "Styled Folder" }}
        coverUrl="https://example.com/cover.jpg"
        projectId="proj-1"
      />
    );

    expect(container.querySelector(".collection-title-container .title-text")?.textContent).toBe("Styled Folder");
    const roundedNodes = Array.from(container.querySelectorAll("[class]")).filter((el) =>
      /\brounded-(xs|sm|md|lg|xl|2xl|3xl|xxxs)\b/.test(el.className)
    );
    expect(roundedNodes).toHaveLength(1);
    expect(roundedNodes[0].className).toContain("rounded-xxxs");
  });
});
