import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeEntity,
  addEntity,
  removeEntity,
  extractEntityIds,
  removeEntityWithPromptClean,
  selectElements,
  selectCharacters,
} from "../core/entityService.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";

// ── Unit Tests: entityService ─────────────────────────────────────────────────

test("entityService: normalizeEntity extracts canonical attributes for elements", () => {
  const rawElement = {
    workflow_id: "elem_tshirt_99",
    name: "Cyberpunk T-Shirt",
    preview: "https://example.com/shirt.png",
    workflow_type: "ELEMENT_SHEET",
  };

  const norm = normalizeEntity(rawElement, "element");
  assert.equal(norm.id, "elem_tshirt_99");
  assert.equal(norm.workflow_id, "elem_tshirt_99");
  assert.equal(norm.displayName, "Cyberpunk T-Shirt");
  assert.equal(norm.type, "element");
  assert.equal(norm.workflow_type, "ELEMENT_SHEET");
  assert.equal(norm.preview, "https://example.com/shirt.png");
});

test("entityService: normalizeEntity extracts canonical attributes for characters", () => {
  const rawCharacter = {
    id: "char_warrior_01",
    display_name: "Neon Warrior",
    url: "https://example.com/char.png",
    is_character: true,
  };

  const norm = normalizeEntity(rawCharacter, "character");
  assert.equal(norm.id, "char_warrior_01");
  assert.equal(norm.displayName, "Neon Warrior");
  assert.equal(norm.type, "character");
  assert.equal(norm.workflow_type, "CHARACTER_SHEET");
});

test("entityService: addEntity adds entity and prevents duplicates", () => {
  const item1 = { workflow_id: "elem_1", name: "Element 1", type: "element" };
  const item2 = { workflow_id: "elem_2", name: "Element 2", type: "element" };

  let list = [];
  list = addEntity(list, item1, "element");
  assert.equal(list.length, 1);
  assert.equal(list[0].id, "elem_1");

  list = addEntity(list, item2, "element");
  assert.equal(list.length, 2);

  list = addEntity(list, item1, "element");
  assert.equal(list.length, 2, "Should not add duplicate entity");
});

test("entityService: removeEntity removes entity by id or workflow_id", () => {
  const list = [
    { id: "e1", workflow_id: "e1", name: "E1" },
    { id: "e2", workflow_id: "e2", name: "E2" },
  ];

  const filtered = removeEntity(list, "e1");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "e2");
});

test("entityService: extractEntityIds returns clean list of string IDs", () => {
  const list = [
    { id: "elem_a", name: "A" },
    { workflow_id: "elem_b", name: "B" },
    "elem_c",
  ];

  const ids = extractEntityIds(list);
  assert.deepEqual(ids, ["elem_a", "elem_b", "elem_c"]);
});

test("entityService: removeEntityWithPromptClean removes entity and prompt tags", () => {
  const list = [{ id: "elem_sword", name: "Sword" }];
  const prompt = "A knight holding <element:elem_sword> in a castle";

  const { nextList, nextPrompt } = removeEntityWithPromptClean(list, "elem_sword", prompt);
  assert.equal(nextList.length, 0);
  assert.equal(nextPrompt, "A knight holding in a castle");
});

// ── Store Integration Tests: Single Source of Truth ───────────────────────────

const imageRefModel = {
  id: "flux_pro",
  name: "Flux Pro",
  domain: "image",
  parameters: {
    images: { type: "image[]", group: "media", max: 6 },
  },
};

test("Store: derives empty elements and characters initially with no mutable entity arrays", () => {
  const store = createPromptBarStore({}, { template: generatedMediaTemplate });
  const state = store.getState();

  assert.equal("elements" in state, false);
  assert.equal("characters" in state, false);
  assert.deepEqual(selectElements(state), []);
  assert.deepEqual(selectCharacters(state), []);
});

test("Store: attachMedia/removeMedia for elements and cascade prompt cleansing", () => {
  const store = createPromptBarStore({}, { template: generatedMediaTemplate });
  store.getState().setModels([imageRefModel]);
  store.getState().setPrompt("Hero with <element:elem_helmet> in ruins");

  store.getState().attachMedia({
    role: "reference",
    value: { workflow_id: "elem_helmet", name: "Cyber Helmet", workflow_type: "ELEMENT_SHEET" },
  });
  assert.equal(selectElements(store.getState()).length, 1);
  assert.equal(selectElements(store.getState())[0].id, "elem_helmet");

  store.getState().removeMedia({ role: "reference", value: { workflow_id: "elem_helmet" } });
  assert.equal(selectElements(store.getState()).length, 0);
  assert.equal(store.getState().prompt, "Hero with in ruins");
});

test("Store: attachMedia/removeMedia for characters and cascade prompt cleansing", () => {
  const store = createPromptBarStore({}, { template: generatedMediaTemplate });
  store.getState().setModels([imageRefModel]);
  store.getState().setPrompt("Portrait of <character:char_alice> at sunset");

  store.getState().attachMedia({
    role: "reference",
    value: { id: "char_alice", name: "Alice", is_character: true },
  });
  assert.equal(selectCharacters(store.getState()).length, 1);
  assert.equal(selectCharacters(store.getState())[0].id, "char_alice");

  store.getState().removeMedia({ role: "reference", value: { id: "char_alice" } });
  assert.equal(selectCharacters(store.getState()).length, 0);
  assert.equal(store.getState().prompt, "Portrait of at sunset");
});

test("Store: serialize derives elements and characters as string ID lists from parameterValues", () => {
  const store = createPromptBarStore({}, { template: generatedMediaTemplate });
  store.getState().setModels([imageRefModel]);
  store.getState().setPrompt("Testing generation");

  store.getState().attachMedia({ role: "reference", value: { workflow_id: "elem_101", name: "Jacket", type: "element" } });
  store.getState().attachMedia({ role: "reference", value: { workflow_id: "elem_102", name: "Boots", type: "element" } });
  store.getState().attachMedia({ role: "reference", value: { id: "char_201", name: "Geralt", type: "character" } });

  const serialized = store.getState().serialize();

  assert.equal(serialized.model, "flux_pro");
  assert.equal(serialized.prompt, "Testing generation");
  assert.deepEqual(serialized.elements, ["elem_101", "elem_102"]);
  assert.deepEqual(serialized.characters, ["char_201"]);
});

test("Store: reset clears attached entities", () => {
  const store = createPromptBarStore({}, { template: generatedMediaTemplate });
  store.getState().setModels([imageRefModel]);
  store.getState().attachMedia({ role: "reference", value: { workflow_id: "elem_101", name: "Jacket", type: "element" } });
  store.getState().attachMedia({ role: "reference", value: { id: "char_201", name: "Geralt", type: "character" } });

  store.getState().reset();
  assert.deepEqual(selectElements(store.getState()), []);
  assert.deepEqual(selectCharacters(store.getState()), []);
});

test("Store: serialize extracts workflow IDs into parameters and references without raw URLs", () => {
  const store = createPromptBarStore({ activeMode: "video", activeSubMode: "frames" }, { template: generatedMediaTemplate });
  store.getState().setModels([
    {
      id: "seedance_2_5",
      name: "ByteDance Seedance 2.5",
      domain: "video",
      capabilities: { input_image: true, last_frame: true },
      parameters: {
        prompt: { type: "text", required: true },
        input_image: { type: "image", group: "media" },
        last_frame: { type: "image", group: "media" },
        duration: { type: "select", values: [{ value: "5" }, { value: "10" }] },
      },
    },
  ]);
  store.getState().setPrompt("A cyber samurai walking in the rain");
  store.getState().setSetting("duration", "5");
  store.getState().attachMedia({
    role: "start",
    value: {
      workflow_id: "wf_start_001",
      url: "https://cdn.example.com/start.png",
    },
  });
  store.getState().attachMedia({
    role: "end",
    value: {
      workflow_id: "wf_end_002",
      url: "https://cdn.example.com/end.png",
    },
  });

  const serialized = store.getState().serialize();

  assert.equal(serialized.model, "seedance_2_5");
  assert.equal(serialized.prompt, "A cyber samurai walking in the rain");
  assert.equal(serialized.parameters.duration, "5");
  assert.equal(serialized.parameters.input_image, "wf_start_001");
  assert.equal(serialized.parameters.last_frame, "wf_end_002");
  assert.ok(Array.isArray(serialized.references));
  assert.ok(serialized.references.includes("wf_start_001"));
  assert.ok(serialized.references.includes("wf_end_002"));
  assert.ok(!serialized.references.some((r) => r.startsWith("http")));
});
