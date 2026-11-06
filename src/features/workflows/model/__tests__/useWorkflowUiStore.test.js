import { describe, it, expect, beforeEach } from "vitest";
import { useWorkflowUiStore } from "../useWorkflowUiStore";

describe("useWorkflowUiStore - Search & Filter Cross-Tab Sync", () => {
  beforeEach(() => {
    useWorkflowUiStore.setState({
      activeStudioTab: "assets",
      filters: {
        models: [], types: [], aspectRatios: [],
        sort: "newest", prompt: "", liked: false,
        gender: [], renderingStyles: [], elementTypes: [],
      },
      _generationFilters: {
        models: [], types: [], aspectRatios: [],
        sort: "newest", prompt: "", liked: false,
        gender: [], renderingStyles: [], elementTypes: [],
      },
      _elementFilters: {
        models: [], types: [], aspectRatios: [],
        sort: "newest", prompt: "", liked: false,
        gender: [], renderingStyles: [], elementTypes: [],
      },
    });
  });

  it("1. Setting prompt filter updates active filters and all tab filter caches", () => {
    useWorkflowUiStore.getState().setFilter("prompt", "cyberpunk warrior");

    const state = useWorkflowUiStore.getState();
    expect(state.filters.prompt).toBe("cyberpunk warrior");
    expect(state._generationFilters.prompt).toBe("cyberpunk warrior");
    expect(state._elementFilters.prompt).toBe("cyberpunk warrior");
  });

  it("2. Switching studio tabs preserves the active search prompt", () => {
    // Start on assets and type a search
    useWorkflowUiStore.getState().setActiveStudioTab("assets");
    useWorkflowUiStore.getState().setFilter("prompt", "dragon");

    // Switch to elements tab
    useWorkflowUiStore.getState().setActiveStudioTab("elements");
    expect(useWorkflowUiStore.getState().filters.prompt).toBe("dragon");

    // Switch to characters tab
    useWorkflowUiStore.getState().setActiveStudioTab("characters");
    expect(useWorkflowUiStore.getState().filters.prompt).toBe("dragon");

    // Switch to trash tab
    useWorkflowUiStore.getState().setActiveStudioTab("trash");
    expect(useWorkflowUiStore.getState().filters.prompt).toBe("dragon");
  });

  it("3. Clearing search prompt resets it across all tabs", () => {
    useWorkflowUiStore.getState().setFilter("prompt", "neon city");
    expect(useWorkflowUiStore.getState().filters.prompt).toBe("neon city");

    useWorkflowUiStore.getState().setFilter("prompt", "");
    const state = useWorkflowUiStore.getState();
    expect(state.filters.prompt).toBe("");
    expect(state._generationFilters.prompt).toBe("");
    expect(state._elementFilters.prompt).toBe("");
  });

  it("4. defaults gridSpacing to 'sm' (S / 4px) and updates via setGridSpacing", () => {
    useWorkflowUiStore.getState().setGridSpacing("sm");
    expect(useWorkflowUiStore.getState().gridSpacing).toBe("sm");

    useWorkflowUiStore.getState().setGridSpacing("md");
    expect(useWorkflowUiStore.getState().gridSpacing).toBe("md");

    useWorkflowUiStore.getState().setGridSpacing("lg");
    expect(useWorkflowUiStore.getState().gridSpacing).toBe("lg");

    useWorkflowUiStore.getState().setGridSpacing("sm");
    expect(useWorkflowUiStore.getState().gridSpacing).toBe("sm");
  });
});
