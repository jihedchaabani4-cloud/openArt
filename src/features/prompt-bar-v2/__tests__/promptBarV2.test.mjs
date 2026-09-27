import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  normalizeParameterDefinition,
  normalizeModelContract,
} from "../core/modelContract.js";
import {
  validateParameter,
  validateAllParameters,
  reconcileState,
  serializeSemanticRequest,
} from "../core/parameterEngine.js";
import {
  TEST_MODEL_A,
  TEST_MODEL_B,
  TEST_MODEL_C,
  TEST_MODEL_D,
  TEST_MODEL_E,
} from "../fixtures/testModels.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Scenario A: Basic Model
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario A — Basic Model A parameter initialization and defaults", () => {
  const modelA = normalizeModelContract(TEST_MODEL_A);

  assert.equal(modelA.id, "test-image-a");
  assert.equal(modelA.domain, "image");

  const paramNames = Object.keys(modelA.parameters);
  assert.deepEqual(paramNames.sort(), ["input_image", "quality", "ratio", "resolution"]);

  // Verify parameter details
  const resDef = modelA.parameters.resolution;
  assert.equal(resDef.type, "select");
  assert.equal(resDef.default, "1k");
  assert.deepEqual(resDef.values.map(v => v.value), ["1k", "2k", "4k"]);

  const qualDef = modelA.parameters.quality;
  assert.equal(qualDef.type, "select");
  assert.equal(qualDef.default, "standard");

  const ratioDef = modelA.parameters.ratio;
  assert.equal(ratioDef.default, "1:1");

  const inputDef = modelA.parameters.input_image;
  assert.equal(inputDef.type, "image");
  assert.equal(inputDef.required, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario B: Model Switch Reconciliation
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario B — Model switch A -> B reconciles values (incompatible resets, compatible survives)", () => {
  const modelA = normalizeModelContract(TEST_MODEL_A);
  const modelB = normalizeModelContract(TEST_MODEL_B);

  // Initial state on Model A:
  // resolution: "4k" (Model B only allows "1k", "2k") -> should reset to B default ("1k")
  // ratio: "16:9" (Model B only allows "1:1", "4:3") -> should reset to B default ("1:1")
  // quality: "hd" (Model B doesn't have quality) -> should be removed
  const stateA = {
    resolution: "4k",
    quality: "hd",
    ratio: "16:9",
  };

  const { nextValues, changes } = reconcileState(stateA, modelA.parameters, modelB.parameters);

  // Expected outcome from spec:
  // resolution -> reset to default "1k"
  // quality    -> removed
  // ratio      -> reset because "16:9" invalid -> default "1:1"
  // seed       -> initialized to 42
  assert.equal(nextValues.resolution, "1k");
  assert.equal(nextValues.ratio, "1:1");
  assert.equal(nextValues.seed, 42);
  assert.equal(nextValues.quality, undefined);

  // Compatible value test:
  // If ratio was "1:1" (which is valid in Model B), it MUST survive!
  const stateACompatible = {
    resolution: "2k",
    quality: "standard",
    ratio: "1:1",
  };
  const reconciledComp = reconcileState(stateACompatible, modelA.parameters, modelB.parameters);
  assert.equal(reconciledComp.nextValues.resolution, "2k"); // 2k is allowed in B!
  assert.equal(reconciledComp.nextValues.ratio, "1:1");     // 1:1 is allowed in B!
  assert.equal(reconciledComp.nextValues.seed, 42);        // seed initialized
  assert.equal(reconciledComp.nextValues.quality, undefined);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario C: New Parameter Appears
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario C — New parameter appears automatically with default", () => {
  const modelA = normalizeModelContract(TEST_MODEL_A);
  const modelB = normalizeModelContract(TEST_MODEL_B);

  const prevValues = { resolution: "1k", ratio: "1:1" };
  const { nextValues, changes } = reconcileState(prevValues, modelA.parameters, modelB.parameters);

  assert.ok("seed" in nextValues);
  assert.equal(nextValues.seed, 42);

  const seedChange = changes.find((c) => c.parameter === "seed");
  assert.ok(seedChange);
  assert.equal(seedChange.action, "initialized");
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario D: Removed Parameter Disappears
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario D — Removed parameter disappears from active state", () => {
  const modelA = normalizeModelContract(TEST_MODEL_A);
  const modelB = normalizeModelContract(TEST_MODEL_B);

  const prevValues = { resolution: "1k", quality: "standard", ratio: "1:1" };
  const { nextValues, changes } = reconcileState(prevValues, modelA.parameters, modelB.parameters);

  assert.equal("quality" in nextValues, false);
  const qualChange = changes.find((c) => c.parameter === "quality");
  assert.ok(qualChange);
  assert.equal(qualChange.action, "removed");
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario E: Video Model C
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario E — Video Model C definitions according to metadata", () => {
  const modelC = normalizeModelContract(TEST_MODEL_C);

  assert.equal(modelC.domain, "video");
  const params = modelC.parameters;

  assert.ok(params.duration);
  assert.equal(params.duration.type, "select");
  assert.deepEqual(params.duration.values.map(v => v.value), [5, 10]);
  assert.equal(params.duration.default, 5);

  assert.ok(params.resolution);
  assert.deepEqual(params.resolution.values.map(v => v.value), ["720p", "1080p"]);

  assert.ok(params.input_image);
  assert.equal(params.input_image.type, "image");
  assert.equal(params.input_image.role, "start_frame");

  assert.ok(params.last_frame);
  assert.equal(params.last_frame.type, "image");
  assert.equal(params.last_frame.role, "end_frame");
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario F: Character Model D
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario F — Character Model D definitions", () => {
  const modelD = normalizeModelContract(TEST_MODEL_D);

  assert.equal(modelD.domain, "character");
  const params = modelD.parameters;

  assert.ok(params.reference_images);
  assert.equal(params.reference_images.type, "image[]");
  assert.equal(params.reference_images.maxCount, 4);

  assert.ok(params.style);
  assert.equal(params.style.type, "select");
  assert.deepEqual(params.style.values.map(v => v.value), ["realistic", "stylized"]);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario G: Unknown Parameter Graceful Handling
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario G — Unknown parameter type produces diagnostic warning without crashing", () => {
  const modelE = normalizeModelContract(TEST_MODEL_E);

  assert.ok(modelE.parameters.quantum_tensor);
  assert.equal(modelE.parameters.quantum_tensor.type, "unsupported_custom_type");

  // Should have emitted a diagnostic
  const diagnostic = modelE.diagnostics.find((d) => d.parameter === "quantum_tensor");
  assert.ok(diagnostic);
  assert.equal(diagnostic.level, "warn");
  assert.match(diagnostic.message, /Unknown parameter type/);

  // Validation does not throw
  const res = validateParameter(modelE.parameters.quantum_tensor, "any_value");
  assert.equal(res.valid, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario H: Invalid Enum Rejection
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario H — Invalid enum value rejected by validation", () => {
  const modelA = normalizeModelContract(TEST_MODEL_A);
  const resDef = modelA.parameters.resolution;

  const validRes = validateParameter(resDef, "2k");
  assert.equal(validRes.valid, true);

  const invalidRes = validateParameter(resDef, "8k");
  assert.equal(invalidRes.valid, false);
  assert.match(invalidRes.error, /not one of allowed values/);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario I: Invalid Number (Min/Max/Step)
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario I — Invalid number min/max/step rejected by validation", () => {
  const modelB = normalizeModelContract(TEST_MODEL_B);
  const seedDef = modelB.parameters.seed; // min: 0, max: 100000

  assert.equal(validateParameter(seedDef, 500).valid, true);
  assert.equal(validateParameter(seedDef, -1).valid, false);
  assert.equal(validateParameter(seedDef, 9999999).valid, false);
  assert.equal(validateParameter(seedDef, "not-a-number").valid, false);

  // Step testing using Model E step_param (min: 0, max: 20, step: 5)
  const modelE = normalizeModelContract(TEST_MODEL_E);
  const stepDef = modelE.parameters.step_param;

  assert.equal(validateParameter(stepDef, 10).valid, true);
  assert.equal(validateParameter(stepDef, 15).valid, true);
  assert.equal(validateParameter(stepDef, 7).valid, false); // Not divisible by 5
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario J: Missing Required Parameter
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario J — Missing required parameter without default surfaces as invalid", () => {
  const modelE = normalizeModelContract(TEST_MODEL_E);
  const reqDef = modelE.parameters.required_no_default;

  // Empty string, undefined, null
  assert.equal(validateParameter(reqDef, undefined).valid, false);
  assert.equal(validateParameter(reqDef, "").valid, false);
  assert.equal(validateParameter(reqDef, null).valid, false);

  // Provided string is valid
  assert.equal(validateParameter(reqDef, "my-secret-key").valid, true);

  // validateAllParameters marks whole state invalid
  const allRes = validateAllParameters(modelE.parameters, {
    quantum_tensor: "ok",
    required_no_default: "",
    step_param: 10,
  });
  assert.equal(allRes.isValid, false);
  assert.ok("required_no_default" in allRes.errors);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario K: Serialization Excludes Unsupported or Invalid Values
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario K — Serialization only outputs defined, valid, supported parameters", () => {
  const modelA = normalizeModelContract(TEST_MODEL_A);

  const values = {
    resolution: "4k",
    quality: "hd",
    ratio: "16:9",
    non_existent_param: "evil_payload",
    input_image: "", // empty optional image should not be serialized
  };

  const serialized = serializeSemanticRequest(
    modelA.id,
    "A photorealistic cybernetic tiger",
    modelA.parameters,
    values
  );

  assert.equal(serialized.model, "test-image-a");
  assert.equal(serialized.prompt, "A photorealistic cybernetic tiger");
  assert.deepEqual(serialized.parameters, {
    resolution: "4k",
    quality: "hd",
    ratio: "16:9",
  });
  assert.equal("non_existent_param" in serialized.parameters, false);
  assert.equal("input_image" in serialized.parameters, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario L: Architectural Boundary Check — Zero Model-ID Branching
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario L — No Model-ID-specific branching in Prompt Bar V2 core & UI", () => {
  const coreDir = path.resolve(__dirname, "../core");
  const uiDir = path.resolve(__dirname, "../ui");
  const controlsDir = path.resolve(__dirname, "../ui/controls");

  const forbiddenPatterns = [
    /\bmodelId\s*===\s*["']/i,
    /\bselectedModelId\s*===\s*["']/i,
    /\bmodel\.id\s*===\s*["']/i,
    /switch\s*\(\s*modelId\s*\)/i,
    /switch\s*\(\s*selectedModelId\s*\)/i,
    /"nanobana_pro"/i,
    /"gpt_image_2"/i,
    /"seedance_2_5"/i,
  ];

  const checkDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) continue;
      const content = fs.readFileSync(filePath, "utf-8");
      for (const pattern of forbiddenPatterns) {
        assert.equal(
          pattern.test(content),
          false,
          `Forbidden model branch detected matching ${pattern} in ${file}`
        );
      }
    }
  };

  checkDirectory(coreDir);
  checkDirectory(uiDir);
  checkDirectory(controlsDir);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario M: Architectural Boundary Check — Zero Provider Branching
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario M — No provider-specific branching in Prompt Bar V2 core & UI", () => {
  const coreDir = path.resolve(__dirname, "../core");
  const uiDir = path.resolve(__dirname, "../ui");
  const controlsDir = path.resolve(__dirname, "../ui/controls");

  const forbiddenPatterns = [
    /provider\s*===/i,
    /\bproviderId\b/i,
    /\bwavespeed\b/i,
    /\bproviderModelId\b/i,
    /\bbindingId\b/i,
    /switch\s*\(\s*provider\s*\)/i,
  ];

  const checkDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) continue;
      const content = fs.readFileSync(filePath, "utf-8");
      for (const pattern of forbiddenPatterns) {
        assert.equal(
          pattern.test(content),
          false,
          `Forbidden provider branch detected matching ${pattern} in ${file}`
        );
      }
    }
  };

  checkDirectory(coreDir);
  checkDirectory(uiDir);
  checkDirectory(controlsDir);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario N: Rapid Model Switch Stability Stress Test
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario N — Rapid model switching stress test maintains state determinism", () => {
  const models = [
    normalizeModelContract(TEST_MODEL_A),
    normalizeModelContract(TEST_MODEL_C),
    normalizeModelContract(TEST_MODEL_B),
    normalizeModelContract(TEST_MODEL_D),
    normalizeModelContract(TEST_MODEL_A),
  ];

  let currentValues = {
    resolution: "1k",
    quality: "standard",
    ratio: "1:1",
  };
  let currentDefs = models[0].parameters;

  for (let step = 1; step < models.length; step++) {
    const nextModel = models[step];
    const { nextValues } = reconcileState(currentValues, currentDefs, nextModel.parameters);

    // Verify all keys in nextValues belong to nextModel
    for (const key of Object.keys(nextValues)) {
      assert.ok(key in nextModel.parameters, `Key ${key} in nextValues does not exist in ${nextModel.id}`);
    }

    currentValues = nextValues;
    currentDefs = nextModel.parameters;
  }

  // Returning to Model A should yield a valid Model A state with ratio "1:1" preserved!
  assert.equal(currentValues.ratio, "1:1");
  assert.ok("resolution" in currentValues);
  assert.ok("quality" in currentValues);
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario O: Prompt Text Independence
// ─────────────────────────────────────────────────────────────────────────────
test("Scenario O — Changing prompt text does not reset or alter parameter values", () => {
  const modelA = normalizeModelContract(TEST_MODEL_A);
  const initialParams = {
    resolution: "4k",
    quality: "hd",
    ratio: "16:9",
  };

  let prompt = "Initial prompt";
  // Simulating user keystrokes in prompt
  prompt = "Initial prompt with more detail";
  prompt = "A majestic mountain at sunrise, 8k render";

  // Serialization produces updated prompt with exact same parameters
  const req = serializeSemanticRequest(modelA.id, prompt, modelA.parameters, initialParams);
  assert.equal(req.prompt, "A majestic mountain at sunrise, 8k render");
  assert.deepEqual(req.parameters, initialParams);
});
