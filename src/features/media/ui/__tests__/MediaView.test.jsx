import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MediaView, CoreMediaItemView, CoreMediaItemPresenter } from "../MediaView";

describe("Canonical MediaView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  describe("1. Direct Media Input", () => {
    it("renders normalized MediaItem directly", () => {
      const media = {
        id: "m-norm-1",
        kind: "image",
        url: "https://example.com/concept.png",
        status: "ready",
        name: "Concept Art Hero",
      };

      render(<MediaView media={media} />);

      const img = screen.getByRole("img", { name: "Concept Art Hero" });
      expect(img).toBeDefined();
      expect(img.getAttribute("src")).toBe("https://example.com/concept.png");
      expect(img.className).toContain("object-contain");
      expect(img.className).not.toContain("rounded-xxxs");
    });

    it("normalizes raw media asset on the fly", () => {
      const rawAsset = {
        file_url: "https://example.com/raw-output.png",
        prompt: "A cinematic dragon in flight",
        status: "success",
      };

      render(<MediaView media={rawAsset} />);

      const img = screen.getByRole("img", { name: "A cinematic dragon in flight" });
      expect(img).toBeDefined();
      expect(img.getAttribute("src")).toBe("https://example.com/raw-output.png");
    });

    it("supports backward-compatible item prop alias", () => {
      const item = {
        id: "item-legacy",
        url: "https://example.com/legacy.png",
        name: "Legacy Image",
        status: "completed",
      };

      render(<MediaView item={item} />);

      const img = screen.getByRole("img", { name: "Legacy Image" });
      expect(img.getAttribute("src")).toBe("https://example.com/legacy.png");
    });

    it("applies canonical rounded-xxxs radius to outer boundary while inner image fills cleanly", () => {
      const item = {
        id: "item-xxxs",
        url: "https://example.com/hairline.png",
        status: "ready",
      };

      const { container } = render(<MediaView item={item} />);

      const img = document.querySelector("img");
      expect(img.className).toContain("object-contain");
      expect(img.className).not.toContain("rounded-xxxs");

      const root = container.firstChild;
      expect(root.className).toContain("rounded-xxxs");
      expect(root.className).toContain("overflow-hidden");
    });
  });

  describe("2. Direct Media + Workflow Context Precedence", () => {
    it("renders direct media visually while inheriting metadata from workflow context", () => {
      const directMedia = {
        id: "target-image",
        url: "https://example.com/target.png",
        name: "Target Detail",
        status: "ready",
      };

      const workflowContext = {
        id: "wf-100",
        workflow_type: "CHARACTER",
        is_liked: true,
        items: [
          { id: "other-image", url: "https://example.com/other.png", name: "Other" },
        ],
      };

      render(
        <MediaView
          media={directMedia}
          workflow={workflowContext}
          showLikedBadge={true}
        />
      );

      // Direct media wins the visual target
      const img = screen.getByRole("img", { name: "Target Detail" });
      expect(img.getAttribute("src")).toBe("https://example.com/target.png");

      // Workflow context supplies is_liked
      const likedBadge = screen.getByTitle("Liked");
      expect(likedBadge).toBeDefined();
    });
  });

  describe("3. Workflow Source Resolution across Workflow Types", () => {
    it("resolves GENERATION workflow primary completed media", () => {
      const workflow = {
        id: "gen-wf-1",
        workflow_type: "GENERATION",
        items: [
          { id: "gen-1", url: "https://example.com/gen1.png", prompt: "Generated Scene 1", status: "completed" },
          { id: "gen-2", url: "https://example.com/gen2.png", prompt: "Generated Scene 2", status: "completed" },
        ],
      };

      render(<MediaView workflow={workflow} />);

      const img = screen.getByRole("img", { name: "Generated Scene 1" });
      expect(img.getAttribute("src")).toBe("https://example.com/gen1.png");
    });

    it("resolves CHARACTER workflow turnaround sheet over detail image", () => {
      const workflow = {
        id: "char-wf-1",
        workflow_type: "CHARACTER",
        items: [
          { id: "detail-1", url: "https://example.com/detail.png", prompt: "Detail Shot", role: "detail", status: "completed" },
          { id: "sheet-1", url: "https://example.com/sheet.png", prompt: "Turnaround Sheet", role: "sheet", status: "completed" },
        ],
      };

      render(<MediaView workflow={workflow} />);

      const img = screen.getByRole("img", { name: "Turnaround Sheet" });
      expect(img.getAttribute("src")).toBe("https://example.com/sheet.png");
    });

    it("resolves ELEMENT workflow primary_media_id when specified", () => {
      const workflow = {
        id: "elem-wf-1",
        workflow_type: "ELEMENT",
        primary_media_id: "elem-cover",
        items: [
          { id: "elem-1", url: "https://example.com/elem1.png", prompt: "Prop 1", status: "completed" },
          { id: "elem-cover", url: "https://example.com/elem-cover.png", prompt: "Prop Cover", status: "completed" },
        ],
      };

      render(<MediaView workflow={workflow} />);

      const img = screen.getByRole("img", { name: "Prop Cover" });
      expect(img.getAttribute("src")).toBe("https://example.com/elem-cover.png");
    });

    it("resolves UPLOAD workflow source media", () => {
      const workflow = {
        id: "upload-wf-1",
        workflow_type: "UPLOAD",
        items: [
          { id: "upload-1", file_url: "https://example.com/uploaded.png", name: "Photo.png", status: "completed" },
        ],
      };

      render(<MediaView workflow={workflow} />);

      const img = screen.getByRole("img", { name: "Photo.png" });
      expect(img.getAttribute("src")).toBe("https://example.com/uploaded.png");
    });
  });

  describe("4. Lifecycle States", () => {
    it("renders ProcessingCard when status is processing", () => {
      const item = {
        id: "proc-1",
        status: "processing",
        progress: 42,
      };

      render(<MediaView media={item} />);

      expect(screen.getByText("42%")).toBeDefined();
    });

    it("renders FlowErrorTile when status is failed and provides retry action", () => {
      const onRetry = vi.fn();
      const item = {
        id: "fail-1",
        status: "failed",
        error: "Prompt violated safety guidelines",
      };

      render(<MediaView media={item} onRetry={onRetry} canReusePrompt={true} />);

      expect(screen.getByText("Prompt violated safety guidelines")).toBeDefined();
      const retryBtn = screen.getByTitle("Reuse prompt");
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("5. Video Rendering & Playback", () => {
    it("renders video element and indicator badge for completed videos", () => {
      const videoMedia = {
        id: "vid-1",
        url: "https://example.com/clip.mp4",
        kind: "video",
        status: "ready",
      };

      render(<MediaView media={videoMedia} showVideoBadge={true} />);

      const video = document.querySelector("video");
      expect(video).toBeDefined();
      expect(video.getAttribute("src")).toBe("https://example.com/clip.mp4");

      const badge = screen.getByTitle("Video");
      expect(badge).toBeDefined();
    });

    it("forwards external videoRef to video element", () => {
      const videoRef = React.createRef();
      const videoMedia = {
        id: "vid-ref",
        url: "https://example.com/clip.mp4",
        kind: "video",
        status: "ready",
      };

      render(<MediaView media={videoMedia} videoRef={videoRef} />);

      expect(videoRef.current).toBeInstanceOf(window.HTMLVideoElement);
      expect(videoRef.current.src).toBe("https://example.com/clip.mp4");
    });

    it("plays video on mouseEnter and pauses/resets on mouseLeave when playOnHover is true", () => {
      const videoMedia = {
        id: "vid-hover",
        url: "https://example.com/hover.mp4",
        kind: "video",
        status: "ready",
      };

      const { container } = render(<MediaView media={videoMedia} playOnHover={true} />);
      const card = container.firstChild;

      fireEvent.mouseEnter(card);
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();

      fireEvent.mouseLeave(card);
      expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    });

    it("triggers onVideoTimeUpdate and onVideoLoadedMetadata callbacks", () => {
      const onVideoTimeUpdate = vi.fn();
      const onVideoLoadedMetadata = vi.fn();
      const videoMedia = {
        id: "vid-events",
        url: "https://example.com/events.mp4",
        kind: "video",
        status: "ready",
      };

      render(
        <MediaView
          media={videoMedia}
          onVideoTimeUpdate={onVideoTimeUpdate}
          onVideoLoadedMetadata={onVideoLoadedMetadata}
        />
      );

      const video = document.querySelector("video");
      expect(video).toBeDefined();
      fireEvent(video, new Event("timeupdate"));
      expect(onVideoTimeUpdate).toHaveBeenCalled();

      fireEvent(video, new Event("loadedmetadata"));
      expect(onVideoLoadedMetadata).toHaveBeenCalled();
    });
  });

  describe("6. Slot Projection", () => {
    it("renders all slots in their expected structural layout positions", () => {
      const media = {
        id: "m-slots",
        url: "https://example.com/img.png",
        status: "ready",
      };

      render(
        <MediaView
          media={media}
          topLeft={<span data-testid="slot-tl">Top Left Slot</span>}
          topRight={<span data-testid="slot-tr">Top Right Slot</span>}
          bottomLeft={<span data-testid="slot-bl">Bottom Left Slot</span>}
          bottomRight={<span data-testid="slot-br">Bottom Right Slot</span>}
          bottom={<div data-testid="slot-bottom">Bottom Bar</div>}
          center={<div data-testid="slot-center">Center Play Icon</div>}
          overlay={<div data-testid="slot-overlay">Custom Overlay</div>}
        />
      );

      expect(screen.getByTestId("slot-tl").textContent).toBe("Top Left Slot");
      expect(screen.getByTestId("slot-tr").textContent).toBe("Top Right Slot");
      expect(screen.getByTestId("slot-bl").textContent).toBe("Bottom Left Slot");
      expect(screen.getByTestId("slot-br").textContent).toBe("Bottom Right Slot");
      expect(screen.getByTestId("slot-bottom").textContent).toBe("Bottom Bar");
      expect(screen.getByTestId("slot-center").textContent).toBe("Center Play Icon");
      expect(screen.getByTestId("slot-overlay").textContent).toBe("Custom Overlay");
    });
  });

  describe("7. Context Menu", () => {
    it("renders context menu items when contextMenuItems is passed", () => {
      const media = {
        id: "m-ctx",
        url: "https://example.com/ctx.png",
        status: "ready",
      };
      const onAction = vi.fn();
      const items = [
        { id: "download", label: "Download Asset", icon: "download", onClick: onAction },
      ];

      render(<MediaView media={media} contextMenuItems={items} />);

      const trigger = document.querySelector('[data-state="closed"]') || document.querySelector(".group");
      expect(trigger).toBeDefined();

      fireEvent.contextMenu(trigger);
      const downloadItem = screen.getByText("Download Asset");
      expect(downloadItem).toBeDefined();

      fireEvent.click(downloadItem);
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it("renders custom contextMenuContent when supplied", () => {
      const media = {
        id: "m-custom-ctx",
        url: "https://example.com/ctx.png",
        status: "ready",
      };

      render(
        <MediaView
          media={media}
          contextMenuContent={<div data-testid="custom-ctx-menu">Studio Specialized Menu</div>}
        />
      );

      const trigger = document.querySelector(".group");
      fireEvent.contextMenu(trigger);

      expect(screen.getByTestId("custom-ctx-menu").textContent).toBe("Studio Specialized Menu");
    });
  });

  describe("8. Ref Forwarding & Core Pass-through", () => {
    it("forwards root container ref to consumer", () => {
      const containerRef = React.createRef();
      const media = {
        id: "m-ref",
        url: "https://example.com/ref.png",
        status: "ready",
      };

      render(<MediaView ref={containerRef} media={media} />);

      expect(containerRef.current).toBeInstanceOf(window.HTMLDivElement);
      expect(containerRef.current.className).toContain("group");
    });

    it("bypasses hook execution when core prop is provided directly", () => {
      const mockCore = {
        url: "https://example.com/precomputed.png",
        status: "completed",
        isVideo: false,
        isMediaLoaded: true,
        displayAspect: "16/9",
        prompt: "Precomputed Prompt",
      };

      render(<MediaView core={mockCore} />);

      const img = screen.getByRole("img", { name: "Precomputed Prompt" });
      expect(img.getAttribute("src")).toBe("https://example.com/precomputed.png");
    });
  });

  describe("9. Backward Compatibility", () => {
    it("exports CoreMediaItemView which functions identically to MediaView", () => {
      const media = {
        id: "m-compat",
        url: "https://example.com/compat.png",
        status: "ready",
        name: "Compatible View",
      };

      render(<CoreMediaItemView media={media} />);

      const img = screen.getByRole("img", { name: "Compatible View" });
      expect(img).toBeDefined();
      expect(img.getAttribute("src")).toBe("https://example.com/compat.png");
    });

    it("exports CoreMediaItemPresenter as a standalone presentational primitive", () => {
      render(
        <CoreMediaItemPresenter
          src="https://example.com/presenter.png"
          status="completed"
          isVideo={false}
        />
      );

      const img = screen.getByRole("img");
      expect(img.getAttribute("src")).toBe("https://example.com/presenter.png");
    });
  });

  describe("10. Surface Variant Ownership", () => {
    it("applies canonical card surface tokens (rounded-xxxs, bg-[var(--bg-surface)], border-white/10) only when surface='card'", () => {
      const media = {
        id: "m-surface",
        url: "https://example.com/surface.png",
        status: "ready",
      };

      const defaultRef = React.createRef();
      const { rerender } = render(<MediaView ref={defaultRef} media={media} />);
      expect(defaultRef.current.className).toContain("rounded-xxxs");
      expect(defaultRef.current.className).not.toContain("border-white/10");

      rerender(<MediaView ref={defaultRef} media={media} surface="card" />);
      expect(defaultRef.current.className).toContain("rounded-xxxs");
      expect(defaultRef.current.className).toContain("bg-[var(--bg-surface)]");
      expect(defaultRef.current.className).toContain("border-white/10");
      expect(defaultRef.current.className).toContain("hover:border-white/20");
    });
  });
});
