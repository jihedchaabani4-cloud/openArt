import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PromptBarControlsRow } from "../platform/parts/PromptBarControlsRow";

afterEach(() => {
  cleanup();
});

describe("PromptBarControlsRow", () => {
  it("renders generate button with credit count in title and triggers handleGenerate on click", () => {
    const handleGenerate = vi.fn();
    render(
      <PromptBarControlsRow
        isGenerating={false}
        isGenerateDisabled={false}
        estimatedCredits={15}
        handleGenerate={handleGenerate}
        showSettingsButton={false}
      />
    );

    const btn = screen.getByRole("button", { name: "Generate" });
    expect(btn.getAttribute("title")).toBe("Generate (15 cr)");
    expect(btn.disabled).toBe(false);

    fireEvent.click(btn);
    expect(handleGenerate).toHaveBeenCalledTimes(1);
  });

  it("disables generate button when isGenerateDisabled is true", () => {
    const handleGenerate = vi.fn();
    render(
      <PromptBarControlsRow
        isGenerating={false}
        isGenerateDisabled={true}
        estimatedCredits={0}
        handleGenerate={handleGenerate}
        showSettingsButton={false}
      />
    );

    const btn = screen.getByRole("button", { name: "Generate" });
    expect(btn.disabled).toBe(true);

    fireEvent.click(btn);
    expect(handleGenerate).not.toHaveBeenCalled();
  });

  it("renders settings trigger button with model name and triggers onToggleDrawer", () => {
    const onToggleDrawer = vi.fn();
    const currentModel = { id: "flux-schnell", displayName: "Flux Schnell" };

    render(
      <PromptBarControlsRow
        isGenerating={false}
        isGenerateDisabled={false}
        estimatedCredits={10}
        handleGenerate={() => {}}
        showSettingsButton={true}
        drawerOpen={false}
        onToggleDrawer={onToggleDrawer}
        currentModel={currentModel}
        currentRatioIcon="crop_square"
        currentCount={2}
      />
    );

    expect(screen.getByText("Flux Schnell")).toBeTruthy();
    expect(screen.getByText("x2")).toBeTruthy();

    const triggerBtn = screen.getByLabelText("Déclencheur des paramètres");
    fireEvent.click(triggerBtn);
    expect(onToggleDrawer).toHaveBeenCalledTimes(1);
  });
});
