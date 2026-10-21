/**
 * [FSD Layer: components/cinema-studio/common]
 * Tests for VideoEditCard and the Skiper91 video player.
 *
 * Uses only native Vitest/Chai matchers (no jest-dom setup file).
 */

import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { VideoEditCard } from "./VideoEditCard";

// Minimal HTMLVideoElement stub for jsdom
function stubVideoElement() {
  Object.defineProperty(window.HTMLVideoElement.prototype, "play", {
    configurable: true,
    writable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(window.HTMLVideoElement.prototype, "pause", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
  Object.defineProperty(window.HTMLVideoElement.prototype, "duration", {
    configurable: true,
    get: () => 60,
  });
}

beforeAll(() => {
  stubVideoElement();
});

afterEach(() => {
  cleanup();
});

const DEFAULT_PROPS = {
  title: "Scene 01 – Hero Walk",
  src: "https://example.com/signed/video.mp4",
  onExport: vi.fn(),
  onRegenerate: vi.fn(),
};

describe("VideoEditCard", () => {
  it("renders the video title", () => {
    render(<VideoEditCard {...DEFAULT_PROPS} />);
    expect(screen.getByText("Scene 01 – Hero Walk")).toBeTruthy();
  });

  it("renders Export and Re-generate buttons", () => {
    render(<VideoEditCard {...DEFAULT_PROPS} />);
    expect(screen.getByTestId("video-edit-card-export")).toBeTruthy();
    expect(screen.getByTestId("video-edit-card-regenerate")).toBeTruthy();
  });

  it("calls onExport when Export button is clicked", () => {
    const onExport = vi.fn();
    render(<VideoEditCard {...DEFAULT_PROPS} onExport={onExport} />);
    fireEvent.click(screen.getByTestId("video-edit-card-export"));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("calls onRegenerate when Re-generate button is clicked", () => {
    const onRegenerate = vi.fn();
    render(<VideoEditCard {...DEFAULT_PROPS} onRegenerate={onRegenerate} />);
    fireEvent.click(screen.getByTestId("video-edit-card-regenerate"));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it("renders a video element with the provided src", () => {
    render(<VideoEditCard {...DEFAULT_PROPS} />);
    const video = document.querySelector("video");
    expect(video).toBeTruthy();
    expect(video.src).toContain("video.mp4");
  });

  it("renders a placeholder when src is null", () => {
    render(<VideoEditCard {...DEFAULT_PROPS} src={null} />);
    expect(screen.getByText("Scene 01 – Hero Walk")).toBeTruthy();
    expect(document.querySelector("video")).toBeNull();
  });

  it("does not render action buttons if callbacks are omitted", () => {
    render(<VideoEditCard title="T" src="http://x.com/v.mp4" />);
    expect(screen.queryByTestId("video-edit-card-export")).toBeNull();
    expect(screen.queryByTestId("video-edit-card-regenerate")).toBeNull();
  });
});
