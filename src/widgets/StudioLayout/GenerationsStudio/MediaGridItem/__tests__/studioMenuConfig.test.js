import { describe, it, expect, vi } from "vitest";
import { getStudioMenuItems } from "../studioMenuConfig";

describe("studioMenuConfig - getStudioMenuItems animate function & exclusions", () => {
  it("includes 'Animer' item for non-video generation and triggers handleAnimate", () => {
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

    // Share and 'Ajouter à la scène' should not be present
    const keys = items.map((i) => i.key);
    expect(keys).not.toContain("share");
    const labels = items.map((i) => i.label);
    expect(labels).not.toContain("Ajouter à la scène");
    expect(labels).not.toContain("Partager");
  });

  it("includes 'Animer' item for non-video upload items", () => {
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
    expect(animateItem.icon).toBe("movie");

    const keys = items.map((i) => i.key);
    expect(keys).not.toContain("share");
  });

  it("includes 'Animer' item for non-video character / element items", () => {
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

    const animateItem = items.find((i) => i.key === "animate");
    expect(animateItem).toBeDefined();
    expect(animateItem.label).toBe("Animer");

    const keys = items.map((i) => i.key);
    expect(keys).not.toContain("share");
  });

  it("does NOT include 'animate' or 'Ajouter à la scène' when isVideo is true", () => {
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
        isVideo: true,
      },
    });

    const keys = items.map((i) => i.key);
    const labels = items.map((i) => i.label);
    expect(keys).not.toContain("animate");
    expect(labels).not.toContain("Ajouter à la scène");
    expect(labels).not.toContain("Animer");
  });
});
