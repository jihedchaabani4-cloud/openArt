import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CoreMediaItemView } from "./CoreMediaItemView";

describe("CoreMediaItemView - Liked top-left indicator badge", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  it("renders the liked badge in the top-left corner when isLiked is true", () => {
    render(
      <CoreMediaItemView
        src="https://example.com/test.png"
        status="completed"
        isLiked={true}
      />
    );

    const likedBadge = screen.getByTitle("Liked");
    expect(likedBadge).toBeDefined();
    expect(likedBadge.getAttribute("aria-label")).toBe("Liked");
    expect(likedBadge.className).toContain("bg-transparent");
  });

  it("does not render the liked badge when isLiked is false", () => {
    render(
      <CoreMediaItemView
        src="https://example.com/test.png"
        status="completed"
        isLiked={false}
      />
    );

    const likedBadge = screen.queryByTitle("Liked");
    expect(likedBadge).toBeNull();
  });

  it("calls onLikeToggle and stops propagation when liked badge is clicked", () => {
    const onLikeToggle = vi.fn();
    const onCardClick = vi.fn();

    render(
      <CoreMediaItemView
        src="https://example.com/test.png"
        status="completed"
        isLiked={true}
        onLikeToggle={onLikeToggle}
        onClick={onCardClick}
      />
    );

    const likedBadge = screen.getByTitle("Liked");
    fireEvent.click(likedBadge);

    expect(onLikeToggle).toHaveBeenCalledTimes(1);
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it("deduces isLiked=true from workflow.metadata.favorited", () => {
    const workflow = {
      id: "wf-1",
      metadata: {
        favorited: true,
      },
    };

    render(
      <CoreMediaItemView
        workflow={workflow}
        src="https://example.com/test.png"
        status="completed"
      />
    );

    const likedBadge = screen.getByTitle("Liked");
    expect(likedBadge).toBeDefined();
    const icon = likedBadge.querySelector(".mat-icon, span");
    expect(icon?.className).toContain("text-white");
    expect(icon?.className).toContain("fill-white");
  });

  it("does not render the liked badge when showLikedBadge is false (edit page mode)", () => {
    render(
      <CoreMediaItemView
        src="https://example.com/test.png"
        status="completed"
        isLiked={true}
        showLikedBadge={false}
      />
    );

    const likedBadge = screen.queryByTitle("Liked");
    expect(likedBadge).toBeNull();
  });

  it("automatically suppresses liked badge when current pathname is an edit route", () => {
    const originalPath = window.location.pathname;
    try {
      window.history.pushState({}, "", "/cinema-studio/proj-1/assets/edit/wf-123");
      render(
        <CoreMediaItemView
          src="https://example.com/test.png"
          status="completed"
          isLiked={true}
        />
      );

      const likedBadge = screen.queryByTitle("Liked");
      expect(likedBadge).toBeNull();
    } finally {
      window.history.pushState({}, "", originalPath);
    }
  });

  it("uses rounded-xl border radius instead of rounded-2xl to subtly reduce corner curvature", () => {
    const { container } = render(
      <CoreMediaItemView
        src="https://example.com/test.png"
        status="completed"
      />
    );
    const card = container.firstChild;
    expect(card.className).toContain("rounded-xl");
    expect(card.className).not.toContain("rounded-2xl");
  });
});
