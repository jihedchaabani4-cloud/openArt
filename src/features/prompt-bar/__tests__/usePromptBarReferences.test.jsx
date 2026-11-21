import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePromptBarReferences } from "../platform/hooks/usePromptBarReferences.js";
import { PromptBarStoreContext } from "../store/PromptBarStoreContext.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import { normalizedPromptOnlyModel } from "./fixtures/models.fixture.js";

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
    const testStore = createPromptBarStore({}, { template: generatedMediaTemplate });

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
          featureConfig: generatedMediaTemplate,
          currentModel: referenceModel,
          activeMode: "image",
        }),
      { wrapper }
    );

    expect(result.current.activeReferences).toEqual([]);
    expect(result.current.remainingImagesQuota).toBe(4);
    expect(result.current.dialogOpen).toBe(false);

    act(() => {
      result.current.handleOpenDialog(activeSlots[0]);
    });
    expect(result.current.dialogOpen).toBe(true);
    expect(result.current.activeDialogSlot).toBe(activeSlots[0]);
    expect(result.current.activeDialogMode).toBe("all");
  });

  it("attaches media and updates quota via handleSelectMedia (both slot click and @mention)", () => {
    const testStore = createPromptBarStore({}, { template: generatedMediaTemplate });
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
          featureConfig: generatedMediaTemplate,
          currentModel: referenceModel,
          activeMode: "image",
        }),
      { wrapper }
    );

    // 1. Slot click attach
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

    // 2. @mention multi-select routes through attachMedia without stale-closure overwrite
    const mentionItems = [];
    act(() => {
      result.current.handleTriggerMentionDialog((items) => mentionItems.push(...items));
    });

    act(() => {
      result.current.handleSelectMedia([
        { id: "char-1", workflow_type: "CHARACTER_SHEET", url: "https://example.com/char.jpg", name: "Nova" },
        { id: "img-2", url: "https://example.com/2.jpg", displayName: "Ref 2" },
      ]);
    });

    expect(mentionItems).toHaveLength(2);
    expect(testStore.getState().parameterValues.images).toHaveLength(3);
    expect(testStore.getState().parameterValues.images[1].type).toBe("character");
  });

  it("returns remainingImagesQuota === 0 when activeSlots is empty and skips mentionCallback", () => {
    const testStore = createPromptBarStore({}, { template: generatedMediaTemplate });
    testStore.getState().setModels([normalizedPromptOnlyModel]);
    testStore.getState().selectModel(normalizedPromptOnlyModel.id);

    const wrapper = ({ children }) => (
      <PromptBarStoreContext.Provider value={testStore}>
        {children}
      </PromptBarStoreContext.Provider>
    );

    const { result } = renderHook(
      () =>
        usePromptBarReferences({
          activeSlots: [],
          featureConfig: generatedMediaTemplate,
          currentModel: normalizedPromptOnlyModel,
          activeMode: "image",
        }),
      { wrapper }
    );

    expect(result.current.remainingImagesQuota).toBe(0);

    const mentionSpy = vi.fn();
    act(() => {
      result.current.handleTriggerMentionDialog(mentionSpy);
    });

    act(() => {
      result.current.handleSelectMedia([
        { id: "img-1", url: "https://example.com/1.jpg", displayName: "Ref 1" },
      ]);
    });

    expect(mentionSpy).not.toHaveBeenCalled();
    expect(result.current.dialogOpen).toBe(false);
  });

  it("only passes items whose attachMedia succeeded to mentionCallback (never rejected items)", () => {
    const maxOneModel = {
      id: "img-max-1",
      name: "Max 1 Model",
      domain: "image",
      parameters: {
        images: { type: "image[]", group: "media", max: 1 },
      },
    };
    const testStore = createPromptBarStore({}, { template: generatedMediaTemplate });
    testStore.getState().setModels([maxOneModel]);
    testStore.getState().selectModel(maxOneModel.id);

    const activeSlots = [
      { role: "reference", label: "Reference Images", accepts: ["image"] },
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
          featureConfig: generatedMediaTemplate,
          currentModel: maxOneModel,
          activeMode: "image",
        }),
      { wrapper }
    );

    // Selecting 2 items when quota is 1 -> only first attaches, second fails MAX_MEDIA_REACHED
    const mentionSpy = vi.fn();
    act(() => {
      result.current.handleTriggerMentionDialog(mentionSpy);
    });
    act(() => {
      result.current.handleSelectMedia([
        { id: "img-ok", url: "https://example.com/ok.jpg", displayName: "OK" },
        { id: "img-overflow", url: "https://example.com/over.jpg", displayName: "Overflow" },
      ]);
    });

    expect(mentionSpy).toHaveBeenCalledTimes(1);
    expect(mentionSpy.mock.calls[0][0]).toHaveLength(1);
    expect(mentionSpy.mock.calls[0][0][0].id).toBe("img-ok");

    // Selecting another item when quota is now 0 -> attachMedia fails, mentionCallback is NOT called
    const secondMentionSpy = vi.fn();
    act(() => {
      result.current.handleTriggerMentionDialog(secondMentionSpy);
    });
    act(() => {
      result.current.handleSelectMedia([
        { id: "img-rejected", url: "https://example.com/rej.jpg", displayName: "Rejected" },
      ]);
    });

    expect(secondMentionSpy).not.toHaveBeenCalled();
  });
});
