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

  it("provides dedicated menu list for folder / collection items", () => {
    const handleLike = vi.fn();
    const handleDownload = vi.fn();
    const onRename = vi.fn();
    const onDelete = vi.fn();

    const items = getStudioMenuItems({
      type: "collection",
      actions: {
        handleLike,
        handleDownload,
        onRename,
        onDelete,
      },
      state: {
        isLiked: true,
      },
    });

    const keys = items.map((i) => i.key);
    expect(keys).toContain("like");
    expect(keys).toContain("download");
    expect(keys).toContain("rename");
    expect(keys).toContain("delete");

    // Must NOT have media/generation-specific actions
    expect(keys).not.toContain("animate");
    expect(keys).not.toContain("reuse");
    expect(keys).not.toContain("add");
    expect(keys).not.toContain("cover");
  });

  it("detects collection entity type in getWorkflowEntityType", () => {
    expect(getWorkflowEntityType({ type: "collection" })).toBe("collection");
    expect(getWorkflowEntityType({ itemType: "collection" })).toBe("collection");
  });
});
