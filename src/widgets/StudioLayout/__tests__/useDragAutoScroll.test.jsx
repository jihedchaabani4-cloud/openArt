import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useDragAutoScroll, findScrollContainer } from "@/features/studio/useDragAutoScroll";
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";

describe("useDragAutoScroll & Mouse Wheel During Drag", () => {
  let container;

  beforeEach(() => {
    vi.useFakeTimers();

    // Create a mock scrollable container in the DOM
    container = document.createElement("div");
    container.className = "flex-1 overflow-y-auto custom-scrollbar";
    Object.defineProperty(container, "scrollHeight", { value: 2000, configurable: true });
    Object.defineProperty(container, "clientHeight", { value: 600, configurable: true });
    Object.defineProperty(container, "scrollTop", { value: 500, writable: true, configurable: true });
    container.getBoundingClientRect = () => ({
      top: 80,
      bottom: 680,
      left: 0,
      right: 1000,
      width: 1000,
      height: 600,
    });
    document.body.appendChild(container);

    usePromptStore.getState().setIsDraggingGalleryItem(false);
  });

  afterEach(() => {
    act(() => {
      window.dispatchEvent(new Event("dragend", { bubbles: true }));
      usePromptStore.getState().setIsDraggingGalleryItem(false);
    });
    cleanup();
    vi.useRealTimers();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it("finds the active scrollable container", () => {
    const found = findScrollContainer(500, 300);
    expect(found).toBe(container);
  });

  it("scrolls the container when mouse wheel is used while dragging", () => {
    renderHook(() => useDragAutoScroll());

    // 1. Without drag, wheel event is not intercepted
    const initialScroll = container.scrollTop;
    const wheelEventBefore = new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true });
    window.dispatchEvent(wheelEventBefore);
    expect(container.scrollTop).toBe(initialScroll);

    // 2. Start drag via usePromptStore or native dragstart
    act(() => {
      usePromptStore.getState().setIsDraggingGalleryItem(true);
    });

    // 3. Wheel event during drag should scroll container
    const wheelEventDuring = new WheelEvent("wheel", { deltaY: 120, clientX: 500, clientY: 300, bubbles: true, cancelable: true });
    window.dispatchEvent(wheelEventDuring);
    expect(container.scrollTop).toBe(initialScroll + 120);

    // 4. End drag
    act(() => {
      usePromptStore.getState().setIsDraggingGalleryItem(false);
    });

    // 5. Subsequent wheel is ignored
    window.dispatchEvent(new WheelEvent("wheel", { deltaY: 50, bubbles: true, cancelable: true }));
    expect(container.scrollTop).toBe(initialScroll + 120);
  });

  it("auto-scrolls UP when dragging near the top of the container / page", () => {
    renderHook(() => useDragAutoScroll());

    act(() => {
      usePromptStore.getState().setIsDraggingGalleryItem(true);
    });

    // Drag pointer moved to top edge (e.g. clientY = 90, near container top = 80)
    const dragOverTop = new MouseEvent("dragover", { clientX: 500, clientY: 90, bubbles: true });
    window.dispatchEvent(dragOverTop);

    const scrollBefore = container.scrollTop;

    // Advance animation frame timer
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(container.scrollTop).toBeLessThan(scrollBefore);

    // End drag
    act(() => {
      window.dispatchEvent(new Event("dragend", { bubbles: true }));
      usePromptStore.getState().setIsDraggingGalleryItem(false);
    });
  });

  it("auto-scrolls DOWN when dragging near the bottom of the container / page", () => {
    renderHook(() => useDragAutoScroll());

    act(() => {
      usePromptStore.getState().setIsDraggingGalleryItem(true);
    });

    // Drag pointer moved to bottom edge (e.g. clientY = 660, near container bottom = 680)
    const dragOverBottom = new MouseEvent("dragover", { clientX: 500, clientY: 660, bubbles: true });
    window.dispatchEvent(dragOverBottom);

    const scrollBefore = container.scrollTop;

    // Advance animation frame timer
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(container.scrollTop).toBeGreaterThan(scrollBefore);

    // End drag
    act(() => {
      window.dispatchEvent(new Event("dragend", { bubbles: true }));
      usePromptStore.getState().setIsDraggingGalleryItem(false);
    });
  });

  it("stops auto-scrolling immediately when dragend or drop occurs", () => {
    renderHook(() => useDragAutoScroll());

    act(() => {
      usePromptStore.getState().setIsDraggingGalleryItem(true);
    });

    const dragOverBottom = new MouseEvent("dragover", { clientX: 500, clientY: 660, bubbles: true });
    window.dispatchEvent(dragOverBottom);

    act(() => {
      vi.advanceTimersByTime(30);
    });

    const scrollMid = container.scrollTop;

    // Fire dragend
    act(() => {
      window.dispatchEvent(new Event("dragend", { bubbles: true }));
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Scroll should not have changed after dragend
    expect(container.scrollTop).toBe(scrollMid);
  });

  it("scrolls via mouse wheel during pointer drag and stops on pointerup", () => {
    renderHook(() => useDragAutoScroll());

    act(() => {
      usePromptStore.getState().setIsDraggingGalleryItem(true);
    });

    const initialScroll = container.scrollTop;

    // Pointer move in middle of screen (neutral zone, no edge auto-scroll)
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 500, clientY: 300, bubbles: true }));

    // Wheel event during pointer drag
    window.dispatchEvent(new WheelEvent("wheel", { deltaY: -80, clientX: 500, clientY: 300, bubbles: true, cancelable: true }));

    expect(container.scrollTop).toBe(initialScroll - 80);

    // Pointer up ends drag
    act(() => {
      window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
      usePromptStore.getState().setIsDraggingGalleryItem(false);
    });

    // Subsequent wheel does not change scroll
    window.dispatchEvent(new WheelEvent("wheel", { deltaY: 50, bubbles: true, cancelable: true }));
    expect(container.scrollTop).toBe(initialScroll - 80);
  });
});
