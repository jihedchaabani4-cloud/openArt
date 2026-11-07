# Technical Audit: Current State of the Prompt Bar System

> **Date**: October 2026 | **Target**: `my-app/src/features/prompt-bar/` and connected modules  
> **Status**: Read-only technical audit | All claims verified via direct code inspection  

---

## 1. File Inventory & Dependency Direction

### 1.1 Tree of `src/features/prompt-bar/` (36 source files, lines of code & role)
```
src/features/prompt-bar/
├── index.js (2) — Public API re-export
├── index.platform.js (44) — Platform export barrel (renderer, store, core, ui)
├── composition/
│   ├── character.type.js (22) — Character layout config (no reference slots)
│   ├── createPromptBarType.js (56) — Factory for frozen CompositionType objects
│   ├── generatedMedia.type.js (64) — Main layout config for image/video prompt bar
│   └── resolveUI.js (33) — Deprecated UI slot helper / filterEligibleModels re-export
├── core/
│   ├── creditCalculationService.js (111) — Dynamic pricing estimation engine
│   ├── entityService.js (203) — Character/Element entity normalization & quota
│   ├── initialization.js (34) — Composition type initialization & default model resolution
│   ├── modelManagement.js (265) — Backend model adapter, parameter normalizer & capabilities
│   ├── parameterState.js (44) — Extracts active definitions and initializes default values
│   ├── reconciliation.js (93) — Parameter value migration across model switches
│   ├── serialization.js (191) — Serializes store state into backend generation payload
│   ├── tagsResolver.js (79) — Tag token serialization and prompt tag extraction
│   ├── tagsService.js (263) — Tag parsing, prompt cleaning on reference removal, auto-assignment
│   ├── types.js (146) — Canonical parameter types and validation diagnostics
│   └── useRealBackendModels.js (86) — React Query hook fetching/adapting backend /api/models
├── features/generated-media/
│   └── generatedMedia.config.js (167) — COMPOSITION_REQUIREMENTS, filterEligibleModels, resolveParameterMapping
├── model/
│   ├── feature-constants.js (477) — Legacy character traits/features form definitions
│   ├── useCharacterStore.js (243) — Legacy singleton Zustand store for character traits form
│   ├── useElementStore.js (6) — Legacy re-export of useCharacterStore
│   ├── useLibraryFilter.js (176) — Deduplication filter excluding selected items from asset library
│   ├── usePromptStore.js (167) — Legacy singleton Zustand store for generation & drag state
│   └── core/
│       ├── promptBarLayout.js (27) — CSS variant padding and height tokens
│       ├── promptBarRules.js (100) — Legacy reference validation & tag cleaning rules
│       └── promptBarState.js (40) — Legacy store initial state defaults
├── platform/
│   └── PromptBarPlatform.jsx (1239) — Orchestrator component rendering shell, slots, editor & drawer
├── providers/ltx/
│   ├── index.js (5) — LTX provider exports
│   └── ltxClient.js (181) — LTX video model configuration & duration/resolution adapters
├── store/
│   ├── createPromptBarStore.js (333) — Vanilla Zustand per-instance store factory
│   ├── PromptBarStoreContext.js (181) — React context, memory Map registry & sessionStorage persistence
│   └── usePromptBarStore.js (26) — Hook selector subscribing to instance store
└── ui/common/
    ├── MediaInput.jsx (115) — UI primitive for single slot media drop/click
    ├── PromptBarShell.jsx (46) — Outer rounded glass container shell
    ├── ReferenceButton.jsx (247) — ViewReference thumbnail and ReferenceButton add button
    ├── editor/
    │   ├── AtMentionMenu.jsx (388) — Dropdown menu for @ mention autocomplete
    │   ├── FeatureNode.jsx (130) — Lexical custom decorator node for character feature tags
    │   ├── MentionNode.jsx (134) — Lexical custom decorator node for media @mentions
    │   ├── MentionPlugin.jsx (269) — Lexical plugin detecting '@' keystrokes
    │   ├── MentionTag.jsx (56) — Mention badge chip rendering image and label
    │   ├── PromptEditor.jsx (294) — Lexical rich text editor container
    │   └── plugins/
    │       ├── SyncFeaturesPlugin.jsx (118) — Lexical plugin syncing character store traits into prompt
    │       └── TextTagConverterPlugin.jsx (114) — Converts raw <MediaAsset:id> strings to Lexical nodes
    └── selectors/
        ├── BaseSelector.jsx (13) — Minimal dropdown wrapper
        ├── DropdownEngine.jsx (225) — Custom popover positioning and portal engine
        ├── DurationSelector.jsx (123) — Duration picker component
        ├── FeatureModeSelector.jsx (80) — Mode toggle button primitive
        ├── FlowPromptBoxSettings.jsx (845) — Settings popover (modes, ratios, sliders, models)
        ├── QualitySelector.jsx (21) — Quality dropdown wrapper
        ├── RatioSelector.jsx (32) — Aspect ratio selector
        ├── VariationSelector.jsx (22) — Output count selector
        └── VideoResolutionSelector.jsx (25) — Video resolution tier selector
```

### 1.2 Files Outside `src/features/prompt-bar/` Importing From It
[OBSERVED] Direct imports found in `my-app/src/`:
1. `src/app/cinema-studio/[projectId]/assets/page.js:18, 24`: imports `PromptBarPlatform`, `generatedMediaType`, `generatedMediaConfig`, `usePromptStore`.
2. `src/app/cinema-studio/[projectId]/collection/[collectionId]/page.js:20, 27`: imports `PromptBarPlatform`, `generatedMediaType`, `generatedMediaConfig`, `usePromptStore`.
3. `src/app/cinema-studio/[projectId]/elements/edit/[workflowId]/page.js:10, 11`: imports `useElementStore`, `usePromptStore`.
4. `src/app/cinema-studio/test/prompt-bar-compare/page.jsx:12`: imports `PromptBarPlatform`, `generatedMediaType`, `generatedMediaConfig`.
5. `src/app/test-mention/page.jsx:20-22`: imports `MentionNode`, `MentionPlugin`, `AtMentionMenu`.
6. `src/features/studio/core/mediaReferenceService.js:25`: imports `* as defaultGeneratedMediaConfig from "@/features/prompt-bar/features/generated-media/generatedMedia.config.js"`.
7. `src/features/studio/PromptBarStoreContext.js:14`: re-exports from `@/features/prompt-bar/store/PromptBarStoreContext.js`.
8. `src/features/studio/usePromptStore.js:1`: re-exports `usePromptStore` from `@/features/prompt-bar/model/usePromptStore`.
9. `src/features/studio/useStudioItemDrag.js:23`: imports `usePromptStore`.
10. `src/features/studio/useDragAutoScroll.js:4`: imports `usePromptStore`.
11. `src/features/workflows/model/useMediaActions.js:7, 8, 17`: imports `useElementStore`, `usePromptStore`, `useRealBackendModels`.
12. `src/widgets/StudioLayout/NewProjectView/NewProjectView.jsx:10`: imports `PromptBarPlatform`.
13. `src/widgets/StudioNavbar/ui/StudioNavbarLeft.jsx:20`: imports `usePromptStore`.

### 1.3 Imports in `core/` and `store/` — Dependency Violations
[OBSERVED]
- `src/features/prompt-bar/core/useRealBackendModels.js:12-13`: imports `@tanstack/react-query` and `@/shared/api/client`. React hook and network client inside `core/`.
- `src/features/prompt-bar/store/PromptBarStoreContext.js:11`: imports `React, { createContext, useContext, useRef } from "react"`. React UI framework inside `store/`.
- `src/features/prompt-bar/platform/PromptBarPlatform.jsx:35-39`: imports `consumePendingPromptAction, addMediaToPrompt, animateMedia` from `@/features/studio`. Prompt-bar imports from parent/sibling feature.

---

## 2. Store(s)

### 2.1 State Shape: `createPromptBarStore.js`
[OBSERVED] `src/features/prompt-bar/store/createPromptBarStore.js:35-49`:
- `modelsMap` (`Record<string, object>`, default `{}`): Normalized model contracts.
- `rawModelsMap` (`Record<string, object>`, default `{}`): Unmodified backend model catalog DTOs.
- `selectedModelId` (`string | null`, default `null`): Chosen model ID.
- `prompt` (`string`, default `""`): Prompt text.
- `parameterValues` (`Record<string, any>`, default `{}`): Parameter values by backend key.
- `elements` (`Array<object>`, default `[]`): Attached Element entities.
- `characters` (`Array<object>`, default `[]`): Attached Character entities.
- `reconciliationLog` (`Array<object>`, default `[]`): Changes from last model switch.
- `validationErrors` (`Record<string, string>`, default `{}`): Parameter validation errors.
- `isGenerating` (`boolean`, default `false`): Generation in-flight status.
- `lastSerializedRequest` (`object | null`, default `null`): Last payload from `serialize()`.
- `activeMode` (`string`, default `"image"`): Active mode (`"image"` | `"video"`).
- `activeSubMode` (`string`, default `"frames"`): Video submode (`"frames"` | `"reference"`).

### 2.2 Store Actions in `createPromptBarStore.js`
[OBSERVED]
- `setModels`: `createPromptBarStore.js:59` — Mutates `modelsMap, rawModelsMap, selectedModelId, parameterValues, reconciliationLog`.
- `selectModel`: `createPromptBarStore.js:104` — Mutates `selectedModelId, parameterValues, prompt, elements, characters, reconciliationLog`.
- `setPrompt`: `createPromptBarStore.js:222` — Mutates `prompt`.
- `setParameter`: `createPromptBarStore.js:225` — Mutates `parameterValues[key]`.
- `setIsGenerating`: `createPromptBarStore.js:229` — Mutates `isGenerating`.
- `addElement`: `createPromptBarStore.js:232` — Mutates `elements`.
- `removeElement`: `createPromptBarStore.js:235` — Mutates `elements, prompt`.
- `setElements`: `createPromptBarStore.js:241` — Mutates `elements`.
- `addCharacter`: `createPromptBarStore.js:246` — Mutates `characters`.
- `removeCharacter`: `createPromptBarStore.js:249` — Mutates `characters, prompt`.
- `setCharacters`: `createPromptBarStore.js:255` — Mutates `characters`.
- `clearEntities`: `createPromptBarStore.js:260` — Mutates `elements: [], characters: []`.
- `setActiveMode`: `createPromptBarStore.js:263` — Mutates `activeMode`.
- `setActiveSubMode`: `createPromptBarStore.js:264` — Mutates `activeSubMode`.
- `clearMediaReferences`: `createPromptBarStore.js:267` — Mutates `parameterValues, elements, characters, prompt`.
- `serialize`: `createPromptBarStore.js:305` — Mutates `lastSerializedRequest`.
- `reset`: `createPromptBarStore.js:317` — Resets state to model defaults.

### 2.3 Domain-Specific Elements in Store
[OBSERVED] `elements`, `characters`, `activeMode`, `activeSubMode`, `addElement`, `removeElement`, `addCharacter`, `removeCharacter`, `clearMediaReferences`.  
*Reason*: Coupled to enforce tag cleansing (`cleanTagsForAsset`) and model capability constraints directly inside store transitions.

### 2.4 Store Topology & Dual Sources of Truth
[OBSERVED]
1. `createPromptBarStore(overrides)`: Factory creating vanilla Zustand store (`src/features/prompt-bar/store/createPromptBarStore.js:32`).
2. `activePromptBarStoreInstance`: Module-level singleton variable (`src/features/prompt-bar/store/PromptBarStoreContext.js:15`), overwritten in render via `setActivePromptBarStore` (`line 139`).
3. `persistentStoreRegistry`: In-memory `Map` registry (`src/features/prompt-bar/store/PromptBarStoreContext.js:28`).
4. `usePromptStore`: Legacy global singleton Zustand store (`src/features/prompt-bar/model/usePromptStore.js:19`).
5. `useCharacterStore`: Legacy character traits store (`src/features/prompt-bar/model/useCharacterStore.js:17`).

*Dual Truth Evidence* (`src/features/workflows/model/useMediaActions.js:150-180`):
```javascript
const activeBarStore = getActivePromptBarStore();
if (activeBarStore) {
  const barState = activeBarStore.getState();
  if (effectivePrompt && barState.setPrompt) barState.setPrompt(effectivePrompt);
  if (modelName && barState.selectModel) barState.selectModel(modelName);
  if (ratioVal && barState.setParameter) {
    barState.setParameter("ratio", ratioVal);
    barState.setParameter("aspect_ratio", ratioVal);
  }
}
const promptStore = usePromptStore.getState();
promptStore.setGenerationMode(isVideo ? "keyframe" : "image");
if (effectivePrompt) promptStore.setPrompt(effectivePrompt);
if (modelName) promptStore.setModelId(modelName);
```
Both the platform instance store and the legacy store are manually synchronized side-by-side.

---

## 3. Persistence

### 3.1 Storage Keys
[OBSERVED] `src/features/prompt-bar/store/PromptBarStoreContext.js:97-99`:
```javascript
const resolvedProjectId = resolveProjectId();
const effectiveKey = persist
  ? `${persistKey}_${resolvedProjectId || "global"}`
  : null;
```
- Example 1 (Studio `/cinema-studio/proj_10982/assets`): `studio-prompt-bar_proj_10982`
- Example 2 (Test page `/prompt-bar-test`): `studio-prompt-bar_global`

### 3.2 What is Saved, Where, and When
[OBSERVED]
- **Target**: `sessionStorage` + in-memory `persistentStoreRegistry = new Map()`.
- **Saved Subset** (`PromptBarStoreContext.js:65-73`): `prompt`, `selectedModelId`, `parameterValues`, `elements`, `characters`, `activeMode`, `activeSubMode`.
- **When Written** (`PromptBarStoreContext.js:158-160`): Synchronously on **every single state change** via `store.subscribe()` (every keystroke in `prompt`, every parameter toggle). No debounce.

### 3.3 Hydration & Edge Cases
[OBSERVED]
- Read in `PromptBarStoreContext.js:113` via `loadSavedState(effectiveKey)`.
- Parse error: `try { JSON.parse(raw); } catch { return null; }` (`lines 50-56`). Silently falls back to default model parameters.
- Non-serializable values: `File`/`Blob` serialize to `{}`. `blob:` URLs persist as dead strings across reloads. Expired signed URLs persist until tab close, failing subsequent fetches with HTTP 401/403.

### 3.4 Lifecycle
[OBSERVED]
- `clearPersistentPromptBarStores()` (`PromptBarStoreContext.js:30`) is **never called in production code** (only in tests).
- `persistRoutes`: `NOT FOUND`. No route-based policy exists.
- In-memory `persistentStoreRegistry` Map retains previous project stores indefinitely (memory leak).
- If user navigates away mid-generation before `finally { setIsGenerating(false); }` executes, `isGenerating` stays `true` in the in-memory store, permanently locking the Generate button upon returning.

### 3.5 Side Effects in Render & SSR
[OBSERVED] `src/features/prompt-bar/store/PromptBarStoreContext.js:101-139`:
```javascript
if (!storeRef.current) {
  if (effectiveKey && persistentStoreRegistry.has(effectiveKey)) {
    storeRef.current = persistentStoreRegistry.get(effectiveKey);
  } else {
    const savedState = effectiveKey ? loadSavedState(effectiveKey) : null;
    const newStore = createPromptBarStore({ ... });
    if (effectiveKey) persistentStoreRegistry.set(effectiveKey, newStore);
    storeRef.current = newStore;
  }
}
setActivePromptBarStore(storeRef.current);
```
- **Violations**: Reads `sessionStorage`, instantiates store, writes to Map registry, and mutates `activePromptBarStoreInstance` inside the component render body.
- **SSR Mismatch**: Server renders with `effectiveKey = "studio-prompt-bar_global"`. Client rehydrates with `effectiveKey = "studio-prompt-bar_<projectId>"`, reading saved state and causing React hydration mismatches.

---

## 4. Models & Parameters

### 4.1 Real Model Manifests (`apiOpenArt/src/models/manifests/`)

#### (a) Model with Start/End Image Parameters (`seedance_2_5/model.json`)
```json
{
  "id": "seedance_2_5",
  "domain": "video",
  "displayName": "ByteDance Seedance 2.5",
  "capabilities": { "prompt": true, "input_image": true, "last_frame": true, "duration": true, "aspect_ratio": true, "resolution": true },
  "canonicalInputs": {
    "prompt": { "type": "string", "required": true },
    "input_image": { "type": "string", "required": false, "max": 1 },
    "last_frame": { "type": "string", "required": false, "max": 1 },
    "duration": { "type": "number", "values": ["5", "10"], "default": "5" },
    "aspect_ratio": { "type": "string", "values": ["16:9", "9:16", "1:1"], "default": "16:9" },
    "resolution": { "type": "string", "values": ["480p", "720p", "1080p"], "default": "720p" }
  }
}
```

#### (b) Model with Images List Parameter (`nanobana_pro/model.json`)
```json
{
  "id": "nanobana_pro",
  "domain": "image",
  "displayName": "NanoBanana Pro",
  "capabilities": { "prompt": true, "input_image": true, "images": true, "aspect_ratio": true, "resolution": true },
  "canonicalInputs": {
    "prompt": { "type": "string", "required": true },
    "images": { "type": "array", "required": false, "max": 14 },
    "input_image": { "type": "string", "required": false, "max": 1 },
    "resolution": { "type": "string", "values": ["1k", "2k", "4k"], "default": "1k" },
    "aspect_ratio": { "type": "string", "values": ["1:1", "3:2", "16:9"], "default": "1:1" }
  }
}
```

#### (c) Model with NO Image/Reference Parameter (`seedream_v5/model.json`)
```json
{
  "id": "seedream_v5",
  "domain": "image",
  "displayName": "ByteDance Seedream V5.0 Pro",
  "capabilities": { "prompt": true, "resolution": true, "aspect_ratio": true },
  "canonicalInputs": {
    "prompt": { "type": "string", "required": true },
    "resolution": { "type": "string", "values": ["1k", "1.5k", "2k"], "default": "1k" },
    "aspect_ratio": { "type": "string", "values": ["1:1", "16:9", "9:16"], "default": "1:1" }
  }
}
```

### 4.2 Parameter Type Declaration & Media Marking
[OBSERVED]
- Types declared in `core/types.js:12-21`: `select`, `number`, `boolean`, `text`, `image`, `video`, `image[]`, `video[]`.
- Media marked via `group = "media"` (`core/types.js:70-72`).
- Adapted from backend strings by literal name check in `core/modelManagement.js:26-45` (`input_image` -> `image`, `images` -> `image[]`, etc.).

### 4.3 UI Parameter Rendering & Hardcoded Literals
[OBSERVED]
In `FlowPromptBoxSettings.jsx`: Mode toggles (`lines 410-456`), ratio selector (`lines 310-316`), variations count (`lines 338-340`) are hardcoded. Other parameters render dynamically (`line 564`).

**Hardcoded parameter literal citations in `features/prompt-bar/`**:
- `"input_image"`: `modelManagement.js:26, 226, 258`; `serialization.js:19`; `types.js:54`; `generatedMedia.config.js:132, 142, 144, 159`; `PromptBarPlatform.jsx:766`.
- `"last_frame"`: `modelManagement.js:30, 226`; `serialization.js:20`; `types.js:52`; `generatedMedia.config.js:132, 148, 151`.
- `"images"`: `modelManagement.js:34, 228, 240`; `serialization.js:17`; `generatedMedia.config.js:56, 132, 156, 161`; `PromptBarPlatform.jsx:493, 498, 504, 564, 694, 766, 837`.
- `"start_frame"`: `modelManagement.js:26, 28`; `serialization.js:22`; `types.js:54`; `generatedMedia.config.js:143`.
- `"end_frame"`: `modelManagement.js:30, 32`; `serialization.js:23`; `types.js:52`; `generatedMedia.config.js:150`.
- `"reference"`: `composition/resolveUI.js:7, 14, 27`; `generatedMedia.config.js:22, 30, 135, 154`; `PromptBarPlatform.jsx:246, 294, 480, 552, 698, 838, 854, 862, 884, 1032`.
- `"reference_images"`: `modelManagement.js:34, 36, 232, 244`; `serialization.js:18`; `types.js:57`; `generatedMedia.config.js:56, 157`; `PromptBarPlatform.jsx:499, 766`.
- `"aspect_ratio"`: `modelManagement.js:79`; `FlowPromptBoxSettings.jsx:311, 313, 357, 369`.
- `"duration"`: `modelManagement.js:81`; `FlowPromptBoxSettings.jsx:607`.
- `"input_video"`: `modelManagement.js:38`; `serialization.js:21`.
- `"reference_videos"`: `modelManagement.js:42, 44`; `types.js:59`.

### 4.4 Parameter Semantic Divergence Across Models
[OBSERVED]
- `input_image`: Means **Start Frame** in video models (`seedance_2_5`), but means **Style Reference / Source Image** in img2img image models (`nanobana_pro`).
- `images`: Means **Multi-Reference Character/Element Images** in image models, but means **Conditioning Media List** in video models.

---

## 5. Media & References Handling

### 5.1 Storage in State
[OBSERVED] Stored in **both** `parameterValues` (as `{ images: [...] }` or `{ input_image: {...} }`) AND in store arrays `elements` and `characters` (`PromptBarPlatform.jsx:711, 713, 724, 726, 735, 737`).

### 5.2 Slot Derivation
[OBSERVED] `PromptBarPlatform.jsx:282-306`: Derived from `featureConfig.COMPOSITION_REQUIREMENTS[activeMode][activeSubMode]`, filtered by `getModelReferenceCapability(currentModel)` and `resolveParameterMapping`.

### 5.3 Role-to-Parameter-Key Mapping
[OBSERVED] Quoted from `src/features/prompt-bar/features/generated-media/generatedMedia.config.js:138-165`:
```javascript
export function resolveParameterMapping(model, role) {
  const params = model?.parameters || {};

  if (role === "start") {
    if (params.input_image) return "input_image";
    if (params.start_frame) return "start_frame";
    return "input_image";
  }

  if (role === "end") {
    if (params.last_frame) return "last_frame";
    if (params.last_image) return "last_image";
    if (params.end_frame) return "end_frame";
    return params.last_frame ? "last_frame" : null;
  }

  if (role === "reference") {
    if (params.images) return "images";
    if (params.reference_images) return "reference_images";
    if (params.input_image && (model?.domain === "image" || model?.category === "image")) {
      return "input_image";
    }
    return params.images ? "images" : null;
  }

  return null;
}
```

### 5.4 Validation & Quotas
[OBSERVED]
- Max images: `getSlotMaxRefs` (`PromptBarPlatform.jsx:537-560`) reads `paramDef.max` or `modelRefCap.maxRefs`.
- Deduplication: `canAddReference` (`entityService.js:147-158`) checks workflow ID matching.
- Type check: `activeSlotAllowedType` (`PromptBarPlatform.jsx:859-874`) validates slot accepts against media type.

### 5.5 `@mention` Tags and `cleanTagsForAsset`
[OBSERVED] Quoted from `src/features/prompt-bar/core/tagsService.js:39-59`:
```javascript
export function cleanTagsForAsset(prompt = "", assetIds = []) {
  if (!prompt || typeof prompt !== "string") return "";
  const ids = Array.isArray(assetIds) ? assetIds.filter(Boolean) : [assetIds].filter(Boolean);
  if (ids.length === 0) return prompt;

  let cleaned = prompt;
  for (const id of ids) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`<(?:character|element|MediaAsset|media|ref|reference):\\s*${escaped}>`, "gi");
    cleaned = cleaned.replace(regex, "");
  }

  return cleaned
    .replace(/\s+,/g, ",")
    .replace(/,\s*,+/g, ",")
    .replace(/^[\s,;]+/g, "")
    .replace(/[\s,;]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
```
*Call sites*: `PromptBarPlatform.jsx:362, 529, 794, 827`; `createPromptBarStore.js:208, 289`; `entityService.js:133`. All referenced variables are defined; returned values are applied back to prompt via `setPrompt()` or `set({ prompt })`.

### 5.6 Parameter Collision Case
[OBSERVED] Switching from Image mode (where reference mapped to `input_image`) to Video Frames mode (where start frame maps to `input_image`):
- `activeKeys` in Video Frames includes `"input_image"`.
- Mode-switch cleanup only cleans keys where `!activeKeys.has(key)` (`PromptBarPlatform.jsx:358`).
- `input_image` is **not deleted**.
- **Result**: The image reference silently converts into the video's Start Frame.

---

## 6. Mode & Model Switching Traces

### a) Image → Video/Frames
1. User clicks "Video" -> `handleModeChange("video")` (`PromptBarPlatform.jsx:252`).
2. Calls `setActiveMode("video")`; filters eligible video models via `featureConfig.filterEligibleModels()`.
3. Calls `selectModel("seedance_2_5")` (`createPromptBarStore.js:104`).
4. `reconcile()` drops image-only params; clears `images`/`reference_images`.
5. Render cycle: `activeSlots` resolves to Start & End frame slots (`lines 289-306`).
6. Mode cleanup effect (`line 324`): clears inactive keys (`images`). Retains `input_image` (collision).

### b) Video/Frames → Video/Reference
1. User clicks "Reference" -> `handleSubModeChange("reference")` (`PromptBarPlatform.jsx:262`).
2. Calls `setActiveSubMode("reference")`; auto-selects model supporting `images` (e.g. `wan_3_0`).
3. Render cycle: `activeSlots` updates to `[{ role: "reference" }]`; `activeKeys` = `Set(["images"])`.
4. Mode cleanup effect (`line 324`): `input_image` and `last_frame` not in `activeKeys` -> set to `undefined` (`line 360`); cleans prompt tags (`line 362`).

### c) Switching Model Inside Same Mode
1. User selects model in `FlowSelect` -> `selectModel(modelId)` (`createPromptBarStore.js:104`).
2. `reconcile()` keeps matching params, resets invalid ones, drops omitted ones.
3. Reference capacity enforcement trims excess items if `maxRefs` is lower, purging prompt tags.
4. Component `useEffect` (`PromptBarPlatform.jsx:486-535`) redundantly re-executes reference trimming.

### d) Switching to Model Lacking a Parameter
1. User has filled start/end frames on `seedance_2_5`; selects model with only `images[]`.
2. `reconcile()` detects `input_image`/`last_frame` missing in new model; omits them from `nextValues`.
3. `selectModel` adds their IDs to `idsToClean`, stripping prompt tags. Values are discarded, not converted to `images[]`.

### 6.5 Mode-Switch Cleanup Effect & Missing Dependencies
[OBSERVED] `PromptBarPlatform.jsx:324-370`:
```javascript
  const prevModeRef = useRef({ mode: activeMode, subMode: activeSubMode });
  useEffect(() => {
    if (!featureConfig?.COMPOSITION_REQUIREMENTS || !currentModel) return;
    const prev = prevModeRef.current;
    if (prev.mode === activeMode && prev.subMode === activeSubMode) return;
    prevModeRef.current = { mode: activeMode, subMode: activeSubMode };

    const allConfiguredKeys = new Set();
    const collectKeys = (node) => {
      if (!node) return;
      if (Array.isArray(node)) {
        node.forEach((slot) => {
          const key = featureConfig.resolveParameterMapping(currentModel, slot.role);
          if (key) allConfiguredKeys.add(key);
        });
      } else if (typeof node === "object") {
        Object.values(node).forEach(collectKeys);
      }
    };
    collectKeys(featureConfig.COMPOSITION_REQUIREMENTS);

    const activeKeys = new Set(
      activeSlots.map((s) => featureConfig.resolveParameterMapping(currentModel, s.role)).filter(Boolean)
    );

    allConfiguredKeys.forEach((key) => {
      if (!activeKeys.has(key) && paramValues[key] !== undefined) {
        const assetId = getAssetId(paramValues[key]);
        setParameter(key, undefined);
        if (assetId) {
          const cleaned = cleanTagsForAsset(prompt, assetId);
          if (cleaned !== prompt) setPrompt(cleaned);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, activeSubMode, featureConfig, activeSlots, currentModel]);
```
- **Missing Deps**: `paramValues`, `prompt`, `setParameter`, `setPrompt`. Stale closure risk suppressed with eslint disable comment.

---

## 7. Template Layer

### 7.1 "Type" vs. "FeatureConfig"
[OBSERVED]
- **`CompositionType`** (`composition/createPromptBarType.js:47-54`): Layout/chrome config (`showPromptInput`, `showModelSelector`, `showParameterDrawer`, `showAttachmentBar`, `showModeSelector`). Consumed by `PromptBarPlatform.jsx:122-124`.
- **`FeatureConfig`** (`features/generated-media/generatedMedia.config.js`): Logic config (`COMPOSITION_REQUIREMENTS`, `filterEligibleModels`, `resolveParameterMapping`). Consumed by `PromptBarPlatform.jsx:208, 285, 340, 374`.

### 7.2 Branches on Specific Types/Modes in Platform
[OBSERVED]
- `line 131-132`: defaults `activeMode = "image"`, `activeSubMode = "frames"`.
- `line 239`: `["image", "video"].filter(...)`
- `line 246`: `["frames", "reference"].filter(...)`
- `line 310`: `activeMode === "video" && activeSubMode === "frames" && hasStart && hasEnd`
- `line 387`: `activeMode === "video" && activeSubMode === "frames"`
- `line 863`: `if (activeMode === "video") return "image"`

### 7.3 Existing vs. Planned Templates
[OBSERVED]
- **Implemented**: `generated-media` (`composition/generatedMedia.type.js` + `generatedMedia.config.js`) and `character` (`composition/character.type.js`).
- **Planned / Missing**: Edit/Inpaint (`NOT FOUND`), Upscale (`NOT FOUND`), 3-view character slots (`NOT FOUND`).

### 7.4 DRY-RUN: Adding a Character Template
1. Create `features/character/character.config.js` with `COMPOSITION_REQUIREMENTS: { reference: [{ role: "reference", label: "Ref", accepts: "image/*" }] }`, `filterEligibleModels: m => m`, `resolveParameterMapping: () => "images"`.
2. Update `composition/character.type.js` setting `layout: { showPromptInput: true, showModelSelector: false, showModeSelector: false, showParameterDrawer: false, showAttachmentBar: true }`.
3. Export `characterConfig` from `index.platform.js`.
4. Mount `<PromptBarPlatform type={characterType} featureConfig={characterConfig} onGenerate={...} />`.

---

## 8. Generate Flow & Payload

### 8.1 Call Trace
[OBSERVED]
1. `PromptBarPlatform.jsx:1193`: User clicks Generate button -> triggers `handleGenerate()`.
2. `PromptBarPlatform.jsx:394`: Calls `const result = serializeAndEmit();`.
3. `createPromptBarStore.js:305`: Calls `serialize(...)` (`serialization.js:87`).
4. `serialization.js:87-190`: Validates parameters, extracts workflow IDs via `extractWorkflowId()`, appends missing media params from `values` (`lines 122-129`), populates `references: []`, `elements: []`, `characters: []`.
5. `PromptBarPlatform.jsx:395`: Calls `await onGenerate?.(result)`.
6. `src/app/cinema-studio/[projectId]/assets/page.js:77`: `handleGenerate(request)` wraps payload and executes `runGenerate({ payload, isVideo })`.

### 8.2 Real Payloads

#### Case 1: Video Frames Mode (`seedance_2_5`)
```json
{
  "model": "seedance_2_5",
  "prompt": "Cinematic camera fly-through of a neon city",
  "parameters": {
    "duration": "5",
    "aspect_ratio": "16:9",
    "resolution": "720p",
    "input_image": "wf_asset_start_987",
    "last_frame": "wf_asset_end_654"
  },
  "references": ["wf_asset_start_987", "wf_asset_end_654"],
  "elements": [],
  "characters": []
}
```

#### Case 2: Multi-Reference Image Model (`nanobana_pro`)
```json
{
  "model": "nanobana_pro",
  "prompt": "Knight standing before palace",
  "parameters": {
    "aspect_ratio": "1:1",
    "resolution": "1k",
    "images": ["wf_ref_001", "wf_ref_002"]
  },
  "references": ["wf_ref_001", "wf_ref_002"],
  "elements": [],
  "characters": []
}
```

#### Case 3: Prompt-Only Model (`seedream_v5`)
```json
{
  "model": "seedream_v5",
  "prompt": "Mountain valley at sunrise",
  "parameters": { "aspect_ratio": "1:1", "resolution": "1k" },
  "references": [],
  "elements": [],
  "characters": []
}
```

### 8.3 Credits Computation
[OBSERVED] `src/features/prompt-bar/core/creditCalculationService.js:25-100`: Table lookup against `model.pricing.table` (or compound key `${resolution}:${quality}`) multiplied by count (`table[key] * count`). Re-validated server-side in `apiOpenArt/src/models/pricing/pricingEngine.js:53`.

---

## 9. External Component Interactions with Prompt Bar

[OBSERVED]
1. **Module Singleton Call**: `getActivePromptBarStore()` (`src/features/workflows/model/useMediaActions.js:150`):
   ```javascript
   const activeBarStore = getActivePromptBarStore();
   if (activeBarStore) {
     activeBarStore.getState().setPrompt(effectivePrompt);
     activeBarStore.getState().selectModel(modelName);
   }
   ```
2. **Session Storage Queue**: When prompt bar is not mounted, `useMediaActions.js:211, 248` calls `setPendingPromptAction({ type: "animate", media })`, writing to `sessionStorage`. Consumed upon mount in `PromptBarPlatform.jsx:168-181`.
3. **DOM Query**: `document.querySelector('[contenteditable="true"]')` in `useMediaActions.js:233` for focus.

---

## 10. `PromptBarPlatform.jsx` Breakdown (1239 lines)

| Line Range | Responsibility | Hooks Used | Architecture Category |
|---|---|---|---|
| `1 – 40` | Module imports (React, UI, store, studio services) | None | Dependencies |
| `41 – 110` | Outer export: context checking & provider wrapping | 1 `useContext` | Orchestration |
| `112 – 158` | Inner renderer initialization: refs and store selectors | 1 `useState`, 4 `useRef`, 1 `useContext`, 16 `usePromptBarStore` | Orchestration |
| `159 – 190` | Sync models, consume pending cross-page actions, textarea height | 3 `useEffect`, 1 `useRef` | Business Logic |
| `191 – 237` | Model eligibility filtering & auto-select fallback | 3 `useMemo`, 1 `useEffect` | Business Logic |
| `238 – 279` | Mode/sub-mode handlers, aspect ratio resolution, credits calculation | 3 `useMemo`, 2 `useCallback` | Business Logic |
| `280 – 319` | Active slots resolution & drawer parameters partitioning | 3 `useMemo` | Business Logic |
| `320 – 371` | Mode-switch cleanup effect (removes inactive slot keys) | 1 `useEffect`, 1 `useRef` | Business Logic |
| `372 – 403` | Frame swap handler and generate submission handler | 2 `useCallback` | Business Logic |
| `404 – 465` | Active references list & all-selected media memoization | 2 `useMemo` | Business Logic |
| `466 – 536` | Dialog state, open handlers, model switch reference trimming effect | 5 `useState`, 2 `useRef`, 1 `useCallback`, 1 `useEffect` | Business Logic + UI State |
| `537 – 600` | Max refs resolution, reference item merging, mention dialog triggers | 3 `useCallback` | Business Logic |
| `601 – 664` | Quick mention handlers, outside-click & Escape listeners | 3 `useCallback`, 2 `useEffect` | UI Orchestration |
| `665 – 800` | Media selection handler and reference item removal handler | 2 `useCallback` | Business Logic |
| `801 – 834` | Slot removal handler (cleans parameter and cascade cleans prompt) | 1 `useCallback` | Business Logic |
| `835 – 889` | Quota calculation memos (used images count, remaining quota, allowed types) | 6 `useMemo` | Business Logic |
| `890 – 923` | Parameter popover outside-click and Escape listeners | 1 `useEffect` | UI Orchestration |
| `924 – 976` | Top panel zone JSX (AtMentionMenu and ImportMediaPopover) | None | Pure UI |
| `977 – 1011` | Settings overlay JSX (`FlowPromptBoxSettings`) | None | Pure UI |
| `1012 – 1109` | Shell slots JSX (`MediaInput`, `ViewReference`, `ReferenceButton`, `SwapIcon`) | None | Pure UI |
| `1110 – 1125` | Lexical prompt editor JSX (`PromptEditor`) | None | Pure UI |
| `1126 – 1211` | Bottom row JSX (tune button, model label, ratio, variations, generate button) | None | Pure UI |
| `1212 – 1238` | Container layout wrapper JSX (fixed vs relative layout based on `hideBackground`) | None | Pure UI |

---

## 11. Bugs, Risks, and Code Smells

1. **Active Store Singleton Overwrite** — **HIGH** [OBSERVED]: `activePromptBarStoreInstance` in `PromptBarStoreContext.js:15, 139` is overwritten during render. Multiple instances cause external actions to target the wrong store.
2. **Render-Phase Side Effects & SSR Mismatch** — **HIGH** [OBSERVED]: `PromptBarStoreContext.js:101-139` instantiates stores, reads `sessionStorage`, and mutates Map registry during render, causing React hydration mismatches and dev-mode double invocation bugs.
3. **Missing Dependencies in Cleanup Effect** — **HIGH** [OBSERVED]: `PromptBarPlatform.jsx:324-370` suppresses exhaustive-deps while accessing `paramValues`, `prompt`, `setParameter`, `setPrompt`, risking stale closure state.
4. **Parameter Key Collision (`input_image`)** — **HIGH** [OBSERVED]: `generatedMedia.config.js:144, 159` maps both Start Frame (video) and Reference (image) to `input_image`. Switching modes retains the image, silently turning a reference into a video start frame.
5. **Memory Leak in Store Registry** — **MEDIUM** [OBSERVED]: `persistentStoreRegistry = new Map()` (`PromptBarStoreContext.js:28`) never clears stores in production. Navigating projects leaks memory.
6. **Synchronous Storage Writes on Keystroke** — **MEDIUM** [OBSERVED]: `PromptBarStoreContext.js:158-160` executes synchronous `sessionStorage.setItem` on every keystroke in prompt text without debouncing.
7. **Duplicated Reference Trimming** — **MEDIUM** [OBSERVED]: `createPromptBarStore.js:123-205` and `PromptBarPlatform.jsx:486-535` execute identical reference trimming and tag cleansing logic twice.
8. **Dead Code in `resolveParameterMapping`** — **LOW** [OBSERVED]: `generatedMedia.config.js:151, 161` has redundant ternary fallbacks that always evaluate to `null`.
9. **Structured Logger Violations** — **LOW** [OBSERVED]: Calls `console.warn` / `console.error` directly in `usePromptStore.js:70`, `useRealBackendModels.js:40`, `PromptBarPlatform.jsx:397`.

---

## 12. Tests

[OBSERVED] 9 test files (53 tests total), all hermetic and passing:
- `PromptBarLayout.test.jsx`: 3 passed (vitest).
- `promptBarPersistence.test.jsx`: 3 passed (vitest).
- `creditCalculationService.test.mjs`: 7 passed (`node --test`).
- `entityContract.test.mjs`: 12 passed (`node --test`).
- `layoutContract.test.mjs`: 3 passed (`node --test`).
- `libraryExclusionContract.test.mjs`: 6 passed (`node --test`).
- `ltxClientContract.test.mjs`: 3 passed (`node --test`).
- `modelEligibilityContract.test.mjs`: 6 passed (`node --test`).
- `tagsContract.test.mjs`: 10 passed (`node --test`).
*Gap*: No end-to-end integration tests mount `PromptBarPlatform.jsx` to test mode switching or user interactions.

---

## 13. Claims Verification Table

| # | Claim | Status | Key Evidence |
|---|---|---|---|
| 1 | Core has no knowledge of image/video/frames/characters | **FALSE** | `createPromptBarStore.js:40-47` defaults `activeMode: "image"`, `elements: []`. `modelManagement.js:26-45` hardcodes `"input_image"`, `"last_frame"`. `serialization.js:16-24` defines `MEDIA_PARAM_NAMES`. |
| 2 | Each prompt bar instance has its own vanilla Zustand store, no global singleton | **PARTIAL** | `createPromptBarStore.js:33` uses `createStore()`, but `PromptBarStoreContext.js:15, 139` writes an `activePromptBarStoreInstance` module singleton, stores are cached in `persistentStoreRegistry` Map, and legacy `usePromptStore.js:19` co-exists. |
| 3 | Persistence key = persistKey + "_" + projectId, using a Map in memory plus sessionStorage mirror | **TRUE** | `PromptBarStoreContext.js:97-99` evaluates `${persistKey}_${resolvedProjectId || "global"}`. Line 28 defines `persistentStoreRegistry = new Map()`, and lines 51, 74, 158-160 mirror to `sessionStorage`. |
| 4 | `PromptBarPlatform.jsx` is ~1200 lines and contains a mode-switch cleanup effect around lines 320–370 | **TRUE** | `PromptBarPlatform.jsx` is 1239 lines long. Lines 324–370 contain the mode-switch cleanup `useEffect` with `// eslint-disable-next-line react-hooks/exhaustive-deps`. |
| 5 | `filterEligibleModels` filters the `models` argument it receives (not a global list) | **TRUE** | `generatedMedia.config.js:88-89` defines `filterEligibleModels(models = [], ...)` and operates on `list = Array.isArray(models) ? models : Object.values(models || {})`. |
| 6 | `resolveParameterMapping` hardcodes start→`input_image`, end→`last_frame`, reference→`images` or `input_image` | **TRUE** | `generatedMedia.config.js:138-165` maps role `start` to `input_image`, `end` to `last_frame`, and `reference` to `images` or `input_image`. |
| 7 | `serialize` only includes parameters declared in the model definition | **FALSE** | `serialization.js:122-129` explicitly loops over `values` and appends any parameter in `MEDIA_PARAM_NAMES` (`images`, `input_image`, etc.) even if omitted from model definitions. Injects `references`, `elements`, `characters`. |
| 8 | Credits formula = base × durationFactor × qualityMultiplier × count | **FALSE** | `creditCalculationService.js:25-100` performs a dynamic table lookup against `model.pricing.table` (or compound key `${resolution}:${quality}`) and multiplies by count (`table[key] * count`). |
| 9 | A Character template exists with its own config and slots (front/side/closeup) | **FALSE** | `character.type.js:10-21` defines `characterType` with `referenceSlots: []` (empty array) and `showAttachmentBar: false`. Front/side/closeup slots do not exist anywhere in the codebase. |
| 10 | Edit/Inpaint and Upscale templates exist (or are only planned) | **PARTIAL** (Planned only) | No `edit.type.js`, `inpaint.type.js`, or `upscale.type.js` files exist in `composition/` or `features/`. Only `generatedMedia.type.js` and `character.type.js` exist. |

---

## 14. Open Questions for the Developer

1. **Parameter Collision on Mode Switch (`input_image`)**: When switching between Image mode (reference) and Video Frames mode (start frame), should `input_image` be discarded or preserved?
2. **Model Switch Media Migration**: When switching from a model with `input_image`/`last_frame` to one with `images[]`, should media be migrated to the new parameter format or dropped?
3. **Migration Plan for Legacy `usePromptStore`**: When will external components (`StudioNavbarLeft`, `useStudioItemDrag`, `useDragAutoScroll`, `useMediaActions`) be migrated off `usePromptStore`?
4. **Scope of the Character Template**: Is the 3-view character element sheet builder intended to be a prompt-bar template, or is it permanently owned by `/elements/edit/`?
5. **Session Storage vs In-Memory Registry Lifecycle**: Should `persistentStoreRegistry` retain store instances indefinitely in memory across projects, or should stores be garbage-collected on unmount?

---

## Summary Table

| Area | Status | Key Evidence |
|---|---|---|
| **Store Architecture** | **Concern** | `PromptBarStoreContext.js:15, 139` uses module-level singleton; `useMediaActions.js:150-180` synchronizes two separate stores. |
| **Persistence & Lifecycle** | **Concern** | `PromptBarStoreContext.js:101-139` executes storage side-effects during render; `sessionStorage.setItem` called un-debounced on every keystroke (`line 159`). |
| **Model Normalization** | **OK** | `modelManagement.js:146` and `useRealBackendModels.js:63` correctly adapt raw backend catalogs into normalized contracts. |
| **Mode & Parameter Mapping** | **Concern** | `generatedMedia.config.js:144, 159` reuses `input_image` for both start frame and reference, causing silent slot aliasing on mode switch. |
| **Serialization & Payload** | **OK** | `serialization.js:87-190` cleanly produces `{ model, prompt, parameters, references }` omitting null/empty fields and validating workflow IDs. |
| **Template Extensibility** | **Concern** | `character.type.js:14` lacks slots; Edit/Inpaint templates are missing; `PromptBarPlatform.jsx:131, 310` branches directly on `"video"` and `"image"` strings. |
| **Credit Calculation** | **OK** | `creditCalculationService.js:25-100` dynamically matches backend `pricingEngine.js` table lookup logic. |
| **Component Decomp.** | **Broken** | `PromptBarPlatform.jsx` is 1239 lines long, mixing UI layout, tag purging, store reconciliation, and window event listeners in one file. |
| **Test Suite** | **OK** | 9 test files (53 tests) pass hermetically with zero external dependencies. |
