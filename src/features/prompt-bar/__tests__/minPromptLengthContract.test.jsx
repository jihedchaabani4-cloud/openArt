import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePromptBarGenerate } from "../platform/hooks/usePromptBarGenerate.js";
import { PromptBarStoreContext } from "../store/PromptBarStoreContext.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { defineTemplate } from "../core/templateContract.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import { characterTemplate } from "../templates/character.template.js";

const dummyModel = {
  id: "test-model",
  name: "Test Model",
  domain: "image",
  parameters: { prompt: { type: "string" } },
};

function renderGenerateHook(template, prompt = "") {
  const store = createPromptBarStore({
    template,
    modelsMap: { "test-model": dummyModel },
    selectedModelId: "test-model",
  });
  store.getState().setPrompt(prompt);

  const wrapper = ({ children }) => (
    <PromptBarStoreContext.Provider value={store}>
      {children}
    </PromptBarStoreContext.Provider>
  );

  return renderHook(
    () =>
      usePromptBarGenerate({
        template,
        currentModel: dummyModel,
        selectedId: "test-model",
        isCurrentEligible: true,
        activeMode: "image",
        activeSubMode: "frames",
        startVal: null,
        onGenerate: vi.fn(),
      }),
    { wrapper }
  );
}

describe("B3: Template Contract minPromptLength (PB-D-19)", () => {
  // (a) Custom template with minPromptLength: 3
  it("(a) custom template with minPromptLength: 3 disables Generate under 3 characters and enables it at 3", () => {
    const customTemplate = defineTemplate({
      id: "custom-3",
      minPromptLength: 3,
      getSlots: () => [],
      filterEligibleModels: (m) => m,
      resolveParameterMapping: () => null,
    });

    const { result: r1 } = renderGenerateHook(customTemplate, "ab"); // length 2
    expect(r1.current.isGenerateDisabled).toBe(true);

    const { result: r2 } = renderGenerateHook(customTemplate, "abc"); // length 3
    expect(r2.current.isGenerateDisabled).toBe(false);
  });

  // (b) Template without minPromptLength field has no minimum
  it("(b) template without minPromptLength field has no minimum requirement", () => {
    const noMinTemplate = defineTemplate({
      id: "custom-no-min",
      getSlots: () => [],
      filterEligibleModels: (m) => m,
      resolveParameterMapping: () => null,
    });

    expect(noMinTemplate.minPromptLength).toBeUndefined();

    const { result } = renderGenerateHook(noMinTemplate, "a");
    expect(result.current.isGenerateDisabled).toBe(false);
  });

  // (c) generatedMediaTemplate behavior unchanged (no minimum)
  it("(c) generatedMediaTemplate behavior unchanged with no prompt length minimum", () => {
    expect(generatedMediaTemplate.minPromptLength).toBeUndefined();

    const { result } = renderGenerateHook(generatedMediaTemplate, "a");
    expect(result.current.isGenerateDisabled).toBe(false);
  });

  // (d) characterTemplate requires 10 characters via template field
  it("(d) characterTemplate declares minPromptLength: 10 and enforces it", () => {
    expect(characterTemplate.minPromptLength).toBe(10);

    const { result: r1 } = renderGenerateHook(characterTemplate, "123456789"); // 9 chars
    expect(r1.current.isGenerateDisabled).toBe(true);

    const { result: r2 } = renderGenerateHook(characterTemplate, "1234567890"); // 10 chars
    expect(r2.current.isGenerateDisabled).toBe(false);
  });

  // (e) defineTemplate rejects negative or non-number values
  it("(e) defineTemplate rejects negative or non-number minPromptLength", () => {
    expect(() =>
      defineTemplate({
        id: "invalid-negative",
        minPromptLength: -1,
        getSlots: () => [],
        filterEligibleModels: (m) => m,
        resolveParameterMapping: () => null,
      })
    ).toThrow(/minPromptLength.*non-negative number/);

    expect(() =>
      defineTemplate({
        id: "invalid-string",
        minPromptLength: "ten",
        getSlots: () => [],
        filterEligibleModels: (m) => m,
        resolveParameterMapping: () => null,
      })
    ).toThrow(/minPromptLength.*non-negative number/);
  });
});
