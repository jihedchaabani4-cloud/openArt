import test from "node:test";
import assert from "node:assert/strict";
import {
  isFrameModel,
  isReferenceModel,
  filterEligibleModels,
  resolveParameterMapping,
} from "../features/generated-media/generatedMedia.config.js";

const testModels = [
  {
    id: "nanobana_pro",
    name: "NanoBanana Pro",
    domain: "image",
    parameters: {
      prompt: { type: "text" },
      images: { type: "image[]", max: 14 },
      input_image: { type: "image", max: 1 },
      aspect_ratio: { type: "select" },
    },
  },
  {
    id: "seedream_v5",
    name: "ByteDance Seedream V5.0 Pro",
    domain: "image",
    parameters: {
      prompt: { type: "text" },
      resolution: { type: "select" },
      aspect_ratio: { type: "select" },
    },
  },
  {
    id: "seedance_2_5",
    name: "ByteDance Seedance 2.5",
    domain: "video",
    parameters: {
      prompt: { type: "text" },
      input_image: { type: "image" },
      last_frame: { type: "image" },
      duration: { type: "select" },
    },
  },
  {
    id: "seedance_2_5_extend",
    name: "ByteDance Seedance 2.5 Extend",
    domain: "video",
    parameters: {
      prompt: { type: "text" },
      input_video: { type: "video" },
      duration: { type: "select" },
    },
  },
];

test("Model Classification: isFrameModel identifies models with input_image and last_frame", () => {
  const seedance = testModels.find((m) => m.id === "seedance_2_5");
  const seedanceExtend = testModels.find((m) => m.id === "seedance_2_5_extend");
  const nanobana = testModels.find((m) => m.id === "nanobana_pro");

  assert.equal(isFrameModel(seedance), true);
  assert.equal(isFrameModel(seedanceExtend), false);
  assert.equal(isFrameModel(nanobana), false);
});

test("Model Classification: isReferenceModel identifies models with images parameter", () => {
  const nanobana = testModels.find((m) => m.id === "nanobana_pro");
  const seedream = testModels.find((m) => m.id === "seedream_v5");
  const seedance = testModels.find((m) => m.id === "seedance_2_5");

  assert.equal(isReferenceModel(nanobana), true);
  assert.equal(isReferenceModel(seedream), false);
  assert.equal(isReferenceModel(seedance), false);
});

test("Eligibility: Video frames subMode selects only frame models (input_image + last_frame)", () => {
  const eligible = filterEligibleModels(testModels, "video", "frames");
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].id, "seedance_2_5");
});

test("Eligibility: Video reference subMode selects only models with images parameter", () => {
  const eligible = filterEligibleModels(testModels, "video", "reference");
  assert.equal(eligible.length, 0); // None of current video models have `images`
});

test("Eligibility: Image mode dynamically narrows to reference-capable models when images present", () => {
  const allImage = filterEligibleModels(testModels, "image", null, {});
  assert.equal(allImage.length, 2);

  const withRef = filterEligibleModels(testModels, "image", null, {
    images: [{ workflow_id: "wf_1" }],
  });
  assert.equal(withRef.length, 1);
  assert.equal(withRef[0].id, "nanobana_pro");
});

test("Mapping: resolveParameterMapping maps reference to images and frames to input_image/last_frame", () => {
  const nanobana = testModels.find((m) => m.id === "nanobana_pro");
  const seedance = testModels.find((m) => m.id === "seedance_2_5");
  const seedream = testModels.find((m) => m.id === "seedream_v5");

  assert.equal(resolveParameterMapping(nanobana, "reference"), "images");
  assert.equal(resolveParameterMapping(seedream, "reference"), null);
  assert.equal(resolveParameterMapping(seedance, "start"), "input_image");
  assert.equal(resolveParameterMapping(seedance, "end"), "last_frame");
});
