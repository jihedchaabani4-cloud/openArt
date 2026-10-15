import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePromptBarReferences } from "../platform/hooks/usePromptBarReferences.js";
import { PromptBarStoreContext } from "../store/PromptBarStoreContext.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { createPromptBarType } from "../composition/createPromptBarType.js";
import {
  COMPOSITION_REQUIREMENTS,
  filterEligibleModels,
  resolveParameterMapping,
} from "../templates/generatedMedia.template.js";

const featureConfig = {
  COMPOSITION_REQUIREMENTS,
  filterEligibleModels,
  resolveParameterMapping,
};

const referenceModel = {
  id: "img-nano",
  name: "Nano Model",
  domain: "image",
  parameters: {
    images: { type: "image[]", group: "media", maxImages: 4 },
  },
};

describe("usePromptBarReferences hook", () => {
  it("derives activeReferences and quotas correctly", () => {
    const type = createPromptBarType({
      id: "generated-media",
      layout: { showModeSelector: true },
      referenceSlots: [{ role: "reference", label: "Reference Images", maxReferences: 4 }],
    });
    const testStore = createPromptBarStore({ type, templateConfig: featureConfig });

    const activeSlots = [
      { role: "reference", label: "Reference Images", accepts: ["image"], maxReferences: 4 },
    ];

    const wrapper = ({ children }) => (
      <PromptBarStoreContext.Provider value={testStore}>
        {children}
      </PromptBarStoreContext.Provider>
    );

    const { result } = renderHook(
      () =>
        usePromptBarReferences({
          activeSlots,
          featureConfig,
          currentModel: referenceModel,
          activeMode: "image",
        }),
      { wrapper }
    );

    expect(result.current.activeReferences).toEqual([]);
    expect(result.current.remainingImagesQuota).toBe(4);
    expect(result.current.dialogOpen).toBe(false);

    // Open dialog for slot
    act(() => {
      result.current.handleOpenDialog(activeSlots[0]);
    });
    expect(result.current.dialogOpen).toBe(true);
    expect(result.current.activeDialogSlot).toBe(activeSlots[0]);
    expect(result.current.activeDialogMode).toBe("all");
  });

  it("attaches media and updates quota via handleSelectMedia", () => {
    const type = createPromptBarType({
      id: "generated-media",
      layout: { showModeSelector: true },
      referenceSlots: [{ role: "reference", label: "Reference Images", maxReferences: 4 }],
    });
    const testStore = createPromptBarStore({ type, template: featureConfig });
    testStore.getState().setModels([referenceModel]);
    testStore.getState().selectModel(referenceModel.id);

    const activeSlots = [
      { role: "reference", label: "Reference Images", accepts: ["image"], maxReferences: 4 },
    ];

    const wrapper = ({ children }) => (
      <PromptBarStoreContext.Provider value={testStore}>
        {children}
      </PromptBarStoreContext.Provider>
    );

    const { result } = renderHook(
      () =>
        usePromptBarReferences({
          activeSlots,
          featureConfig,
          currentModel: referenceModel,
          activeMode: "image",
        }),
      { wrapper }
    );

    act(() => {
      result.current.handleOpenDialog(activeSlots[0]);
    });

    act(() => {
      result.current.handleSelectMedia([
        { id: "img-1", url: "https://example.com/1.jpg", displayName: "Ref 1" },
      ]);
    });

    expect(result.current.dialogOpen).toBe(false);
    expect(testStore.getState().parameterValues.images).toHaveLength(1);
    expect(testStore.getState().parameterValues.images[0].url).toBe("https://example.com/1.jpg");
  });
});
