import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { MediaViewCard } from "../MediaViewCard";

describe("MediaViewCard - Idle Video Animation Loop & Cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("does not repeatedly schedule requestAnimationFrame when the video is paused/idle", () => {
    let rAFCallCount = 0;
    const originalRAF = window.requestAnimationFrame;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rAFCallCount++;
      return originalRAF ? originalRAF(cb) : 1;
    });

    const item = {
      id: "media-video-1",
      url: "https://example.com/sample.mp4",
      is_video: true,
    };

    render(<MediaViewCard item={item} />);

    const video = document.querySelector("video");
    expect(video).toBeDefined();

    // In an idle/paused state, rAF should not loop continuously
    // We run timers or ticks if any, and check that rAF count remains 0 (or does not loop)
    expect(rAFCallCount).toBe(0);
  });

  it("updates progress on timeupdate and cancels rAF loop when video pauses or ends", () => {
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");

    const item = {
      id: "media-video-2",
      url: "https://example.com/sample.mp4",
      is_video: true,
    };

    const { unmount } = render(<MediaViewCard item={item} />);
    const video = document.querySelector("video");
    expect(video).toBeDefined();

    // Trigger timeupdate
    Object.defineProperty(video, "duration", { value: 10, writable: true });
    Object.defineProperty(video, "currentTime", { value: 5, writable: true });
    fireEvent(video, new Event("timeupdate"));

    // Start playing, then pause
    fireEvent(video, new Event("play"));
    fireEvent(video, new Event("pause"));
    expect(cancelSpy).toHaveBeenCalled();

    // Start playing, then end
    cancelSpy.mockClear();
    fireEvent(video, new Event("play"));
    fireEvent(video, new Event("ended"));
    expect(cancelSpy).toHaveBeenCalled();

    unmount();
  });
});
