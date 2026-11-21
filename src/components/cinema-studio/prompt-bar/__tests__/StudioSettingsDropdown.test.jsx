import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { StudioSettingsDropdown } from "../StudioSettingsDropdown";
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

function openSettings() {
  const trigger = screen.getByRole("button", { name: /grille de blocs/i });
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  fireEvent.keyDown(trigger, { key: "Enter" });
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
}

describe("StudioSettingsDropdown - Stepped Card Size Slider", () => {
  beforeEach(() => {
    useWorkflowUiStore.setState({
      gridSize: "md",
      gridSpacing: "sm",
      splitByDate: false,
      showFolders: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders 'Card size' stepped slider with 4 interior ticks and removes 'Space between media'", () => {
    render(<StudioSettingsDropdown />);
    openSettings();

    expect(screen.getByText("Card size")).toBeDefined();
    expect(screen.queryByText("Space between media")).toBeNull();
    expect(screen.queryByText("Médias importés")).toBeNull();

    const slider = screen.getByRole("slider", { name: "Card size" });
    expect(slider).toBeDefined();
    expect(slider.getAttribute("aria-valuenow")).toBe("3"); // md = stop 3 of 5

    const ticks = document.querySelectorAll('[data-slot="slider-tick"]');
    expect(ticks.length).toBe(4);
  });

  it("steps gridSize across xs / sm / md / lg / xl via keyboard arrows and clamps minimum to xs", () => {
    render(<StudioSettingsDropdown />);
    openSettings();

    const slider = screen.getByRole("slider", { name: "Card size" });

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(useWorkflowUiStore.getState().gridSize).toBe("lg");

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(useWorkflowUiStore.getState().gridSize).toBe("xl");

    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(useWorkflowUiStore.getState().gridSize).toBe("sm");

    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(useWorkflowUiStore.getState().gridSize).toBe("xs");

    // Pressing ArrowLeft again at xs stays clamped at xs (never empty 0%)
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(useWorkflowUiStore.getState().gridSize).toBe("xs");
  });

  it("respects custom gridSize and setGridSize props when provided", () => {
    const handleSetGridSize = vi.fn();
    render(
      <StudioSettingsDropdown
        gridSize="sm"
        setGridSize={handleSetGridSize}
      />
    );
    openSettings();

    const slider = screen.getByRole("slider", { name: "Card size" });
    expect(slider.getAttribute("aria-valuenow")).toBe("2");

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(handleSetGridSize).toHaveBeenCalledWith("md");
  });

  it("toggles 'Split by date' switch in the store", () => {
    render(<StudioSettingsDropdown />);
    openSettings();

    const splitItem = screen.getByRole("menuitemcheckbox", { name: /Split by date/i });
    expect(splitItem.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(splitItem);
    expect(useWorkflowUiStore.getState().splitByDate).toBe(true);

    const foldersItem = screen.getByRole("menuitemcheckbox", { name: /Show folders/i });
    expect(foldersItem.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(foldersItem);
    expect(useWorkflowUiStore.getState().showFolders).toBe(false);
  });
});
