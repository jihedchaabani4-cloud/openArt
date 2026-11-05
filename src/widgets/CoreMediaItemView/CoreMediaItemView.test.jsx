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

  it("renders CoreMediaItemPresenter directly when core prop is supplied", () => {
    const mockCore = {
      url: "https://example.com/test.png",
      status: "completed",
      isVideo: false,
      isMediaLoaded: true,
      displayAspect: "1/1",
    };

    render(
      <CoreMediaItemView
        core={mockCore}
        isLiked={true}
        showLikedBadge={true}
      />
    );

    const likedBadge = screen.getByTitle("Liked");
    expect(likedBadge).toBeDefined();
  });

  it("uses rounded-lg border radius for comfortable card container geometry", () => {
    const { container } = render(
      <CoreMediaItemView
        src="https://example.com/test.png"
        status="completed"
      />
    );
    const card = container.firstChild;
    expect(card.className).toContain("rounded-lg");
    expect(card.className).not.toContain("rounded-2xl");
  });

  it("removes border from the media card container", () => {
    const { container } = render(
      <CoreMediaItemView
        src="https://example.com/test.png"
        status="completed"
      />
    );
    const card = container.firstChild;
    expect(card.className).not.toContain("border-white/10");
  });

  it("renders a video indicator icon on the left when isVideo is true", () => {
    render(
      <CoreMediaItemView
        src="https://example.com/test.mp4"
        status="completed"
        isVideo={true}
      />
    );

    const videoBadge = screen.getByTitle("Video");
    expect(videoBadge).toBeDefined();
    expect(videoBadge.getAttribute("aria-label")).toBe("Video");
    expect(videoBadge.className).toContain("bg-transparent");
    expect(videoBadge.className).not.toContain("bg-black/40");
    const icon = videoBadge.querySelector(".mat-icon, span");
    expect(icon?.textContent).toContain("videocam");
    expect(icon?.className).toContain("text-white");
  });

  it("does not render video indicator icon when isVideo is false", () => {
    render(
      <CoreMediaItemView
        src="https://example.com/test.png"
        status="completed"
        isVideo={false}
      />
    );

    const videoBadge = screen.queryByTitle("Video");
    expect(videoBadge).toBeNull();
  });

  describe("Aspect ratio preservation across display modes", () => {
    it("applies displayAspect to cardElement style when fit is contain and media is completed", () => {
      const { container } = render(
        <CoreMediaItemView
          src="https://example.com/test.png"
          status="completed"
          fit="contain"
          aspect="16/9"
        />
      );

      const card = container.firstChild;
      expect(card.style.aspectRatio).toBe("16/9");
    });

    it("applies displayAspect to cardElement style when fit is cover", () => {
      const { container } = render(
        <CoreMediaItemView
          src="https://example.com/test.png"
          status="completed"
          fit="cover"
          aspect="9/16"
        />
      );

      const card = container.firstChild;
      expect(card.style.aspectRatio).toBe("9/16");
    });
  });

  describe("Direct mediaId support", () => {
    it("resolves target item by mediaId from workflow.items when mediaId prop is passed", () => {
      const workflow = {
        id: "wf-1",
        items: [
          { id: "item-1", url: "https://example.com/1.png", prompt: "first item" },
          { id: "item-2", url: "https://example.com/2.png", prompt: "second target item" },
        ],
      };
      render(
        <CoreMediaItemView
          workflow={workflow}
          mediaId="item-2"
          status="completed"
        />
      );

      const img = screen.getByAltText("second target item");
      expect(img).toBeDefined();
      expect(img.getAttribute("src")).toBe("https://example.com/2.png");
    });
  });
});

