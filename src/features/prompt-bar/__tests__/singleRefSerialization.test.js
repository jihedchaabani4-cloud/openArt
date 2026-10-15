import { describe, it, expect } from "vitest";
import { serialize } from "../core/serialization.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";

describe("B4: Single-Reference Shape Serialization Contract", () => {
  const model_single_ref = {
    id: "model_single_ref",
    name: "Single Ref Model",
    domain: "image",
    parameters: {
      images: { type: "image[]", group: "media", max: 1 },
      aspect_ratio: { type: "string" },
    },
  };

  it("serializes single-reference unwrapped object into an array for parameters declared as image[]", () => {
    const values = {
      aspect_ratio: "16:9",
      images: { workflow_id: "ref_alpha", name: "Alpha" },
    };

    const payload = serialize(
      model_single_ref.id,
      "Test prompt",
      model_single_ref.parameters,
      values
    );

    // The backend imageGenerationNode and imageController require Array.isArray(parameters.images)
    expect(Array.isArray(payload.parameters.images)).toBe(true);
    expect(payload.parameters.images).toEqual(["ref_alpha"]);
    expect(payload.references).toContain("ref_alpha");
  });

  it("store.serialize() outputs array for parameters declared as image[] when value in store is single object", () => {
    const store = createPromptBarStore({
      modelsMap: { [model_single_ref.id]: model_single_ref },
      selectedModelId: model_single_ref.id,
      parameterValues: {
        aspect_ratio: "16:9",
        images: { workflow_id: "ref_alpha" },
      },
    });

    const payload = store.getState().serialize();

    expect(Array.isArray(payload.parameters.images)).toBe(true);
    expect(payload.parameters.images).toEqual(["ref_alpha"]);
  });
});
