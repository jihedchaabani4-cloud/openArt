import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  selectPersistable,
  loadSaved,
  createSaver,
  removeSaved,
  DEFAULT_PERSIST_DEBOUNCE_MS,
} from "../store/persistence.js";

describe("store/persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createMockStorage(initialData = {}, throwOnSet = false) {
    const store = new Map(Object.entries(initialData));
    return {
      store,
      getItem: vi.fn((k) => (store.has(k) ? store.get(k) : null)),
      setItem: vi.fn((k, v) => {
        if (throwOnSet) throw new Error("QuotaExceededError");
        store.set(k, String(v));
      }),
      removeItem: vi.fn((k) => store.delete(k)),
    };
  }

  describe("selectPersistable", () => {
    it("returns canonical subset with v: 2 and never includes isGenerating", () => {
      const state = {
        prompt: "a majestic tiger",
        selectedModelId: "model-123",
        parameterValues: { aspect_ratio: "16:9", steps: 30 },
        elements: [{ id: "elem-1", url: "https://example.com/tiger.jpg" }],
        characters: [{ id: "char-1", url: "https://example.com/char.png" }],
        activeMode: "video",
        activeSubMode: "reference",
        isGenerating: true,
        extraUIProp: "ignored",
      };

      const persistable = selectPersistable(state);

      expect(persistable.v).toBe(2);
      expect(persistable.prompt).toBe("a majestic tiger");
      expect(persistable.selectedModelId).toBe("model-123");
      expect(persistable.activeMode).toBe("video");
      expect(persistable.activeSubMode).toBe("reference");
      expect(persistable.isGenerating).toBeUndefined();
      expect(persistable.extraUIProp).toBeUndefined();
    });

    it("drops File, Blob, blob: and data: URLs from parameterValues, elements, and characters", () => {
      const mockFile = { size: 1024, arrayBuffer: () => {} };
      const mockBlob = { size: 512, type: "image/png", arrayBuffer: () => {} };

      const state = {
        prompt: "test",
        isGenerating: false,
        parameterValues: {
          aspect_ratio: "1:1",
          start_frame: "blob:http://localhost:3000/1234-5678",
          end_frame: "data:image/png;base64,iVBORw0KGgo...",
          file_param: mockFile,
          blob_param: mockBlob,
          images: [
            { id: "img-valid", url: "https://cdn.example.com/asset.jpg" },
            { id: "img-blob", url: "blob:http://localhost:3000/temp" },
            mockFile,
          ],
        },
        elements: [
          { id: "elem-good", url: "https://cdn.example.com/elem.png" },
          { id: "elem-blob", url: "blob:http://localhost:3000/elem" },
        ],
        characters: [
          { id: "char-good", url: "https://cdn.example.com/char.png" },
          mockFile,
        ],
      };

      const persistable = selectPersistable(state);
      const json = JSON.stringify(persistable);

      // Verify that no blob: or data: string appears anywhere in raw JSON
      expect(json).not.toContain("blob:");
      expect(json).not.toContain("data:");
      expect(persistable.parameterValues.start_frame).toBeUndefined();
      expect(persistable.parameterValues.end_frame).toBeUndefined();
      expect(persistable.parameterValues.file_param).toBeUndefined();
      expect(persistable.parameterValues.blob_param).toBeUndefined();

      // Verify array filtering
      expect(persistable.parameterValues.images).toHaveLength(1);
      expect(persistable.parameterValues.images[0].id).toBe("img-valid");
      expect(persistable.elements).toHaveLength(1);
      expect(persistable.elements[0].id).toBe("elem-good");
      expect(persistable.characters).toHaveLength(1);
      expect(persistable.characters[0].id).toBe("char-good");
    });
  });

  describe("loadSaved", () => {
    it("returns parsed object when version is 2", () => {
      const savedData = {
        v: 2,
        prompt: "saved prompt",
        selectedModelId: "saved-model",
      };
      const storage = createMockStorage({ "test-key": JSON.stringify(savedData) });

      const loaded = loadSaved(storage, "test-key");
      expect(loaded).toEqual(savedData);
    });

    it("returns null if key is missing, invalid JSON, or wrong version", () => {
      const storage = createMockStorage({
        "bad-json": "not { json",
        "wrong-v": JSON.stringify({ v: 1, prompt: "old" }),
      });

      expect(loadSaved(storage, "missing-key")).toBeNull();
      expect(loadSaved(storage, "bad-json")).toBeNull();
      expect(loadSaved(storage, "wrong-v")).toBeNull();
    });

    it("returns null safely when storage throws an exception", () => {
      const throwingStorage = {
        getItem: vi.fn(() => {
          throw new Error("SecurityError: Access Denied");
        }),
      };

      expect(loadSaved(throwingStorage, "any-key")).toBeNull();
    });
  });

  describe("createSaver and debouncing", () => {
    it("debounces multiple rapid state changes into a single write", () => {
      let currentState = { prompt: "initial", v: 2 };
      const listeners = new Set();
      const storage = createMockStorage();
      const key = "pb2:test:default:global";

      const saver = createSaver({
        storage,
        key,
        getState: () => currentState,
        subscribe: (fn) => {
          listeners.add(fn);
          return () => listeners.delete(fn);
        },
        debounceMs: DEFAULT_PERSIST_DEBOUNCE_MS,
      });

      // 10 state changes within the debounce window
      for (let i = 1; i <= 10; i++) {
        currentState = { ...currentState, prompt: `update-${i}` };
        listeners.forEach((fn) => fn());
      }

      // No write should have happened immediately
      expect(storage.setItem).not.toHaveBeenCalled();

      // Advance time by 299ms (just before 300ms window)
      vi.advanceTimersByTime(299);
      expect(storage.setItem).not.toHaveBeenCalled();

      // Advance by remaining 1ms to trigger trailing write
      vi.advanceTimersByTime(1);
      expect(storage.setItem).toHaveBeenCalledTimes(1);

      const savedJson = storage.store.get(key);
      expect(JSON.parse(savedJson).prompt).toBe("update-10");

      saver.stop();
    });

    it("flush writes immediately and cancels pending timer", () => {
      let currentState = { prompt: "flushed", v: 2 };
      const listeners = new Set();
      const storage = createMockStorage();
      const key = "pb2:test:flush";

      const saver = createSaver({
        storage,
        key,
        getState: () => currentState,
        subscribe: (fn) => {
          listeners.add(fn);
          return () => listeners.delete(fn);
        },
      });

      listeners.forEach((fn) => fn());
      expect(storage.setItem).not.toHaveBeenCalled();

      saver.flush();
      expect(storage.setItem).toHaveBeenCalledTimes(1);

      // Advancing timer does NOT trigger a second write
      vi.advanceTimersByTime(500);
      expect(storage.setItem).toHaveBeenCalledTimes(1);

      saver.stop();
    });

    it("stop cancels pending writes and unsubscribes", () => {
      let currentState = { prompt: "stopped", v: 2 };
      const listeners = new Set();
      const storage = createMockStorage();
      const key = "pb2:test:stop";

      const saver = createSaver({
        storage,
        key,
        getState: () => currentState,
        subscribe: (fn) => {
          listeners.add(fn);
          return () => listeners.delete(fn);
        },
      });

      listeners.forEach((fn) => fn());
      saver.stop();

      vi.advanceTimersByTime(500);
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(listeners.size).toBe(0);
    });

    it("handles throwing storage gracefully without throwing error", () => {
      const storage = createMockStorage({}, true); // throws on setItem
      const saver = createSaver({
        storage,
        key: "pb2:test:error",
        getState: () => ({ prompt: "boom" }),
        subscribe: () => () => {},
      });

      expect(() => saver.flush()).not.toThrow();
      saver.stop();
    });
  });

  describe("removeSaved", () => {
    it("removes key from storage safely", () => {
      const storage = createMockStorage({ "k-1": "data" });
      removeSaved(storage, "k-1");
      expect(storage.getItem("k-1")).toBeNull();
    });
  });
});
