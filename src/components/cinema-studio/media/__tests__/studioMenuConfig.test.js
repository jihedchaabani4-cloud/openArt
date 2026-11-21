import { describe, it, expect, vi } from "vitest";
import { getStudioMenuItems, getWorkflowEntityType } from "../studioMenuConfig";

describe("studioMenuConfig - Per-type menu list & animate exclusions", () => {
  it("includes 'Animer' for non-video generation items", () => {
    const handleAnimate = vi.fn();
    const items = getStudioMenuItems({
      type: "generation",
      actions: {
        handleAnimate,
        handleAddToPrompt: vi.fn(),
        handleLike: vi.fn(),
        onDelete: vi.fn(),
      },
      state: {
        isVideo: false,
      },
    });

    const animateItem = items.find((i) => i.key === "animate");
    expect(animateItem).toBeDefined();
    expect(animateItem.label).toBe("Animer");
    expect(animateItem.icon).toBe("film-01");

    animateItem.onClick();
    expect(handleAnimate).toHaveBeenCalledTimes(1);
  });

  it("removes inactive reuse button when canReuse is false", () => {
    const items = getStudioMenuItems({
      type: "generation",
      actions: { handleLike: vi.fn(), handleReuseSettings: vi.fn(), onDelete: vi.fn() },
      state: { showReuse: true, canReuse: false },
    });

    expect(items.find((item) => item.key === "reuse")).toBeUndefined();
  });

  it("removes inactive 'add' button when canAddToPrompt is false", () => {
    const items = getStudioMenuItems({
      type: "generation",
      actions: { handleLike: vi.fn(), handleAddToPrompt: vi.fn(), onDelete: vi.fn() },
      state: { canAddToPrompt: false },
    });

    expect(items.find((item) => item.key === "add")).toBeUndefined();
  });

  it("removes inactive 'delete' button when canDelete is false", () => {
    const items = getStudioMenuItems({
      type: "generation",
      actions: { handleLike: vi.fn(), onDelete: vi.fn() },
      state: { canDelete: false },
    });

    expect(items.find((item) => item.key === "delete")).toBeUndefined();
  });

  it("includes 'Animer' for non-video upload items", () => {
    const handleAnimate = vi.fn();
    const items = getStudioMenuItems({
      type: "upload",
      actions: {
        handleAnimate,
        handleAddToPrompt: vi.fn(),
        handleLike: vi.fn(),
        onDelete: vi.fn(),
      },
      state: {
        isVideo: false,
      },
    });

    const animateItem = items.find((i) => i.key === "animate");
    expect(animateItem).toBeDefined();
    expect(animateItem.label).toBe("Animer");
  });

  it("does NOT include 'animate' for character items even when handleAnimate is provided", () => {
    const handleAnimate = vi.fn();
    const items = getStudioMenuItems({
      type: "character",
      actions: {
        handleAnimate,
        handleAddToPrompt: vi.fn(),
        handleLike: vi.fn(),
        onDelete: vi.fn(),
      },
      state: {
        isVideo: false,
      },
    });

    const keys = items.map((i) => i.key);
    expect(keys).not.toContain("animate");
  });

  it("does NOT include 'animate' for element items even when handleAnimate is provided", () => {
    const handleAnimate = vi.fn();
    const items = getStudioMenuItems({
      type: "element",
      actions: {
        handleAnimate,
        handleAddToPrompt: vi.fn(),
        handleLike: vi.fn(),
        onDelete: vi.fn(),
      },
      state: {
        isVideo: false,
      },
    });

    const keys = items.map((i) => i.key);
    expect(keys).not.toContain("animate");
  });

  it("does NOT include 'animate', 'Ajouter à la scène', or 'add' (Ajouter au prompt) when isVideo is true", () => {
    const handleAnimate = vi.fn();
    const handleAddToPrompt = vi.fn();
    const items = getStudioMenuItems({
      type: "generation",
      actions: {
        handleAnimate,
        handleAddToPrompt,
        handleLike: vi.fn(),
        onDelete: vi.fn(),
      },
      state: {
        isVideo: true,
      },
    });

    const keys = items.map((i) => i.key);
    const labels = items.map((i) => i.label);
    expect(keys).not.toContain("animate");
    expect(labels).not.toContain("Ajouter à la scène");
    expect(keys).not.toContain("add");
    expect(labels).not.toContain("Ajouter au prompt");
  });

  it("does NOT include 'add' (Ajouter au prompt) for upload items when isVideo is true", () => {
    const items = getStudioMenuItems({
      type: "upload",
      actions: {
        handleAddToPrompt: vi.fn(),
        handleLike: vi.fn(),
        onDelete: vi.fn(),
      },
      state: {
        isVideo: true,
      },
    });

    const keys = items.map((i) => i.key);
    const labels = items.map((i) => i.label);
    expect(keys).not.toContain("add");
    expect(labels).not.toContain("Ajouter au prompt");
  });

  it("provides unified menu list for folder / collection items across all surfaces", () => {
    const handleOpenInNewTab = vi.fn();
    const handleCreateSubfolder = vi.fn();
    const handleEdit = vi.fn();
    const handleMoveTo = vi.fn();
    const handleLike = vi.fn();
    const handleDownload = vi.fn();
    const handleSetColor = vi.fn();
    const onDelete = vi.fn();

    const items = getStudioMenuItems({
      type: "collection",
      actions: {
        handleOpenInNewTab,
        handleCreateSubfolder,
        handleEdit,
        handleMoveTo,
        handleLike,
        handleDownload,
        handleSetColor,
        onDelete,
      },
      state: {
        isLiked: true,
        isDownloading: false,
      },
    });

    const keys = items.map((i) => i.key);

    // Must contain all unified actions
    expect(keys).toContain("open_in_new");
    expect(keys).toContain("create_new_folder");
    expect(keys).toContain("edit");
    expect(keys).toContain("drive_file_move");
    expect(keys).toContain("like");
    expect(keys).toContain("download");
    expect(keys).toContain("color");
    expect(keys).toContain("delete");

    // Must NOT have rename or media-specific actions
    expect(keys).not.toContain("rename");
    expect(keys).not.toContain("animate");
    expect(keys).not.toContain("reuse");
    expect(keys).not.toContain("add");
    expect(keys).not.toContain("cover");

    // Verify icons
    expect(items.find((i) => i.key === "open_in_new")?.icon).toBe("link-square-02");
    expect(items.find((i) => i.key === "create_new_folder")?.icon).toBe("folder-add");
    expect(items.find((i) => i.key === "edit")?.icon).toBe("pencil-edit-02");
    expect(items.find((i) => i.key === "drive_file_move")?.icon).toBe("folder-transfer");
    expect(items.find((i) => i.key === "like")?.icon).toBe("favourite");
    expect(items.find((i) => i.key === "download")?.icon).toBe("download-04");
    expect(items.find((i) => i.key === "color")?.icon).toBe("paint-board");
    expect(items.find((i) => i.key === "delete")?.icon).toBe("delete-02");

    // Verify handlers
    items.find((i) => i.key === "open_in_new")?.onClick();
    expect(handleOpenInNewTab).toHaveBeenCalledTimes(1);

    items.find((i) => i.key === "create_new_folder")?.onClick();
    expect(handleCreateSubfolder).toHaveBeenCalledTimes(1);

    items.find((i) => i.key === "edit")?.onClick();
    expect(handleEdit).toHaveBeenCalledTimes(1);

    items.find((i) => i.key === "drive_file_move")?.onClick();
    expect(handleMoveTo).toHaveBeenCalledTimes(1);

    items.find((i) => i.key === "like")?.onClick();
    expect(handleLike).toHaveBeenCalledTimes(1);

    items.find((i) => i.key === "download")?.onClick();
    expect(handleDownload).toHaveBeenCalledTimes(1);

    items.find((i) => i.key === "delete")?.onClick();
    expect(onDelete).toHaveBeenCalledTimes(1);

    // Color item has subItems for color swatches
    const colorItem = items.find((i) => i.key === "color");
    expect(colorItem.subItems).toBeDefined();
    expect(colorItem.subItems.length).toBeGreaterThan(0);
    const amberSwatch = colorItem.subItems.find((s) => s.key === "color-amber");
    expect(amberSwatch).toBeDefined();
    amberSwatch.onClick();
    expect(handleSetColor).toHaveBeenCalledWith("#FFC241");
  });

  it("detects collection entity type in getWorkflowEntityType", () => {
    expect(getWorkflowEntityType({ type: "collection" })).toBe("collection");
    expect(getWorkflowEntityType({ itemType: "collection" })).toBe("collection");
  });

  describe("2-phase context-aware prompt actions (Reference Mode vs Frame Mode)", () => {
    it("Phase 1 (isFrameMode: false): shows 'Ajouter au prompt' + 'Animer' and omits Start/End Frame", () => {
      const items = getStudioMenuItems({
        type: "generation",
        actions: {
          handleAddToPrompt: vi.fn(),
          handleAnimate: vi.fn(),
          handleAddStartFrame: vi.fn(),
          handleAddEndFrame: vi.fn(),
          handleLike: vi.fn(),
          onDelete: vi.fn(),
        },
        state: {
          isVideo: false,
          isFrameMode: false,
        },
      });

      const keys = items.map((i) => i.key);
      expect(keys).toContain("add");
      expect(keys).toContain("animate");
      expect(keys).not.toContain("add-start-frame");
      expect(keys).not.toContain("add-end-frame");
    });

    it("Phase 2 (isFrameMode: true) on generation: replaces 'add' & 'animate' with Start Frame and End Frame", () => {
      const handleAddStartFrame = vi.fn();
      const handleAddEndFrame = vi.fn();
      const items = getStudioMenuItems({
        type: "generation",
        actions: {
          handleAddToPrompt: vi.fn(),
          handleAnimate: vi.fn(),
          handleAddStartFrame,
          handleAddEndFrame,
          handleLike: vi.fn(),
          onDelete: vi.fn(),
        },
        state: {
          isVideo: false,
          isFrameMode: true,
        },
      });

      const keys = items.map((i) => i.key);
      expect(keys).not.toContain("add");
      expect(keys).not.toContain("animate");
      expect(keys).toContain("add-start-frame");
      expect(keys).toContain("add-end-frame");

      const startItem = items.find((i) => i.key === "add-start-frame");
      expect(startItem.label).toBe("Ajouter en Start Frame");
      expect(startItem.icon).toBe("chevron-first");
      startItem.onClick();
      expect(handleAddStartFrame).toHaveBeenCalledTimes(1);

      const endItem = items.find((i) => i.key === "add-end-frame");
      expect(endItem.label).toBe("Ajouter en End Frame");
      expect(endItem.icon).toBe("chevron-last");
      endItem.onClick();
      expect(handleAddEndFrame).toHaveBeenCalledTimes(1);
    });

    it("Phase 2 (isFrameMode: true) on upload: shows Start Frame and End Frame instead of 'add' & 'animate'", () => {
      const items = getStudioMenuItems({
        type: "upload",
        actions: {
          handleAddToPrompt: vi.fn(),
          handleAnimate: vi.fn(),
          handleAddStartFrame: vi.fn(),
          handleAddEndFrame: vi.fn(),
          handleLike: vi.fn(),
          onDelete: vi.fn(),
        },
        state: {
          isVideo: false,
          isFrameMode: true,
        },
      });

      const keys = items.map((i) => i.key);
      expect(keys).toContain("add-start-frame");
      expect(keys).toContain("add-end-frame");
      expect(keys).not.toContain("add");
      expect(keys).not.toContain("animate");
    });

    it("Phase 2 (isFrameMode: true) hides Start/End Frame for videos and ineligible items", () => {
      const videoItems = getStudioMenuItems({
        type: "generation",
        actions: {
          handleAddStartFrame: vi.fn(),
          handleAddEndFrame: vi.fn(),
          handleLike: vi.fn(),
          onDelete: vi.fn(),
        },
        state: {
          isVideo: true,
          isFrameMode: true,
        },
      });
      expect(videoItems.map((i) => i.key)).not.toContain("add-start-frame");
      expect(videoItems.map((i) => i.key)).not.toContain("add-end-frame");

      const disabledItems = getStudioMenuItems({
        type: "generation",
        actions: {
          handleAddStartFrame: vi.fn(),
          handleAddEndFrame: vi.fn(),
          handleLike: vi.fn(),
          onDelete: vi.fn(),
        },
        state: {
          isVideo: false,
          canAddToPrompt: false,
          isFrameMode: true,
        },
      });
      expect(disabledItems.map((i) => i.key)).not.toContain("add-start-frame");
      expect(disabledItems.map((i) => i.key)).not.toContain("add-end-frame");
    });

    it("Phase 2 (isFrameMode: true) hides reference & frame items for character/element sheets", () => {
      for (const type of ["character", "element"]) {
        const items = getStudioMenuItems({
          type,
          actions: {
            handleAddToPrompt: vi.fn(),
            handleAddStartFrame: vi.fn(),
            handleAddEndFrame: vi.fn(),
            handleLike: vi.fn(),
            onDelete: vi.fn(),
          },
          state: {
            isVideo: false,
            isFrameMode: true,
          },
        });
        const keys = items.map((i) => i.key);
        expect(keys).not.toContain("add");
        expect(keys).not.toContain("add-start-frame");
        expect(keys).not.toContain("add-end-frame");
      }
    });
  });
});
