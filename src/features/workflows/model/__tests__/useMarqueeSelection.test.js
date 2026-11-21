import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";

const { mockScrollContainerBy } = vi.hoisted(() => ({
  mockScrollContainerBy: vi.fn((container, deltaY, deltaX = 0) => {
    if (!container) return;
    container.scrollTop += deltaY;
    if (deltaX) container.scrollLeft += deltaX;
  }),
}));

vi.mock("@/features/studio/model/useDragAutoScroll", () => ({
  scrollContainerBy: (...args) => mockScrollContainerBy(...args),
}));

import { useStudioSelectionStore } from "../useStudioSelectionStore";
import {
  useMarqueeSelection,
  rectsIntersect,
  computeMarqueeSelection,
} from "../useMarqueeSelection";

function dispatchPointer(target, type, init = {}) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: init.button ?? 0,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
    shiftKey: Boolean(init.shiftKey),
    ctrlKey: Boolean(init.ctrlKey),
    metaKey: Boolean(init.metaKey),
  });
  Object.defineProperty(event, "pointerType", {
    value: init.pointerType ?? "mouse",
    configurable: true,
  });
  target.dispatchEvent(event);
  return event;
}

function makeRect(left, top, width, height) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}

function setupGridDOM({
  scRect = makeRect(100, 60, 800, 500),
  scrollHeight = 1500,
  clientHeight = 500,
  cards = [],
} = {}) {
  const scrollContainer = document.createElement("div");
  scrollContainer.setAttribute("data-scroll-container", "true");
  scrollContainer.getBoundingClientRect = () => scRect;
  Object.defineProperty(scrollContainer, "scrollHeight", { value: scrollHeight, configurable: true });
  Object.defineProperty(scrollContainer, "clientHeight", { value: clientHeight, configurable: true });
  Object.defineProperty(scrollContainer, "clientWidth", { value: scRect.width, configurable: true });
  Object.defineProperty(scrollContainer, "offsetWidth", { value: scRect.width, configurable: true });
  scrollContainer.scrollTop = 0;
  scrollContainer.scrollLeft = 0;

  const gridContainer = document.createElement("div");
  scrollContainer.appendChild(gridContainer);

  const cardElements = cards.map((card) => {
    const el = document.createElement("div");
    el.setAttribute("data-selection-key", card.key);
    if (card.draggable) {
      el.setAttribute("data-draggable-card", "true");
    }
    el.getBoundingClientRect = () =>
      typeof card.getRect === "function" ? card.getRect(scrollContainer) : card.rect;
    gridContainer.appendChild(el);
    return el;
  });

  document.body.appendChild(scrollContainer);

  return {
    scrollContainer,
    gridContainer,
    cardElements,
    cleanup: () => {
      scrollContainer.remove();
    },
  };
}

describe("useStudioSelectionStore.setSelectedKeys", () => {
  beforeEach(() => {
    useStudioSelectionStore.setState({
      scopeKey: "assets:proj-1",
      selectedKeys: [],
      lastSelectedKey: null,
    });
  });

  it("deduplicates non-empty string keys, preserves lastSelectedKey, and no-ops when shallow-equal", () => {
    useStudioSelectionStore.getState().toggleItem("workflow:w1");
    expect(useStudioSelectionStore.getState().lastSelectedKey).toBe("workflow:w1");

    const listener = vi.fn();
    const unsub = useStudioSelectionStore.subscribe(listener);

    // Live update with duplicates & invalid values
    useStudioSelectionStore
      .getState()
      .setSelectedKeys(["workflow:w1", "workflow:w2", "workflow:w1", "", null, undefined, 42]);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:w1", "workflow:w2"]);
    expect(useStudioSelectionStore.getState().lastSelectedKey).toBe("workflow:w1");

    // Shallow-equal call -> NO state update
    useStudioSelectionStore.getState().setSelectedKeys(["workflow:w1", "workflow:w2"]);
    expect(listener).toHaveBeenCalledTimes(1);

    // Clearing via empty array resets lastSelectedKey to null
    useStudioSelectionStore.getState().setSelectedKeys([]);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);
    expect(useStudioSelectionStore.getState().lastSelectedKey).toBeNull();

    // Clearing again -> no-op
    useStudioSelectionStore.getState().setSelectedKeys([]);
    expect(listener).toHaveBeenCalledTimes(2);

    unsub();
  });
});

describe("Marquee pure helpers", () => {
  it("rectsIntersect handles overlap, containment, touching edges, 1D drag lines, and zero-area points", () => {
    const card = makeRect(100, 100, 100, 100); // 100..200 x 100..200

    expect(rectsIntersect(makeRect(150, 150, 100, 100), card)).toBe(true);
    expect(rectsIntersect(makeRect(120, 120, 20, 20), card)).toBe(true);
    expect(rectsIntersect(makeRect(50, 50, 200, 200), card)).toBe(true);
    expect(rectsIntersect(makeRect(250, 100, 50, 50), card)).toBe(false);
    // Touching edges do not intersect
    expect(rectsIntersect(makeRect(200, 100, 50, 50), card)).toBe(false);
    expect(rectsIntersect(makeRect(100, 200, 50, 50), card)).toBe(false);
    // Straight horizontal drag line across card
    expect(rectsIntersect(makeRect(80, 150, 150, 0), card)).toBe(true);
    // Zero-area point
    expect(rectsIntersect(makeRect(150, 150, 0, 0), card)).toBe(false);
    expect(rectsIntersect(null, card)).toBe(false);
  });

  it("computeMarqueeSelection supports replace, add, and toggle (XOR) modes", () => {
    const base = ["workflow:a", "workflow:b"];
    const hits = ["workflow:b", "workflow:c", "workflow:b"];

    expect(computeMarqueeSelection(base, hits, "replace")).toEqual(["workflow:b", "workflow:c"]);
    expect(computeMarqueeSelection(base, hits, "add")).toEqual([
      "workflow:a",
      "workflow:b",
      "workflow:c",
    ]);
    expect(computeMarqueeSelection(base, hits, "toggle")).toEqual(["workflow:a", "workflow:c"]);
    expect(computeMarqueeSelection(base, [], "replace")).toEqual([]);
    expect(computeMarqueeSelection(base, [], "add")).toEqual(["workflow:a", "workflow:b"]);
    expect(computeMarqueeSelection(base, [], "toggle")).toEqual(["workflow:a", "workflow:b"]);
  });
});

describe("useMarqueeSelection hook", () => {
  let dom;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.userSelect = "";
    useStudioSelectionStore.setState({
      scopeKey: "assets:proj-1",
      selectedKeys: [],
      lastSelectedKey: null,
    });
  });

  afterEach(() => {
    cleanup();
    if (dom) {
      dom.cleanup();
      dom = null;
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("activates after 5px threshold, selects intersected items, clamps rect, updates box ref without re-rendering on move, and restores userSelect", () => {
    dom = setupGridDOM({
      scRect: makeRect(100, 60, 800, 500),
      cards: [
        { key: "workflow:w1", rect: makeRect(120, 100, 150, 120) },
        { key: "workflow:w2", rect: makeRect(300, 100, 150, 120) },
        { key: "workflow:w3", rect: makeRect(500, 100, 150, 120) },
      ],
    });

    const containerRef = { current: dom.gridContainer };
    const setSelectedKeys = vi.fn((keys) => useStudioSelectionStore.getState().setSelectedKeys(keys));
    const boxEl = document.createElement("div");
    let renderCount = 0;

    const { result, rerender } = renderHook(
      ({ isSelectionMode }) => {
        renderCount += 1;
        return useMarqueeSelection({
          containerRef,
          enabled: true,
          isSelectionMode,
          setSelectedKeys,
        });
      },
      { initialProps: { isSelectionMode: false } }
    );

    expect(result.current.isMarqueeActive).toBe(false);
    expect(result.current.marqueeRectRef.current).toBeNull();

    // Pointer down in empty space
    act(() => {
      dispatchPointer(dom.scrollContainer, "pointerdown", { clientX: 110, clientY: 90 });
    });

    // Move < 5px -> still inactive
    act(() => {
      dispatchPointer(window, "pointermove", { clientX: 113, clientY: 92 });
    });
    expect(result.current.isMarqueeActive).toBe(false);
    expect(result.current.marqueeRectRef.current).toBeNull();
    expect(setSelectedKeys).not.toHaveBeenCalled();
    expect(document.body.style.userSelect).toBe("");

    // Move >= 5px intersecting w1 and w2
    act(() => {
      dispatchPointer(window, "pointermove", { clientX: 350, clientY: 160 });
    });
    expect(document.body.style.userSelect).toBe("none");
    expect(result.current.isMarqueeActive).toBe(true);
    expect(result.current.marqueeRectRef.current).toEqual({
      left: 110,
      top: 90,
      width: 240,
      height: 70,
    });
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:w1", "workflow:w2"]);

    // Attach marqueeBoxRef (simulating mount on isMarqueeActive === true)
    result.current.marqueeBoxRef(boxEl);
    expect(boxEl.style.left).toBe("110px");
    expect(boxEl.style.top).toBe("90px");
    expect(boxEl.style.width).toBe("240px");
    expect(boxEl.style.height).toBe("70px");

    // Flipping isSelectionMode false -> true mid-drag MUST NOT cancel the active drag
    rerender({ isSelectionMode: true });
    expect(result.current.isMarqueeActive).toBe(true);

    const rendersBeforeMove = renderCount;
    // Drag outside scrollContainer bounds (left of 100, above 60) -> clamped to scRect, zero React re-renders!
    act(() => {
      dispatchPointer(window, "pointermove", { clientX: 20, clientY: 10 });
    });
    expect(renderCount).toBe(rendersBeforeMove);
    expect(result.current.marqueeRectRef.current).toEqual({
      left: 100,
      top: 60,
      width: 10,
      height: 30,
    });
    expect(boxEl.style.left).toBe("100px");
    expect(boxEl.style.top).toBe("60px");
    expect(boxEl.style.width).toBe("10px");
    expect(boxEl.style.height).toBe("30px");

    // Pointer up -> restores userSelect and clears marquee state
    act(() => {
      dispatchPointer(window, "pointerup", { clientX: 20, clientY: 10 });
    });
    expect(result.current.isMarqueeActive).toBe(false);
    expect(result.current.marqueeRectRef.current).toBeNull();
    expect(document.body.style.userSelect).toBe("");
  });

  it("yields to [data-draggable-card=\"true\"] in both normal and selection mode, and activates on non-draggable cards", () => {
    dom = setupGridDOM({
      cards: [
        { key: "workflow:drag", rect: makeRect(120, 100, 150, 120), draggable: true },
        { key: "workflow:nodrag", rect: makeRect(300, 100, 150, 120), draggable: false },
      ],
    });
    const [dragCard, nonDragCard] = dom.cardElements;
    const containerRef = { current: dom.gridContainer };
    const setSelectedKeys = vi.fn();

    const { result, rerender } = renderHook(
      ({ isSelectionMode }) =>
        useMarqueeSelection({
          containerRef,
          enabled: true,
          isSelectionMode,
          setSelectedKeys,
        }),
      { initialProps: { isSelectionMode: false } }
    );

    // 1. Not in selection mode + draggable card -> yield to single Drag-to-Folder
    act(() => {
      dispatchPointer(dragCard, "pointerdown", { clientX: 150, clientY: 140 });
      dispatchPointer(window, "pointermove", { clientX: 320, clientY: 180 });
    });
    expect(result.current.isMarqueeActive).toBe(false);
    expect(setSelectedKeys).not.toHaveBeenCalled();

    // 2. Not in selection mode + non-draggable card (e.g. Elements/Characters/Trash) -> activates!
    act(() => {
      dispatchPointer(nonDragCard, "pointerdown", { clientX: 320, clientY: 140 });
      dispatchPointer(window, "pointermove", { clientX: 360, clientY: 180 });
    });
    expect(result.current.isMarqueeActive).toBe(true);
    expect(setSelectedKeys).toHaveBeenCalledWith(["workflow:nodrag"]);
    act(() => {
      dispatchPointer(window, "pointerup", { clientX: 360, clientY: 180 });
    });

    // 3. In selection mode: selected draggable card yields to multi-drag; unselected dimmed card (no data-draggable-card) starts marquee!
    setSelectedKeys.mockClear();
    rerender({ isSelectionMode: true });
    act(() => {
      dispatchPointer(dragCard, "pointerdown", { clientX: 150, clientY: 140 });
      dispatchPointer(window, "pointermove", { clientX: 350, clientY: 180 });
    });
    expect(result.current.isMarqueeActive).toBe(false);
    expect(setSelectedKeys).not.toHaveBeenCalled();

    act(() => {
      dispatchPointer(nonDragCard, "pointerdown", { clientX: 320, clientY: 140 });
      dispatchPointer(window, "pointermove", { clientX: 140, clientY: 180 });
    });
    expect(result.current.isMarqueeActive).toBe(true);
    expect(setSelectedKeys).toHaveBeenCalledWith(["workflow:drag", "workflow:nodrag"]);
    act(() => {
      dispatchPointer(window, "pointerup", { clientX: 140, clientY: 180 });
    });
  });

  it("ignores non-primary button, touch pointer, disabled hook, and interactive targets", () => {
    dom = setupGridDOM({
      cards: [{ key: "workflow:w1", rect: makeRect(120, 100, 150, 120) }],
    });

    const btn = document.createElement("button");
    const selectionBar = document.createElement("div");
    selectionBar.setAttribute("data-selection-bar", "true");
    const barChild = document.createElement("span");
    selectionBar.appendChild(barChild);
    const preventDrag = document.createElement("div");
    preventDrag.setAttribute("data-prevent-drag", "true");

    dom.gridContainer.appendChild(btn);
    dom.gridContainer.appendChild(selectionBar);
    dom.gridContainer.appendChild(preventDrag);

    const containerRef = { current: dom.gridContainer };
    const setSelectedKeys = vi.fn();

    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useMarqueeSelection({
          containerRef,
          enabled,
          isSelectionMode: false,
          setSelectedKeys,
        }),
      { initialProps: { enabled: true } }
    );

    const attemptDrag = (target, init = {}) => {
      act(() => {
        dispatchPointer(target, "pointerdown", { clientX: 110, clientY: 90, ...init });
        dispatchPointer(window, "pointermove", { clientX: 220, clientY: 180, ...init });
        dispatchPointer(window, "pointerup", { clientX: 220, clientY: 180, ...init });
      });
    };

    attemptDrag(dom.scrollContainer, { button: 2 });
    attemptDrag(dom.scrollContainer, { pointerType: "touch" });
    attemptDrag(btn);
    attemptDrag(barChild);
    attemptDrag(preventDrag);

    expect(result.current.isMarqueeActive).toBe(false);
    expect(setSelectedKeys).not.toHaveBeenCalled();

    // Disabled hook ignores primary mouse drag too
    rerender({ enabled: false });
    attemptDrag(dom.scrollContainer);
    expect(setSelectedKeys).not.toHaveBeenCalled();
  });

  it("supports Shift (add) and Ctrl/Meta (toggle XOR) modifiers against captured baseKeys", () => {
    dom = setupGridDOM({
      cards: [
        { key: "workflow:w1", rect: makeRect(120, 100, 100, 100) },
        { key: "workflow:w2", rect: makeRect(250, 100, 100, 100) },
        { key: "workflow:w3", rect: makeRect(380, 100, 100, 100) },
      ],
    });
    const containerRef = { current: dom.gridContainer };
    const setSelectedKeys = vi.fn((keys) => useStudioSelectionStore.getState().setSelectedKeys(keys));

    useStudioSelectionStore.getState().setSelectedKeys(["workflow:w1", "workflow:w2"]);

    renderHook(() =>
      useMarqueeSelection({
        containerRef,
        enabled: true,
        isSelectionMode: true,
        setSelectedKeys,
      })
    );

    // Shift-drag over w2 & w3 -> union ["w1", "w2", "w3"]
    act(() => {
      dispatchPointer(dom.scrollContainer, "pointerdown", {
        clientX: 240,
        clientY: 90,
        shiftKey: true,
      });
      dispatchPointer(window, "pointermove", { clientX: 420, clientY: 160, shiftKey: true });
      dispatchPointer(window, "pointerup", { clientX: 420, clientY: 160 });
    });
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "workflow:w1",
      "workflow:w2",
      "workflow:w3",
    ]);

    // Ctrl-drag over w2 -> XOR removes w2, keeps w1 & w3
    act(() => {
      dispatchPointer(dom.scrollContainer, "pointerdown", {
        clientX: 240,
        clientY: 90,
        ctrlKey: true,
      });
      dispatchPointer(window, "pointermove", { clientX: 300, clientY: 160, ctrlKey: true });
      dispatchPointer(window, "pointerup", { clientX: 300, clientY: 160 });
    });
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:w1", "workflow:w3"]);
  });

  it("anchors marquee in content-space across scroll and runs edge auto-scroll via scrollContainerBy", () => {
    const rafQueue = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    dom = setupGridDOM({
      scRect: makeRect(100, 60, 800, 500), // bottom = 560
      scrollHeight: 1500,
      clientHeight: 500,
      cards: [
        {
          key: "workflow:top",
          getRect: (sc) => makeRect(120, 100 - sc.scrollTop, 150, 100),
        },
        {
          key: "workflow:below",
          getRect: (sc) => makeRect(120, 620 - sc.scrollTop, 150, 100),
        },
      ],
    });
    const containerRef = { current: dom.gridContainer };
    const setSelectedKeys = vi.fn((keys) => useStudioSelectionStore.getState().setSelectedKeys(keys));

    const { result } = renderHook(() =>
      useMarqueeSelection({
        containerRef,
        enabled: true,
        isSelectionMode: false,
        setSelectedKeys,
      })
    );

    // Start near top card, drag into bottom 40px edge zone (bottom=560, clientY=550)
    act(() => {
      dispatchPointer(dom.scrollContainer, "pointerdown", { clientX: 110, clientY: 110 });
      dispatchPointer(window, "pointermove", { clientX: 200, clientY: 550 });
    });

    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:top"]);
    expect(rafQueue.length).toBeGreaterThan(0);

    // Run rAF edge auto-scroll ticks until workflow:below enters viewport (needs ~70px scroll)
    act(() => {
      for (let i = 0; i < 6 && rafQueue.length > 0; i++) {
        const cb = rafQueue.shift();
        cb(i * 16);
      }
    });

    expect(mockScrollContainerBy).toHaveBeenCalled();
    // Verify vertical scroll (deltaY > 0, deltaX === 0)
    const firstCall = mockScrollContainerBy.mock.calls[0];
    expect(firstCall[0]).toBe(dom.scrollContainer);
    expect(firstCall[1]).toBeGreaterThan(0);
    expect(firstCall[2]).toBe(0);

    // Both top card (now scrolled higher in content) and newly revealed bottom card are selected!
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([
      "workflow:top",
      "workflow:below",
    ]);
    // Visual marqueeRect remains clamped inside scrollContainer top (>= 60)
    expect(result.current.marqueeRectRef.current.top).toBeGreaterThanOrEqual(60);

    act(() => {
      dispatchPointer(window, "pointerup", { clientX: 200, clientY: 550 });
    });
    expect(result.current.isMarqueeActive).toBe(false);
    expect(result.current.marqueeRectRef.current).toBeNull();
  });

  it("suppresses the trailing capture-phase click after an active marquee drag, then cleans up", () => {
    vi.useFakeTimers();
    dom = setupGridDOM({
      cards: [{ key: "workflow:w1", rect: makeRect(120, 100, 150, 120) }],
    });
    const [cardEl] = dom.cardElements;
    const onCardClick = vi.fn();
    cardEl.addEventListener("click", onCardClick);

    const containerRef = { current: dom.gridContainer };
    const setSelectedKeys = vi.fn();

    renderHook(() =>
      useMarqueeSelection({
        containerRef,
        enabled: true,
        isSelectionMode: false,
        setSelectedKeys,
      })
    );

    // Active drag ending over card
    act(() => {
      dispatchPointer(dom.scrollContainer, "pointerdown", { clientX: 110, clientY: 90 });
      dispatchPointer(window, "pointermove", { clientX: 200, clientY: 160 });
      dispatchPointer(window, "pointerup", { clientX: 200, clientY: 160 });
    });

    // Immediate trailing click is suppressed before reaching card
    cardEl.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(onCardClick).not.toHaveBeenCalled();

    // Subsequent click works normally
    vi.runAllTimers();
    cardEl.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(onCardClick).toHaveBeenCalledTimes(1);

    // Sub-threshold drag (< 5px) does NOT suppress click
    act(() => {
      dispatchPointer(dom.scrollContainer, "pointerdown", { clientX: 130, clientY: 110 });
      dispatchPointer(window, "pointermove", { clientX: 132, clientY: 111 });
      dispatchPointer(window, "pointerup", { clientX: 132, clientY: 111 });
    });
    cardEl.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(onCardClick).toHaveBeenCalledTimes(2);
  });

  it("cleans up state and userSelect on blur, pointercancel, and unmount", () => {
    dom = setupGridDOM({
      cards: [{ key: "workflow:w1", rect: makeRect(120, 100, 150, 120) }],
    });
    const containerRef = { current: dom.gridContainer };
    const setSelectedKeys = vi.fn();

    const { result, unmount } = renderHook(() =>
      useMarqueeSelection({
        containerRef,
        enabled: true,
        isSelectionMode: false,
        setSelectedKeys,
      })
    );

    // Blur mid-drag
    act(() => {
      dispatchPointer(dom.scrollContainer, "pointerdown", { clientX: 110, clientY: 90 });
      dispatchPointer(window, "pointermove", { clientX: 200, clientY: 160 });
    });
    expect(result.current.isMarqueeActive).toBe(true);
    expect(document.body.style.userSelect).toBe("none");

    act(() => {
      window.dispatchEvent(new Event("blur"));
    });
    expect(result.current.isMarqueeActive).toBe(false);
    expect(document.body.style.userSelect).toBe("");

    // pointercancel mid-drag
    act(() => {
      dispatchPointer(dom.scrollContainer, "pointerdown", { clientX: 110, clientY: 90 });
      dispatchPointer(window, "pointermove", { clientX: 200, clientY: 160 });
    });
    expect(result.current.isMarqueeActive).toBe(true);

    act(() => {
      dispatchPointer(window, "pointercancel", { clientX: 200, clientY: 160 });
    });
    expect(result.current.isMarqueeActive).toBe(false);
    expect(document.body.style.userSelect).toBe("");

    // Unmount mid-drag
    act(() => {
      dispatchPointer(dom.scrollContainer, "pointerdown", { clientX: 110, clientY: 90 });
      dispatchPointer(window, "pointermove", { clientX: 200, clientY: 160 });
    });
    expect(document.body.style.userSelect).toBe("none");

    unmount();
    expect(document.body.style.userSelect).toBe("");
  });
});
