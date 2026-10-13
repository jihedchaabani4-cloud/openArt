import { describe, it, expect, vi } from "vitest";
import { getStudioMenuItems } from "../studioMenuConfig";

describe("studioMenuConfig - getStudioMenuItems exclusions", () => {
  it("does not include 'animate' or 'share' items in generation menu items", () => {
    const items = getStudioMenuItems({
      type: "generation",
      actions: {
        handleAnimate: vi.fn(),
        handleShare: vi.fn(),
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
    expect(keys).not.toContain("share");
    expect(labels).not.toContain("Ajouter à la scène");
    expect(labels).not.toContain("Animer");
    expect(labels).not.toContain("Partager");
  });

  it("does not include 'animate' or 'share' items in upload menu items", () => {
    const items = getStudioMenuItems({
      type: "upload",
      actions: {
        handleAnimate: vi.fn(),
        handleShare: vi.fn(),
        handleAddToPrompt: vi.fn(),
        handleLike: vi.fn(),
        onDelete: vi.fn(),
      },
      state: {
        isVideo: false,
      },
    });

    const keys = items.map((i) => i.key);
    const labels = items.map((i) => i.label);

    expect(keys).not.toContain("animate");
    expect(keys).not.toContain("share");
    expect(labels).not.toContain("Ajouter à la scène");
    expect(labels).not.toContain("Animer");
    expect(labels).not.toContain("Partager");
  });

  it("does not include 'animate' or 'share' items in character/element menu items", () => {
    const items = getStudioMenuItems({
      type: "character",
      actions: {
        handleAnimate: vi.fn(),
        handleShare: vi.fn(),
        handleAddToPrompt: vi.fn(),
        handleLike: vi.fn(),
        onDelete: vi.fn(),
      },
    });

    const keys = items.map((i) => i.key);
    const labels = items.map((i) => i.label);

    expect(keys).not.toContain("animate");
    expect(keys).not.toContain("share");
    expect(labels).not.toContain("Partager");
  });
});
