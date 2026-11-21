/**
 * Black-Box Core Boundary & Invariant Tests
 *
 * Verifies:
 * (a) Zero leaked raw setters / escape hatches on sealed store & public services
 * (b) promptBarService.run() enforces strict allowlist (mounted & unmounted)
 * (c) setSetting() validates against model schema & rejects media slot keys
 * (d) Single source of truth: switchMode leaves zero orphan entities, attachMedia normalizes
 *     entities & enforces quota for characterTemplate's `references` slot, swapFrames & clearDraft
 *     are atomic (1 notification), pendingActions drains when setModels arrives, applyGeneration
 *     bumps promptFillNonce & validates settings & media through attachMedia/quota rules.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { createBoundPromptBarService } from "../store/publicActions.js";
import { createRegistry } from "../store/registry.js";
import { promptBarService } from "../api/promptBarService.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import { characterTemplate } from "../templates/character.template.js";
import { selectElements, selectCharacters } from "../core/entityService.js";
import { REASONS } from "../core/commandResult.js";
import * as publicExports from "../index.js";
import {
  fixtureModels,
  normalizedFramesModel,
  normalizedImagesListModel,
} from "./fixtures/models.fixture.js";

const FORBIDDEN_RAW_MUTATORS = [
  "_store",
  "setActiveMode",
  "setActiveSubMode",
  "setTemplate",
  "setParametersBatch",
  "setParameter",
  "addElement",
  "removeElement",
  "setElements",
  "addCharacter",
  "removeCharacter",
  "setCharacters",
  "clearEntities",
  "clearMediaReferences",
  "elements",
  "characters",
];

function createMockStorage() {
  const map = new Map();
  return {
    getItem: vi.fn((k) => (map.has(k) ? map.get(k) : null)),
    setItem: vi.fn((k, v) => map.set(k, String(v))),
    removeItem: vi.fn((k) => map.delete(k)),
    clear: vi.fn(() => map.clear()),
  };
}

describe("Black-Box Core Boundary & Invariants", () => {
  let reg;
  let storage;

  beforeEach(() => {
    reg = createRegistry();
    storage = createMockStorage();
  });

  describe("(a) Sealed store & public service expose zero raw setters or escape hatches", () => {
    it("sealed store state has none of the forbidden raw setters or mutable entity arrays", () => {
      const store = createPromptBarStore({}, { template: generatedMediaTemplate });
      const state = store.getState();

      for (const forbidden of FORBIDDEN_RAW_MUTATORS) {
        expect(forbidden in state).toBe(false);
        expect(state[forbidden]).toBeUndefined();
      }
    });

    it("bound React service (createBoundPromptBarService) and external promptBarService expose zero raw setters", () => {
      const identity = { templateId: "generated-media", projectId: "p1", instanceId: "default" };
      const store = createPromptBarStore({ identity }, { template: generatedMediaTemplate });
      reg.getOrCreate(identity, () => store);
      reg.markMounted(identity);

      const boundService = createBoundPromptBarService(store);
      const externalService = promptBarService(identity, { registry: reg, storage });

      for (const forbidden of FORBIDDEN_RAW_MUTATORS) {
        expect(forbidden in boundService).toBe(false);
        expect(forbidden in externalService).toBe(false);
      }

      // Template actions are exposed automatically on boundService
      expect(typeof boundService.addReference).toBe("function");
      expect(typeof boundService.animateMedia).toBe("function");
      expect(typeof boundService.applyGeneration).toBe("function");
    });

    it("index.js exports ONLY the sealed public API (no raw store factory or deleted composition shims)", () => {
      expect(typeof publicExports.promptBarService).toBe("function");
      expect(typeof publicExports.usePromptBarService).toBe("function");
      expect(typeof publicExports.usePromptBarState).toBe("function");
      expect(typeof publicExports.usePromptBarSnapshot).toBe("function");
      expect(typeof publicExports.PromptBarStoreProvider).toBe("function");
      expect(typeof publicExports.selectElements).toBe("function");
      expect(typeof publicExports.selectCharacters).toBe("function");

      expect(publicExports.createPromptBarStore).toBeUndefined();
      expect(publicExports.usePromptBarStore).toBeUndefined();
      expect(publicExports.createPromptBarType).toBeUndefined();
      expect(publicExports.generatedMediaType).toBeUndefined();
      expect(publicExports.characterType).toBeUndefined();
    });
  });

  describe("(b) promptBarService.run() rejects private & non-allowlisted action names", () => {
    const forbiddenNames = [
      "_store",
      "setParameter",
      "setParametersBatch",
      "setActiveMode",
      "setActiveSubMode",
      "setTemplate",
      "addElement",
      "addCharacter",
      "clearEntities",
      "hydrate",
      "setModels",
      "setState",
      "serialize",
      "unknownPrivateMethod",
    ];

    it("rejects all non-allowlisted names on a mounted instance without mutating state", () => {
      const identity = { templateId: "generated-media", projectId: "p1", instanceId: "default" };
      const store = createPromptBarStore({ identity }, { template: generatedMediaTemplate });
      store.getState().setModels(fixtureModels);
      reg.getOrCreate(identity, () => store);
      reg.markMounted(identity);

      const service = promptBarService(identity, { registry: reg, storage });
      const listener = vi.fn();
      store.subscribe(listener);

      for (const name of forbiddenNames) {
        const res = service.run(name, "arg1", "arg2");
        expect(res.ok).toBe(false);
        expect(res.reason).toBe(REASONS.INVALID_ARGUMENT);
      }

      expect(listener).not.toHaveBeenCalled();
    });

    it("rejects all non-allowlisted names even when unmounted (never enqueues them)", () => {
      const identity = { templateId: "generated-media", projectId: "p1", instanceId: "unmounted" };
      const service = promptBarService(identity, { registry: reg, storage });

      for (const name of forbiddenNames) {
        const res = service.run(name, "arg1");
        expect(res.ok).toBe(false);
        expect(res.reason).toBe(REASONS.INVALID_ARGUMENT);
      }

      expect(storage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("(c) setSetting validates against schema & rejects media slot keys", () => {
    it("rejects all media keys so media can only flow through media commands", () => {
      const store = createPromptBarStore({}, { template: generatedMediaTemplate });
      store.getState().setModels(fixtureModels);

      const mediaKeys = [
        "images",
        "reference_images",
        "references",
        "input_image",
        "last_frame",
        "start_frame",
        "end_frame",
        "input_video",
      ];

      for (const key of mediaKeys) {
        const res = store.getState().setSetting(key, { workflow_id: "illegal" });
        expect(res.ok).toBe(false);
        expect(res.reason).toBe(REASONS.INVALID_ARGUMENT);
        expect(store.getState().parameterValues[key]).not.toEqual({ workflow_id: "illegal" });
      }
    });

    it("validates non-media settings against active model schema and rejects invalid/unknown values", () => {
      const store = createPromptBarStore({}, { template: generatedMediaTemplate });
      store.getState().setModels(fixtureModels); // picks nanobana_pro in image mode

      const okRes = store.getState().setSetting("resolution", "2K");
      expect(okRes.ok).toBe(true);
      expect(store.getState().parameterValues.resolution).toBe("2K");

      // Invalid option value
      const badValRes = store.getState().setSetting("resolution", "999K");
      expect(badValRes.ok).toBe(false);
      expect(badValRes.reason).toBe(REASONS.INVALID_ARGUMENT);
      expect(store.getState().parameterValues.resolution).toBe("2K");

      // Unknown parameter key for active model
      const unknownKeyRes = store.getState().setSetting("duration", 10);
      expect(unknownKeyRes.ok).toBe(false);
      expect(unknownKeyRes.reason).toBe(REASONS.INVALID_ARGUMENT);
    });
  });

  describe("(d) Single source of truth, atomic commands, quota & async pending drain", () => {
    it("switchMode leaves zero orphan entities and removes them from serialized output", () => {
      const store = createPromptBarStore({}, { template: generatedMediaTemplate });
      store.getState().setModels(fixtureModels);

      // Attach raw character & element workflows (without pre-normalizing)
      const r1 = store.getState().attachMedia({
        role: "reference",
        value: { id: "wf_char_1", workflow_type: "CHARACTER_SHEET", name: "Aria", image_count: 2 },
      });
      const r2 = store.getState().attachMedia({
        role: "reference",
        value: { id: "wf_elem_1", workflow_type: "ELEMENT_SHEET", name: "Sword", image_count: 1 },
      });
      expect(r1.ok).toBe(true);
      expect(r2.ok).toBe(true);

      // Entities normalized and derived from parameterValues
      expect(selectCharacters(store.getState())).toHaveLength(1);
      expect(selectCharacters(store.getState())[0].type).toBe("character");
      expect(selectElements(store.getState())).toHaveLength(1);
      expect(selectElements(store.getState())[0].type).toBe("element");

      // Switch to video/frames -> zero orphan entities
      const sw = store.getState().switchMode("video", "frames");
      expect(sw.ok).toBe(true);
      expect(selectCharacters(store.getState())).toEqual([]);
      expect(selectElements(store.getState())).toEqual([]);

      const payload = store.getState().serialize();
      expect(payload.characters).toEqual([]);
      expect(payload.elements).toEqual([]);
      expect(payload.references).toEqual([]);
    });

    it("attachMedia respects quota for characterTemplate's `references` slot (mediaLimit: 4)", () => {
      const store = createPromptBarStore({}, { template: characterTemplate });

      for (let i = 1; i <= 4; i++) {
        const res = store.getState().attachMedia({
          role: "reference",
          value: { id: `char_ref_${i}`, url: `https://example.com/${i}.png` },
        });
        expect(res.ok).toBe(true);
      }

      expect(store.getState().parameterValues.references).toHaveLength(4);

      const overflow = store.getState().attachMedia({
        role: "reference",
        value: { id: "char_ref_5", url: "https://example.com/5.png" },
      });
      expect(overflow.ok).toBe(false);
      expect(overflow.reason).toBe(REASONS.MAX_MEDIA_REACHED);
      expect(store.getState().parameterValues.references).toHaveLength(4);
    });

    it("swapFrames and clearDraft are atomic (1 notification each) and clearDraft preserves model settings", () => {
      const store = createPromptBarStore(
        { activeMode: "video", activeSubMode: "frames" },
        { template: generatedMediaTemplate }
      );
      store.getState().setModels(fixtureModels);
      store.getState().setPrompt("Epic drone shot");
      store.getState().setSetting("duration", 10);
      store.getState().attachMedia({ role: "start", value: { workflow_id: "start_wf" } });
      store.getState().attachMedia({ role: "end", value: { workflow_id: "end_wf" } });

      const listener = vi.fn();
      store.subscribe(listener);

      // 1. swapFrames is 1 atomic notification
      const swapRes = store.getState().swapFrames();
      expect(swapRes.ok).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(store.getState().parameterValues.input_image.workflow_id).toBe("end_wf");
      expect(store.getState().parameterValues.last_frame.workflow_id).toBe("start_wf");

      // 2. clearDraft is 1 atomic notification, wipes prompt & media, keeps duration=10
      const clearRes = store.getState().clearDraft();
      expect(clearRes.ok).toBe(true);
      expect(listener).toHaveBeenCalledTimes(2);
      expect(store.getState().prompt).toBe("");
      expect(store.getState().parameterValues.input_image).toBeUndefined();
      expect(store.getState().parameterValues.last_frame).toBeUndefined();
      expect(store.getState().parameterValues.duration).toBe(10);
    });

    it("pendingActions drains synchronously when setModels arrives for an async-loaded store", async () => {
      const { registry: globalRegistry } = await import("../store/registry.js");
      const identity = {
        templateId: "generated-media",
        instanceId: "async-drain-test",
        projectId: "proj_async_drain",
      };

      // Queue action while unmounted
      const extService = promptBarService(identity, { registry: globalRegistry, storage });
      const q = extService.addReference({ workflow_id: "wf_queued_ref", url: "https://example.com/q.png" });
      expect(q.ok).toBe(false);
      expect(q.reason).toBe(REASONS.NOT_MOUNTED);
      expect(q.details?.queued).toBe(true);

      // Mount store with empty models first (models arrive asynchronously)
      const store = globalRegistry.getOrCreate(
        identity,
        () => createPromptBarStore({ identity }, { template: generatedMediaTemplate }),
        { storage }
      );
      globalRegistry.markMounted(identity, { storage });
      expect(store.getState().parameterValues.images).toBeUndefined();

      // Models arrive via setModels -> selects eligible image model AND drains pendingActions synchronously
      store.getState().setModels(fixtureModels);

      expect(store.getState().selectedModelId).toBe(normalizedImagesListModel.id);
      expect(store.getState().parameterValues.images).toHaveLength(1);
      expect(store.getState().parameterValues.images[0].workflow_id).toBe("wf_queued_ref");

      // Clean up global registry entry
      globalRegistry.markUnmounted(identity);
      globalRegistry.dispose(identity);
    });

    it("applyGeneration bumps promptFillNonce, validates settings via validateParameter, and attaches references via attachMedia", () => {
      const store = createPromptBarStore({}, { template: generatedMediaTemplate });
      store.getState().setModels(fixtureModels);
      const beforeNonce = store.getState().promptFillNonce;

      const res = store.actions.applyGeneration({
        mode: "video",
        subMode: "frames",
        modelId: normalizedFramesModel.id,
        prompt: "Reused cinematic shot",
        parameters: {
          duration: 10,
          resolution: "INVALID_RES_999K", // must be rejected by validateParameter
          input_image: { workflow_id: "wf_start_reused", url: "https://example.com/s.png" },
        },
        replaceParameters: true,
      });

      expect(res.ok).toBe(true);
      expect(store.getState().prompt).toBe("Reused cinematic shot");
      expect(store.getState().promptFillNonce).toBe(beforeNonce + 1);
      expect(store.getState().parameterValues.duration).toBe(10);
      expect(store.getState().parameterValues.resolution).toBe("720p"); // default kept, invalid rejected
      expect(store.getState().parameterValues.input_image).toMatchObject({
        workflow_id: "wf_start_reused",
        type: "image",
      });
    });
  });
});
