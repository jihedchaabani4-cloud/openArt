/**
 * Tags & Reference Synchronization Contract Tests
 *
 * Validates:
 * 1. tagsService cleanTagsForAsset (bidirectional cleanup on reference deletion)
 * 2. tagsService autoAssignReference (auto-adding reference on @ tag)
 * 3. tagsService getActiveReferences (extracting live slot assets)
 * 4. tagsResolver serialization and parsing against backend format
 * 5. End-to-end cascading cleanup with PromptBar store
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  cleanTagsForAsset,
  cleanAllTags,
  isAssetReferencedInPrompt,
  getActiveReferences,
  autoAssignReference,
  getAssetId,
} from "../core/tagsService.js";

import {
  serializeTag,
  parsePromptTags,
  resolveTagsWithReferences,
} from "../core/tagsResolver.js";

import { createPromptBarStore } from "../store/createPromptBarStore.js";

// Mock slots configuration
const MOCK_FRAMES_SLOTS = [
  { role: "start", label: "Start Frame", accepts: "image/*" },
  { role: "end", label: "End Frame", accepts: "image/*" },
];

const MOCK_FEATURE_CONFIG = {
  resolveParameterMapping: (model, role) => {
    if (role === "start") return "input_image";
    if (role === "end") return "last_frame";
    if (role === "reference") return "reference_images";
    return null;
  },
};

test("Tags Service: cleanTagsForAsset removes specific asset tags and cleans whitespace", () => {
  const prompt = "A photo of <MediaAsset: asset_123> walking beside <MediaAsset:asset_456> in the rain";
  const cleaned = cleanTagsForAsset(prompt, "asset_123");

  assert.equal(cleaned, "A photo of walking beside <MediaAsset:asset_456> in the rain");
  assert.equal(isAssetReferencedInPrompt(cleaned, "asset_123"), false);
  assert.equal(isAssetReferencedInPrompt(cleaned, "asset_456"), true);
});

test("Tags Service: cleanTagsForAsset cleans different tag prefixes (<character>, <element>, <media>)", () => {
  const prompt = "Cyberpunk <character:char_1> holding <element:elem_2> near <media:media_3>";
  
  const cleanedChar = cleanTagsForAsset(prompt, "char_1");
  assert.equal(cleanedChar, "Cyberpunk holding <element:elem_2> near <media:media_3>");

  const cleanedBoth = cleanTagsForAsset(cleanedChar, ["elem_2", "media_3"]);
  assert.equal(cleanedBoth, "Cyberpunk holding near");
});

test("Tags Service: cleanAllTags removes all tag markers", () => {
  const prompt = "Create a portrait of <character:abc-123> with style <MediaAsset:def-456>";
  const cleaned = cleanAllTags(prompt);
  assert.equal(cleaned, "Create a portrait of with style");
});

test("Tags Service: getActiveReferences extracts active references correctly", () => {
  const paramValues = {
    input_image: { workflow_id: "wf_start", displayName: "Start Frame", url: "https://img.com/start.png" },
    last_frame: { id: "wf_end", name: "End Frame", url: "https://img.com/end.png" },
  };

  const refs = getActiveReferences(MOCK_FRAMES_SLOTS, paramValues, MOCK_FEATURE_CONFIG);
  assert.equal(refs.length, 2);
  assert.equal(refs[0].role, "start");
  assert.equal(refs[0].backendKey, "input_image");
  assert.equal(refs[0].assetId, "wf_start");
  assert.equal(refs[1].role, "end");
  assert.equal(refs[1].backendKey, "last_frame");
  assert.equal(refs[1].assetId, "wf_end");
});

test("Tags Service: autoAssignReference assigns new asset to first empty slot", () => {
  const paramValues = {};
  const setCalls = [];
  const setParameter = (key, val) => {
    paramValues[key] = val;
    setCalls.push({ key, val });
  };

  const asset1 = { workflow_id: "asset_alpha", name: "Alpha", url: "https://img.com/a.png" };
  const res1 = autoAssignReference({
    asset: asset1,
    activeSlots: MOCK_FRAMES_SLOTS,
    paramValues,
    featureConfig: MOCK_FEATURE_CONFIG,
    setParameter,
  });

  assert.equal(res1.assigned, true);
  assert.equal(res1.slotRole, "start");
  assert.equal(res1.backendKey, "input_image");
  assert.equal(paramValues.input_image.workflow_id, "asset_alpha");

  // Assign second asset to second slot
  const asset2 = { id: "asset_beta", name: "Beta", url: "https://img.com/b.png" };
  const res2 = autoAssignReference({
    asset: asset2,
    activeSlots: MOCK_FRAMES_SLOTS,
    paramValues,
    featureConfig: MOCK_FEATURE_CONFIG,
    setParameter,
  });

  assert.equal(res2.assigned, true);
  assert.equal(res2.slotRole, "end");
  assert.equal(res2.backendKey, "last_frame");
  assert.equal(paramValues.last_frame.id, "asset_beta");

  // Third asset when slots are full
  const asset3 = { id: "asset_gamma" };
  const res3 = autoAssignReference({
    asset: asset3,
    activeSlots: MOCK_FRAMES_SLOTS,
    paramValues,
    featureConfig: MOCK_FEATURE_CONFIG,
    setParameter,
  });

  assert.equal(res3.assigned, false);
  assert.equal(res3.full, true);
});

test("Tags Service: autoAssignReference prevents duplicate assignment if already in a slot", () => {
  const paramValues = {
    input_image: { workflow_id: "asset_alpha", name: "Alpha" },
  };
  let called = false;
  const setParameter = () => { called = true; };

  const res = autoAssignReference({
    asset: { workflow_id: "asset_alpha" },
    activeSlots: MOCK_FRAMES_SLOTS,
    paramValues,
    featureConfig: MOCK_FEATURE_CONFIG,
    setParameter,
  });

  assert.equal(res.assigned, false);
  assert.equal(res.alreadyAssigned, true);
  assert.equal(res.slotRole, "start");
  assert.equal(called, false);
});

test("Tags Resolver: serializeTag generates canonical token matching backend expectations", () => {
  assert.equal(serializeTag("uuid-123", "media"), "<MediaAsset:uuid-123>");
  assert.equal(serializeTag("char-456", "character"), "<character:char-456>");
  assert.equal(serializeTag("elem-789", "element"), "<element:elem-789>");
});

test("Tags Resolver: parsePromptTags extracts tags with positions and types", () => {
  const prompt = "Scene with <character:c-1> and <MediaAsset:m-2>";
  const parsed = parsePromptTags(prompt);

  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].type, "character");
  assert.equal(parsed[0].assetId, "c-1");
  assert.equal(parsed[1].type, "mediaasset");
  assert.equal(parsed[1].assetId, "m-2");
});

test("Tags Resolver: resolveTagsWithReferences separates valid from orphan tags", () => {
  const activeRefs = [
    { assetId: "active-1", displayName: "Active 1" },
  ];
  const prompt = "<MediaAsset:active-1> and <MediaAsset:orphan-2>";
  const { validTags, orphanTags } = resolveTagsWithReferences(prompt, activeRefs);

  assert.equal(validTags.length, 1);
  assert.equal(validTags[0].assetId, "active-1");
  assert.equal(orphanTags.length, 1);
  assert.equal(orphanTags[0].assetId, "orphan-2");
});

test("Integration: Deleting reference slot cleanses prompt in store", () => {
  const store = createPromptBarStore();
  
  // Set up prompt with two tags
  store.getState().setPrompt("A video transitioning from <MediaAsset:start_id> to <MediaAsset:end_id>");
  store.getState().setParameter("input_image", { workflow_id: "start_id" });
  store.getState().setParameter("last_frame", { workflow_id: "end_id" });

  // Simulate user removing start frame slot
  const removedId = getAssetId(store.getState().parameterValues.input_image);
  assert.equal(removedId, "start_id");

  // 1. Remove slot
  store.getState().setParameter("input_image", undefined);
  // 2. Clean prompt
  const updatedPrompt = cleanTagsForAsset(store.getState().prompt, removedId);
  store.getState().setPrompt(updatedPrompt);

  assert.equal(store.getState().prompt, "A video transitioning from to <MediaAsset:end_id>");
  assert.equal(store.getState().parameterValues.input_image, undefined);
  assert.equal(store.getState().parameterValues.last_frame.workflow_id, "end_id");
});
