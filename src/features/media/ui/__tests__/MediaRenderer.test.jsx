import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MediaRenderer } from "../MediaRenderer";

describe("MediaRenderer - Pure Presentational Primitive", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders an <img> when item kind is 'image'", () => {
    const item = {
      id: "img-1",
      kind: "image",
      url: "https://example.com/photo.png",
      name: "Mountain Peak",
      status: "ready",
    };

    render(<MediaRenderer item={item} />);

    const img = screen.getByRole("img", { name: "Mountain Peak" });
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("https://example.com/photo.png");
  });

  it("renders a <video> when item kind is 'video'", () => {
    const item = {
      id: "vid-1",
      kind: "video",
      url: "https://example.com/clip.mp4",
      thumbUrl: "https://example.com/clip-thumb.png",
      name: "Short Film",
      status: "ready",
    };

    const { container } = render(<MediaRenderer item={item} />);

    const video = container.querySelector("video");
    expect(video).toBeDefined();
    expect(video.getAttribute("src")).toBe("https://example.com/clip.mp4");
    expect(video.getAttribute("poster")).toBe("https://example.com/clip-thumb.png");
  });

  it("calculates aspect ratio style from item width and height", () => {
    const item = {
      id: "img-ar",
      kind: "image",
      url: "https://example.com/photo.png",
      width: 1920,
      height: 1080,
      status: "ready",
    };

    const { container } = render(<MediaRenderer item={item} />);
    const root = container.firstChild;
    expect(root.style.aspectRatio).toBe("1920 / 1080");
  });

  it("explicit aspectRatio prop overrides item dimensions", () => {
    const item = {
      id: "img-ar",
      kind: "image",
      url: "https://example.com/photo.png",
      width: 1920,
      height: 1080,
      status: "ready",
    };

    const { container } = render(<MediaRenderer item={item} aspectRatio="1/1" />);
    const root = container.firstChild;
    expect(root.style.aspectRatio).toBe("1 / 1");
  });

  it("renders processing state when status is 'processing' and url is absent", () => {
    const item = {
      id: "proc-1",
      kind: "image",
      url: null,
      status: "processing",
    };

    render(<MediaRenderer item={item} />);

    const statusEl = screen.getByRole("status");
    expect(statusEl).toBeDefined();
    expect(statusEl.textContent).toContain("Processing");
  });

  it("renders failed error state when status is 'failed'", () => {
    const item = {
      id: "fail-1",
      kind: "image",
      url: null,
      status: "failed",
      error: "Generation timed out",
    };

    render(<MediaRenderer item={item} />);

    const alertEl = screen.getByRole("alert");
    expect(alertEl).toBeDefined();
    expect(alertEl.textContent).toContain("Generation timed out");
  });

  it("renders empty placeholder when item has no URL and status is ready", () => {
    const item = {
      id: "empty-1",
      kind: "image",
      url: null,
      status: "ready",
    };

    render(<MediaRenderer item={item} />);

    expect(screen.getByText("No media available")).toBeDefined();
  });
});
