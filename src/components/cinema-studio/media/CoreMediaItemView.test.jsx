import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { CoreMediaItemView } from "./MediaView";
import { getCachedImageDimensions } from "@/shared/lib/displayUtils";

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
    const icon = likedBadge.querySelector('[data-icon-provider="hugeicons"]');
    expect(icon?.getAttribute("data-icon-name")).toBe("favourite");
    expect(icon?.className).toContain("text-white");
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

  it("uses rounded-comfortable border radius for canonical media geometry", () => {
    const { container } = render(
      <CoreMediaItemView
        src="https://example.com/test.png"
        status="completed"
      />
    );
    const card = container.firstChild;
    expect(card.className).toContain("rounded-comfortable");
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

  it("renders a unified bottom-right video badge with white background and black icon when isVideo is true", () => {
    const { container } = render(
      <CoreMediaItemView
        src="https://example.com/test.mp4"
        status="completed"
        isVideo={true}
      />
    );

    const videoBadge = screen.getByTitle("Video");
    expect(videoBadge).toBeDefined();
    expect(videoBadge.getAttribute("aria-label")).toBe("Video");
    expect(videoBadge.className).toContain("size-6");
    expect(videoBadge.className).toContain("rounded-sharp");
    expect(videoBadge.className).toContain("bg-white");
    expect(videoBadge.className).toContain("text-black");
    expect(container.querySelector('[data-slot="media-bottom-right"]')?.contains(videoBadge)).toBe(true);
    const icon = videoBadge.querySelector('[data-icon-provider="hugeicons"]');
    expect(icon?.getAttribute("data-icon-name")).toBe("video-01");
    expect(icon?.className).toContain("text-black");
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
      // Regression: fit="contain" must use definite w-full h-full (never w-fit h-fit) so images never clip
      expect(card.className).toContain("w-full");
      expect(card.className).toContain("h-full");
      expect(card.className).not.toContain("w-fit");
      expect(card.className).not.toContain("h-fit");
      const img = container.querySelector("img");
      expect(img.className).toContain("w-full");
      expect(img.className).toContain("h-full");
      expect(img.className).toContain("object-contain");
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

    it("normalizes colon ratio props like '9:16' to valid CSS '9/16'", () => {
      const { container } = render(
        <CoreMediaItemView
          src="https://example.com/colon-ratio.png"
          status="completed"
          fit="cover"
          aspect="9:16"
        />
      );

      expect(container.firstChild.style.aspectRatio).toBe("9/16");
    });

    it("prefers verified natural image dimensions over stale propAspect after load", async () => {
      const { container } = render(
        <CoreMediaItemView
          src="https://example.com/intrinsic-overrides-prop.png"
          status="completed"
          fit="cover"
          aspect="16/9"
        />
      );

      const img = container.querySelector("img");
      await act(async () => {
        Object.defineProperty(img, "complete", { configurable: true, value: true });
        Object.defineProperty(img, "naturalWidth", { configurable: true, value: 736 });
        Object.defineProperty(img, "naturalHeight", { configurable: true, value: 1308 });
        fireEvent.load(img);
      });

      expect(container.firstChild.style.aspectRatio).toBe("736/1308");
    });

    it("does not poison the dimension cache for urlB with urlA's dims when src changes", async () => {
      const urlA = "https://example.com/switch-a.png";
      const urlB = "https://example.com/switch-b.png";

      const { container, rerender } = render(
        <CoreMediaItemView src={urlA} status="completed" />
      );

      const img = container.querySelector("img");
      await act(async () => {
        Object.defineProperty(img, "complete", { configurable: true, value: true });
        Object.defineProperty(img, "naturalWidth", { configurable: true, value: 1920 });
        Object.defineProperty(img, "naturalHeight", { configurable: true, value: 1080 });
        fireEvent.load(img);
      });
      expect(getCachedImageDimensions(urlA)).toMatchObject({ width: 1920, height: 1080 });

      rerender(<CoreMediaItemView src={urlB} status="completed" />);
      expect(getCachedImageDimensions(urlB)).toBeNull();
    });

    it("caches natural dimensions under propSrc when propSrc overrides item.url", async () => {
      const itemUrl = "https://example.com/item-orig-url.png";
      const overrideSrc = "https://example.com/override-render-url.png";

      const { container } = render(
        <CoreMediaItemView
          item={{ id: "override-item", url: itemUrl, status: "completed" }}
          src={overrideSrc}
          status="completed"
        />
      );

      const img = container.querySelector("img");
      await act(async () => {
        Object.defineProperty(img, "complete", { configurable: true, value: true });
        Object.defineProperty(img, "naturalWidth", { configurable: true, value: 720 });
        Object.defineProperty(img, "naturalHeight", { configurable: true, value: 1280 });
        fireEvent.load(img);
      });

      expect(getCachedImageDimensions(overrideSrc)).toMatchObject({ width: 720, height: 1280 });
      expect(getCachedImageDimensions(itemUrl)).toBeNull();
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

