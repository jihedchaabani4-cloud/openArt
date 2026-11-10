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
    expect(animateItem.icon).toBe("movie");

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
    expect(items.find((i) => i.key === "open_in_new")?.icon).toBe("open_in_new");
    expect(items.find((i) => i.key === "create_new_folder")?.icon).toBe("create_new_folder");
    expect(items.find((i) => i.key === "edit")?.icon).toBe("edit");
    expect(items.find((i) => i.key === "drive_file_move")?.icon).toBe("drive_file_move");
    expect(items.find((i) => i.key === "like")?.icon).toBe("favorite");
    expect(items.find((i) => i.key === "download")?.icon).toBe("download");
    expect(items.find((i) => i.key === "color")?.icon).toBe("palette");
    expect(items.find((i) => i.key === "delete")?.icon).toBe("delete");

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
    const limeSwatch = colorItem.subItems.find((s) => s.key === "color-lime");
    expect(limeSwatch).toBeDefined();
    limeSwatch.onClick();
    expect(handleSetColor).toHaveBeenCalledWith("#d1fe17");
  });

  it("detects collection entity type in getWorkflowEntityType", () => {
    expect(getWorkflowEntityType({ type: "collection" })).toBe("collection");
    expect(getWorkflowEntityType({ itemType: "collection" })).toBe("collection");
  });
});
