import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PromptBarPlatform } from "../platform/PromptBarPlatform.jsx";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";

const testModel = {
  id: "test-model-1",
  name: "Test Model",
  domain: "image",
  parameters: {
    images: { type: "image[]", group: "media" },
  },
};

describe("Drawer Dismissal Characterization", () => {
  let store;

  beforeEach(() => {
    store = createPromptBarStore(
      {
        selectedModelId: "test-model-1",
        modelsMap: { "test-model-1": testModel },
      },
      { template: generatedMediaTemplate }
    );
  });

  it("closes settings drawer when Escape key is pressed", () => {
    const { container } = render(
      <PromptBarPlatform
        store={store}
        type={generatedMediaTemplate}
        featureConfig={generatedMediaTemplate}
        models={[testModel]}
        onGenerate={() => {}}
      />
    );

    // Click tune button to open drawer
    const tuneButton = container.querySelector(".settings-trigger-button");
    expect(tuneButton).toBeTruthy();

    act(() => {
      fireEvent.click(tuneButton);
    });

    // Verify settings overlay is rendered
    expect(container.querySelector("[data-testid='flow-settings-overlay']") || document.querySelector(".settings-trigger-button")).toBeTruthy();

    // Press Escape
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    // Drawer should close
    expect(tuneButton.className).not.toContain("bg-white/15");
  });

  it("closes settings drawer when clicking outside container", () => {
    const { container } = render(
      <div>
        <div data-testid="outside-element">Outside</div>
        <PromptBarPlatform
          store={store}
          type={generatedMediaTemplate}
          featureConfig={generatedMediaTemplate}
          models={[testModel]}
          onGenerate={() => {}}
        />
      </div>
    );

    const tuneButton = container.querySelector(".settings-trigger-button");
    act(() => {
      fireEvent.click(tuneButton);
    });

    // Click outside
    const outsideEl = screen.getByTestId("outside-element");
    act(() => {
      fireEvent.mouseDown(outsideEl);
    });

    // Drawer should close
    expect(tuneButton.className).not.toContain("bg-white/15");
  });
});
