import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { StudioSelectionBar } from "../StudioSelectionBar";
import { MediaView } from "../MediaView";
import { useStudioSelectionStore } from "@/features/workflows/model/useStudioSelectionStore";
import { useWorkflowUiStore } from "@/features/workflows/model/useWorkflowUiStore";
import { useStudioBulkActions } from "@/features/workflows/model/useStudioBulkActions";
import { getBulkContextMenuSnapshot } from "@/features/workflows/model/studioBulkMenuBridge";

const mockRouterReplace = vi.fn();
const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: mockRouterPush,
  }),
}));

const mockBulkActions = {
  busyAction: null,
  hasCollections: false,
  hasWorkflows: true,
  workflowCount: 2,
  collectionCount: 0,
  canDownload: true,
  canMove: true,
  canLike: true,
  canAddToPrompt: true,
  isAllLiked: false,
  needsDeleteConfirm: true,
  bulkDownload: vi.fn(),
  bulkToggleLike: vi.fn(),
  bulkMoveToFolder: vi.fn().mockResolvedValue(undefined),
  bulkDelete: vi.fn().mockResolvedValue(undefined),
  bulkRestore: vi.fn().mockResolvedValue(undefined),
  bulkAddToPrompt: vi.fn(),
};

let currentBulkState = { ...mockBulkActions };

vi.mock("@/features/workflows/model/useStudioBulkActions", () => ({
  useStudioBulkActions: vi.fn(() => currentBulkState),
}));

let mockFolders = [];
const mockUseProjectFolders = vi.fn(() => ({ data: mockFolders }));
vi.mock("@/features/folders/api/queries/useProjectFolders", () => ({
  useProjectFolders: (...args) => mockUseProjectFolders(...args),
}));

const sampleEntries = [
  {
    type: "collection",
    key: "col-f1",
    data: { id: "f1", name: "Folder One" },
  },
  {
    type: "workflow",
    key: "wf-1",
    data: {
      id: "wf-1",
      items: [{ id: "m1", url: "https://example.com/1.png", status: "completed" }],
    },
  },
  {
    type: "workflow",
    key: "wf-2",
    data: {
      id: "wf-2",
      items: [{ id: "m2", url: "https://example.com/2.png", status: "completed" }],
    },
  },
];

describe("StudioSelectionBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkflowUiStore.setState({ showFolders: true });
    useStudioSelectionStore.setState({
      scopeKey: "assets:proj-1",
      selectedKeys: [],
      lastSelectedKey: null,
    });
    currentBulkState = {
      ...mockBulkActions,
      bulkDownload: vi.fn(),
      bulkToggleLike: vi.fn(),
      bulkMoveToFolder: vi.fn().mockResolvedValue(undefined),
      bulkDelete: vi.fn().mockResolvedValue(undefined),
      bulkRestore: vi.fn().mockResolvedValue(undefined),
      bulkAddToPrompt: vi.fn(),
    };
    mockFolders = [
      { id: "f1", name: "Folder One", parentId: null },
      { id: "f1-child", name: "Child of One", parentId: "f1" },
      { id: "f1-grandchild", name: "Grandchild of One", parentId: "f1-child" },
      { id: "f2", name: "Folder Two", parentId: null },
    ];
  });

  afterEach(() => {
    cleanup();
  });

  it("renders nothing when no items are selected", () => {
    const { container } = render(
      <StudioSelectionBar projectId="proj-1" scope="assets" entries={sampleEntries} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders count, thumbnail, clear button, and opens items-only Trash confirmation modal", async () => {
    useStudioSelectionStore.setState({
      selectedKeys: ["workflow:wf-1", "workflow:wf-2"],
      lastSelectedKey: "workflow:wf-2",
    });

    render(
      <StudioSelectionBar projectId="proj-1" scope="assets" entries={sampleEntries} />
    );

    expect(screen.getByRole("toolbar", { name: "Selection actions" })).toBeDefined();
    expect(screen.getByText("2 selected")).toBeDefined();

    // Thumbnail renders last selected workflow image
    const thumb = document.querySelector("img[src='https://example.com/2.png']");
    expect(thumb).not.toBeNull();

    // Action triggers
    fireEvent.click(screen.getByRole("button", { name: /Download/i }));
    expect(currentBulkState.bulkDownload).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Like selected" }));
    expect(currentBulkState.bulkToggleLike).toHaveBeenCalledTimes(1);

    // Items-only workspace delete ALWAYS opens confirmation dialog with exact copy
    fireEvent.click(screen.getByRole("button", { name: "Delete selected" }));
    expect(currentBulkState.bulkDelete).not.toHaveBeenCalled();

    expect(
      await screen.findByText("Move 2 selected items to Trash?")
    ).toBeDefined();
    const confirmBtn = screen.getByRole("button", { name: "Move to Trash" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(currentBulkState.bulkDelete).toHaveBeenCalledTimes(1);
    });

    // Clear selection button resets store
    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);
  });

  it("uses singular item wording for single workspace item delete confirmation", async () => {
    currentBulkState = {
      ...currentBulkState,
      workflowCount: 1,
      collectionCount: 0,
      hasCollections: false,
    };

    useStudioSelectionStore.setState({
      selectedKeys: ["workflow:wf-1"],
      lastSelectedKey: "workflow:wf-1",
    });

    render(
      <StudioSelectionBar projectId="proj-1" scope="assets" entries={sampleEntries} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete selected" }));
    expect(
      await screen.findByText("Move 1 selected item to Trash?")
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Move to Trash" })).toBeDefined();
  });

  it("hides Like when canLike is false and opens folder+items confirmation dialog with exact copy", async () => {
    currentBulkState = {
      ...currentBulkState,
      hasCollections: true,
      collectionCount: 1,
      workflowCount: 1,
      canLike: false,
      canAddToPrompt: false,
      needsDeleteConfirm: true,
    };

    useStudioSelectionStore.setState({
      selectedKeys: ["collection:f1", "workflow:wf-1"],
      lastSelectedKey: "collection:f1",
    });

    render(
      <StudioSelectionBar projectId="proj-1" scope="assets" entries={sampleEntries} />
    );

    expect(screen.queryByRole("button", { name: /Like selected/i })).toBeNull();

    // Clicking Delete opens confirmation dialog rather than deleting immediately
    fireEvent.click(screen.getByRole("button", { name: "Delete selected" }));
    expect(currentBulkState.bulkDelete).not.toHaveBeenCalled();

    expect(
      await screen.findByText(
        "Selected folders (and their subfolders) will be permanently deleted. All selected items and items inside those folders will be moved to Trash."
      )
    ).toBeDefined();

    const confirmBtn = screen.getByRole("button", { name: "Delete & Move to Trash" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(currentBulkState.bulkDelete).toHaveBeenCalledTimes(1);
    });
  });

  it("opens BulkMoveFolderDialog, excludes selected folders and their descendants, and moves to chosen folder", async () => {
    currentBulkState = {
      ...currentBulkState,
      hasCollections: true,
      collectionCount: 1,
      workflowCount: 0,
      canMove: true,
    };

    useStudioSelectionStore.setState({
      selectedKeys: ["collection:f1"],
      lastSelectedKey: "collection:f1",
    });

    render(
      <StudioSelectionBar projectId="proj-1" scope="assets" entries={sampleEntries} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Move to/i }));

    // Root and Folder Two should be present; Folder One and its descendants excluded
    expect(await screen.findByText("Root (All assets)")).toBeDefined();
    expect(screen.getByText("Folder Two")).toBeDefined();
    expect(screen.queryByText("Folder One")).toBeNull();
    expect(screen.queryByText("Child of One")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Folder Two/i }));
    fireEvent.click(screen.getByRole("button", { name: "Move" }));

    await waitFor(() => {
      expect(currentBulkState.bulkMoveToFolder).toHaveBeenCalledWith("f2");
    });
  });

  it("hides Move to on elements and characters scopes", () => {
    currentBulkState = {
      ...currentBulkState,
      canMove: false,
      canDownload: true,
      canLike: true,
    };

    useStudioSelectionStore.setState({
      selectedKeys: ["workflow:wf-1"],
      lastSelectedKey: "workflow:wf-1",
    });

    render(
      <StudioSelectionBar
        projectId="proj-1"
        scope="elements"
        workflows={[sampleEntries[1].data, sampleEntries[2].data]}
      />
    );

    expect(screen.queryByRole("button", { name: /Move to/i })).toBeNull();
    expect(screen.getByRole("button", { name: /Download/i })).toBeDefined();
    expect(screen.getByRole("button", { name: "Like selected" })).toBeDefined();
  });

  it("renders Restore, Delete permanently (with exact trash confirmation copy), and Select all on trash scope", async () => {
    currentBulkState = {
      ...currentBulkState,
      canDownload: false,
      canMove: false,
      canLike: false,
      canAddToPrompt: false,
      needsDeleteConfirm: true,
    };

    useStudioSelectionStore.setState({
      selectedKeys: ["workflow:wf-1"],
      lastSelectedKey: "workflow:wf-1",
    });

    render(
      <StudioSelectionBar
        projectId="proj-1"
        scope="trash"
        workflows={[sampleEntries[1].data, sampleEntries[2].data]}
      />
    );

    expect(screen.queryByRole("button", { name: /Download/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Move to/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Restore/i }));
    expect(currentBulkState.bulkRestore).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Select all/i }));
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "workflow:wf-1",
      "workflow:wf-2",
    ]);

    fireEvent.click(screen.getByRole("button", { name: /Delete permanently/i }));
    expect(currentBulkState.bulkDelete).not.toHaveBeenCalled();

    expect(
      await screen.findByText("Permanently delete 2 items? This cannot be undone.")
    ).toBeDefined();

    const confirmButtons = screen.getAllByRole("button", { name: "Delete permanently" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(currentBulkState.bulkDelete).toHaveBeenCalledTimes(1);
    });
  });

  it("passes currentFolderId and navigates to first surviving ancestor folder via onNavigateUp", () => {
    useStudioSelectionStore.setState({
      selectedKeys: ["workflow:wf-1"],
      lastSelectedKey: "workflow:wf-1",
    });

    render(
      <StudioSelectionBar
        projectId="proj-1"
        scope="collection"
        currentFolderId="f1-grandchild"
        entries={sampleEntries}
      />
    );

    const lastCallArgs =
      useStudioBulkActions.mock.calls[useStudioBulkActions.mock.calls.length - 1][0];
    expect(lastCallArgs.currentFolderId).toBe("f1-grandchild");
    expect(typeof lastCallArgs.onNavigateUp).toBe("function");
    expect(mockUseProjectFolders).toHaveBeenCalledWith("proj-1");

    // Both f1-grandchild and f1-child are deleted; f1 survives -> navigate to /collection/f1
    lastCallArgs.onNavigateUp(["f1-child", "f1-grandchild"]);
    expect(mockRouterReplace).toHaveBeenCalledWith("/cinema-studio/proj-1/collection/f1");
  });

  it("does not mount selection bar hooks when empty and does not query project folders when currentFolderId is null", () => {
    const { rerender } = render(
      <StudioSelectionBar
        projectId="proj-1"
        scope="trash"
        workflows={[sampleEntries[1].data]}
      />
    );

    // Zero hook work when nothing is selected
    expect(mockUseProjectFolders).not.toHaveBeenCalled();
    expect(useStudioBulkActions).not.toHaveBeenCalled();

    // When selected on a null-folder scope, queries with null (disabled)
    useStudioSelectionStore.setState({
      selectedKeys: ["workflow:wf-1"],
      lastSelectedKey: "workflow:wf-1",
    });
    rerender(
      <StudioSelectionBar
        projectId="proj-1"
        scope="trash"
        workflows={[sampleEntries[1].data]}
      />
    );
    expect(mockUseProjectFolders).toHaveBeenCalledWith(null);
  });

  it("falls back to project assets root when all ancestors of currentFolderId are deleted", () => {
    useStudioSelectionStore.setState({
      selectedKeys: ["workflow:wf-1"],
      lastSelectedKey: "workflow:wf-1",
    });

    render(
      <StudioSelectionBar
        projectId="proj-1"
        scope="collection"
        currentFolderId="f1-child"
        entries={sampleEntries}
      />
    );

    const lastCallArgs =
      useStudioBulkActions.mock.calls[useStudioBulkActions.mock.calls.length - 1][0];
    lastCallArgs.onNavigateUp(["f1", "f1-child"]);
    expect(mockRouterReplace).toHaveBeenCalledWith("/cinema-studio/proj-1/assets");
  });

  it("excludes hidden folders when showFolders is false and prunes them from selection", async () => {
    useWorkflowUiStore.setState({ showFolders: false });
    useStudioSelectionStore.setState({
      selectedKeys: ["collection:f1", "workflow:wf-1"],
      lastSelectedKey: "workflow:wf-1",
    });

    render(
      <StudioSelectionBar projectId="proj-1" scope="assets" entries={sampleEntries} />
    );

    // Hidden collection:f1 is pruned and excluded from displayed count
    await waitFor(() => {
      expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:wf-1"]);
    });
    expect(screen.getByText("1 selected")).toBeDefined();

    // Open More dropdown -> Select all should only select visible workflows (not collection:f1)
    fireEvent.pointerDown(screen.getByRole("button", { name: "More selection actions" }));
    const selectAllItem = await screen.findByText("Select all");
    fireEvent.click(selectAllItem);

    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "workflow:wf-1",
      "workflow:wf-2",
    ]);
  });

  it("prunes selection and renders nothing when filtered entries become empty", async () => {
    useStudioSelectionStore.setState({
      selectedKeys: ["workflow:wf-1", "workflow:wf-2"],
      lastSelectedKey: "workflow:wf-2",
    });

    const { container, rerender } = render(
      <StudioSelectionBar projectId="proj-1" scope="assets" entries={sampleEntries} />
    );
    expect(screen.getByText("2 selected")).toBeDefined();

    // Simulate search/filter yielding 0 items (SharedGalleryGrid unmounts while bar stays mounted)
    rerender(
      <StudioSelectionBar projectId="proj-1" scope="assets" entries={[]} />
    );

    expect(container.firstChild).toBeNull();
    await waitFor(() => {
      expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);
    });
  });

  it("bridges live bulk actions to selected card context menu and opens real Move and Trash dialogs", async () => {
    useStudioSelectionStore.setState({
      selectedKeys: ["workflow:wf-1", "workflow:wf-2"],
      lastSelectedKey: "workflow:wf-2",
    });

    const { getByTestId, unmount } = render(
      <>
        <MediaView
          data-testid="selected-card"
          src="https://example.com/1.png"
          status="completed"
          surface="card"
          selectionEnabled={true}
          isSelected={true}
          isSelectionMode={true}
          contextMenuItems={[{ key: "single-only", label: "Single Item Edit", onClick: vi.fn() }]}
        />
        <MediaView
          data-testid="unselected-card"
          src="https://example.com/2.png"
          status="completed"
          surface="card"
          selectionEnabled={true}
          isSelected={false}
          isSelectionMode={true}
          contextMenuItems={[{ key: "single-only", label: "Single Item Edit", onClick: vi.fn() }]}
        />
        <StudioSelectionBar projectId="proj-1" scope="assets" entries={sampleEntries} />
      </>
    );

    // Unselected card in selection mode has right-click completely disabled
    fireEvent.contextMenu(getByTestId("unselected-card"));
    expect(document.querySelector('[data-slot="context-menu-content"]')).toBeNull();
    expect(screen.queryByText("Single Item Edit")).toBeNull();

    // Right-click selected card -> opens Bulk Selection Context Menu
    fireEvent.contextMenu(getByTestId("selected-card"));
    const bulkMenu = await screen.findByText("Download (2)");
    expect(bulkMenu).toBeDefined();
    expect(screen.queryByText("Single Item Edit")).toBeNull();
    expect(screen.getByText("Move to...")).toBeDefined();
    expect(screen.getByText("Like selected")).toBeDefined();
    expect(screen.getByText("Add to Prompt")).toBeDefined();
    expect(screen.getByText("Select all")).toBeDefined();
    expect(screen.getByText("Clear selection")).toBeDefined();
    expect(
      screen.getByText("Move to Trash").closest('[data-slot="context-menu-item"]')?.getAttribute("data-variant")
    ).toBe("destructive");

    // Download (2) triggers StudioSelectionBar's real bulkDownload
    fireEvent.click(bulkMenu);
    expect(currentBulkState.bulkDownload).toHaveBeenCalledTimes(1);

    // Re-open -> Move to... opens StudioSelectionBar's real BulkMoveFolderDialog
    fireEvent.contextMenu(getByTestId("selected-card"));
    fireEvent.click(await screen.findByText("Move to..."));
    expect(await screen.findByText("Move 2 items")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Folder Two/i }));
    fireEvent.click(screen.getByRole("button", { name: "Move" }));
    await waitFor(() => {
      expect(currentBulkState.bulkMoveToFolder).toHaveBeenCalledWith("f2");
    });

    // Re-open -> Move to Trash opens StudioSelectionBar's real ConfirmDeleteDialog
    fireEvent.contextMenu(getByTestId("selected-card"));
    fireEvent.click(await screen.findByText("Move to Trash"));
    expect(await screen.findByText("Move 2 selected items to Trash?")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Move to Trash" }));
    await waitFor(() => {
      expect(currentBulkState.bulkDelete).toHaveBeenCalledTimes(1);
    });

    // Re-open -> Select all selects all visible entries
    fireEvent.contextMenu(getByTestId("selected-card"));
    fireEvent.click(await screen.findByText("Select all"));
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "collection:f1",
      "workflow:wf-1",
      "workflow:wf-2",
    ]);

    // Unmount clears bridge provider cleanly
    unmount();
    expect(getBulkContextMenuSnapshot()).toBeNull();
  });

  it("renders scope-aware Trash bulk context menu and triggers Restore and Delete permanently dialog", async () => {
    currentBulkState = {
      ...currentBulkState,
      canDownload: false,
      canMove: false,
      canLike: false,
      canAddToPrompt: false,
    };

    useStudioSelectionStore.setState({
      selectedKeys: ["workflow:wf-1"],
      lastSelectedKey: "workflow:wf-1",
    });

    const { getByTestId } = render(
      <>
        <MediaView
          data-testid="selected-trash-card"
          src="https://example.com/1.png"
          status="completed"
          surface="card"
          selectionEnabled={true}
          isSelected={true}
          isSelectionMode={true}
        />
        <StudioSelectionBar
          projectId="proj-1"
          scope="trash"
          workflows={[sampleEntries[1].data, sampleEntries[2].data]}
        />
      </>
    );

    fireEvent.contextMenu(getByTestId("selected-trash-card"));

    const menuPanel = document.querySelector('[data-bulk-context-menu="true"]');
    expect(menuPanel).not.toBeNull();
    expect(menuPanel.textContent).toContain("1 selected");
    expect(menuPanel.textContent).not.toContain("Download");
    expect(menuPanel.textContent).not.toContain("Move to...");
    expect(menuPanel.textContent).not.toContain("Like selected");
    expect(menuPanel.textContent).not.toContain("Add to Prompt");

    const restoreItem = menuPanel.querySelector('[data-slot="context-menu-item"]');
    expect(restoreItem.textContent).toContain("Restore");
    fireEvent.click(restoreItem);
    expect(currentBulkState.bulkRestore).toHaveBeenCalledTimes(1);

    // Re-open -> Delete permanently opens StudioSelectionBar's permanent delete confirm dialog
    fireEvent.contextMenu(getByTestId("selected-trash-card"));
    const deleteMenuItem = Array.from(
      document.querySelectorAll('[data-bulk-context-menu="true"] [data-slot="context-menu-item"]')
    ).find((el) => el.textContent.includes("Delete permanently"));
    expect(deleteMenuItem?.getAttribute("data-variant")).toBe("destructive");
    fireEvent.click(deleteMenuItem);

    expect(
      await screen.findByText("Permanently delete 1 item? This cannot be undone.")
    ).toBeDefined();
    const confirmButtons = screen.getAllByRole("button", { name: "Delete permanently" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(currentBulkState.bulkDelete).toHaveBeenCalledTimes(1);
    });
  });

  it("hides Like and Add to Prompt when folders are selected and hides Move to on elements scope", async () => {
    currentBulkState = {
      ...currentBulkState,
      hasCollections: true,
      collectionCount: 1,
      workflowCount: 0,
      canDownload: true,
      canMove: true,
      canLike: false,
      canAddToPrompt: false,
    };

    useStudioSelectionStore.setState({
      selectedKeys: ["collection:f1"],
      lastSelectedKey: "collection:f1",
    });

    const { getByTestId, rerender } = render(
      <>
        <MediaView
          data-testid="selected-folder-card"
          src="https://example.com/1.png"
          status="completed"
          surface="card"
          selectionEnabled={true}
          isSelected={true}
          isSelectionMode={true}
        />
        <StudioSelectionBar projectId="proj-1" scope="assets" entries={sampleEntries} />
      </>
    );

    fireEvent.contextMenu(getByTestId("selected-folder-card"));
    const folderMenu = document.querySelector('[data-bulk-context-menu="true"]');
    expect(folderMenu).not.toBeNull();
    expect(folderMenu.textContent).toContain("Download");
    expect(folderMenu.textContent).not.toContain("Download (1)");
    expect(folderMenu.textContent).toContain("Move to...");
    expect(folderMenu.textContent).not.toContain("Like selected");
    expect(folderMenu.textContent).not.toContain("Add to Prompt");

    // Close menu via Clear selection
    const clearItem = Array.from(
      folderMenu.querySelectorAll('[data-slot="context-menu-item"]')
    ).find((el) => el.textContent.includes("Clear selection"));
    fireEvent.click(clearItem);
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);

    // Now verify elements scope hides Move to... and shows Unlike selected when isAllLiked=true
    currentBulkState = {
      ...currentBulkState,
      hasCollections: false,
      collectionCount: 0,
      workflowCount: 1,
      canDownload: true,
      canMove: false,
      canLike: true,
      canAddToPrompt: true,
      isAllLiked: true,
    };
    useStudioSelectionStore.setState({
      selectedKeys: ["workflow:wf-1"],
      lastSelectedKey: "workflow:wf-1",
    });

    rerender(
      <>
        <MediaView
          data-testid="selected-folder-card"
          src="https://example.com/1.png"
          status="completed"
          surface="card"
          selectionEnabled={true}
          isSelected={true}
          isSelectionMode={true}
        />
        <StudioSelectionBar
          projectId="proj-1"
          scope="elements"
          workflows={[sampleEntries[1].data]}
        />
      </>
    );

    fireEvent.contextMenu(getByTestId("selected-folder-card"));
    const elemMenu = document.querySelector('[data-bulk-context-menu="true"]');
    expect(elemMenu).not.toBeNull();
    expect(elemMenu.textContent).not.toContain("Move to...");
    expect(elemMenu.textContent).toContain("Unlike selected");
    expect(elemMenu.textContent).toContain("Add to Prompt");
  });
});
