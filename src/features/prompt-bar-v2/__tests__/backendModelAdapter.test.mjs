import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  adaptBackendParameter,
  adaptBackendModel,
  adaptBackendCatalog,
} from "../core/backendModelAdapter.js";
import {
  reconcileState,
  validateAllParameters,
  serializeSemanticRequest,
} from "../core/parameterEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load real manifest from apiOpenArt
function loadRealManifest(modelFolder) {
  const manifestPath = path.resolve(
    __dirname,
    `../../../../../apiOpenArt/src/models/manifests/${modelFolder}/model.json`
  );
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Real manifest not found at: ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Adapt Real NanoBanana Pro Manifest
// ─────────────────────────────────────────────────────────────────────────────
test("Backend Adapter — Adapts real NanoBanana Pro manifest into V2 contract", () => {
  const rawNano = loadRealManifest("nanobana_pro");
  // Simulating the shape produced by apiOpenArt formatModelDto / getModelConfig
  const rawDto = {
    key: rawNano.id,
    displayName: rawNano.displayName,
    category: rawNano.domain,
    description: rawNano.description,
    badge: "PRO",
    parameters: rawNano.canonicalInputs,
  };

  const adapted = adaptBackendModel(rawDto);

  assert.equal(adapted.id, "nanobana_pro");
  assert.equal(adapted.name, "NanoBanana Pro");
  assert.equal(adapted.domain, "image");
  assert.equal(adapted.badge, "PRO");

  const p = adapted.parameters;

  // resolution
  assert.ok(p.resolution);
  assert.equal(p.resolution.type, "select");
  assert.equal(p.resolution.default, "1k");
  assert.deepEqual(p.resolution.values.map(v => v.value), ["1k", "2k", "4k"]);

  // aspect_ratio
  assert.ok(p.aspect_ratio);
  assert.equal(p.aspect_ratio.type, "select");
  assert.equal(p.aspect_ratio.default, "1:1");

  // quality
  assert.ok(p.quality);
  assert.equal(p.quality.type, "select");
  assert.deepEqual(p.quality.values.map(v => v.value), ["standard", "hd"]);

  // input_image (start frame slot)
  assert.ok(p.input_image);
  assert.equal(p.input_image.type, "image");
  assert.equal(p.input_image.role, "start_frame");
  assert.equal(p.input_image.group, "media");

  // reference_images (shelf)
  assert.ok(p.reference_images);
  assert.equal(p.reference_images.type, "image[]");
  assert.equal(p.reference_images.role, "reference_images");
  assert.equal(p.reference_images.group, "media");

  // seed
  assert.ok(p.seed);
  assert.equal(p.seed.type, "number");
  assert.equal(p.seed.group, "advanced");

  // prompt
  assert.ok(p.prompt);
  assert.equal(p.prompt.isPrompt, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Adapt Real ByteDance Seedance 2.5 Video Manifest
// ─────────────────────────────────────────────────────────────────────────────
test("Backend Adapter — Adapts real ByteDance Seedance 2.5 video manifest into V2 contract", () => {
  const rawSeedance = loadRealManifest("seedance_2_5");
  const rawDto = {
    key: rawSeedance.id,
    displayName: rawSeedance.displayName,
    category: rawSeedance.domain,
    description: rawSeedance.description,
    badge: "CINEMA",
    parameters: rawSeedance.canonicalInputs,
  };

  const adapted = adaptBackendModel(rawDto);

  assert.equal(adapted.id, "seedance_2_5");
  assert.equal(adapted.domain, "video");

  const p = adapted.parameters;

  // duration: in backend it is numbers [5, 10] or strings
  assert.ok(p.duration);
  assert.equal(p.duration.type, "select");
  assert.ok(p.duration.values.some(v => String(v.value) === "5"));
  assert.ok(p.duration.values.some(v => String(v.value) === "10"));

  // resolution
  assert.ok(p.resolution);
  assert.equal(p.resolution.type, "select");
  assert.deepEqual(p.resolution.values.map(v => v.value), ["480p", "720p", "1080p", "4k"]);

  // start and end frame slots
  assert.ok(p.input_image);
  assert.equal(p.input_image.type, "image");
  assert.equal(p.input_image.role, "start_frame");

  assert.ok(p.last_frame);
  assert.equal(p.last_frame.type, "image");
  assert.equal(p.last_frame.role, "end_frame");

  // generate_audio
  assert.ok(p.generate_audio);
  assert.equal(p.generate_audio.type, "boolean");
  assert.equal(p.generate_audio.default, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Real Model Transition & Reconciliation (NanoBanana Pro -> Seedance 2.5)
// ─────────────────────────────────────────────────────────────────────────────
test("Backend Adapter — Real model transition (NanoBanana Pro -> Seedance 2.5) reconciles cleanly", () => {
  const rawNano = loadRealManifest("nanobana_pro");
  const rawSeedance = loadRealManifest("seedance_2_5");

  const nanoModel = adaptBackendModel({
    key: rawNano.id,
    displayName: rawNano.displayName,
    category: rawNano.domain,
    parameters: rawNano.canonicalInputs,
  });

  const seedanceModel = adaptBackendModel({
    key: rawSeedance.id,
    displayName: rawSeedance.displayName,
    category: rawSeedance.domain,
    parameters: rawSeedance.canonicalInputs,
  });

  // State on NanoBanana Pro:
  const nanoState = {
    resolution: "2k",
    aspect_ratio: "16:9",
    quality: "hd",
    seed: 12345,
    reference_images: [{ url: "https://example.com/ref.jpg" }],
    input_image: "https://example.com/start.jpg",
  };

  // Switch to Seedance 2.5
  const { nextValues, changes } = reconcileState(
    nanoState,
    nanoModel.parameters,
    seedanceModel.parameters
  );

  // Compatible values that exist in Seedance:
  // aspect_ratio: "16:9" exists in Seedance -> PRESERVED
  assert.equal(nextValues.aspect_ratio, "16:9");

  // input_image: exists in Seedance -> PRESERVED
  assert.equal(nextValues.input_image, "https://example.com/start.jpg");

  // resolution: "2k" does NOT exist in Seedance (Seedance has 480p, 720p, 1080p, 4k) -> RESET to Seedance default ("720p")
  assert.equal(nextValues.resolution, "720p");

  // quality & reference_images: do not exist in Seedance -> REMOVED
  assert.equal(nextValues.quality, undefined);
  assert.equal(nextValues.reference_images, undefined);

  // duration & generate_audio: new parameters in Seedance -> INITIALIZED
  assert.ok(String(nextValues.duration) === "5");
  assert.equal(nextValues.generate_audio, true);

  // Validate state against Seedance definitions
  const valResult = validateAllParameters(seedanceModel.parameters, nextValues);
  assert.equal(valResult.isValid, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Real Model Serialization has ZERO Provider Internals
// ─────────────────────────────────────────────────────────────────────────────
test("Backend Adapter — Serialized request from real model contains zero provider leakage", () => {
  const rawSeedance = loadRealManifest("seedance_2_5");
  const seedanceModel = adaptBackendModel({
    key: rawSeedance.id,
    displayName: rawSeedance.displayName,
    category: rawSeedance.domain,
    parameters: rawSeedance.canonicalInputs,
  });

  const values = {
    duration: 5,
    resolution: "1080p",
    aspect_ratio: "16:9",
    generate_audio: true,
    input_image: "https://example.com/shot.jpg",
    provider: "wavespeed", // Attempted malicious injection
    providerId: "fake_provider_123",
  };

  const serialized = serializeSemanticRequest(
    seedanceModel.id,
    "Cinematic shot of neon city in rain",
    seedanceModel.parameters,
    values
  );

  assert.equal(serialized.model, "seedance_2_5");
  assert.equal(serialized.prompt, "Cinematic shot of neon city in rain");
  assert.deepEqual(serialized.parameters, {
    duration: 5,
    resolution: "1080p",
    aspect_ratio: "16:9",
    generate_audio: true,
    input_image: "https://example.com/shot.jpg",
  });

  assert.equal("provider" in serialized.parameters, false);
  assert.equal("providerId" in serialized.parameters, false);
});
