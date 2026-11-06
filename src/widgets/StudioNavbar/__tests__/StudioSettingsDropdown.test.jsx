import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { StudioSettingsDropdown } from "../ui/StudioSettingsDropdown";
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

describe("StudioSettingsDropdown - Space between media (S / M / L)", () => {
  beforeEach(() => {
    useWorkflowUiStore.setState({
      gridSize: "lg",
      gridSpacing: "sm",
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders both 'Taille de la grille' and 'Space between media' toggle groups", () => {
    render(<StudioSettingsDropdown />);
    openSettings();

    expect(screen.getByText("Taille de la grille")).toBeDefined();
    expect(screen.getByText("Space between media")).toBeDefined();

    // Verify S, M, L radio buttons are present
    const radioGroups = screen.getAllByRole("radiogroup");
    expect(radioGroups.length).toBe(2);

    const spacingRadios = radioGroups[1].querySelectorAll("button[role='radio']");
    expect(spacingRadios.length).toBe(3);
    expect(spacingRadios[0].textContent).toBe("S");
    expect(spacingRadios[1].textContent).toBe("M");
    expect(spacingRadios[2].textContent).toBe("L");

    // S is checked by default
    expect(spacingRadios[0].getAttribute("aria-checked")).toBe("true");
    expect(spacingRadios[1].getAttribute("aria-checked")).toBe("false");
    expect(spacingRadios[2].getAttribute("aria-checked")).toBe("false");
  });

  it("clicking M and L updates store gridSpacing", () => {
    render(<StudioSettingsDropdown />);
    openSettings();

    const radioGroups = screen.getAllByRole("radiogroup");
    const spacingRadios = radioGroups[1].querySelectorAll("button[role='radio']");

    // Click M
    fireEvent.click(spacingRadios[1]);
    expect(useWorkflowUiStore.getState().gridSpacing).toBe("md");

    // Click L
    fireEvent.click(spacingRadios[2]);
    expect(useWorkflowUiStore.getState().gridSpacing).toBe("lg");

    // Click S
    fireEvent.click(spacingRadios[0]);
    expect(useWorkflowUiStore.getState().gridSpacing).toBe("sm");
  });

  it("respects custom gridSpacing and setGridSpacing props when provided", () => {
    const handleSetGridSpacing = vi.fn();
    render(
      <StudioSettingsDropdown
        gridSpacing="md"
        setGridSpacing={handleSetGridSpacing}
      />
    );
    openSettings();

    const radioGroups = screen.getAllByRole("radiogroup");
    const spacingRadios = radioGroups[1].querySelectorAll("button[role='radio']");

    // M is checked
    expect(spacingRadios[1].getAttribute("aria-checked")).toBe("true");

    // Click L
    fireEvent.click(spacingRadios[2]);
    expect(handleSetGridSpacing).toHaveBeenCalledWith("lg");
  });
});
