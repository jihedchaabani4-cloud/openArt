import { describe, it, expect, beforeEach, afterEach, beforeAll } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NavbarFilterDropdown } from "../NavbarFilterDropdown";
import { useWorkflowUiStore } from "@/features/workflows/model/useWorkflowUiStore";

beforeAll(() => {
  if (typeof global.ResizeObserver === "undefined") {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

function openFilterMenu() {
  const trigger = screen.getByRole("button", { name: /^Filter$/i });
  fireEvent.keyDown(trigger, { key: "Enter" });
  return trigger;
}

function openSubmenu(triggerText) {
  const subTrigger = screen.getByText(triggerText).closest('[role="menuitem"]');
  fireEvent.keyDown(subTrigger, { key: "ArrowRight" });
  return subTrigger;
}

describe("NavbarFilterDropdown", () => {
  beforeEach(() => {
    useWorkflowUiStore.setState({ activeStudioTab: "assets" });
    useWorkflowUiStore.getState().clearFilters();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders outline Filter trigger with Type submenus, Hide failed switch, Activity radios, and Reset", () => {
    render(<NavbarFilterDropdown availableModels={["Google Veo 3.1", "GPT Image 2"]} />);

    const trigger = openFilterMenu();
    expect(trigger.className).toContain("ds-btn-outline");

    // 1. Toggle Hide failed switch
    fireEvent.click(screen.getByText("Hide failed"));
    expect(useWorkflowUiStore.getState().filters.hideFailed).toBe(true);

    // 2. Select Activity -> Generated, then Uploaded, then Liked (syncs liked flag)
    fireEvent.click(screen.getByText("Generated"));
    expect(useWorkflowUiStore.getState().filters.activity).toBe("generated");
    expect(useWorkflowUiStore.getState().filters.liked).toBe(false);

    fireEvent.click(screen.getByText("Uploaded"));
    expect(useWorkflowUiStore.getState().filters.activity).toBe("uploaded");

    fireEvent.click(screen.getByText("Liked"));
    expect(useWorkflowUiStore.getState().filters.activity).toBe("liked");
    expect(useWorkflowUiStore.getState().filters.liked).toBe(true);

    // 3. Open "All types" submenu & multi-select Image + Video
    openSubmenu("All types");
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Image" }));
    expect(useWorkflowUiStore.getState().filters.types).toEqual(["image"]);
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Video" }));
    expect(useWorkflowUiStore.getState().filters.types).toEqual(["image", "video"]);

    // 4. Open "All models" submenu, search, and toggle a model
    openSubmenu("All models");
    const searchInput = screen.getByLabelText("Search models");
    fireEvent.change(searchInput, { target: { value: "Veo" } });
    expect(screen.queryByRole("menuitemcheckbox", { name: /GPT Image 2/i })).toBeNull();
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: /Google Veo 3\.1/i }));
    expect(useWorkflowUiStore.getState().filters.models).toEqual(["Google Veo 3.1"]);

    // 5. Open "Date range" submenu and select Last 7 days
    openSubmenu("Date range");
    fireEvent.click(screen.getByText("Last 7 days"));
    expect(useWorkflowUiStore.getState().filters.dateRange).toBe("7d");

    // Active count badge shows 5 (types, models, dateRange, hideFailed, activity)
    expect(trigger.textContent).toContain("5");

    // 6. Reset filters restores all defaults
    fireEvent.click(screen.getByText("Reset filters"));
    const reset = useWorkflowUiStore.getState().filters;
    expect(reset.types).toEqual([]);
    expect(reset.models).toEqual([]);
    expect(reset.dateRange).toBe("all");
    expect(reset.hideFailed).toBe(false);
    expect(reset.activity).toBe("all");
    expect(reset.liked).toBe(false);
  });

  it("opens main dropdown on mouse click and portals submenus outside parent panel", () => {
    render(<NavbarFilterDropdown availableModels={["Google Veo 3.1"]} />);

    const trigger = screen.getByRole("button", { name: /^Filter$/i });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });

    const mainPanel = document.querySelector('[data-slot="dropdown-menu-content"]');
    expect(mainPanel).not.toBeNull();

    openSubmenu("All types");
    const subPanel = document.querySelector('[data-slot="dropdown-menu-sub-content"]');
    expect(subPanel).not.toBeNull();
    // Submenu MUST be portaled outside mainPanel so backdrop-filter + overflow-x-hidden cannot clip it
    expect(mainPanel.contains(subPanel)).toBe(false);
  });

  it("renders on the trash tab just like Assets, Elements, and Characters", () => {
    useWorkflowUiStore.setState({ activeStudioTab: "trash" });
    render(<NavbarFilterDropdown />);
    expect(screen.getByRole("button", { name: /^Filter$/i })).toBeTruthy();
  });
});
