import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AssetSwitchBar } from "../AssetSwitchBar";

afterEach(() => {
  cleanup();
});

const SAMPLE_WORKFLOWS = [
  {
    id: "wf-1",
    display_name: "Sunrise Shot",
    items: [{ id: "m-1", url: "https://cdn.example.com/sunrise.png", status: "completed" }],
  },
  {
    id: "wf-2",
    display_name: "Neon Alley",
    items: [{ id: "m-2", url: "https://cdn.example.com/neon.mp4", is_video: true, status: "completed" }],
  },
  {
    id: "wf-3",
    display_name: "Desert Horizon",
    items: [{ id: "m-3", url: "https://cdn.example.com/desert.png", status: "completed" }],
  },
];

describe("AssetSwitchBar", () => {
  it("hides navigation and renders an aria-hidden spacer when workflows.length <= 1", () => {
    const { container, rerender } = render(
      <AssetSwitchBar workflows={[]} activeWorkflowId={null} currentIndex={0} />
    );
    expect(screen.queryByRole("navigation", { name: "Project assets" })).toBeNull();
    expect(container.firstChild?.getAttribute("aria-hidden")).toBe("true");

    rerender(
      <AssetSwitchBar
        workflows={[SAMPLE_WORKFLOWS[0]]}
        activeWorkflowId="wf-1"
        currentIndex={0}
      />
    );
    expect(screen.queryByRole("navigation", { name: "Project assets" })).toBeNull();
    expect(container.firstChild?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders thumbnails only for passed workflows, marks active aria-current='page', and invokes onSelectWorkflow on click, arrows, and wheel", () => {
    const onSelectWorkflow = vi.fn();
    render(
      <AssetSwitchBar
        workflows={SAMPLE_WORKFLOWS}
        activeWorkflowId="wf-2"
        currentIndex={1}
        onSelectWorkflow={onSelectWorkflow}
      />
    );

    const nav = screen.getByRole("navigation", { name: "Project assets" });
    expect(nav).toBeDefined();

    const firstThumb = screen.getByRole("button", { name: "Sunrise Shot" });
    const activeThumb = screen.getByRole("button", { name: "Neon Alley" });
    const lastThumb = screen.getByRole("button", { name: "Desert Horizon" });

    expect(firstThumb.getAttribute("aria-current")).toBeNull();
    expect(activeThumb.getAttribute("aria-current")).toBe("page");
    expect(lastThumb.getAttribute("aria-current")).toBeNull();

    // Direct thumbnail click
    fireEvent.click(lastThumb);
    expect(onSelectWorkflow).toHaveBeenCalledWith(SAMPLE_WORKFLOWS[2]);

    // Prev / Next arrow clicks
    const prevBtn = screen.getByRole("button", { name: "Previous asset" });
    const nextBtn = screen.getByRole("button", { name: "Next asset" });
    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(false);

    fireEvent.click(prevBtn);
    expect(onSelectWorkflow).toHaveBeenLastCalledWith(SAMPLE_WORKFLOWS[0]);

    fireEvent.click(nextBtn);
    expect(onSelectWorkflow).toHaveBeenLastCalledWith(SAMPLE_WORKFLOWS[2]);

    // Wheel scroll forward & backward
    const viewport = activeThumb.closest(".overflow-hidden");
    expect(viewport).not.toBeNull();

    onSelectWorkflow.mockClear();
    fireEvent.wheel(viewport, { deltaY: 50 });
    expect(onSelectWorkflow).toHaveBeenCalledWith(SAMPLE_WORKFLOWS[2]);

    onSelectWorkflow.mockClear();
    fireEvent.wheel(viewport, { deltaY: -50 });
    expect(onSelectWorkflow).toHaveBeenCalledWith(SAMPLE_WORKFLOWS[0]);
  });

  it("disables previous arrow at index 0 and disables next arrow at the last index", () => {
    const onSelectWorkflow = vi.fn();
    const { rerender } = render(
      <AssetSwitchBar
        workflows={SAMPLE_WORKFLOWS}
        activeWorkflowId="wf-1"
        currentIndex={0}
        onSelectWorkflow={onSelectWorkflow}
      />
    );

    expect(screen.getByRole("button", { name: "Previous asset" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Next asset" }).disabled).toBe(false);

    rerender(
      <AssetSwitchBar
        workflows={SAMPLE_WORKFLOWS}
        activeWorkflowId="wf-3"
        currentIndex={2}
        onSelectWorkflow={onSelectWorkflow}
      />
    );

    expect(screen.getByRole("button", { name: "Previous asset" }).disabled).toBe(false);
    expect(screen.getByRole("button", { name: "Next asset" }).disabled).toBe(true);
  });
});
