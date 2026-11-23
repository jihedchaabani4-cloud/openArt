import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { GalleryCanvasContextMenu } from "../GalleryCanvasContextMenu";
import { useWorkflowUiStore } from "@/features/workflows/model/useWorkflowUiStore";
import { useStudioSelectionStore } from "@/features/workflows/model/useStudioSelectionStore";

const mockUploadMedia = vi.fn();

vi.mock("@/features/media/model/useUploadMedia", () => ({
  useUploadMedia: () => ({
    uploadMedia: mockUploadMedia,
    isUploading: false,
  }),
}));

vi.mock("@/components/cinema-studio/collections/CreateFolderDialog", () => ({
  CreateFolderDialog: ({ open, projectId, parentId }) =>
    open ? (
      <div
        data-testid="mock-create-folder-dialog"
        data-project-id={projectId || ""}
        data-parent-id={parentId || ""}
      >
        Create Folder Dialog
      </div>
    ) : null,
}));

beforeAll(() => {
  if (typeof global.ResizeObserver === "undefined") {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

function openCanvasMenu(target) {
  fireEvent.contextMenu(target, { clientX: 120, clientY: 160 });
}

function openSubmenu(triggerText) {
  const subTrigger = screen.getByText(triggerText).closest('[role="menuitem"]');
  fireEvent.keyDown(subTrigger, { key: "ArrowRight" });
  return subTrigger;
}

const SAMPLE_ENTRIES = [
  { type: "collection", data: { id: "col-1", name: "Folder A" }, key: "col-col-1" },
  { type: "workflow", data: { id: "wf-1", name: "wf-1" }, key: "wf-1" },
  { type: "workflow", data: { id: "wf-2", name: "wf-2" }, key: "wf-2" },
];

describe("GalleryCanvasContextMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkflowUiStore.setState({
      activeStudioTab: "assets",
      gridSize: "md",
      gridSpacing: "sm",
      splitByDate: false,
      showFolders: true,
    });
    useWorkflowUiStore.getState().clearFilters();
    useStudioSelectionStore.getState().clearSelection();
  });

  afterEach(() => {
    cleanup();
  });

  it("opens on right-clicking empty scroll-container space and shows core sections", () => {
    render(
      <GalleryCanvasContextMenu
        scope="assets"
        projectId="proj-1"
        entries={SAMPLE_ENTRIES}
        allowCreateFolder={true}
        allowUpload={true}
      >
        <div data-scroll-container="true" data-testid="canvas">
          <div data-testid="empty-space">Empty canvas</div>
        </div>
      </GalleryCanvasContextMenu>
    );

    openCanvasMenu(screen.getByTestId("empty-space"));

    expect(screen.getByText("New folder")).toBeDefined();
    expect(screen.getByText("Upload media")).toBeDefined();
    expect(screen.getByText("Select all")).toBeDefined();
    expect(screen.queryByText("Clear selection")).toBeNull();
    expect(screen.getByText("Card size")).toBeDefined();
    expect(screen.getByRole("slider", { name: "Card size" })).toBeDefined();
    expect(screen.getByText("Sort")).toBeDefined();
    expect(screen.getByText("Filter")).toBeDefined();
    expect(screen.getByText("Split by date")).toBeDefined();
    expect(screen.getByText("Show folders")).toBeDefined();
  });

  it("does NOT open when right-clicking a [data-selection-key] card (even without its own context menu), a button, or a checkbox", () => {
    render(
      <GalleryCanvasContextMenu
        scope="assets"
        projectId="proj-1"
        entries={SAMPLE_ENTRIES}
        allowCreateFolder={true}
      >
        <div data-scroll-container="true" data-testid="canvas">
          <div data-selection-key="workflow:wf-processing" data-testid="processing-card">
            <span data-testid="processing-card-inner">Generating...</span>
          </div>
          <button type="button" data-testid="action-btn">
            Click me
          </button>
          <div role="checkbox" aria-checked="false" data-testid="date-checkbox">
            Today
          </div>
        </div>
      </GalleryCanvasContextMenu>
    );

    openCanvasMenu(screen.getByTestId("processing-card-inner"));
    expect(screen.queryByText("Card size")).toBeNull();

    openCanvasMenu(screen.getByTestId("action-btn"));
    expect(screen.queryByText("Card size")).toBeNull();

    openCanvasMenu(screen.getByTestId("date-checkbox"));
    expect(screen.queryByText("Card size")).toBeNull();
  });

  it("updates useWorkflowUiStore for gridSize, sort, types, activity/liked, hideFailed, clearFilters, splitByDate, and showFolders", () => {
    render(
      <GalleryCanvasContextMenu
        scope="assets"
        projectId="proj-1"
        entries={SAMPLE_ENTRIES}
      >
        <div data-scroll-container="true" data-testid="canvas">
          Empty space
        </div>
      </GalleryCanvasContextMenu>
    );

    openCanvasMenu(screen.getByTestId("canvas"));

    // 1. Card size stepped slider
    const slider = screen.getByRole("slider", { name: "Card size" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(useWorkflowUiStore.getState().gridSize).toBe("lg");

    // 2. View toggles (stay open on toggle)
    fireEvent.click(screen.getByText("Split by date"));
    expect(useWorkflowUiStore.getState().splitByDate).toBe(true);

    fireEvent.click(screen.getByText("Show folders"));
    expect(useWorkflowUiStore.getState().showFolders).toBe(false);

    // 3. Filter submenu: types, activity/liked, hideFailed, Reset filters
    openSubmenu("Filter");
    fireEvent.click(screen.getByText("Images"));
    expect(useWorkflowUiStore.getState().filters.types).toEqual(["image"]);

    fireEvent.click(screen.getByText("Videos"));
    expect(useWorkflowUiStore.getState().filters.types).toEqual(["image", "video"]);

    fireEvent.click(screen.getByText("All types"));
    expect(useWorkflowUiStore.getState().filters.types).toEqual([]);

    fireEvent.click(screen.getByText("Generated"));
    expect(useWorkflowUiStore.getState().filters.activity).toBe("generated");
    expect(useWorkflowUiStore.getState().filters.liked).toBe(false);

    fireEvent.click(screen.getByText("Liked"));
    expect(useWorkflowUiStore.getState().filters.activity).toBe("liked");
    expect(useWorkflowUiStore.getState().filters.liked).toBe(true);

    fireEvent.click(screen.getByText("Hide failed"));
    expect(useWorkflowUiStore.getState().filters.hideFailed).toBe(true);

    fireEvent.click(screen.getByText("Reset filters"));
    expect(useWorkflowUiStore.getState().filters.activity).toBe("all");
    expect(useWorkflowUiStore.getState().filters.liked).toBe(false);
    expect(useWorkflowUiStore.getState().filters.hideFailed).toBe(false);
    expect(useWorkflowUiStore.getState().filters.types).toEqual([]);

    // 4. Sort submenu
    openSubmenu("Sort");
    fireEvent.click(screen.getByText("Oldest first"));
    expect(useWorkflowUiStore.getState().filters.sort).toBe("oldest");
  });

  it("Select all selects visible entries (respecting showFolders) and Clear selection clears them", () => {
    render(
      <GalleryCanvasContextMenu
        scope="assets"
        projectId="proj-1"
        entries={SAMPLE_ENTRIES}
      >
        <div data-scroll-container="true" data-testid="canvas">
          Empty space
        </div>
      </GalleryCanvasContextMenu>
    );

    // With showFolders === true, selects collection + workflows
    openCanvasMenu(screen.getByTestId("canvas"));
    fireEvent.click(screen.getByText("Select all"));
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "collection:col-1",
      "workflow:wf-1",
      "workflow:wf-2",
    ]);

    // Clear selection appears when hasSelection is true and clears store
    openCanvasMenu(screen.getByTestId("canvas"));
    fireEvent.click(screen.getByText("Clear selection"));
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);

    // With showFolders === false, skips collection entries
    useWorkflowUiStore.setState({ showFolders: false });
    openCanvasMenu(screen.getByTestId("canvas"));
    fireEvent.click(screen.getByText("Select all"));
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "workflow:wf-1",
      "workflow:wf-2",
    ]);
  });

  it("New folder opens CreateFolderDialog with projectId & parentId, and Upload media invokes onUploadClick", () => {
    const onUploadClick = vi.fn();

    render(
      <GalleryCanvasContextMenu
        scope="collection"
        projectId="proj-42"
        currentFolderId="folder-9"
        entries={SAMPLE_ENTRIES}
        allowCreateFolder={true}
        allowUpload={true}
        onUploadClick={onUploadClick}
      >
        <div data-scroll-container="true" data-testid="canvas">
          Empty space
        </div>
      </GalleryCanvasContextMenu>
    );

    openCanvasMenu(screen.getByTestId("canvas"));
    fireEvent.click(screen.getByText("New folder"));

    const dialog = screen.getByTestId("mock-create-folder-dialog");
    expect(dialog.getAttribute("data-project-id")).toBe("proj-42");
    expect(dialog.getAttribute("data-parent-id")).toBe("folder-9");

    openCanvasMenu(screen.getByTestId("canvas"));
    fireEvent.click(screen.getByText("Upload media"));
    expect(onUploadClick).toHaveBeenCalledTimes(1);
  });

  it("supports elements/characters scope with primaryAction, Liked only filter, and hides Show folders", () => {
    const onNewElement = vi.fn();

    render(
      <GalleryCanvasContextMenu
        scope="elements"
        projectId="proj-1"
        workflows={[{ id: "el-1", name: "el-1" }]}
        primaryAction={{
          label: "New element",
          icon: "add-01",
          onClick: onNewElement,
        }}
      >
        <div data-scroll-container="true" data-testid="canvas">
          Empty space
        </div>
      </GalleryCanvasContextMenu>
    );

    openCanvasMenu(screen.getByTestId("canvas"));
    expect(screen.queryByText("Show folders")).toBeNull();
    expect(screen.queryByText("New folder")).toBeNull();
    expect(screen.queryByText("Upload media")).toBeNull();

    // Open Filter submenu -> Liked only switch
    openSubmenu("Filter");
    fireEvent.click(screen.getByText("Liked only"));
    expect(useWorkflowUiStore.getState().filters.liked).toBe(true);

    // Primary action
    fireEvent.click(screen.getByText("New element"));
    expect(onNewElement).toHaveBeenCalledTimes(1);
  });

  it("repositions the canvas context menu when right-clicking a new empty spot while already open", async () => {
    function getPopperCoords() {
      const wrapper = document.querySelector("[data-radix-popper-content-wrapper]");
      const match = /translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/.exec(
        wrapper?.style?.transform || ""
      );
      return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
    }

    render(
      <GalleryCanvasContextMenu
        scope="assets"
        projectId="proj-1"
        entries={SAMPLE_ENTRIES}
        allowCreateFolder={true}
      >
        <div data-scroll-container="true" data-testid="canvas" style={{ width: 900, height: 600 }}>
          <div data-testid="empty-a">Spot A</div>
          <div data-testid="empty-b">Spot B</div>
        </div>
      </GalleryCanvasContextMenu>
    );

    fireEvent.contextMenu(screen.getByTestId("empty-a"), { clientX: 110, clientY: 130 });
    await waitFor(() => {
      const coords = getPopperCoords();
      expect(coords).not.toBeNull();
      expect(Math.abs(coords.x - 110)).toBeLessThanOrEqual(5);
      expect(Math.abs(coords.y - 130)).toBeLessThanOrEqual(5);
    });

    fireEvent.contextMenu(screen.getByTestId("empty-b"), { clientX: 460, clientY: 290 });
    await waitFor(() => {
      const coords = getPopperCoords();
      expect(coords).not.toBeNull();
      expect(Math.abs(coords.x - 460)).toBeLessThanOrEqual(5);
      expect(Math.abs(coords.y - 290)).toBeLessThanOrEqual(5);
    });
  });

  it("does not open the empty-canvas menu when right-clicking an uploading or processing card, and Select all skips in-flight entries", () => {
    const mixedEntries = [
      ...SAMPLE_ENTRIES,
      { type: "workflow", data: { id: "wf-uploading", status: "uploading" } },
      { type: "workflow", data: { id: "wf-processing", status: "processing" } },
    ];

    render(
      <GalleryCanvasContextMenu
        scope="assets"
        projectId="proj-1"
        entries={mixedEntries}
        allowCreateFolder={true}
      >
        <div data-scroll-container="true" data-testid="canvas">
          <div data-gallery-card="true">
            <div data-slot="uploading-card" data-testid="uploading-card">Uploading</div>
          </div>
          <div data-gallery-card="true">
            <div data-slot="processing-card" data-testid="processing-card">Processing</div>
          </div>
        </div>
      </GalleryCanvasContextMenu>
    );

    fireEvent.contextMenu(screen.getByTestId("uploading-card"));
    expect(screen.queryByText("New folder")).toBeNull();

    fireEvent.contextMenu(screen.getByTestId("processing-card"));
    expect(screen.queryByText("New folder")).toBeNull();

    // Empty-canvas Select all skips uploading & processing items
    openCanvasMenu(screen.getByTestId("canvas"));
    fireEvent.click(screen.getByText("Select all"));
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "collection:col-1",
      "workflow:wf-1",
      "workflow:wf-2",
    ]);
  });
});
