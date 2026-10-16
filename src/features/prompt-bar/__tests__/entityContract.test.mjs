import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeEntity,
  addEntity,
  removeEntity,
  extractEntityIds,
  removeEntityWithPromptClean,
} from "../core/entityService.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";

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

  // Adding item2
  list = addEntity(list, item2, "element");
  assert.equal(list.length, 2);

  // Duplicate add of item1
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

// ── Store Integration Tests: createPromptBarStore ─────────────────────────────

test("Store: initial state contains empty elements and characters arrays", () => {
  const store = createPromptBarStore();
  const state = store.getState();

  assert.deepEqual(state.elements, []);
  assert.deepEqual(state.characters, []);
});

test("Store: addElement, removeElement, and cascade prompt cleansing", () => {
  const store = createPromptBarStore();
  store.getState().setPrompt("Hero with <element:elem_helmet> in ruins");

  store.getState().addElement({ workflow_id: "elem_helmet", name: "Cyber Helmet" });
  assert.equal(store.getState().elements.length, 1);
  assert.equal(store.getState().elements[0].id, "elem_helmet");

  // Remove element: verifies both state removal and prompt cleanup
  store.getState().removeElement("elem_helmet");
  assert.equal(store.getState().elements.length, 0);
  assert.equal(store.getState().prompt, "Hero with in ruins");
});

test("Store: addCharacter, removeCharacter, and cascade prompt cleansing", () => {
  const store = createPromptBarStore();
  store.getState().setPrompt("Portrait of <character:char_alice> at sunset");

  store.getState().addCharacter({ id: "char_alice", name: "Alice", is_character: true });
  assert.equal(store.getState().characters.length, 1);
  assert.equal(store.getState().characters[0].id, "char_alice");

  // Remove character: verifies both state removal and prompt cleanup
  store.getState().removeCharacter("char_alice");
  assert.equal(store.getState().characters.length, 0);
  assert.equal(store.getState().prompt, "Portrait of at sunset");
});

test("Store: serialize outputs elements and characters as string ID lists", () => {
  const store = createPromptBarStore();
  store.getState().setModels([
    { id: "flux_pro", name: "Flux Pro", domain: "image", parameters: {} },
  ]);
  store.getState().selectModel("flux_pro");
  store.getState().setPrompt("Testing generation");

  store.getState().addElement({ workflow_id: "elem_101", name: "Jacket" });
  store.getState().addElement({ workflow_id: "elem_102", name: "Boots" });
  store.getState().addCharacter({ id: "char_201", name: "Geralt" });

  const serialized = store.getState().serialize();

  assert.equal(serialized.model, "flux_pro");
  assert.equal(serialized.prompt, "Testing generation");
  assert.deepEqual(serialized.elements, ["elem_101", "elem_102"]);
  assert.deepEqual(serialized.characters, ["char_201"]);
});

test("Store: reset resets elements and characters to empty arrays", () => {
  const store = createPromptBarStore();
  store.getState().addElement({ workflow_id: "elem_101", name: "Jacket" });
  store.getState().addCharacter({ id: "char_201", name: "Geralt" });

  store.getState().reset();
  assert.deepEqual(store.getState().elements, []);
  assert.deepEqual(store.getState().characters, []);
});

test("Store: serialize extracts workflow IDs into parameters and references without raw URLs", () => {
  const store = createPromptBarStore();
  store.getState().setModels([
    {
      id: "seedance_2_5",
      name: "ByteDance Seedance 2.5",
      domain: "video",
      parameters: {
        prompt: { type: "text", required: true },
        input_image: { type: "image", group: "media" },
        last_frame: { type: "image", group: "media" },
        duration: { type: "select", values: [{ value: "5" }, { value: "10" }] },
      },
    },
  ]);
  store.getState().selectModel("seedance_2_5");
  store.getState().setPrompt("A cyber samurai walking in the rain");
  store.getState().setParameter("duration", "5");
  store.getState().setParameter("input_image", {
    workflow_id: "wf_start_001",
    url: "https://cdn.example.com/start.png",
  });
  store.getState().setParameter("last_frame", {
    workflow_id: "wf_end_002",
    url: "https://cdn.example.com/end.png",
  });
  store.getState().addElement({ workflow_id: "elem_sword", name: "Katana" });

  const serialized = store.getState().serialize();

  assert.equal(serialized.model, "seedance_2_5");
  assert.equal(serialized.prompt, "A cyber samurai walking in the rain");
  assert.equal(serialized.parameters.duration, "5");
  assert.equal(serialized.parameters.input_image, "wf_start_001");
  assert.equal(serialized.parameters.last_frame, "wf_end_002");
  assert.deepEqual(serialized.elements, ["elem_sword"]);
  assert.ok(Array.isArray(serialized.references));
  assert.ok(serialized.references.includes("wf_start_001"));
  assert.ok(serialized.references.includes("wf_end_002"));
  assert.ok(serialized.references.includes("elem_sword"));
  assert.ok(!serialized.references.some((r) => r.startsWith("http")));
});

