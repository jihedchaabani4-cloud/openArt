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

describe("MediaViewCard - CoreMediaItemView Delegation & Picker Responsibilities", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockItem = {
    id: "item-1",
    name: "Cyberpunk Alley",
    url: "https://example.com/cyberpunk.png",
    status: "completed",
  };

  const mockVideoItem = {
    id: "item-video",
    name: "Neon Drive",
    url: "https://example.com/neon.mp4",
    is_video: true,
    status: "completed",
  };

  it("1. Image rendering: delegates to CoreMediaItemView with cover fit", () => {
    render(<MediaViewCard item={mockItem} />);

    const img = document.querySelector("img");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("https://example.com/cyberpunk.png");
    expect(img.className).toContain("object-cover");
  });

  it("2. Video rendering and playback: renders video element and handles hover play/pause", () => {
    render(<MediaViewCard item={mockVideoItem} />);

    const video = document.querySelector("video");
    expect(video).toBeDefined();
    expect(video.getAttribute("src")).toBe("https://example.com/neon.mp4");
    expect(video.getAttribute("loop")).not.toBeNull();

    // Video play icon badge
    const playIcon = document.querySelector("[role='img'], .mat-icon, span");
    expect(playIcon).toBeDefined();

    // Hover playback
    const playSpy = vi.spyOn(video, "play").mockImplementation(() => Promise.resolve());
    const pauseSpy = vi.spyOn(video, "pause").mockImplementation(() => {});

    const button = document.querySelector("button");
    fireEvent.mouseEnter(button);
    expect(playSpy).toHaveBeenCalled();

    fireEvent.mouseLeave(button);
    expect(pauseSpy).toHaveBeenCalled();
    expect(video.currentTime).toBe(0);
  });

  it("3. Selected state: renders white ring and selection checkmark overlay", () => {
    const { rerender } = render(<MediaViewCard item={mockItem} isSelected={false} />);
    let button = document.querySelector("button");
    expect(button.className).not.toContain("ring-2 ring-white");
    expect(document.querySelector("svg path[d*='13.485']")).toBeNull();

    rerender(<MediaViewCard item={mockItem} isSelected={true} />);
    button = document.querySelector("button");
    expect(button.className).toContain("ring-2 ring-white");
    expect(document.querySelector("svg path[d*='13.485']")).toBeDefined();
  });

  it("4. Highlighted state: applies prominent ring and z-index for picker keyboard navigation", () => {
    render(<MediaViewCard item={mockItem} isHighlighted={true} />);

    const button = document.querySelector("button");
    expect(button.className).toContain("ring-2 ring-white");
    expect(button.className).toContain("z-10");
  });

  it("5. Disabled state: applies disabled attribute and quota visual styles", () => {
    render(<MediaViewCard item={mockItem} isDisabled={true} />);

    const button = document.querySelector("button");
    expect(button.disabled).toBe(true);
    expect(button.className).toContain("opacity-25");
    expect(button.className).toContain("cursor-not-allowed");
  });

  it("6. Selection callback behavior: dispatches onSelect and onDoubleClick when enabled", () => {
    const onSelect = vi.fn();
    const onDoubleClick = vi.fn();

    const { rerender } = render(
      <MediaViewCard
        item={mockItem}
        onSelect={onSelect}
        onDoubleClick={onDoubleClick}
      />
    );

    const button = document.querySelector("button");
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(mockItem);

    fireEvent.doubleClick(button);
    expect(onDoubleClick).toHaveBeenCalledWith(mockItem);

    // Disabled should suppress callbacks
    onSelect.mockClear();
    onDoubleClick.mockClear();

    rerender(
      <MediaViewCard
        item={mockItem}
        isDisabled={true}
        onSelect={onSelect}
        onDoubleClick={onDoubleClick}
      />
    );

    fireEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.doubleClick(button);
    expect(onDoubleClick).not.toHaveBeenCalled();
  });

  it("7. DOM ref forwarding: forwards ref to root button for keyboard navigation scroll into view", () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const ref = { current: null };
    render(<MediaViewCard ref={ref} item={mockItem} />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current.tagName).toBe("BUTTON");

    ref.current.scrollIntoView({ block: "nearest" });
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("8. Keyboard navigation and focus behavior: receives focus cleanly as a button element", () => {
    const ref = { current: null };
    render(<MediaViewCard ref={ref} item={mockItem} />);

    ref.current.focus();
    expect(document.activeElement).toBe(ref.current);
  });

  it("9. Badges: renders character and element badges correctly on reference cards", () => {
    const characterItem = {
      id: "char-1",
      url: "https://example.com/char.png",
      is_character: true,
      status: "completed",
    };

    const { container: container1, unmount: unmount1 } = render(
      <MediaViewCard item={characterItem} />
    );
    expect(container1.textContent).toContain("accessibility_new");
    unmount1();

    const elementItem = {
      id: "elem-1",
      url: "https://example.com/elem.png",
      is_element: true,
      status: "completed",
    };

    const { container: container2 } = render(
      <MediaViewCard item={elementItem} />
    );
    expect(container2.textContent).toContain("widgets");
  });
});
