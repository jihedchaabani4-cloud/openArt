import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import { MediaItemView } from "./MediaItemView";

describe("MediaItemView - Clean, Simple Media Viewer by mediaId", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders media by mediaId directly from workflow", () => {
    const workflow = {
      id: "wf-1",
      items: [
        { id: "m-1", url: "https://example.com/item1.png", prompt: "first" },
        { id: "m-2", url: "https://example.com/item2.png", prompt: "target-item" },
      ],
    };

    render(
      <MediaItemView
        workflow={workflow}
        mediaId="m-2"
        status="completed"
      />
    );

    const img = screen.getByAltText("target-item");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("https://example.com/item2.png");
  });

  it("does not render liked badge by default even when isLiked is true", () => {
    render(
      <MediaItemView
        src="https://example.com/item.png"
        status="completed"
        isLiked={true}
      />
    );

    // Simple media view must be clean: NO liked badge by default
    const likedBadge = screen.queryByTitle("Liked");
    expect(likedBadge).toBeNull();
  });

  it("does not render video badge / type icon by default even when isVideo is true", () => {
    render(
      <MediaItemView
        src="https://example.com/video.mp4"
        status="completed"
        isVideo={true}
      />
    );

    // Simple media view must be clean: NO video badge / type icon by default
    const videoBadge = screen.queryByTitle("Video");
    expect(videoBadge).toBeNull();
  });

  it("does not render studio menu by default", () => {
    const { container } = render(
      <MediaItemView
        src="https://example.com/item.png"
        status="completed"
      />
    );

    // No menu triggers by default
    expect(container.querySelector("[data-testid='studio-item-menu-trigger']")).toBeNull();
    expect(screen.queryByTitle("More options")).toBeNull();
  });

  it("preserves authentic aspect ratio and does NOT force a 1:1 default ratio", () => {
    const { container } = render(
      <MediaItemView
        src="https://example.com/item.png"
        status="completed"
      />
    );

    const card = container.firstChild;
    // Should NOT have style="aspect-ratio: 1/1" forced by default
    expect(card.style.aspectRatio).not.toBe("1/1");
  });

  it("respects explicit aspect ratio when provided", () => {
    const { container } = render(
      <MediaItemView
        src="https://example.com/item.png"
        status="completed"
        aspect="16/9"
      />
    );

    const card = container.firstChild;
    expect(card.style.aspectRatio).toBe("16/9");
  });

  it("allows rendering custom slot elements when explicitly provided", () => {
    render(
      <MediaItemView
        src="https://example.com/item.png"
        status="completed"
        topLeft={<span data-testid="custom-cover-badge">Couverture</span>}
        topRight={<button data-testid="custom-delete-btn">Supprimer</button>}
      >
        <div data-testid="custom-overlay">Overlay content</div>
      </MediaItemView>
    );

    expect(screen.getByTestId("custom-cover-badge")).toBeDefined();
    expect(screen.getByTestId("custom-delete-btn")).toBeDefined();
    expect(screen.getByTestId("custom-overlay")).toBeDefined();
  });
});
