import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { EditMediaView } from "../EditMediaView";

// Mock MediaView to render children and slots without heavy sub-components
vi.mock("@/features/media", () => ({
  MediaView: ({ bottom }) => (
    <div data-testid="core-media-view">
      {bottom}
    </div>
  ),
}));

// Mock useMediaViewerCore
vi.mock("@/features/workflows/core/useMediaViewerCore", () => ({
  useMediaViewerCore: () => ({
    isCompleted: true,
    isVideo: true,
    isPlaying: false,
    togglePlay: vi.fn(),
    isMuted: false,
    toggleMute: vi.fn(),
    progressPercent: 25,
    seek: vi.fn(),
    currentTime: "0:05",
    duration: "0:20",
    toggleFullscreen: vi.fn(),
  }),
}));

describe("EditMediaView - Pointer Event Cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("removes window pointermove and pointerup listeners on unmount if seeking was in progress", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const addSpy = vi.spyOn(window, "addEventListener");

    const workflow = { id: "wf-1", items: [{ id: "m-1", url: "https://example.com/test.mp4" }] };
    const { unmount } = render(<EditMediaView workflow={workflow} />);

    // Find scrubber track
    const track = document.querySelector(".group\\/track");
    expect(track).toBeDefined();

    // Start dragging
    fireEvent.pointerDown(track, { clientX: 100 });

    expect(addSpy).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("pointerup", expect.any(Function));

    // Unmount before pointerUp occurs
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("pointerup", expect.any(Function));
  });
});
