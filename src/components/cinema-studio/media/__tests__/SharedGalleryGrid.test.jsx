import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, act, waitFor, fireEvent, screen } from "@testing-library/react";
import { SharedGalleryGrid } from "../SharedGalleryGrid";
import { MediaView } from "../MediaView";
import { setCachedImageDimensions } from "@/shared/lib/displayUtils";
import { useWorkflowUiStore } from "@/features/workflows/model/useWorkflowUiStore";
import { useStudioSelectionStore } from "@/features/workflows/model/useStudioSelectionStore";
import { registerBulkMenuProvider } from "@/features/workflows/model/studioBulkMenuBridge";

describe("SharedGalleryGrid - justified layout & dimension reflow", () => {
  afterEach(() => {
    cleanup();
  });

  it("reconciles dimensions cached synchronously by a child ref during commit", async () => {
    const url = "https://example.com/cached-during-commit.png";

    function CachedImgCard({ item, width, height }) {
      return (
        <div
          data-testid="card"
          data-width={width}
          data-height={height}
          ref={() => {
            // Simulates browser-cached <img ref> firing synchronously before parent effects
            if (item?.url) {
              setCachedImageDimensions(item.url, 1600, 900);
            }
          }}
        />
      );
    }

    const { getByTestId } = render(
      <SharedGalleryGrid
        items={[{ id: "img-commit", url, status: "completed" }]}
        CardComponent={CachedImgCard}
        defaultContainerWidth={1200}
        gridSize="md"
      />
    );

    await waitFor(() => {
      const card = getByTestId("card");
      expect(Number(card.dataset.height)).toBe(280);
      expect(Number(card.dataset.width)).toBe(Math.round(280 * (16 / 9)));
    });
  });

  it("reflows reactively when natural image dimensions arrive after mount", async () => {
    const url = "https://example.com/async-load-reflow.png";

    function ProbeCard({ width, height }) {
      return <div data-testid="probe-card" data-width={width} data-height={height} />;
    }

    const { getByTestId } = render(
      <SharedGalleryGrid
        items={[{ id: "img-async", url, status: "completed" }]}
        CardComponent={ProbeCard}
        defaultContainerWidth={1200}
        gridSize="md"
      />
    );

    // Initial fallback 3:4 at md (280px) => 210x280
    expect(Number(getByTestId("probe-card").dataset.width)).toBe(210);
    expect(Number(getByTestId("probe-card").dataset.height)).toBe(280);

    await act(async () => {
      setCachedImageDimensions(url, 1920, 1080);
    });

    await waitFor(() => {
      expect(Number(getByTestId("probe-card").dataset.width)).toBe(
        Math.round(280 * (16 / 9))
      );
    });
  });

  it("prioritizes explicit generationConfig.ratio over placeholder 1024x1024 dimensions", () => {
    function ProbeCard({ width, height }) {
      return <div data-testid="ratio-card" data-width={width} data-height={height} />;
    }

    const { getByTestId } = render(
      <SharedGalleryGrid
        items={[
          {
            id: "img-placeholder",
            url: "https://example.com/placeholder-override.png",
            status: "completed",
            width: 1024,
            height: 1024,
            generationConfig: { ratio: "16:9" },
          },
        ]}
        CardComponent={ProbeCard}
        defaultContainerWidth={1200}
        gridSize="md"
      />
    );

    expect(Number(getByTestId("ratio-card").dataset.height)).toBe(280);
    expect(Number(getByTestId("ratio-card").dataset.width)).toBe(
      Math.round(280 * (16 / 9))
    );
  });

  it("groups workflows by calendar day with formatted date headers when splitByDate is enabled", () => {
    function ProbeCard({ workflow }) {
      return <div data-testid={`wf-${workflow.id}`}>{workflow.id}</div>;
    }

    const { container, getByText } = render(
      <SharedGalleryGrid
        splitByDate={true}
        workflows={[
          {
            id: "wf-nov8-a",
            metadata: { createTime: "2026-11-08T14:00:00Z" },
            items: [{ id: "m1", url: "https://example.com/1.png", status: "completed" }],
          },
          {
            id: "wf-nov8-b",
            metadata: { createTime: "2026-11-08T09:00:00Z" },
            items: [{ id: "m2", url: "https://example.com/2.png", status: "completed" }],
          },
          {
            id: "wf-nov7-a",
            metadata: { createTime: "2026-11-07T18:00:00Z" },
            items: [{ id: "m3", url: "https://example.com/3.png", status: "completed" }],
          },
        ]}
        CardComponent={ProbeCard}
        defaultContainerWidth={1200}
        gridSize="md"
      />
    );

    expect(getByText("November 8, 2026")).toBeDefined();
    expect(getByText("November 7, 2026")).toBeDefined();

    const sections = container.querySelectorAll("[data-date-section]");
    expect(sections.length).toBe(2);
    expect(sections[0].querySelectorAll("[data-testid^='wf-']").length).toBe(2);
    expect(sections[1].querySelectorAll("[data-testid^='wf-']").length).toBe(1);
  });

  it("hides collection/folder entries when showFolders is false", () => {
    function ProbeCard({ itemType, collection, workflow }) {
      const label = itemType === "collection" ? collection.name : workflow.id;
      return <div data-testid={`entry-${label}`}>{label}</div>;
    }

    const entries = [
      { type: "collection", key: "col-1", data: { id: "col-1", name: "FolderA" } },
      {
        type: "workflow",
        key: "wf-1",
        data: {
          id: "wf-1",
          items: [{ id: "m1", url: "https://example.com/1.png", status: "completed" }],
        },
      },
    ];

    const { rerender, queryByTestId } = render(
      <SharedGalleryGrid
        entries={entries}
        showFolders={true}
        CardComponent={ProbeCard}
        defaultContainerWidth={1200}
      />
    );
    expect(queryByTestId("entry-FolderA")).not.toBeNull();
    expect(queryByTestId("entry-wf-1")).not.toBeNull();

    rerender(
      <SharedGalleryGrid
        entries={entries}
        showFolders={false}
        CardComponent={ProbeCard}
        defaultContainerWidth={1200}
      />
    );
    expect(queryByTestId("entry-FolderA")).toBeNull();
    expect(queryByTestId("entry-wf-1")).not.toBeNull();
  });

  it("steps gridSize on middle-button hold + scroll wheel up/down and ignores plain scroll", () => {
    vi.useFakeTimers();
    useWorkflowUiStore.setState({ gridSize: "md" });

    function ProbeCard({ item }) {
      return <div>{item.id}</div>;
    }

    const { container } = render(
      <SharedGalleryGrid
        items={[{ id: "img-1", url: "https://example.com/1.png", status: "completed" }]}
        CardComponent={ProbeCard}
        defaultContainerWidth={1200}
      />
    );

    const grid = container.querySelector('[data-justified-grid="true"]');

    // Plain scroll without middle button held does nothing
    fireEvent.wheel(grid, { deltaY: -100, buttons: 0 });
    expect(useWorkflowUiStore.getState().gridSize).toBe("md");

    // Hold middle mouse button + scroll up -> larger (lg)
    fireEvent.mouseDown(grid, { button: 1 });
    fireEvent.wheel(grid, { deltaY: -100, buttons: 4 });
    expect(useWorkflowUiStore.getState().gridSize).toBe("lg");

    // Cooldown prevents instant jump within 140ms
    fireEvent.wheel(grid, { deltaY: -100, buttons: 4 });
    expect(useWorkflowUiStore.getState().gridSize).toBe("lg");

    // After cooldown -> xl, then scroll down -> lg
    vi.advanceTimersByTime(150);
    fireEvent.wheel(grid, { deltaY: -100, buttons: 4 });
    expect(useWorkflowUiStore.getState().gridSize).toBe("xl");

    vi.advanceTimersByTime(150);
    fireEvent.wheel(grid, { deltaY: 100, buttons: 4 });
    expect(useWorkflowUiStore.getState().gridSize).toBe("lg");

    // Release middle button -> scrolling stops resizing
    fireEvent.mouseUp(window, { button: 1 });
    vi.advanceTimersByTime(150);
    fireEvent.wheel(grid, { deltaY: 100, buttons: 0 });
    expect(useWorkflowUiStore.getState().gridSize).toBe("lg");

    vi.useRealTimers();
  });
});

describe("SharedGalleryGrid - multi-select & date-group tri-state checkbox", () => {
  afterEach(() => {
    cleanup();
    useStudioSelectionStore.setState({
      scopeKey: null,
      selectedKeys: [],
      lastSelectedKey: null,
    });
  });

  const mixedEntries = [
    { type: "collection", key: "col-1", data: { id: "col-1", name: "Folder A" } },
    {
      type: "workflow",
      key: "wf-1",
      data: {
        id: "wf-1",
        metadata: { createTime: "2026-11-08T14:00:00Z" },
        items: [{ id: "m1", url: "https://example.com/1.png", status: "completed" }],
      },
    },
    {
      type: "workflow",
      key: "wf-2",
      data: {
        id: "wf-2",
        metadata: { createTime: "2026-11-08T09:00:00Z" },
        items: [{ id: "m2", url: "https://example.com/2.png", status: "completed" }],
      },
    },
    {
      type: "workflow",
      key: "wf-3",
      data: {
        id: "wf-3",
        metadata: { createTime: "2026-11-07T18:00:00Z" },
        items: [{ id: "m3", url: "https://example.com/3.png", status: "completed" }],
      },
    },
  ];

  function SelectProbeCard({
    itemType,
    collection,
    workflow,
    isSelected,
    isSelectionMode,
    selectionEnabled,
    onToggleSelect,
  }) {
    const id = itemType === "collection" ? collection.id : workflow.id;
    return (
      <button
        type="button"
        data-testid={`sel-card-${id}`}
        data-selected={isSelected ? "true" : "false"}
        data-selection-mode={isSelectionMode ? "true" : "false"}
        data-selection-enabled={selectionEnabled ? "true" : "false"}
        onClick={(e) => onToggleSelect?.(e)}
      >
        {id}
      </button>
    );
  }

  it("forwards selection props to both collection and workflow cards and supports shift-range toggle", () => {
    const { getByTestId } = render(
      <SharedGalleryGrid
        entries={mixedEntries}
        selectionEnabled={true}
        splitByDate={false}
        showFolders={true}
        CardComponent={SelectProbeCard}
        defaultContainerWidth={1200}
      />
    );

    const colCard = getByTestId("sel-card-col-1");
    const wf2Card = getByTestId("sel-card-wf-2");

    expect(colCard.dataset.selectionEnabled).toBe("true");
    expect(colCard.dataset.selected).toBe("false");

    // Click collection card -> selects collection:col-1
    fireEvent.click(colCard);
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["collection:col-1"]);
    expect(colCard.dataset.selected).toBe("true");
    expect(wf2Card.dataset.selectionMode).toBe("true");

    // Shift+click wf-2 -> selects inclusive range [collection:col-1, workflow:wf-1, workflow:wf-2]
    fireEvent.click(wf2Card, { shiftKey: true });
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "collection:col-1",
      "workflow:wf-1",
      "workflow:wf-2",
    ]);
  });

  it("renders a tri-state checkbox for each date group when splitByDate and selectionEnabled are true", () => {
    const { getByRole } = render(
      <SharedGalleryGrid
        entries={mixedEntries}
        selectionEnabled={true}
        splitByDate={true}
        showFolders={true}
        CardComponent={SelectProbeCard}
        defaultContainerWidth={1200}
      />
    );

    const nov8Checkbox = getByRole("checkbox", { name: "Select all from November 8, 2026" });
    const nov7Checkbox = getByRole("checkbox", { name: "Select all from November 7, 2026" });

    // Initially unchecked
    expect(nov8Checkbox.getAttribute("data-state")).toBe("unchecked");
    expect(nov7Checkbox.getAttribute("data-state")).toBe("unchecked");

    // Select 1 of 2 items in November 8 -> indeterminate
    act(() => {
      useStudioSelectionStore.setState({ selectedKeys: ["workflow:wf-1"] });
    });
    expect(nov8Checkbox.getAttribute("data-state")).toBe("indeterminate");
    expect(nov8Checkbox.querySelector('[data-icon-name="minus-sign"]')).not.toBeNull();
    expect(nov7Checkbox.getAttribute("data-state")).toBe("unchecked");

    // Click November 8 checkbox -> selects all in November 8 -> checked
    fireEvent.click(nov8Checkbox);
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "workflow:wf-1",
      "workflow:wf-2",
    ]);
    expect(nov8Checkbox.getAttribute("data-state")).toBe("checked");
    expect(nov8Checkbox.querySelector('[data-icon-name="tick-02"]')).not.toBeNull();
    expect(nov8Checkbox.className).not.toContain("bg-surface-card");

    // Click again -> deselects all in November 8 -> unchecked
    fireEvent.click(nov8Checkbox);
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);
    expect(nov8Checkbox.getAttribute("data-state")).toBe("unchecked");
  });

  it("supports Ctrl/Cmd+A and Escape shortcuts while ignoring editable inputs", () => {
    render(
      <div>
        <input data-testid="search-input" />
        <SharedGalleryGrid
          entries={mixedEntries}
          selectionEnabled={true}
          splitByDate={false}
          showFolders={true}
          CardComponent={SelectProbeCard}
          defaultContainerWidth={1200}
        />
      </div>
    );

    // Focused inside input -> Ctrl+A ignored
    const input = document.querySelector("[data-testid='search-input']");
    input.focus();
    fireEvent.keyDown(input, { key: "a", ctrlKey: true });
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);

    // Blur input -> Ctrl+A selects all rendered entries
    input.blur();
    fireEvent.keyDown(window, { key: "a", ctrlKey: true });
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "collection:col-1",
      "workflow:wf-1",
      "workflow:wf-2",
      "workflow:wf-3",
    ]);

    // Escape clears selection
    fireEvent.keyDown(window, { key: "Escape" });
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);
  });

  it("prunes hidden items from selection when entries or showFolders change", () => {
    useStudioSelectionStore.setState({
      selectedKeys: ["collection:col-1", "workflow:wf-1"],
    });

    const { rerender } = render(
      <SharedGalleryGrid
        entries={mixedEntries}
        selectionEnabled={true}
        splitByDate={false}
        showFolders={true}
        CardComponent={SelectProbeCard}
        defaultContainerWidth={1200}
      />
    );

    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "collection:col-1",
      "workflow:wf-1",
    ]);

    rerender(
      <SharedGalleryGrid
        entries={mixedEntries}
        selectionEnabled={true}
        splitByDate={false}
        showFolders={false}
        CardComponent={SelectProbeCard}
        defaultContainerWidth={1200}
      />
    );

    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:wf-1"]);
  });

  it("renders circular selection checkbox, selected ring, and side-by-side video badge in MediaView", () => {
    const onCardClick = vi.fn();
    const onToggleSelect = vi.fn();

    const { container, getByRole, rerender } = render(
      <MediaView
        src="https://example.com/clip.mp4"
        isVideo={true}
        status="completed"
        surface="card"
        showHoverOverlay={false}
        selectionEnabled={true}
        isSelected={false}
        isSelectionMode={false}
        onToggleSelect={onToggleSelect}
        onClick={onCardClick}
      />
    );

    const checkbox = getByRole("checkbox", { name: "Select item" });
    expect(checkbox.getAttribute("data-variant")).toBe("default");

    // Clicking the checkbox stops propagation and calls onToggleSelect without opening card
    fireEvent.click(checkbox, { shiftKey: true });
    expect(onToggleSelect).toHaveBeenCalledTimes(1);
    expect(onToggleSelect.mock.calls[0][0].shiftKey).toBe(true);
    expect(onCardClick).not.toHaveBeenCalled();

    // Unified video badge sits cleanly in the bottom-right corner without colliding with top-left checkbox
    const videoBadge = container.querySelector('[aria-label="Video"]');
    expect(videoBadge).not.toBeNull();
    expect(container.querySelector('[data-slot="media-bottom-right"]')?.contains(videoBadge)).toBe(true);

    // Selected state adds data-selected and delicate 1px ring-text-primary/80 outline
    rerender(
      <MediaView
        src="https://example.com/clip.mp4"
        isVideo={true}
        status="completed"
        surface="card"
        showHoverOverlay={false}
        selectionEnabled={true}
        isSelected={true}
        isSelectionMode={true}
        onToggleSelect={onToggleSelect}
        onClick={onCardClick}
      />
    );

    const selectedCard = container.querySelector('[data-selected="true"]');
    expect(selectedCard).not.toBeNull();
    const outline = selectedCard.querySelector('[data-slot="card-selected-outline"]');
    expect(outline).not.toBeNull();
    expect(outline.className).toContain("border");
    expect(outline.className).toContain("border-text-primary/65");
    expect(selectedCard.className).not.toContain("ring-");
    expect(selectedCard.className).not.toContain("opacity-50");

    // Unselected card in selection mode dims to opacity-50 hover:opacity-75
    rerender(
      <MediaView
        src="https://example.com/clip.mp4"
        isVideo={true}
        status="completed"
        surface="card"
        showHoverOverlay={false}
        selectionEnabled={true}
        isSelected={false}
        isSelectionMode={true}
        onToggleSelect={onToggleSelect}
        onClick={onCardClick}
      />
    );
    const dimmedCard = container.firstChild;
    expect(dimmedCard.className).toContain("opacity-50");
    expect(dimmedCard.className).toContain("hover:opacity-75");
  });

  it("hides single-item overlays, suppresses hover video play, and disables right-click on unselected cards in selection mode", () => {
    const singleAction = vi.fn();
    const unregister = registerBulkMenuProvider(() => ({
      count: 3,
      scope: "assets",
      isBusy: false,
      canDownload: true,
      canMove: true,
      canLike: true,
      canAddToPrompt: true,
      isAllLiked: false,
      hasAllKeys: true,
      bulkDownload: vi.fn(),
      openMoveDialog: vi.fn(),
      bulkToggleLike: vi.fn(),
      openDeleteConfirm: vi.fn(),
      bulkRestore: vi.fn(),
      bulkAddToPrompt: vi.fn(),
      selectAll: vi.fn(),
      clearSelection: vi.fn(),
    }));

    try {
      const { container, queryByTestId, queryByTitle, getByRole } = render(
        <MediaView
          src="https://example.com/clip.mp4"
          isVideo={true}
          status="completed"
          surface="card"
          playOnHover={true}
          isLiked={true}
          showLikedBadge={true}
          selectionEnabled={true}
          isSelected={false}
          isSelectionMode={true}
          onToggleSelect={vi.fn()}
          topLeft={<button type="button" data-testid="single-top-left">TopLeft</button>}
          topRight={<button type="button" data-testid="single-top-right">SingleAction</button>}
          bottomLeft={<span data-testid="single-bottom-left">Title</span>}
          bottomRight={<span data-testid="single-bottom-right">Badge</span>}
          bottom={<div data-testid="single-bottom">Progress</div>}
          center={<button type="button" data-testid="single-center">Play</button>}
          contextMenuItems={[
            { key: "single-del", label: "Single Item Action", icon: "delete", onClick: singleAction },
          ]}
        />
      );

      // Clean selection checkbox + non-interactive video badge remain visible
      expect(getByRole("checkbox", { name: "Select item" })).toBeDefined();
      expect(container.querySelector('[aria-label="Video"]')).not.toBeNull();

      // All single-item actions, liked heart, slots, and hover scrim are suppressed
      expect(queryByTestId("single-top-left")).toBeNull();
      expect(queryByTestId("single-top-right")).toBeNull();
      expect(queryByTestId("single-bottom-left")).toBeNull();
      expect(queryByTestId("single-bottom-right")).toBeNull();
      expect(queryByTestId("single-bottom")).toBeNull();
      expect(queryByTestId("single-center")).toBeNull();
      expect(queryByTitle("Liked")).toBeNull();

      const card = container.firstChild;
      expect(card.className).toContain("opacity-50");
      expect(card.className).toContain("hover:opacity-75");
      expect(card.className).toContain("cursor-pointer");
      expect(container.querySelector(".bg-black\\/25")).toBeNull();

      // playOnHover is suppressed in selection mode
      const video = container.querySelector("video");
      const playSpy = vi.fn().mockResolvedValue(undefined);
      video.play = playSpy;
      fireEvent.mouseEnter(card);
      expect(playSpy).not.toHaveBeenCalled();

      // Right-click on unselected dimmed card opens NO context menu (neither single nor bulk)
      fireEvent.contextMenu(card);
      expect(screen.queryByText("Single Item Action")).toBeNull();
      expect(screen.queryByText("3 selected")).toBeNull();
      expect(document.querySelector('[data-slot="context-menu-content"]')).toBeNull();
    } finally {
      unregister();
    }
  });

  it("opens Bulk Selection Context Menu on selected cards in selection mode and preserves single-item UX in normal mode", async () => {
    const bulkHandlers = {
      bulkDownload: vi.fn(),
      openMoveDialog: vi.fn(),
      bulkToggleLike: vi.fn(),
      openDeleteConfirm: vi.fn(),
      bulkRestore: vi.fn(),
      bulkAddToPrompt: vi.fn(),
      selectAll: vi.fn(),
      clearSelection: vi.fn(),
    };
    const singleAction = vi.fn();
    let currentCount = 5;

    const unregister = registerBulkMenuProvider(() => ({
      count: currentCount,
      scope: "assets",
      isBusy: false,
      canDownload: true,
      canMove: true,
      canLike: true,
      canAddToPrompt: true,
      isAllLiked: false,
      hasAllKeys: true,
      ...bulkHandlers,
    }));

    try {
      const { container, rerender, queryByTestId } = render(
        <MediaView
          src="https://example.com/photo.png"
          status="completed"
          surface="card"
          isLiked={true}
          showLikedBadge={true}
          selectionEnabled={true}
          isSelected={true}
          isSelectionMode={true}
          onToggleSelect={vi.fn()}
          topRight={<button type="button" data-testid="single-top-right">SingleAction</button>}
          contextMenuItems={[
            { key: "single-only", label: "Single Item Only", icon: "edit", onClick: singleAction },
          ]}
        />
      );

      // Single-item hover action is hidden on selected cards too
      expect(queryByTestId("single-top-right")).toBeNull();

      // Update count without re-rendering the selected card — opening menu reads fresh snapshot lazily
      currentCount = 15;
      fireEvent.contextMenu(container.firstChild);

      expect(await screen.findByText("15 selected")).toBeDefined();
      expect(screen.queryByText("Single Item Only")).toBeNull();

      const menuPanel = document.querySelector('[data-slot="context-menu-content"]');
      expect(menuPanel).not.toBeNull();
      expect(menuPanel.className).toContain("w-56");
      expect(menuPanel.className).toContain("surface-glass");

      const downloadItem = screen.getByText("Download (15)");
      fireEvent.click(downloadItem);
      expect(bulkHandlers.bulkDownload).toHaveBeenCalledTimes(1);

      // Switch back to normal mode -> single-item actions and single-item context menu are 100% preserved
      rerender(
        <MediaView
          src="https://example.com/photo.png"
          status="completed"
          surface="card"
          isLiked={true}
          showLikedBadge={true}
          selectionEnabled={true}
          isSelected={false}
          isSelectionMode={false}
          onToggleSelect={vi.fn()}
          topRight={<button type="button" data-testid="single-top-right">SingleAction</button>}
          contextMenuItems={[
            { key: "single-only", label: "Single Item Only", icon: "edit", onClick: singleAction },
          ]}
        />
      );

      expect(queryByTestId("single-top-right")).not.toBeNull();
      expect(screen.getByTitle("Liked")).toBeDefined();

      fireEvent.contextMenu(container.firstChild);
      const singleMenuItem = await screen.findByText("Single Item Only");
      expect(screen.queryByText("15 selected")).toBeNull();
      fireEvent.click(singleMenuItem);
      expect(singleAction).toHaveBeenCalledTimes(1);
    } finally {
      unregister();
    }
  });

  it("pauses and resets an actively hover-playing video when entering selection mode even as playOnHover flips false", () => {
    const { container, rerender } = render(
      <MediaView
        src="https://example.com/hover-clip.mp4"
        isVideo={true}
        status="completed"
        surface="card"
        playOnHover={true}
        selectionEnabled={true}
        isSelected={false}
        isSelectionMode={false}
      />
    );

    const card = container.firstChild;
    const video = container.querySelector("video");
    let isPaused = true;
    Object.defineProperty(video, "paused", {
      configurable: true,
      get: () => isPaused,
    });
    const playSpy = vi.fn(() => {
      isPaused = false;
      video.currentTime = 2.4;
      return Promise.resolve();
    });
    const pauseSpy = vi.fn(() => {
      isPaused = true;
    });
    video.play = playSpy;
    video.pause = pauseSpy;

    // Hover starts playback in normal mode
    fireEvent.mouseEnter(card);
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(video.paused).toBe(false);
    expect(video.currentTime).toBe(2.4);

    // Entering selection mode simultaneously flips playOnHover -> false (as StudioMediaGridCard does)
    rerender(
      <MediaView
        src="https://example.com/hover-clip.mp4"
        isVideo={true}
        status="completed"
        surface="card"
        playOnHover={false}
        selectionEnabled={true}
        isSelected={true}
        isSelectionMode={true}
      />
    );

    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(video.paused).toBe(true);
    expect(video.currentTime).toBe(0);
  });

  it("preserves selection when Escape closes an open Bulk Context Menu and clears on the next Escape", async () => {
    const unregister = registerBulkMenuProvider(() => ({
      count: 1,
      scope: "assets",
      isBusy: false,
      canDownload: true,
      canMove: true,
      canLike: true,
      canAddToPrompt: true,
      isAllLiked: false,
      hasAllKeys: true,
      bulkDownload: vi.fn(),
      openMoveDialog: vi.fn(),
      bulkToggleLike: vi.fn(),
      openDeleteConfirm: vi.fn(),
      bulkRestore: vi.fn(),
      bulkAddToPrompt: vi.fn(),
      selectAll: vi.fn(),
      clearSelection: vi.fn(),
    }));

    function MediaCardAdapter({ workflow, isSelected, isSelectionMode, selectionEnabled, onToggleSelect }) {
      return (
        <MediaView
          data-testid={`esc-card-${workflow.id}`}
          src="https://example.com/1.png"
          status="completed"
          surface="card"
          selectionEnabled={selectionEnabled}
          isSelected={isSelected}
          isSelectionMode={isSelectionMode}
          onToggleSelect={onToggleSelect}
          onClick={(e) => {
            if (isSelectionMode && onToggleSelect) onToggleSelect(e);
          }}
        />
      );
    }

    try {
      useStudioSelectionStore.setState({
        selectedKeys: ["workflow:wf-1"],
        lastSelectedKey: "workflow:wf-1",
      });

      const { getByTestId } = render(
        <SharedGalleryGrid
          workflows={[mixedEntries[1].data, mixedEntries[2].data]}
          selectionEnabled={true}
          splitByDate={false}
          CardComponent={MediaCardAdapter}
          defaultContainerWidth={1200}
        />
      );

      // Right-click selected card to open Bulk Selection Context Menu
      fireEvent.contextMenu(getByTestId("esc-card-wf-1"));
      expect(await screen.findByText("1 selected")).toBeDefined();

      // First Escape dismisses the context menu via Radix DismissableLayer and keeps selection intact
      fireEvent.keyDown(document.activeElement || document.body, { key: "Escape" });
      await waitFor(() => {
        expect(document.querySelector('[data-bulk-context-menu="true"]')).toBeNull();
      });
      expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:wf-1"]);

      // Second Escape (no popup open) clears selection cleanly
      fireEvent.keyDown(window, { key: "Escape" });
      expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);
    } finally {
      unregister();
    }
  });

  it("renders data-selection-key wrappers on selectable grid items only when selectionEnabled is true", () => {
    const { container, rerender } = render(
      <SharedGalleryGrid
        entries={mixedEntries}
        selectionEnabled={true}
        splitByDate={false}
        showFolders={true}
        CardComponent={SelectProbeCard}
        defaultContainerWidth={1200}
      />
    );

    const keyEls = Array.from(container.querySelectorAll("[data-selection-key]"));
    expect(keyEls.map((el) => el.getAttribute("data-selection-key"))).toEqual([
      "collection:col-1",
      "workflow:wf-1",
      "workflow:wf-2",
      "workflow:wf-3",
    ]);

    rerender(
      <SharedGalleryGrid
        entries={mixedEntries}
        selectionEnabled={false}
        splitByDate={false}
        showFolders={true}
        CardComponent={SelectProbeCard}
        defaultContainerWidth={1200}
      />
    );

    expect(container.querySelectorAll("[data-selection-key]").length).toBe(0);
  });

  it("renders marquee-selection-box while dragging and selects intersected items live", () => {
    const dispatchPointer = (target, type, init) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        ...init,
      });
      Object.defineProperty(event, "pointerId", { value: 1 });
      Object.defineProperty(event, "isPrimary", { value: true });
      Object.defineProperty(event, "pointerType", { value: "mouse" });
      act(() => {
        target.dispatchEvent(event);
      });
    };

    const { container, getByTestId } = render(
      <div data-scroll-container="true" data-testid="scroll-container">
        <SharedGalleryGrid
          entries={mixedEntries}
          selectionEnabled={true}
          splitByDate={false}
          showFolders={true}
          CardComponent={SelectProbeCard}
          defaultContainerWidth={1200}
        />
      </div>
    );

    const scrollContainer = getByTestId("scroll-container");
    scrollContainer.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 1200,
      bottom: 800,
      width: 1200,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const rectsByKey = {
      "collection:col-1": { left: 10, top: 10, right: 210, bottom: 210, width: 200, height: 200 },
      "workflow:wf-1": { left: 220, top: 10, right: 420, bottom: 210, width: 200, height: 200 },
      "workflow:wf-2": { left: 430, top: 10, right: 630, bottom: 210, width: 200, height: 200 },
      "workflow:wf-3": { left: 10, top: 230, right: 210, bottom: 430, width: 200, height: 200 },
    };

    container.querySelectorAll("[data-selection-key]").forEach((el) => {
      const key = el.getAttribute("data-selection-key");
      const r = rectsByKey[key];
      el.getBoundingClientRect = () => ({ ...r, x: r.left, y: r.top, toJSON: () => {} });
    });

    expect(container.querySelector('[data-slot="marquee-selection-box"]')).toBeNull();

    // Drag across col-1, wf-1, wf-2 (missing wf-3 on the row below)
    dispatchPointer(scrollContainer, "pointerdown", { clientX: 5, clientY: 5 });
    dispatchPointer(window, "pointermove", { clientX: 450, clientY: 150 });

    const marqueeBox = container.querySelector('[data-slot="marquee-selection-box"]');
    expect(marqueeBox).not.toBeNull();
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "collection:col-1",
      "workflow:wf-1",
      "workflow:wf-2",
    ]);

    // Release pointer -> box disappears, selection stays intact
    dispatchPointer(window, "pointerup", { clientX: 450, clientY: 150 });
    expect(container.querySelector('[data-slot="marquee-selection-box"]')).toBeNull();
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "collection:col-1",
      "workflow:wf-1",
      "workflow:wf-2",
    ]);
  });

  it("clears selection when clicking empty space outside cards inside scroll container", () => {
    useStudioSelectionStore.getState().setScope("assets:proj-outside");
    useStudioSelectionStore.getState().setSelectedKeys(["workflow:wf-o1"]);

    function ProbeCard({ workflow }) {
      return <div data-testid={`outside-${workflow.id}`}>{workflow.id}</div>;
    }

    const { getByTestId } = render(
      <div data-scroll-container="true" data-testid="scroll-bg">
        <SharedGalleryGrid
          selectionEnabled={true}
          workflows={[
            {
              id: "wf-o1",
              items: [{ id: "m1", url: "https://example.com/1.png", status: "completed" }],
            },
          ]}
          CardComponent={ProbeCard}
          defaultContainerWidth={1200}
        />
        <div data-testid="empty-footer-space" />
      </div>
    );

    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:wf-o1"]);

    // Clicking inside the card does NOT trigger background clear
    fireEvent.click(getByTestId("outside-wf-o1"));
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:wf-o1"]);

    // Clicking empty space outside cards clears selection
    fireEvent.click(getByTestId("empty-footer-space"));
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);
  });

  it("does not re-render sibling unselected cards when toggling another card in selection mode", () => {
    const renderCounts = {};

    const MemoCountingCard = React.memo(function MemoCountingCard({
      itemType,
      collection,
      workflow,
      isSelected,
      onToggleSelect,
    }) {
      const id = itemType === "collection" ? collection.id : workflow.id;
      renderCounts[id] = (renderCounts[id] || 0) + 1;
      return (
        <button
          type="button"
          data-testid={`memo-card-${id}`}
          data-selected={isSelected ? "true" : "false"}
          onClick={(e) => onToggleSelect?.(e)}
        >
          {id}
        </button>
      );
    });

    const { getByTestId } = render(
      <SharedGalleryGrid
        entries={mixedEntries}
        selectionEnabled={true}
        splitByDate={true}
        showFolders={true}
        CardComponent={MemoCountingCard}
        defaultContainerWidth={1200}
      />
    );

    // Enter selection mode by selecting wf-1
    fireEvent.click(getByTestId("memo-card-wf-1"));
    expect(getByTestId("memo-card-wf-1").dataset.selected).toBe("true");

    const countsAfterFirstSelect = { ...renderCounts };

    // Select wf-2 -> ONLY wf-2 should re-render; sibling col-1, wf-1, and wf-3 must NOT re-render
    fireEvent.click(getByTestId("memo-card-wf-2"));
    expect(getByTestId("memo-card-wf-2").dataset.selected).toBe("true");
    expect(renderCounts["wf-2"]).toBe(countsAfterFirstSelect["wf-2"] + 1);
    expect(renderCounts["col-1"]).toBe(countsAfterFirstSelect["col-1"]);
    expect(renderCounts["wf-1"]).toBe(countsAfterFirstSelect["wf-1"]);
    expect(renderCounts["wf-3"]).toBe(countsAfterFirstSelect["wf-3"]);
  });

  it("treats selection as a disallowed action for processing and uploading cards across checkboxes, Ctrl+A, date-group toggle, and MediaView", () => {
    const entriesWithInFlight = [
      {
        type: "workflow",
        key: "wf-done",
        data: {
          id: "wf-done",
          status: "completed",
          metadata: { createTime: "2026-04-12T10:00:00.000Z" },
          items: [{ id: "m-done", url: "https://example.com/done.jpg", status: "completed" }],
        },
      },
      {
        type: "workflow",
        key: "wf-proc",
        data: {
          id: "wf-proc",
          status: "processing",
          metadata: { createTime: "2026-04-12T10:05:00.000Z" },
          items: [{ id: "m-proc", url: null, status: "processing" }],
        },
      },
      {
        type: "workflow",
        key: "wf-up",
        data: {
          id: "wf-up",
          status: "uploading",
          metadata: { createTime: "2026-04-12T10:06:00.000Z" },
          items: [{ id: "m-up", url: "blob:http://localhost/up", status: "uploading" }],
        },
      },
      {
        type: "workflow",
        key: "wf-only-proc-day",
        data: {
          id: "wf-only-proc-day",
          status: "processing",
          metadata: { createTime: "2026-04-13T10:00:00.000Z" },
          items: [{ id: "m-proc-2", url: null, status: "processing" }],
        },
      },
    ];

    const { container } = render(
      <SharedGalleryGrid
        entries={entriesWithInFlight}
        selectionEnabled={true}
        splitByDate={true}
        CardComponent={MediaView}
        defaultContainerWidth={1200}
      />
    );

    // Only the completed workflow gets a data-selection-key wrapper and checkbox
    const selectableWrappers = container.querySelectorAll("[data-selection-key]");
    expect(selectableWrappers).toHaveLength(1);
    expect(selectableWrappers[0].getAttribute("data-selection-key")).toBe("workflow:wf-done");

    // Date group containing ONLY a processing workflow renders NO date-group checkbox
    const procOnlyHeader = container.querySelector('[data-date-group-header="2026-04-13"]');
    expect(procOnlyHeader).not.toBeNull();
    expect(procOnlyHeader.querySelector('[role="checkbox"]')).toBeNull();

    // Ctrl+A selects ONLY the completed card, never processing or uploading cards
    fireEvent.keyDown(window, { key: "a", ctrlKey: true });
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:wf-done"]);

    // Processing & uploading cards stay cursor-default and expose zero selection outline/checkbox
    const procCard = container.querySelector('[data-slot="processing-card"]')?.closest("div.group");
    expect(procCard?.className).toContain("cursor-default");
    expect(procCard?.className).not.toContain("cursor-pointer");
    expect(procCard?.querySelector('[data-slot="card-select-checkbox"]')).toBeNull();
    expect(procCard?.querySelector('[data-slot="card-selected-outline"]')).toBeNull();

    const uploadCard = container.querySelector('[data-slot="uploading-card"]')?.closest("div.group");
    expect(uploadCard?.className).toContain("cursor-default");
    expect(uploadCard?.className).not.toContain("cursor-pointer");
    expect(uploadCard?.querySelector('[data-slot="card-select-checkbox"]')).toBeNull();
    expect(uploadCard?.querySelector('[data-slot="card-selected-outline"]')).toBeNull();
  });
});
