# Prompt Bar Platform Architecture

This document describes the production architecture of the Prompt Bar Platform (`src/features/prompt-bar/`), its architectural layers, lifecycle, persistence, and transitions model.

---

## 1. Architectural Layers

The Prompt Bar platform is organized into 6 strictly decoupled layers adhering to unidirectional dependencies:

```
┌────────────────────────────────────────────────────────┐
│ 1. Template & Wrappers Layer                           │
│    (templates/generatedMedia.template.js,              │
│     templates/GeneratedPromptBar.jsx)                  │
├────────────────────────────────────────────────────────┤
│ 2. Public Service Facade Layer                         │
│    (service/promptBarService.js)                       │
├────────────────────────────────────────────────────────┤
│ 3. Platform & Composite Hooks Layer                    │
│    (platform/PromptBarPlatform.jsx,                    │
│     platform/hooks/usePromptBar*.js)                   │
├────────────────────────────────────────────────────────┤
│ 4. Store & Registry Layer                              │
│    (store/registry.js, store/createPromptBarStore.js,  │
│     store/persistence.js, store/commands/*.js)         │
├────────────────────────────────────────────────────────┤
│ 5. Pure Core Engine Layer                              │
│    (core/templateContract.js, core/media.js,           │
│     core/serialization.js, core/reconciliation.js)     │
├────────────────────────────────────────────────────────┤
│ 6. Presentational UI Parts Layer                       │
│    (platform/parts/*.jsx, ui/common/*.jsx)             │
└────────────────────────────────────────────────────────┘
```

1. **Template & Wrappers**: Single source of truth for feature-specific domain rules (modes, composition slots, eligibility, parameter mapping, external actions, and `persistRoutes`). Wrappers provide clean `<GeneratedPromptBar />` drop-in usage for pages.
2. **Service Facade**: `promptBarService` is the public API entry point for external app features (like Animate, Reuse, or Add Reference buttons). Routes commands by instance identity without backend calls.
3. **Platform**: `PromptBarPlatform.jsx` acts as the feature-agnostic orchestrator. Subdivided into focused hooks (`usePromptBarModels`, `usePromptBarSlots`, `usePromptBarReferences`, `usePromptBarGenerate`).
4. **Store & Registry**: Registry outside React manages vanilla Zustand stores. Stores are isolated per instance. Commands are pure reducers executed atomically.
5. **Pure Core Engine**: Zero React, zero DOM, zero Next.js imports. Implements parameter reconciliation, payload serialization, media quota calculations, and contracts.
6. **UI Parts**: Split presentational components (`PromptBarTopPanel`, `PromptBarSlotsRow`, `PromptBarControlsRow`, `PromptEditor`) with zero store access.

---

## 2. Identity and Key Format

Every Prompt Bar instance is uniquely identified by a 3-part identity tuple:
```javascript
{
  templateId: string, // e.g. "generated-media", "character-sheet"
  instanceId: string, // e.g. "default", "compare-a"
  projectId:  string  // e.g. "proj_123", "global"
}
```

The canonical storage and registry key is serialized as:
$$\text{key} = \text{pb2}:\langle\text{templateId}\rangle:\langle\text{instanceId}\rangle:\langle\text{projectId}\rangle$$

- Instances with different `instanceId` or `projectId` never share state or storage keys.
- Legacy storage keys (e.g. `studio-prompt-bar_<projectId>`) are seamlessly read during migration and superseded by the canonical key.

---

## 3. Lifecycle & Persistence

1. **Creation**: When `PromptBarStoreProvider` renders, the store is retrieved or created via `registry.getOrCreate(identity)`. Render side effects are strictly forbidden (PB-D-06): no storage access or registry mutations occur in the component render body.
2. **Mount & Hydration**: On mount (`useEffect`), the instance is registered with `registry.markMounted(identity, meta)`. Saved state is read from storage and safely hydrated into the store via `store.hydrate(saved)`.
3. **Debounced Persistence**: Store updates trigger a debounced saver (`createSaver`, 300ms delay). Only persistable fields (`prompt`, `activeMode`, `activeSubMode`, `selectedModelId`, `parameterValues`) are saved; runtime flags and volatile object URLs are pruned (`selectPersistable`).
4. **Submit Lifecycle**: Generation actions invoke `beginSubmit()`, acquiring an active submission lock. In-flight submissions block route resets and duplicate generation calls until `endSubmit()` executes.
5. **Route Persistence Policy (`persistRoutes`)**: When templates declare `persistRoutes`, `usePromptBarRouteWatcher` observes Next.js pathname changes. Navigating outside allowed routes triggers an automatic reset (`registry.reset(identity)`) and purges saved state from storage.
6. **Unmount & Cleanup**: When an instance unmounts, `registry.markUnmounted(identity)` marks it inactive. If disposed, its state is garbage-collected.

---

## 4. Atomic Transitions Rule (PB-D-03)

Mutations and multi-step state changes follow the Command Pattern:
- Commands (`switchMode`, `selectModel`, `attachMedia`, `removeMedia`) are pure functions: `(state, args, deps) => CommandResult`.
- Multi-step transitions execute via `applyComposite(store, steps)`. All changes are composed and committed to the Zustand store in **a single `set()` call**.
- This guarantees zero intermediate invalid states, zero tearing, and zero cascading re-renders.

---

## 5. External Actions

Templates can define domain-specific external actions through `createActions(core)`:
- `addReference(options)`: Attaches a media reference to the first available or target slot.
- `animateMedia(options)`: Switches to video/frames mode, selects a video model, and populates the start frame.
- `applyGeneration(generation)`: Reconstructs prompt, mode, model, and parameters from a previous generation item.

These actions are accessible through the public facade:
```javascript
promptBarService.forInstance("generated-media").animateMedia({ media: item });
```

---

## 6. How to Add a Template

To add a new template, follow the step-by-step guide in [docs/prompt-bar/ADDING_A_TEMPLATE.md](./ADDING_A_TEMPLATE.md).
Target footprint is two files:
1. `src/features/prompt-bar/templates/<name>.template.js`
2. `src/features/prompt-bar/templates/<Name>PromptBar.jsx`

---

## 7. Historical Analysis vs. Current Reality

| Claim in Old Analysis | Reality Now in Platform |
|---|---|
| Core has no domain knowledge | **Reality Verified**: Core is 100% domain-agnostic. All slot definitions, parameter mappings, model eligibility filters, and route patterns live in templates. |
| `serialize` only includes declared parameters | **Reality Verified**: Parameters are validated and filtered against model/template definitions. Undefined, null, or empty string values are strictly omitted from payloads. |
| Credits formula was hardcoded | **Reality Verified**: `calculateModelCredits` computes pricing dynamically using model multipliers, pricing tiers, and variations count. |
| Character front/side/closeup existed in old bar | **Reality Verified**: It was an unbuilt design intent. Task W4 proved with `promptOnly.template.js` that model-less/mode-less bars operate cleanly. |
| Edit and Upscale exist as independent implementations | **Reality Verified**: Edit and Upscale are handled through the unified platform or will be added as lightweight template definitions in P8. |
| Singleton `activePromptBarStoreInstance` module variable | **Reality Verified**: Eliminated. All instances are isolated via the external store `registry` keyed by `{ templateId, instanceId, projectId }`. |
