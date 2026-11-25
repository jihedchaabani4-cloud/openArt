import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ProcessingCard } from "../ProcessingCard";
import { MediaView } from "../MediaView";
import { MediaRenderer } from "../MediaRenderer";

describe("ProcessingCard & MediaView processing wiring", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders volumetric wave + orbiting dark core layers with spinning corner loader and zero skeletons or legacy border classes", () => {
    const { container } = render(<ProcessingCard progress={23} />);

    const card = container.querySelector('[data-slot="processing-card"]');
    expect(card).not.toBeNull();
    expect(card.className).toContain("bg-omni-bg");
    expect(card.className).toContain("border-border-subtle");
    expect(card.className).not.toContain("border-qc-");
    expect(container.querySelector(".ds-proc-dither")).not.toBeNull();

    const stage = container.querySelector('[data-slot="processing-wave-stage"]');
    expect(stage).not.toBeNull();
    expect(stage.className).toContain("ds-proc-stage");
    expect(stage.querySelector(".ds-proc-wave-a")).not.toBeNull();
    expect(stage.querySelector(".ds-proc-wave-b")).not.toBeNull();
    expect(stage.querySelector(".ds-proc-glow-c")).not.toBeNull();
    expect(stage.querySelector(".ds-proc-orb-core")).not.toBeNull();

    const topHud = container.querySelector('[data-slot="processing-top-hud"]');
    expect(topHud).not.toBeNull();
    expect(topHud.className).toContain("inset-x-3");
    expect(topHud.className).toContain("justify-between");

    const spinner = container.querySelector('[data-slot="processing-spinner"]');
    expect(spinner).not.toBeNull();
    expect(spinner.getAttribute("data-icon-name")).toBe("loading-03");
    expect(spinner.className).toContain("animate-spin");
    expect(topHud.lastElementChild).toBe(spinner);

    // No percentage badge, no skeleton shimmer
    expect(container.querySelector('[data-slot="processing-progress"]')).toBeNull();
    expect(screen.queryByText("23%")).toBeNull();
    expect(container.querySelector(".animate-pulse")).toBeNull();
    expect(container.querySelector(".animate-shimmer")).toBeNull();
  });

  it("renders top-left image-02 icon by default and video-01 for video/showPlayIcon, plus top-right spinning loading icon", () => {
    const { container, rerender } = render(<ProcessingCard progress={42.6} />);

    expect(container.querySelector('[data-icon-name="image-02"]')).not.toBeNull();
    expect(container.querySelector('[data-icon-name="video-01"]')).toBeNull();
    expect(container.querySelector('[data-slot="processing-spinner"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="processing-progress"]')).toBeNull();

    rerender(<ProcessingCard isVideo progress={76} />);
    expect(container.querySelector('[data-icon-name="video-01"]')).not.toBeNull();
    expect(container.querySelector('[data-icon-name="image-02"]')).toBeNull();
    expect(container.querySelector('[data-slot="processing-spinner"]')).not.toBeNull();

    rerender(<ProcessingCard showPlayIcon />);
    expect(container.querySelector('[data-icon-name="video-01"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="processing-spinner"]')).not.toBeNull();
  });

  it("renders bottom-left truncated prompt and bottom-right tonal reuse button that stops propagation", () => {
    const onParentClick = vi.fn();
    const onReusePrompt = vi.fn();
    const promptText =
      "Full body character turnaround sheet featuring the exact same man from reference";

    const { container, rerender } = render(
      <div onClick={onParentClick}>
        <ProcessingCard
          progress={63}
          prompt={promptText}
          onReusePrompt={onReusePrompt}
          canReusePrompt={true}
        />
      </div>
    );

    const promptEl = container.querySelector('[data-slot="processing-prompt"]');
    expect(promptEl).not.toBeNull();
    expect(promptEl.textContent).toBe(promptText);
    expect(promptEl.className).toContain("truncate");

    const reuseBtn = screen.getByRole("button", { name: "Reuse prompt" });
    expect(reuseBtn).toBeDefined();
    expect(reuseBtn.getAttribute("title")).toBe("Reuse prompt");
    expect(reuseBtn.className).toContain("rounded-subtle");
    expect(reuseBtn.querySelector('[data-icon-name="arrow-turn-backward"]')).not.toBeNull();

    fireEvent.click(reuseBtn);
    expect(onReusePrompt).toHaveBeenCalledTimes(1);
    expect(onParentClick).not.toHaveBeenCalled();

    // Hides reuse button when canReusePrompt is false
    rerender(
      <ProcessingCard
        progress={63}
        prompt={promptText}
        onReusePrompt={onReusePrompt}
        canReusePrompt={false}
      />
    );
    expect(screen.queryByRole("button", { name: "Reuse prompt" })).toBeNull();
    expect(container.querySelector('[data-slot="processing-prompt"]')?.textContent).toBe(promptText);

    // Omits bottom HUD entirely when neither prompt nor reuse action is provided
    rerender(<ProcessingCard progress={23} />);
    expect(container.querySelector('[data-slot="processing-bottom-hud"]')).toBeNull();
  });

  it("MediaView enforces zero interactive actions on processing/uploading cards while preserving FlowErrorTile actions on failed", () => {
    const onRetry = vi.fn();
    const onDelete = vi.fn();
    const onCardClick = vi.fn();

    const { container, rerender } = render(
      <MediaView
        src={null}
        status="processing"
        progress={43}
        selectionEnabled={true}
        item={{
          id: "gen-1",
          status: "processing",
          prompt: "Cinematic rooftop silhouette at twilight",
        }}
        onRetry={onRetry}
        canReusePrompt={true}
        onDelete={onDelete}
        onClick={onCardClick}
      />
    );

    expect(container.querySelector('[data-slot="processing-card"]')).not.toBeNull();
    expect(container.querySelector(".ds-proc-orb-core")).not.toBeNull();
    expect(container.querySelector('[data-slot="processing-spinner"]')).not.toBeNull();
    expect(screen.getByText("Cinematic rooftop silhouette at twilight")).toBeDefined();

    // In-flight processing cards expose zero interactive actions and zero selection checkbox
    expect(screen.queryByRole("button", { name: "Reuse prompt" })).toBeNull();
    expect(container.querySelector('[data-slot="card-select-checkbox"]')).toBeNull();

    // Uploading cards also expose zero selection checkbox or interactive actions
    rerender(
      <MediaView
        src="blob:http://localhost:3000/upload-preview"
        status="uploading"
        progress={52}
        selectionEnabled={true}
        item={{ id: "up-1", status: "uploading" }}
      />
    );
    expect(container.querySelector('[data-slot="uploading-card"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="processing-card"]')).toBeNull();
    expect(container.querySelector('[data-slot="card-select-checkbox"]')).toBeNull();

    // Failed cards render FlowErrorTile with ONLY reuse prompt + delete actions
    rerender(
      <MediaView
        src={null}
        status="failed"
        error="Policy violation"
        item={{ id: "fail-1", status: "failed", error: "Policy violation" }}
        onRetry={onRetry}
        canReusePrompt={true}
        onDelete={onDelete}
      />
    );
    expect(container.querySelector("flow-error-tile")).not.toBeNull();
    expect(container.querySelector('[data-slot="processing-card"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reuse prompt" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("MediaRenderer uses ProcessingCard for processing items with spinning corner loader", () => {
    const { container } = render(
      <MediaRenderer
        item={{
          id: "mr-proc-1",
          kind: "video",
          status: "processing",
          progress: 63,
          prompt: "Tracking drone shot over misty fjord",
        }}
      />
    );

    expect(container.querySelector('[data-slot="processing-card"]')).not.toBeNull();
    expect(container.querySelector(".ds-proc-wave-a")).not.toBeNull();
    expect(container.querySelector(".ds-proc-orb-core")).not.toBeNull();
    expect(container.querySelector('[data-icon-name="video-01"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="processing-spinner"]')).not.toBeNull();
    expect(screen.getByText("Tracking drone shot over misty fjord")).toBeDefined();
  });

  it("MediaView renders a completed item preview even when a sibling item in workflow.items is processing, and suppresses Liked/menu triggers on failed/in-flight cards", () => {
    const completedItem = {
      id: "m-done",
      url: "https://example.com/done.png",
      status: "completed",
    };
    const mixedWorkflow = {
      id: "wf-mixed",
      items: [
        completedItem,
        { id: "m-proc", url: null, status: "processing" },
      ],
    };

    const { container, rerender } = render(
      <MediaView
        workflow={mixedWorkflow}
        item={completedItem}
        src="https://example.com/done.png"
        status="completed"
        isLiked={true}
        showLikedBadge={true}
        menuTrigger={<button type="button" data-testid="menu-trigger">Menu</button>}
      />
    );

    // Completed item image stays visible instead of being wiped out by sibling's ProcessingCard
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("https://example.com/done.png");
    expect(container.querySelector('[data-slot="processing-card"]')).toBeNull();
    // Workflow-level in-flight still gates interactive Liked button and menu trigger
    expect(screen.queryByTitle("Liked")).toBeNull();
    expect(screen.queryByTestId("menu-trigger")).toBeNull();

    // Failed card must NOT render Liked button even if isLiked=true
    rerender(
      <MediaView
        src={null}
        status="failed"
        error="Generation failed"
        isLiked={true}
        showLikedBadge={true}
      />
    );
    expect(screen.queryByTitle("Liked")).toBeNull();
  });
});
