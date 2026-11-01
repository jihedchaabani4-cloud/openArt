/**
 * Prompt fill animation tests: programmatic prompt fills play a one-shot
 * ShineText sweep in the editor; user typing never animates (PB decision on
 * fill chiralitiy — see DECISIONS.md PB-D-24).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, act, cleanup } from "@testing-library/react";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { selectPersistable } from "../store/persistence.js";
import { createRegistry } from "../store/registry.js";
import { promptBarService } from "../api/promptBarService.js";
import { drainPendingActions } from "../store/pendingActions.js";
import { PromptEditor } from "../ui/common/editor/PromptEditor.jsx";
import { SHINE_TEXT_SWEEP_MS } from "@/shared/ui/ShineText";

function createMockStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    _raw: store,
  };
}

describe("Prompt fill animation: programmatic fills shine once, typing never", () => {
  const identity = {
    templateId: "generated-media",
    projectId: "proj_fill",
    instanceId: "default",
  };

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  // ── Store ────────────────────────────────────────────────────────────────

  it("setPromptExternal sets the prompt and bumps promptFillNonce in ONE notification", () => {
    const store = createPromptBarStore({});
    let notifications = 0;
    store.subscribe(() => {
      notifications++;
    });

    store.getState().setPromptExternal("Generated description");

    expect(store.getState().prompt).toBe("Generated description");
    expect(store.getState().promptFillNonce).toBe(1);
    expect(notifications).toBe(1);
  });

  it("user typing (setPrompt) updates the prompt but never bumps the fill nonce", () => {
    const store = createPromptBarStore({});
    store.getState().setPromptExternal("External text");
    store.getState().setPrompt("User typed something");

    expect(store.getState().prompt).toBe("User typed something");
    expect(store.getState().promptFillNonce).toBe(1);
  });

  it("reset does not bump the fill nonce (reset is not an animated fill)", () => {
    const store = createPromptBarStore({});
    store.getState().setPromptExternal("Before reset");
    store.getState().reset();

    expect(store.getState().prompt).toBe("");
    expect(store.getState().promptFillNonce).toBe(1);
  });

  // ── Persistence: the nonce is transient UI state ─────────────────────────

  it("promptFillNonce is NEVER persisted (transient like isGenerating), prompt is", () => {
    const store = createPromptBarStore({});
    store.getState().setPromptExternal("Persisted prompt text");

    const saved = selectPersistable(store.getState());
    expect(saved.prompt).toBe("Persisted prompt text");
    expect(Object.hasOwn(saved, "promptFillNonce")).toBe(false);
  });

  // ── Service + queue replay ride the external path ────────────────────────

  it("service dispatch (mounted instance) sets prompt through the external path, bumping the nonce", () => {
    const registry = createRegistry();
    const storage = createMockStorage();

    const store = createPromptBarStore({
      prompt: "Initial",
      selectedModelId: "model_1",
    });
    registry.getOrCreate(identity, () => store);
    registry.markMounted(identity);

    const service = promptBarService(identity, { registry, storage });
    const res = service.setPrompt("Generated prompt via service");

    expect(res.ok).toBe(true);
    expect(store.getState().prompt).toBe("Generated prompt via service");
    expect(store.getState().promptFillNonce).toBe(1);
  });

  it("queued setPrompt replayed on mount rides the external path (nonce bumped exactly once)", () => {
    const registry = createRegistry();
    const storage = createMockStorage();

    const service = promptBarService(identity, { registry, storage });
    const res = service.setPrompt("Queued description");
    expect(res.ok).toBe(false);
    expect(res.details?.queued).toBe(true);

    const store = createPromptBarStore({
      prompt: "Original on mount",
      selectedModelId: "model_1",
    });
    registry.getOrCreate(identity, () => store);
    registry.markMounted(identity);

    const drainRes = drainPendingActions(identity, { registry, storage, currentProjectId: "proj_fill" });
    expect(drainRes.executed).toBe(1);

    expect(store.getState().prompt).toBe("Queued description");
    expect(store.getState().promptFillNonce).toBe(1);

    // Second drain must not re-animate (nothing left to replay)
    const drainRes2 = drainPendingActions(identity, { registry, storage, currentProjectId: "proj_fill" });
    expect(drainRes2.executed).toBe(0);
    expect(store.getState().promptFillNonce).toBe(1);
  });

  // ── Editor: class present during sweep, removed after one cycle ──────────

  it("PromptEditor gains the one-shot sweep classes on fillNonce change and drops them after one cycle", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <PromptEditor value="" onChange={() => {}} fillNonce={0} />
    );
    const editable = container.querySelector('[contenteditable="true"]');
    expect(editable).toBeDefined();
    expect(editable.className).not.toContain("shine-text--sweep");

    rerender(<PromptEditor value="Generated description" onChange={() => {}} fillNonce={1} />);
    expect(editable.className).toContain("shine-text--sweep");
    expect(editable.className).toContain("shine-text--sweep--once");

    rerender(<PromptEditor value="Generated description" onChange={() => {}} fillNonce={1} />);

    act(() => {
      vi.advanceTimersByTime(SHINE_TEXT_SWEEP_MS + 500);
    });
    expect(editable.className).not.toContain("shine-text--sweep");

    // Same nonce again → no re-animation
    rerender(<PromptEditor value="Generated description" onChange={() => {}} fillNonce={1} />);
    expect(editable.className).not.toContain("shine-text--sweep");
  });

  // ── Platform wiring (source contract) ────────────────────────────────────

  it("PromptBarPlatform reads promptFillNonce and passes fillNonce to PromptEditor (default for all templates)", () => {
    const platformPath = path.resolve(__dirname, "../platform/PromptBarPlatform.jsx");
    const src = fs.readFileSync(platformPath, "utf8");

    expect(src).toContain("promptFillNonce");
    expect(src).toMatch(/fillNonce=\{promptFillNonce\}/);
  });
});
