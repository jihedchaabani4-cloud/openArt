# Pre-Merge Verification Report (`pb7(CHECK)`)

## In plain words

1. **C1 (`9276cf6`)**: 9arinna el 19 fichiers elli tfasskhou fi `9276cf6` m3a les versions mte3hom fi `src/features/prompt-bar/`: 7 fichiers `IDENTICAL` (0 diff), 4 shims/dead code, 1 `FORMAT-ONLY`, w 5 `LOGIC-DIFF` (`initialization`, `modelManagement`, `serialization`, `tagsService`, `createPromptBarStore`).
2. **Impact 3al consumers (C1.3–C1.6)**: 7atta `LOGIC-DIFF` fi fonction pure ma toussel l consumer: el wa7id elli tbaddel fil runtime howa `useCharacterStore` fi `characters/new/page.js`, w `9276cf6` wa77ed deux instances Zustand singletons kenou mفرقin (`Verdict C1: SAFE`).
3. **Lint (C2)**: Fi `src/features/prompt-bar`, 0 errors w 71 warnings (+34 `no-unused-vars` par rapport lel base `42c32fa`: +12 non-test, +22 test; +0 `exhaustive-deps`). L'erreur `MediaGridItem.jsx:294` (`useStudioItemDrag` ba3d `if (!item) return null`) pre-existing (`d77da18e`), w najjem t7ott React fi crash ken `item` yetbaddel mel `null` l objet.
4. **Effects (C3)**: `PromptBarPlatform.jsx` fiha 1 `useEffect` bark (`setTemplate(featureConfig)` fi ligne 162, mouch auto-expand textarea). Total non-test fi `prompt-bar` 33 `useEffect` (28 bla `CharacterFeatureEditor.jsx` mta3 P8 contre 30 fil base); les 2 effects elli kenou yصل7ou state ba3d mode/model switch tna77aw fi P4.
5. **Backend & FIX-4 (C4)**: `FIX-4` (`2627032`) ma ybaddel el payload mta3 **7atta modèle réel** (kol `images` fil backend 3andhom `max: 14` wala `16`, w kol `max: 1` houma `input_image`/`last_frame` de type `"string"`). Mais l9ina **High backend finding**: `schemaValidator.js` ma ythabbetch `Array.isArray` 3la `type: "array"`, w `imageController.js:115` / `imageGenerationNode.js:66` ythabbtou ownership ken ki `Array.isArray(parameters.images)`.
6. **Merge Readiness (C5)**: Build (28 routes) w Tests (72 files, 494 tests) `OK`; el branch prête lel merge ba3d confirmation `9276cf6` w el browser smoke checklist.

---

## C1. Commit `9276cf6` Differential Audit

### C1.1 Pairing Table for All 19 Deleted Files

- **Tag**: `VERIFIED`
- **Command**: `git diff-tree -r --no-commit-id --name-status 9276cf6` and line counts via `git show 9276cf6~1:<delPath>` and `git show 9276cf6:<counterpartPath>`.

| # | Deleted Path at `9276cf6^` (`95bde45`) | Lines (`9276cf6^`) | Counterpart Path at `9276cf6` | Lines (`9276cf6`) | Pair Classification |
|---|---|---|---|---|---|
| 1 | `src/features/prompt-bar/composition/generatedMedia.type.js` | 8 | `src/features/prompt-bar/templates/generatedMedia.template.js` | 456 | `LOGIC-DIFF` (Deleted file was 1-line re-export shim of counterpart) |
| 2 | `src/features/prompt-bar/composition/resolveUI.js` | 32 | `src/features/prompt-bar/templates/generatedMedia.template.js` | 456 | `LOGIC-DIFF` (Dead file; 0 importers at `9276cf6^`, superseded by `getSlots`) |
| 3 | `src/features/prompt-bar/features/generated-media/generatedMedia.config.js` | 14 | `src/features/prompt-bar/templates/generatedMedia.template.js` | 456 | `LOGIC-DIFF` (Deleted file was re-export shim of counterpart) |
| 4 | `src/features/prompt-bar/model/core/promptBarState.js` | 39 | `src/features/prompt-bar/store/createPromptBarStore.js` | 454 | `LOGIC-DIFF` (Dead file; 0 importers at `9276cf6^`) |
| 5 | `src/features/studio/PromptBarStoreContext.js` | 15 | `src/features/prompt-bar/store/PromptBarStoreContext.js` | 237 | `LOGIC-DIFF` (Deleted file was pure re-export shim of counterpart) |
| 6 | `src/features/studio/core/entityService.js` | 224 | `src/features/prompt-bar/core/entityService.js` | 225 | `IDENTICAL` (`0 diff lines` ignoring whitespace/blank lines) |
| 7 | `src/features/studio/core/initialization.js` | 40 | `src/features/prompt-bar/core/initialization.js` | 45 | `LOGIC-DIFF` (+5 insertions) |
| 8 | `src/features/studio/core/modelManagement.js` | 244 | `src/features/prompt-bar/core/modelManagement.js` | 265 | `LOGIC-DIFF` (+49 insertions, -28 deletions) |
| 9 | `src/features/studio/core/parameterState.js` | 47 | `src/features/prompt-bar/core/parameterState.js` | 47 | `IDENTICAL` (`0 diff lines`) |
| 10 | `src/features/studio/core/promptBarRules.js` | 119 | `src/features/prompt-bar/model/core/promptBarRules.js` | 119 | `IDENTICAL` (`0 diff lines`) |
| 11 | `src/features/studio/core/promptBarState.js` | 39 | `src/features/prompt-bar/store/createPromptBarStore.js` | 454 | `LOGIC-DIFF` (Dead file; 0 importers at `9276cf6^`) |
| 12 | `src/features/studio/core/reconciliation.js` | 103 | `src/features/prompt-bar/core/reconciliation.js` | 103 | `IDENTICAL` (`0 diff lines`) |
| 13 | `src/features/studio/core/serialization.js` | 93 | `src/features/prompt-bar/core/serialization.js` | 191 | `LOGIC-DIFF` (+118 insertions, -20 deletions) |
| 14 | `src/features/studio/core/tagsService.js` | 260 | `src/features/prompt-bar/core/tagsService.js` | 253 | `LOGIC-DIFF` (+6 insertions, -13 deletions) |
| 15 | `src/features/studio/core/types.js` | 145 | `src/features/prompt-bar/core/types.js` | 147 | `FORMAT-ONLY` (+16/-14: string literals replaced by `PARAM`/`MEDIA_TYPES` constants with identical values) |
| 16 | `src/features/studio/createPromptBarStore.js` | 319 | `src/features/prompt-bar/store/createPromptBarStore.js` | 454 | `LOGIC-DIFF` (+270 insertions, -135 deletions) |
| 17 | `src/features/studio/feature-constants.js` | 524 | `src/features/prompt-bar/model/feature-constants.js` | 524 | `IDENTICAL` (`0 diff lines`) |
| 18 | `src/features/studio/useCharacterStore.js` | 242 | `src/features/prompt-bar/model/useCharacterStore.js` | 242 | `IDENTICAL` (`0 diff lines`) |
| 19 | `src/features/studio/useLibraryFilter.js` | 196 | `src/features/prompt-bar/model/useLibraryFilter.js` | 196 | `IDENTICAL` (`0 diff lines`) |

---

### C1.2 Textual Comparison and `LOGIC-DIFF` Hunks

- **Tag**: `VERIFIED`
- **Command**: `git diff --no-index --ignore-all-space --ignore-blank-lines --stat "$env:TEMP\pb_c1_a.js" "$env:TEMP\pb_c1_b.js"`

#### 1. Shims (`generatedMedia.type.js`, `generatedMedia.config.js`, `studio/PromptBarStoreContext.js`) and Dead State Files (`resolveUI.js`, `promptBarState.js`)
```javascript
// git show 9276cf6~1:src/features/prompt-bar/composition/generatedMedia.type.js
export { generatedMediaType } from "../templates/generatedMedia.template.js";

// git show 9276cf6~1:src/features/prompt-bar/features/generated-media/generatedMedia.config.js
export {
  COMPOSITION_REQUIREMENTS,
  isFrameModel,
  isReferenceModel,
  filterEligibleModels,
  resolveParameterMapping,
  generatedMediaConfig,
} from "../../templates/generatedMedia.template.js";

// git show 9276cf6~1:src/features/studio/PromptBarStoreContext.js
export {
  setActivePromptBarStore,
  getActivePromptBarStore,
  PromptBarStoreContext,
  PromptBarStoreProvider,
  usePromptBarStoreInstance,
  clearPersistentPromptBarStores,
} from "@/features/prompt-bar/store/PromptBarStoreContext.js";
```
- **2-line explanation**: `generatedMedia.type.js`, `generatedMedia.config.js`, and `studio/PromptBarStoreContext.js` were already 100% pass-through re-export shims pointing to their `prompt-bar` counterparts prior to `9276cf6`. `resolveUI.js` and both `promptBarState.js` copies had 0 importers anywhere in the repo at `9276cf6^`.

#### 2. `src/features/studio/core/initialization.js` vs `src/features/prompt-bar/core/initialization.js` (`1 file changed, 5 insertions(+)`)
```diff
@@ -15,6 +15,11 @@ import { initializeValues, getActiveDefinitions } from "./parameterState.js";
  * @returns {{ selectedModelId: string|null, parameterValues: Record<string, any> }}
  */
 export function initializeFromType(typeConfig, modelsMap = {}) {
+  if (typeConfig?.features?.models === false) {
+    const parameterValues = initializeValues(typeConfig?.parameters || {});
+    return { selectedModelId: null, parameterValues };
+  }
+
   const { defaultModelId, supportedDomains } = typeConfig || {};
```
- **2-line explanation**: The `prompt-bar` version adds the W4 guard for model-less templates (`features.models === false`), returning `selectedModelId: null` and initializing template-level parameters instead of picking a fallback model from `modelsMap`. When `features.models !== false`, both versions behave identically.

#### 3. `src/features/studio/core/modelManagement.js` vs `src/features/prompt-bar/core/modelManagement.js` (`1 file changed, 49 insertions(+), 28 deletions(-)`)
```diff
@@ -169,7 +170,27 @@ export function adaptBackendModel(rawModel = {}) {
     icon: resolveModelIcon(rawModel),
     pricing: rawModel.pricing || rawModel.retailPricing || null,
     tags: rawModel.tags || [],
-    capabilities: rawModel.capabilities || {},
+    capabilities: {
+      ...(rawModel.capabilities || {}),
+      [PARAM.INPUT_IMAGE]: Boolean(
+        rawModel.capabilities?.[PARAM.INPUT_IMAGE] ||
+        rawParams[PARAM.INPUT_IMAGE] ||
+        rawParams[PARAM.IMAGES] ||
+        rawParams[PARAM.REFERENCE_IMAGES] ||
+        definitions[PARAM.INPUT_IMAGE]
+      ),
+      [PARAM.LAST_FRAME]: Boolean(
+        rawModel.capabilities?.[PARAM.LAST_FRAME] ||
+        rawParams[PARAM.LAST_FRAME] ||
+        rawParams[PARAM.END_FRAME] ||
+        definitions[PARAM.LAST_FRAME]
+      ),
+      [PARAM.INPUT_VIDEO]: Boolean(
+        rawModel.capabilities?.[PARAM.INPUT_VIDEO] ||
+        rawParams[PARAM.INPUT_VIDEO] ||
+        definitions[PARAM.INPUT_VIDEO]
+      ),
+    },
     parameters: definitions,
     diagnostics,
   };
```
- **2-line explanation**: Beyond replacing string literals with `PARAM.*` constants, `adaptBackendModel` in `prompt-bar` populates boolean `capabilities.input_image`, `capabilities.last_frame`, and `capabilities.input_video` derived from `rawParams` and `definitions`, whereas the stale `studio` copy left `capabilities` as `rawModel.capabilities || {}`. `getModelReferenceCapability(model)` is identical in both files.

#### 4. `src/features/studio/core/serialization.js` vs `src/features/prompt-bar/core/serialization.js` (`1 file changed, 118 insertions(+), 20 deletions(-)`)
```diff
@@ -12,6 +12,48 @@
 import { validateParameter } from "./reconciliation.js";
+import { PARAM } from "./parameterKeys.js";
+
+const MEDIA_PARAM_NAMES = new Set([
+  PARAM.IMAGES, PARAM.REFERENCE_IMAGES, PARAM.INPUT_IMAGE,
+  PARAM.LAST_FRAME, PARAM.INPUT_VIDEO, PARAM.START_FRAME, PARAM.END_FRAME,
+]);
+
+export function extractWorkflowId(item) {
+  if (!item) return null;
+  if (typeof item === "object") {
+    const id = item.workflow_id || item.workflowId || item.id || item.asset_id;
+    if (typeof id === "string" && id.trim()) {
+      const clean = id.trim();
+      if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("blob:")) return clean;
+    }
+    return null;
+  }
+  if (typeof item === "string") {
+    const clean = item.trim();
+    if (clean && !clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("blob:")) return clean;
+  }
+  return null;
+}
@@ -34,27 +96,42 @@ export function serialize(modelId, prompt = "", definitions = {}, values = {}, e
-      if (Array.isArray(val)) {
-        parameters[name] = val.map((v) =>
-          typeof v === "object" && v !== null ? v.workflow_id || v.id || v.asset_id || v.url : v
-        );
-      } else if (typeof val === "object" && val !== null) {
-        parameters[name] = val.workflow_id || val.id || val.asset_id || val.url;
-      } else {
-        parameters[name] = val;
-      }
+      const isMedia = MEDIA_PARAM_NAMES.has(name) || def?.group === "media" ||
+        def?.type === "image" || def?.type === "image[]" || def?.type === "video" || def?.type === "video[]";
+      if (isMedia) {
+        parameters[name] = normalizeMediaParamValue(val);
+      }
-  // Explicit pass-through for undeclared media keys...
+  return { model: modelId || "", prompt: trimmedPrompt, parameters, references, elements, characters };
```
- **2-line explanation**: The stale `studio` copy leaked undeclared media keys (`input_image`, `last_frame`, `images`) into `parameters` (bug PB-K2) and did not emit `references`. The `prompt-bar` version (updated in P4 T1/T4 and FIX-4) strictly emits only declared parameters, strips `blob:`/`http:` URLs when extracting workflow IDs, wraps array-typed media in `[]`, and computes `references`.

#### 5. `src/features/studio/core/tagsService.js` vs `src/features/prompt-bar/core/tagsService.js` (`1 file changed, 6 insertions(+), 13 deletions(-)`)
```diff
@@ -16,17 +16,8 @@
 export const TAG_REGEX = /<(?:character|element|MediaAsset|media|ref|reference):\s*([^>]+)>/gi;
-export function getAssetId(asset) {
-  if (!asset) return null;
-  if (typeof asset === "string") return asset;
-  return asset.workflow_id || asset.workflowId || asset.id || asset.asset_id || asset.ref_media_id || asset.url || null;
-}
+import { getAssetId } from "./mediaRef.js";
+export { getAssetId };
@@ -43,8 +34,8 @@ export function cleanTagsForAsset(prompt = "", assetIds = []) {
-    const escaped = String(id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
-    const regex = new RegExp(`<(?:character|element|MediaAsset|media|ref|reference):\\s*${escaped}\\s*>`, "gi");
+    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
+    const regex = new RegExp(`<(?:character|element|MediaAsset|media|ref|reference):\\s*${escaped}>`, "gi");
@@ -129,6 +120,8 @@ export function getActiveReferences(activeSlots = [], paramValues = {}, featureC
+        is_upload: Boolean(item.is_upload || item.type === "upload" || item.workflow_type === "UPLOAD"),
+        element_type: item.element_type || item.elementType || item.category,
```
- **2-line explanation**: The `prompt-bar` version delegates `getAssetId` to `mediaRef.js` (which trims strings), drops trailing `\s*` before `>` in `cleanTagsForAsset`, and adds `is_upload` and `element_type` metadata fields to items returned by `getActiveReferences`.

#### 6. `src/features/studio/createPromptBarStore.js` vs `src/features/prompt-bar/store/createPromptBarStore.js` (`1 file changed, 270 insertions(+), 135 deletions(-)`)
```diff
@@ -10,16 +10,21 @@
 import { createStore } from "zustand/vanilla";
+import { registry } from "./registry.js";
+import { switchMode as switchModeCommand } from "./commands/switchMode.js";
+import { selectModel as selectModelCommand } from "./commands/selectModel.js";
+import { attachMedia as attachMediaCommand } from "./commands/attachMedia.js";
+import { removeMedia as removeMediaCommand } from "./commands/removeMedia.js";
-export function createPromptBarStore(overrides = {}) {
+export function createPromptBarStore(overrides = {}, initialDeps = {}) {
@@ -45,10 +57,30 @@
+    pendingHydration: overrides.pendingHydration || null,
+    identity: overrides.identity || null,
+    template: overrides.template || deps.template || null,
+    focusRequest: overrides.focusRequest || 0,
     ...overrides,
+    hydrate: (saved) => { ... },
+    switchMode: (mode, subMode) => { ... },
+    selectModel: (modelId) => { ... },
+    attachMedia: (role, item) => { ... },
+    removeMedia: (role, idOrIndex) => { ... },
+    beginSubmit: () => { ... },
+    endSubmit: (token) => { ... },
+    requestFocus: () => { ... },
```
- **2-line explanation**: `src/features/studio/createPromptBarStore.js` was an unreferenced pre-P3 copy that lacked P3/P4/P5 store actions (`hydrate`, `switchMode`, `selectModel`, `attachMedia`, `removeMedia`, `beginSubmit`, `endSubmit`, `requestFocus`, template action binding).

---

### C1.3 Consumer Mapping (`9276cf6^` vs `HEAD`)

- **Tag**: `VERIFIED`
- **Command**: `git grep -n "features/studio" 9276cf6~1 -- src ":!src/features/studio"` and `git show 9276cf6 -- src/features/studio/index.js src/features/studio/core/mediaReferenceService.js`

| Consumer (`file:line`) | Export(s) Imported | Resolved Target at `9276cf6^` | Resolved Target at `HEAD` | Target Diff Class |
|---|---|---|---|---|
| `src/app/cinema-studio/[projectId]/characters/new/page.js:9` | `useCharacterStore` | `src/features/studio/useCharacterStore.js` | `src/features/prompt-bar/model/useCharacterStore.js` | `IDENTICAL` source (unifies singleton instance) |
| `src/app/cinema-studio/[projectId]/characters/page.js:10` | `usePromptStore` | `src/features/prompt-bar/model/usePromptStore.js` | `src/features/prompt-bar/model/usePromptStore.js` | Unchanged |
| `src/app/cinema-studio/[projectId]/elements/page.js:12` | `usePromptStore` | `src/features/prompt-bar/model/usePromptStore.js` | `src/features/prompt-bar/model/usePromptStore.js` | Unchanged |
| `src/app/cinema-studio/[projectId]/layout.js:15` | `useDragAutoScroll` | `src/features/studio/useDragAutoScroll.js` | `src/features/studio/useDragAutoScroll.js` | Unchanged |
| `src/features/workflows/model/elementSheetConfig.js:1` | `extractFeaturesFromPrompt`, `getFeatureInfoFromLabel` | `src/features/studio/feature-constants.js` | `src/features/prompt-bar/model/feature-constants.js` | `IDENTICAL` (`0 diff lines`) |
| `src/features/workflows/model/useMediaActions.js:9` | `canAnyModelAcceptEntity` | `studio/core/mediaReferenceService.js` -> `studio/core/{entityService,modelManagement}.js` | `studio/core/mediaReferenceService.js` -> `prompt-bar/core/{entityService,modelManagement}.js` | `IDENTICAL` (`getEntityImageCount` & `getModelReferenceCapability` match 100%) |
| `src/widgets/ImportMediaDialog/ImportMediaPopover.jsx:7` | `useLibraryFilter`, `extractIdentifyingKeys` | `src/features/studio/useLibraryFilter.js` | `src/features/prompt-bar/model/useLibraryFilter.js` | `IDENTICAL` (`0 diff lines`) |
| `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:12` | `usePromptStore`, `useStudioItemDrag` | `src/features/studio/useStudioItemDrag.js` & `prompt-bar/model/usePromptStore.js` | `src/features/studio/useStudioItemDrag.js` & `prompt-bar/model/usePromptStore.js` | Unchanged |
| `src/components/cinema-studio/elements/ElementDetailsGallery.test.jsx:42` | `vi.mock("@/features/studio")` | Test mock | Test mock | Unchanged |
| `src/features/prompt-bar/__tests__/mediaActionsMigration.test.jsx:44` | `vi.mock("@/features/studio")` | `studio/core/mediaReferenceService.js` | `studio/core/mediaReferenceService.js` | Unchanged |
| `src/widgets/StudioLayout/__tests__/useDragAutoScroll.test.jsx:3` | `useDragAutoScroll`, `findScrollContainer` | `src/features/studio/useDragAutoScroll.js` | `src/features/studio/useDragAutoScroll.js` | Unchanged |
| 9 test files in `src/features/prompt-bar/__tests__/*` | `generatedMediaConfig`, `generatedMediaType`, `filterEligibleModels`, `COMPOSITION_REQUIREMENTS`, `resolveParameterMapping` | Re-export shims `generatedMedia.config.js` / `generatedMedia.type.js` -> `generatedMedia.template.js` | Direct import from `src/features/prompt-bar/templates/generatedMedia.template.js` | Identical runtime object |

- **Note on `src/features/studio/index.js` and `mediaReferenceService.js`**:
  - `git grep -n "adaptBackendModel\|adaptBackendCatalog\|tagsService\|entityService" HEAD -- src` confirms **0 external consumers** import `adaptBackendModel`, `adaptBackendCatalog`, `tagsService`, or `entityService` from `@/features/studio`.
  - Inside `src/features/studio/core/mediaReferenceService.js:21`, `autoAssignReference`, `getAssetId`, and `cleanTagsForAsset` are imported from `tagsService.js` but **never called** anywhere in `mediaReferenceService.js`; only `getEntityImageCount` and `getModelReferenceCapability` are called (inside `canAnyModelAcceptEntity` and `findBestModelForEntity`).

---

### C1.4 Differential Execution (`pb-parent` vs `pb-head`)

- **Tag**: `VERIFIED` (for pure functions executed in Node across `$env:TEMP\pb-parent` and `$env:TEMP\pb-head`) / `INFERRED` (for React hooks and Zustand store factories compared by API surface and diff).
- **Command**: `node docs/prompt-bar-plan/scratch/c1_diff_exec.mjs` importing `pb-parent/src/features/studio/core/*` vs `pb-head/src/features/prompt-bar/core/*`.

| Function & Input | Old Output (`pb-parent` studio copy) | New Output (`pb-head` prompt-bar version) | Result | Reaches Any Consumer of `studio`? |
|---|---|---|---|---|
| `entityService.normalizeEntity(sampleChar, "character")` | `{"id":"char_1","workflow_id":"char_1","displayName":"Hero","url":"","preview":"","type":"character","workflow_type":"CHARACTER_SHEET","image_count":2}` | Identical | **MATCH** | Yes (`IDENTICAL`) |
| `entityService.getEntityImageCount(sampleChar)` | `2` | `2` | **MATCH** | Yes (`canAnyModelAcceptEntity`) |
| `entityService.canAddReference([{id:"r1"}], sampleChar, 4)` | `{"canAdd":true,"usedImages":1,"remainingImages":3,"candidateCount":2}` | Identical | **MATCH** | No studio caller |
| `entityService.canAddReference([{id:"r1"}], sampleChar, 2)` | `{"canAdd":false,"usedImages":1,"remainingImages":1,"candidateCount":2,"reason":"Requires 2 image slots, but only 1 left."}` | Identical | **MATCH** | No studio caller |
| `modelManagement.getModelReferenceCapability(model_frames)` | `{"supports":false,"maxRefs":0,"backendKey":null}` | Identical | **MATCH** | Yes (`canAnyModelAcceptEntity`) |
| `modelManagement.getModelReferenceCapability(model_images)` | `{"supports":true,"maxRefs":4,"backendKey":"images"}` | Identical | **MATCH** | Yes (`canAnyModelAcceptEntity`) |
| `modelManagement.getModelReferenceCapability(model_single_ref)` | `{"supports":true,"maxRefs":1,"backendKey":"images"}` | Identical | **MATCH** | Yes (`canAnyModelAcceptEntity`) |
| `modelManagement.getModelReferenceCapability(model_prompt_only)` | `{"supports":false,"maxRefs":0,"backendKey":null}` | Identical | **MATCH** | Yes (`canAnyModelAcceptEntity`) |
| `modelManagement.adaptBackendModel(model_frames \| model_images \| model_single_ref \| model_prompt_only)` | `capabilities: {}` | `capabilities: { input_image: bool, last_frame: bool, input_video: bool }` | **MISMATCH** | **No** (0 callers via `studio`) |
| `tagsService.getAssetId({workflow_id:"wf_1", id:"id_1"})` | `"wf_1"` | `"wf_1"` | **MATCH** | No studio caller |
| `tagsService.cleanTagsForAsset("Hello <media:ref_1> and <character:char_1> world", ["ref_1"])` | `"Hello and <character:char_1> world"` | `"Hello and <character:char_1> world"` | **MATCH** | No studio caller |
| `tagsService.cleanTagsForAsset("Hello <media:ref_1 > world", ["ref_1"])` | `"Hello world"` | `"Hello <media:ref_1 > world"` | **MISMATCH** | **No** (0 callers via `studio`) |
| `tagsService.getActiveReferences(...)` | Item without `is_upload` / `element_type` | Item includes `"is_upload":true,"element_type":"style"` | **MISMATCH** | **No** (0 callers via `studio`) |
| `reconciliation.reconcile(images -> promptOnly)` | Preserves compatible `aspect_ratio`, drops/logs incompatible | Identical | **MATCH** | No studio caller |
| `serialization.serialize(model_images, ...)` with undeclared `input_image` | Leaks `"input_image":"stale_start"`, omits `references` | Drops undeclared `input_image`, emits `"references":["ref_1","el_1"]` | **MISMATCH** | **No** (`studio/createPromptBarStore.js` had 0 importers) |
| `initialization.initializeFromType({features:{models:false}})` | `{"selectedModelId":"model_frames","parameterValues":{}}` | `{"selectedModelId":null,"parameterValues":{"images":[]}}` | **MISMATCH** | **No** (`studio/createPromptBarStore.js` had 0 importers) |

- **Hooks & Stores API Surface Comparison (`INFERRED` from diff and exports)**:
  - `useCharacterStore` (`242 lines` vs `242 lines`): `0 diff lines`. Exports `useCharacterStore`, `useElementStore`, `default`. Identical state shape and action arity.
  - `useLibraryFilter` (`196 lines` vs `196 lines`): `0 diff lines`. Exports `useLibraryFilter(options)` (arity 1) and `extractIdentifyingKeys(item)` (arity 1).
  - `createPromptBarStore`: `studio/createPromptBarStore.js` (`createPromptBarStore(overrides = {})`, arity 0/1) had **0 importers** at `9276cf6^` because `studio/PromptBarStoreContext.js` already re-exported from `@/features/prompt-bar/store/PromptBarStoreContext.js`.

---

### C1.5 Consumer Behavior Impact Analysis

1. `src/features/workflows/model/useMediaActions.js:9` (`canAnyModelAcceptEntity`): Calls `getEntityImageCount` (`IDENTICAL`) and `getModelReferenceCapability` (`MATCH` across all models). **Zero behavior change**.
2. `src/features/workflows/model/elementSheetConfig.js:1` (`extractFeaturesFromPrompt`, `getFeatureInfoFromLabel`): `feature-constants.js` is `IDENTICAL` (0 diff lines). **Zero behavior change**.
3. `src/widgets/ImportMediaDialog/ImportMediaPopover.jsx:7` (`useLibraryFilter`, `extractIdentifyingKeys`): `useLibraryFilter.js` is `IDENTICAL` (0 diff lines). **Zero behavior change**.
4. `src/app/cinema-studio/[projectId]/characters/new/page.js:9` (`useCharacterStore`): Source files `src/features/studio/useCharacterStore.js` and `src/features/prompt-bar/model/useCharacterStore.js` were `IDENTICAL` (0 diff lines), but because Zustand's `create()` instantiates a store per module, prior to `9276cf6` `characters/new/page.js` (importing from `@/features/studio`) mutated a separate singleton instance from `CharacterPromptBar.jsx`, `CharacterFeatureEditor.jsx`, and `SyncFeaturesPlugin.jsx` (importing from `src/features/prompt-bar/model/useCharacterStore.js`). Pointing `src/features/studio/index.js` to `@/features/prompt-bar/model/useCharacterStore` in `9276cf6` **unified them into a single shared store instance** on the `/cinema-studio/[projectId]/characters/new` screen.

### C1.6 Verdict C1

- **Verdict C1**: **SAFE** — No pure-function `LOGIC-DIFF` reaches any external consumer; all dead duplicate `studio/core/*` files were unused by external callers, and unifying `useCharacterStore` in `src/features/studio/index.js` prevents split-brain singleton state on `/cinema-studio/[projectId]/characters/new`.

---

## C2. Lint Comparison (`42c32fa` vs `HEAD`)

### C2.1 `src/features/prompt-bar` ESLint Breakdown

- **Tag**: `VERIFIED`
- **Command**: `npx eslint src/features/prompt-bar -f json -o "$env:TEMP\now.json"` (at `HEAD` `51ec356`) and inside worktree `$env:TEMP\pb-base` (at `42c32fa`), parsed via `node docs/prompt-bar-plan/scratch/c2_analyze.mjs`.

| ESLint Rule ID | Base (`42c32fa`) Total | Base Non-Test | Base Test | HEAD (`51ec356`) Total | HEAD Non-Test | HEAD Test | Delta (HEAD - Base) |
|---|---|---|---|---|---|---|---|
| `no-unused-vars` | 22 | 21 | 1 | 56 | 33 | 23 | **+34** (+12 non-test, +22 test) |
| `react-hooks/exhaustive-deps` | 8 | 8 | 0 | 8 | 8 | 0 | **0** |
| `@next/next/no-img-element` | 7 | 7 | 0 | 7 | 7 | 0 | **0** |
| **Total Warnings** | **37** | **36** | **1** | **71** | **48** | **23** | **+34** (+12 non-test, +22 test) |
| **Total Errors** | **0** | **0** | **0** | **0** | **0** | **0** | **0** |

- **Did the refactor add warnings?** **Yes**: it added **34 warnings**, 100% of which are `no-unused-vars` (+12 in non-test files, +22 in test files). Zero `react-hooks/exhaustive-deps` and zero `@next/next/no-img-element` warnings were added, and errors in `src/features/prompt-bar` remained **0**.
- **Top 5 files with the most warnings in `src/features/prompt-bar` at `HEAD`**:
  1. `src/features/prompt-bar/ui/common/editor/PromptEditor.jsx` — **7 warnings** (`no-unused-vars` x4, `react-hooks/exhaustive-deps` x3; had 8 at base)
  2. `src/features/prompt-bar/platform/PromptBarPlatform.jsx` — **5 warnings** (`no-unused-vars` x3 at lines 3, 108, 215; `react-hooks/exhaustive-deps` x2 at lines 128, 129)
  3. `src/features/prompt-bar/__tests__/usePromptBarRouteWatcher.test.jsx` — **4 warnings** (`no-unused-vars` x4 at lines 2, 2, 7, 99)
  4. `src/features/prompt-bar/ui/common/ReferenceButton.jsx` — **4 warnings** (`no-unused-vars` x2, `@next/next/no-img-element` x2; unchanged from base)
  5. `src/features/prompt-bar/__tests__/promptBarService.test.js` — **3 warnings** (`no-unused-vars` x3 at lines 11, 15, 80; tied with `FeatureNode.jsx`, `MentionTag.jsx`, `FlowPromptBoxSettings.jsx` at 3 warnings each)

---

### C2.2 Whole-Repo Error: `MediaGridItem.jsx:294`

- **Tag**: `VERIFIED`
- **Commands**:
  - `git blame -L 280,305 src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx`
  - `git log --oneline 42c32fa..HEAD -- src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx` -> *(empty output: 0 commits)*
  - `git merge-base --is-ancestor d77da18e 42c32fa; Write-Output "is-ancestor d77da18e 42c32fa exit: $LASTEXITCODE"` -> `is-ancestor d77da18e 42c32fa exit: 0`

#### Verbatim Lines 280–300 (`src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:280-300`)
```javascript
      isVideo,
      showTileDetails,
      canDelete,
      canReuse,
      canAddToPrompt,
    },
  });

  const wfId = workflow?.name || workflow?.id || item?.workflow_id || item?.id;
  const {
    handlePointerDown,
    isDragging,
    dragTarget,
    justDraggedRef,
  } = useStudioItemDrag({
    itemType: "workflow",
    item: workflow || item,
    itemId: wfId,
    url,
    isDraggable,
    isRenaming,
```

#### `git blame -L 285,300` Output
```text
f5ba2221 (Jihad 2026-09-28 00:48:28 +0100 285)     },
f5ba2221 (Jihad 2026-09-28 00:48:28 +0100 286)   });
22397994 (Jihad 2026-04-17 19:47:19 +0100 287) 
d77da18e (Jihad 2026-10-13 00:52:40 +0100 288)   const wfId = workflow?.name || workflow?.id || item?.workflow_id || item?.id;
d77da18e (Jihad 2026-10-13 00:52:40 +0100 289)   const {
d77da18e (Jihad 2026-10-13 00:52:40 +0100 290)     handlePointerDown,
d77da18e (Jihad 2026-10-13 00:52:40 +0100 291)     isDragging,
d77da18e (Jihad 2026-10-13 00:52:40 +0100 292)     justDraggedRef,
d77da18e (Jihad 2026-10-13 00:52:40 +0100 293)   } = useStudioItemDrag({
d77da18e (Jihad 2026-10-13 00:52:40 +0100 294)     itemType: "workflow",
d77da18e (Jihad 2026-10-13 00:52:40 +0100 295)     item: workflow || item,
d77da18e (Jihad 2026-10-13 00:52:40 +0100 296)     itemId: wfId,
d77da18e (Jihad 2026-10-13 00:52:40 +0100 297)     url,
d77da18e (Jihad 2026-10-13 00:52:40 +0100 298)     isDraggable,
d77da18e (Jihad 2026-10-13 00:52:40 +0100 299)     isRenaming,
```

- **Pre-existing & untouched by plan**: Commit `d77da18e` is an ancestor of `42c32fa` (`$LASTEXITCODE = 0`), and **0 plan commits** touched `MediaGridItem.jsx`.
- **Stability across renders (3-line analysis)**:
  Line 176 of `MediaGridItem.jsx` executes an early return `if (!item) return null;` before `useStudioItemDrag({...})` is called at line 294 (`item` comes from `useWorkflowActions(workflow, resolvedItem)` at line 56).
  If a mounted `WorkflowMediaGridItem` initially renders while `workflow.items` is empty (`item === null`) and then re-renders when polling/realtime populates `workflow.items` (`item !== null`), the early return is bypassed on the second render.
  Because `useStudioItemDrag` invokes `useState`, `useRef`, `useCallback`, and `useEffect`, transitioning `item` from `null` to non-null (or vice versa) on the same mounted component instance changes the hook count between renders and will cause React to throw `"Rendered more hooks than during the previous render"`.

---

### C2.3 Whole-Repo ESLint Totals (`42c32fa` vs `HEAD`)

- **Tag**: `VERIFIED`
- **Command**: `npx eslint . -f json` in clean worktree at `42c32fa` and at `HEAD` (`51ec356`), plus `npm run lint` in working tree.

| Commit | Errors | Warnings | Total Problems |
|---|---|---|---|
| **Base (`42c32fa`)** | **1** (`MediaGridItem.jsx:294`) | **236** (225 non-test, 11 test) | **237** |
| **HEAD (`51ec356`)** | **1** (`MediaGridItem.jsx:294`) | **277** (244 non-test, 33 test) | **278** |

---

## C3. Effects Audit: Real Totals Across the Codebase

### C3.1 Non-Test `useEffect(` and `useLayoutEffect(` Per-File Table (`42c32fa` vs `HEAD`)

- **Tag**: `VERIFIED`
- **Command**: `node docs/prompt-bar-plan/scratch/c3_effects.mjs` (inspecting all non-test files in `src/features/prompt-bar`, `src/features/studio`, `src/features/workflows/model/useMediaActions.js`, and touched studio pages/layouts at `42c32fa` and `HEAD`). Zero `useLayoutEffect(` calls exist in either commit.

| Non-Test File Path | `42c32fa` `useEffect(` | `42c32fa` `useLayoutEffect(` | `HEAD` `useEffect(` | `HEAD` `useLayoutEffect(` | Delta |
|---|---|---|---|---|---|
| `src/features/prompt-bar/model/useLibraryFilter.js` | 1 | 0 | 1 | 0 | 0 |
| `src/features/prompt-bar/platform/PromptBarPlatform.jsx` | 9 | 0 | 1 | 0 | **-8** |
| `src/features/prompt-bar/platform/hooks/usePromptBarModels.js` | *(N/A)* | 0 | 2 | 0 | **+2** (extracted from Platform) |
| `src/features/prompt-bar/platform/hooks/usePromptBarReferences.js` | *(N/A)* | 0 | 2 | 0 | **+2** (extracted from Platform) |
| `src/features/prompt-bar/store/PromptBarStoreContext.js` | 1 | 0 | 1 | 0 | 0 |
| `src/features/prompt-bar/store/usePromptBarRouteWatcher.js` | *(N/A)* | 0 | 1 | 0 | **+1** (new in W2) |
| `src/features/prompt-bar/ui/character/CharacterFeatureEditor.jsx` | *(N/A)* | 0 | 5 | 0 | **+5** (new in P8-character `b05f6ff`) |
| `src/features/prompt-bar/ui/common/editor/AtMentionMenu.jsx` | 4 | 0 | 4 | 0 | 0 |
| `src/features/prompt-bar/ui/common/editor/MentionPlugin.jsx` | 3 | 0 | 3 | 0 | 0 |
| `src/features/prompt-bar/ui/common/editor/PromptEditor.jsx` | 4 | 0 | 5 | 0 | **+1** (`FocusRequestPlugin` in X3) |
| `src/features/prompt-bar/ui/common/editor/plugins/SyncFeaturesPlugin.jsx` | 3 | 0 | 3 | 0 | 0 |
| `src/features/prompt-bar/ui/common/editor/plugins/TextTagConverterPlugin.jsx` | 1 | 0 | 1 | 0 | 0 |
| `src/features/prompt-bar/ui/common/selectors/DropdownEngine.jsx` | 3 | 0 | 3 | 0 | 0 |
| `src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx` | 1 | 0 | 1 | 0 | 0 |
| **Subtotal: `src/features/prompt-bar` (non-test)** | **30** | **0** | **33** *(28 excl. P8 `CharacterFeatureEditor`)* | **0** | **+3** *(-2 excl. P8)* |
| `src/features/studio/useDragAutoScroll.js` | 1 | 0 | 1 | 0 | 0 |
| `src/features/studio/useLibraryFilter.js` | 1 | 0 | *(deleted in `9276cf6`)* | 0 | **-1** |
| `src/features/studio/useStudioItemDrag.js` | 2 | 0 | 2 | 0 | 0 |
| `src/features/workflows/model/useMediaActions.js` | 0 | 0 | 0 | 0 | 0 |
| `src/app/cinema-studio/[projectId]/layout.js` | 4 | 0 | 4 | 0 | 0 |
| `src/app/cinema-studio/[projectId]/elements/edit/[workflowId]/page.js` | 2 | 0 | 2 | 0 | 0 |
| `src/app/cinema-studio/[projectId]/characters/new/page.js` | 0 | 0 | 0 | 0 | 0 |
| `src/widgets/StudioLayout/CinemaStudioLayout/CinemaStudioLayout.jsx` | 0 | 0 | 0 | 0 | 0 |
| **Total Across All Audited Scopes** | **40** | **0** | **42** *(37 excl. P8 `CharacterFeatureEditor`)* | **0** | **+2** *(-3 excl. P8)* |

---

### C3.2 Complete Inventory and Classification of All 33 Effects in `src/features/prompt-bar` at `HEAD`

- **Tag**: `VERIFIED`
- **Classifications**:
  - **(a)** Subscription / event listener with cleanup
  - **(b)** Focus / DOM measurement or imperative DOM sync
  - **(c)** Hydration / mount lifecycle
  - **(d)** Writes store state or calls a React state setter after render (derived-state / state-sync in effect)
  - **(e)** Other (ref synchronization / callback notification)

| # | `file:line` | First Line | One-Sentence Purpose | Class | If `(d)`: Replaceable by Derivation or Command? |
|---|---|---|---|---|---|
| 1 | `model/useLibraryFilter.js:68` | `useEffect(() => {` | Syncs `selectedCategory` local state when `initialCategory` prop changes. | **(d)** | Replaceable by passing `initialCategory` only as `useState` initial value or deriving default category during render. |
| 2 | `platform/PromptBarPlatform.jsx:162` | `useEffect(() => {` | Syncs `featureConfig` prop into the store via `setTemplate(featureConfig)` after render. | **(d)** | Replaceable by initializing `template` inside `PromptBarStoreProvider` on store creation (which `PromptBarStoreContext.js:126` already does when `type` is passed to the provider). |
| 3 | `platform/hooks/usePromptBarModels.js:38` | `useEffect(() => {` | Copies asynchronously fetched `models` array from React Query into store via `setModels(models)`. | **(d)** | External async data boundary sync (React Query -> Zustand store); could be triggered in query `select`/callback or kept as external data feed. |
| 4 | `platform/hooks/usePromptBarModels.js:75` | `useEffect(() => {` | Auto-selects `eligibleModels[0].id` (or `null`) via `selectModel(...)` when current `selectedId` is not in `eligibleModels`. | **(d)** | Replaceable by computing fallback model during `setModels` / `switchMode` store commands or deriving effective model during render. |
| 5 | `platform/hooks/usePromptBarReferences.js:194` | `useEffect(() => {` | Registers `mousedown` listener on `document` to close quick-mention popover on outside click. | **(a)** | N/A |
| 6 | `platform/hooks/usePromptBarReferences.js:207` | `useEffect(() => {` | Registers `mousedown` and `keydown` (`Escape`) listeners on `document` to close parameter drawer. | **(a)** | N/A |
| 7 | `store/PromptBarStoreContext.js:157` | `React.useEffect(() => {` | Marks instance mounted in registry, prunes unmounted stores of other projects, hydrates from `sessionStorage`, and subscribes debounced saver + `pagehide` flush. | **(c)** | N/A (Mandated by PB-D-06, PB-D-08, PB-D-09, PB-D-10). |
| 8 | `store/usePromptBarRouteWatcher.js:31` | `useEffect(() => {` | Resets non-submitting instances and clears their `sessionStorage` key when `pathname` leaves `persistRoutes`. | **(c)** | N/A (Mandated by PB-D-14). |
| 9 | `ui/character/CharacterFeatureEditor.jsx:33` | `React.useEffect(() => {` | Syncs local `activeTab` state from `featureEditor.activeTab` when the trait editor opens. | **(d)** | Replaceable by reading `featureEditor.activeTab` directly from `useCharacterStore` (derivation). |
| 10 | `ui/character/CharacterFeatureEditor.jsx:40` | `React.useEffect(() => {` | Registers `mousedown` listener on `document` to close the character trait editor on outside click. | **(a)** | N/A |
| 11 | `ui/character/CharacterFeatureEditor.jsx:143` | `React.useEffect(() => {` | Syncs local `activeSubTab` in `IdentityView` when `featureEditor.activeSubTab` changes. | **(d)** | Replaceable by deriving `activeSubTab` from store state or command action. |
| 12 | `ui/character/CharacterFeatureEditor.jsx:265` | `React.useEffect(() => {` | Syncs local `activeSubTab` in `HeadView` when `featureEditor.activeSubTab` changes. | **(d)** | Replaceable by deriving `activeSubTab` from store state or command action. |
| 13 | `ui/character/CharacterFeatureEditor.jsx:323` | `React.useEffect(() => {` | Syncs local `activeSubTab` in `DetailsView` when `featureEditor.activeSubTab` changes. | **(d)** | Replaceable by deriving `activeSubTab` from store state or command action. |
| 14 | `ui/common/editor/AtMentionMenu.jsx:204` | `useEffect(() => {` | Resets `selectedIndex` to `0` when the `@mention` menu opens or query `q` changes. | **(d)** | Replaceable by resetting index in the query change handler. |
| 15 | `ui/common/editor/AtMentionMenu.jsx:211` | `useEffect(() => {` | Registers `mousedown` listener on `document` to close `@mention` menu on outside click. | **(a)** | N/A |
| 16 | `ui/common/editor/AtMentionMenu.jsx:227` | `useEffect(() => {` | Scrolls the highlighted menu item into view (`el.scrollIntoView`) when `selectedIndex` changes. | **(b)** | N/A |
| 17 | `ui/common/editor/AtMentionMenu.jsx:236` | `useEffect(() => {` | Registers capture-phase `keydown` listener on `document` for arrow/Enter/Escape navigation in `@mention` menu. | **(a)** | N/A |
| 18 | `ui/common/editor/MentionPlugin.jsx:38` | `useEffect(() => {` | Registers Lexical `editor.registerUpdateListener` to detect `@query` text at the cursor. | **(a)** | N/A |
| 19 | `ui/common/editor/MentionPlugin.jsx:129` | `useEffect(() => {` | Registers Lexical `KEY_DOWN_COMMAND` listener for keyboard navigation in `MentionPlugin`. | **(a)** | N/A |
| 20 | `ui/common/editor/MentionPlugin.jsx:174` | `useEffect(() => {` | Registers `mousedown` listener on `document` to close `MentionPlugin` menu on outside click. | **(a)** | N/A |
| 21 | `ui/common/editor/PromptEditor.jsx:34` | `useEffect(() => {` | Imperatively updates Lexical editor root text when `externalValue` prop diverges from `root.getTextContent()`. | **(b)** | N/A (Controlled Lexical editor bridge). |
| 22 | `ui/common/editor/PromptEditor.jsx:52` | `useEffect(() => {` | Registers Lexical `KEY_DOWN_COMMAND` listener to submit on `Enter` (without `Shift`). | **(a)** | N/A |
| 23 | `ui/common/editor/PromptEditor.jsx:84` | `useEffect(() => {` | Registers Lexical `editor.registerUpdateListener` to track `@` mention query while `mentionOpen` is true. | **(a)** | N/A |
| 24 | `ui/common/editor/PromptEditor.jsx:122` | `useEffect(() => {` | Registers Lexical `KEY_DOWN_COMMAND` listener to open mention dialog when `@` is typed. | **(a)** | N/A |
| 25 | `ui/common/editor/PromptEditor.jsx:232` | `useEffect(() => {` | Calls `editor.focus()` when store `focusRequest` counter increments (`FocusRequestPlugin`). | **(b)** | N/A (Replaced direct DOM query per X3). |
| 26 | `ui/common/editor/plugins/SyncFeaturesPlugin.jsx:14` | `useEffect(() => {` | Keeps `featuresRef.current` synchronized with latest `features` from `useCharacterStore`. | **(e)** | N/A |
| 27 | `ui/common/editor/plugins/SyncFeaturesPlugin.jsx:18` | `useEffect(() => {` | Synchronizes selected traits from `useCharacterStore.features` into Lexical `FeatureNode` chips. | **(b)** | N/A (Lexical AST bridge). |
| 28 | `ui/common/editor/plugins/SyncFeaturesPlugin.jsx:82` | `useEffect(() => {` | Registers Lexical `editor.registerUpdateListener` to unselect traits in `useCharacterStore` when chips are deleted in editor. | **(a)** | N/A |
| 29 | `ui/common/editor/plugins/TextTagConverterPlugin.jsx:22` | `useEffect(() => {` | Registers Lexical `registerNodeTransform(TextNode, ...)` to convert `<Trait: ...>` and `<MediaAsset: ...>` text into Lexical nodes. | **(a)** | N/A |
| 30 | `ui/common/selectors/DropdownEngine.jsx:38` | `useEffect(() => {` | Invokes `onOpen?.()` or `onClose?.()` callback when dropdown `open` state toggles. | **(e)** | N/A |
| 31 | `ui/common/selectors/DropdownEngine.jsx:47` | `useEffect(() => {` | Registers capture-phase `pointerdown` listener on `document` to close dropdown on outside click. | **(a)** | N/A |
| 32 | `ui/common/selectors/DropdownEngine.jsx:84` | `useEffect(() => {` | Registers `scroll` and `resize` listeners on `window` to reposition open dropdown. | **(a)** | N/A |
| 33 | `ui/common/selectors/FlowPromptBoxSettings.jsx:126` | `useEffect(() => {` | Calculates placement and registers `mousedown`, `resize`, and `scroll` listeners while settings popover is open. | **(a)** | N/A |

---

### C3.3 Compliance with `00_CORE.md` §1.9 ("No `useEffect` Whose Job Is to Repair State After a Render")

- **Assessment**: **SUBSTANTIALLY RESPECTED FOR MEDIA/MODE/MODEL TRANSITIONS, WITH 2 MINOR RESIDUAL SYNC EFFECTS IN PLATFORM/MODELS**:
  1. **Eliminated transition-repair effects (`VERIFIED`)**: At baseline `42c32fa`, `PromptBarPlatform.jsx` had two `useEffect` hooks (`lines 324` and `488` at P3 gate `67d1055`) that watched `activeMode`/`activeSubMode` and `selectedId` after render and mutated `parameterValues` and prompt tags in a second render pass. Both were completely deleted in Phase P4 (`a037992` and `d01c3a2`) and replaced by synchronous, atomic store commands (`switchMode` and `selectModel`).
  2. **Residual effect #1 — `PromptBarPlatform.jsx:162` (`setTemplate(featureConfig)`)**: Added in P4 so that when `<PromptBarPlatform featureConfig={...} />` is rendered without passing `type` to `PromptBarStoreProvider`, the store still receives `template`. When used via `<GeneratedPromptBar />` or `<CharacterPromptBar />`, `PromptBarStoreProvider` already initializes `template` synchronously at store creation (`PromptBarStoreContext.js:126`), making this effect a redundant post-render sync.
  3. **Residual effect #2 — `usePromptBarModels.js:75` (`selectModel(eligibleModels[0].id)`)**: Retained from baseline (`PromptBarPlatform.jsx:240` at P3 gate); when `eligibleModels` changes and `selectedId` is not eligible (e.g. when the async model catalog first arrives or if a caller changes mode without `storeSwitchMode`), this effect repairs `selectedId` after render. Note that `switchMode` (`src/features/prompt-bar/store/commands/switchMode.js:35-48`) already selects the first eligible model synchronously during mode transitions when `modelsMap` is populated.

---

## C4. Backend Array Contract and FIX-4 (Read-Only on Backend)

### C4.1 Backend Schema Validator Behavior When `type: "array"` Receives a String

- **Tag**: `VERIFIED`
- **Files Inspected**: `apiOpenArt/src/models/schema/schemaValidator.js:110-169` and `apiOpenArt/src/models/execution/modelRunner.js:60-66`
- **Command & Output**:
  ```powershell
  node -e "import('../apiOpenArt/src/models/schema/schemaValidator.js').then(({validateCanonicalInput}) => { const schema = { images: { type: 'array', required: false, max: 14 }, aspect_ratio: { type: 'string', values: ['1:1', '16:9'], default: '1:1' } }; const out = validateCanonicalInput(schema, { images: 'wf_someone_else', aspect_ratio: '16:9' }); console.log('validateCanonicalInput output:', JSON.stringify(out)); })"
  # Output: validateCanonicalInput output: {"images":"wf_someone_else","aspect_ratio":"16:9"}
  ```

#### Verbatim Excerpt (`apiOpenArt/src/models/schema/schemaValidator.js:127-149`)
```javascript
    // Type coercion and checking
    let coerced = value;

    if (paramDef.type === "number" && typeof value === "string") {
      const n = Number(value);
      if (!isNaN(n)) coerced = n;
    }

    if (paramDef.type === "boolean" && typeof value === "string") {
      coerced = value === "true" || value === "1";
    }

    // Enum validation (values array)
    if (Array.isArray(paramDef.values) && paramDef.values.length > 0) {
      const strValue = String(coerced);
      const strValues = paramDef.values.map(String);
      if (!strValues.includes(strValue)) {
        throw new InvalidEnumValueError(paramName, coerced, paramDef.values);
      }
    }

    cleanInput[paramName] = coerced;
```

- **Answer**: `validateCanonicalInput` **accepts a plain string as-is** when `paramDef.type === "array"` (with or without `max`). It neither rejects non-arrays nor coerces strings to arrays, and it does not enforce `paramDef.max`.

---

### C4.2 Ownership Check & Media Resolution Trace (`imageController.js`, `videoController.js`, `imageGenerationNode.js`)

- **Tag**: `VERIFIED`
- **Files Inspected**:
  - `apiOpenArt/controllers/imageController.js:84-124`
  - `apiOpenArt/controllers/videoController.js:83-126`
  - `apiOpenArt/src/v2/nodes/imageGenerationNode.js:51-78`
  - `apiOpenArt/src/v2/nodes/videoGenerationNode.js:52-113`
  - `apiOpenArt/src/v2/resolvers/WorkflowReferenceResolver.js:361-372`

#### Verbatim Excerpt (`apiOpenArt/controllers/imageController.js:110-123`)
```javascript
    // ── 0c. Enforce Input Media Ownership ────────────────────────────────────
    if (parameters && typeof parameters === "object") {
      if (parameters.input_image && typeof parameters.input_image === "string" && !parameters.input_image.startsWith("http")) {
        await assertOwnsAny(["workflow", "media"], parameters.input_image.trim(), userId);
      }
      if (Array.isArray(parameters.images)) {
        for (const img of parameters.images) {
          const imgId = typeof img === "string" ? img : (img?.workflow_id || img?.id);
          if (typeof imgId === "string" && !imgId.startsWith("http")) {
            await assertOwnsAny(["workflow", "media"], imgId.trim(), userId);
          }
        }
      }
    }
```

#### Verbatim Excerpt (`apiOpenArt/src/v2/nodes/imageGenerationNode.js:66-77`)
```javascript
  if (Array.isArray(resolvedParams.images)) {
    resolvedParams.images = await Promise.all(
      resolvedParams.images.map(async (item) => {
        const idOrUrl = typeof item === "string" ? item : (item?.workflow_id || item?.id || item?.url);
        if (typeof idOrUrl === "string" && !idOrUrl.startsWith("http")) {
          const resolved = await resolvePrimaryMediaUrl(idOrUrl, userId);
          return resolved || idOrUrl;
        }
        return idOrUrl;
      })
    );
  }
```

- **Step-by-step Trace When `parameters.images` Is a Plain String (`images: "<someone_elses_workflow_id>"`)**:
  1. **Controller Ownership Gate (`imageController.js:115`, `videoController.js:117`)**: Runs `if (Array.isArray(parameters.images))`. Because `parameters.images` is a string, **the ownership check is completely skipped**! The controller creates the workflow row in DB, reserves credits, and enqueues the job.
  2. **Node URL & Ownership Resolution (`imageGenerationNode.js:66`, `videoGenerationNode.js:101`)**: Also runs `if (Array.isArray(resolvedParams.images))`. Because `resolvedParams.images` is a string, `resolvePrimaryMediaUrl` (which enforces `assertOwnsAny(["workflow", "media"], workflowId, userId)` at `WorkflowReferenceResolver.js:366`) is **also skipped**!
  3. **Validator & Runner (`schemaValidator.js:127-149`, `modelRunner.js:63`)**: `validateCanonicalInput` does not check `Array.isArray` for `type: "array"`, so `cleanInput.images` remains the unverified string `"<someone_elses_workflow_id>"` and is passed to the provider adapter (note: because step 2 was skipped, the victim's private media URL is never resolved from the DB, so the provider only receives the raw UUID string and fails, but the request bypassed controller validation, created DB records, and reserved billing credits).
  4. **Additional Array-Item Object Bypass in `imageController.js:86,117` vs `imageGenerationNode.js:69-72`**:
     - `imageController.js:117` extracts `const imgId = typeof img === "string" ? img : (img?.workflow_id || img?.id);` (ignoring `img.url`), whereas `imageGenerationNode.js:69` extracts `const idOrUrl = typeof item === "string" ? item : (item?.workflow_id || item?.id || item?.url);`.
     - If a client sends `parameters: { images: [{ url: "<someone_elses_workflow_id>" }] }` or `parameters: { images: ["https://external.example/img.png"] }`, `imageController.js:86` (only checks `typeof val === "string"`, not array elements) and `imageController.js:117` (`imgId` is `undefined` when only `url` is set) **both skip the check**. Then in `imageGenerationNode.js:71-72`, if `resolvePrimaryMediaUrl(idOrUrl, userId)` fails ownership and returns `null`, line 72 executes `return resolved || idOrUrl;` (falling back to `idOrUrl` instead of throwing, unlike `input_image` at lines 57–62).
  5. **Where `input_image` and `last_frame` (strings) ownership is enforced**:
     - `input_image`: Enforced at `imageController.js:112-114`, `videoController.js:111-116`, AND inside `resolvePrimaryMediaUrl` (`WorkflowReferenceResolver.js:366`) called by `imageGenerationNode.js:56` and `videoGenerationNode.js:58` (both throw an `Error` if `resolvedUrl` is `null`).
     - `last_frame` & `input_video`: Enforced at `videoController.js:111-116` AND inside `resolvePrimaryMediaUrl` called by `videoGenerationNode.js:74,90` (throws if `resolvedUrl` is `null`). (`imageController.js` does not check `last_frame`, and `imageGenerationNode.js` does not resolve `last_frame`).
  6. **Logged in `BACKLOG.md`** as `[High]` severity backend finding (not modified per Hard Rule 1).

---

### C4.3 Backend Model Manifests Survey & Golden Payload Tests

- **Tag**: `VERIFIED`
- **Command**: Node scan of all `apiOpenArt/src/models/manifests/*/model.json` files for `type === "array"` or media parameters (`image`, `frame`, `video`).

| Model Manifest (`apiOpenArt/src/models/manifests/*/model.json`) | Parameter Name | Declared Type | Declared `max` |
|---|---|---|---|
| `gemini_2_0_flash`, `gemini_2_0_flash_lite`, `gemini_3_1_flash_lite`, `gemini_3_5_flash_lite`, `gemini_3_flash`, `gemini_flash_lite_latest` | `images` | `"array"` | `16` |
| `gpt_image_2` | `images` | `"array"` | `16` |
| `gpt_image_2` | `input_image` | `"string"` | `1` |
| `nanobana_2`, `nanobana_pro`, `nanobana_pro_ultra` | `images` | `"array"` | `14` |
| `nanobana_2`, `nanobana_pro`, `nanobana_pro_ultra` | `input_image` | `"string"` | `1` |
| `ltx_2_3_fast`, `ltx_2_3_pro`, `ltx_2_5_fast`, `ltx_2_5_pro` | `input_image`, `last_frame` | `"string"` | `1` |
| `ltx_extend`, `ltx_retake`, `seedance_2_5_extend` | `input_video` | `"string"` | `1` |
| `seedance_2_5`, `wan_3_0` | `input_image`, `last_frame` | `"string"` | `1` |
| `wavespeed_upscale` | `input_image` | `"string"` | `1` |

- **Does commit `2627032` (`pb7(FIX-4)`) change the payload of ANY real model today?**
  - **NO (`VERIFIED`)**: Zero real backend manifests declare an array media parameter (`images` or `reference_images`) with `max: 1`. Every real model with `images` declares `max: 14` or `max: 16` (so `selectModel.js` keeps `parameterValues.images` as an array), and every real model with `max: 1` declares `input_image`, `last_frame`, or `input_video` with `type: "string"` (mapped by `adaptBackendParameter` to `type: "image"` or `"video"`). `FIX-4` only affects synthetic test models declaring `images: { type: "image[]", max: 1 }` where `selectModel.js:57-67` unwraps a 1-item array into a single object.
- **Golden Payload Tests Execution (`VERIFIED`)**:
  - Command: `npx vitest run src/features/prompt-bar/__tests__/safe1PureCore.test.js src/features/prompt-bar/__tests__/singleRefSerialization.test.js`
  - Summary Output:
    ```text
     ✓ src/features/prompt-bar/__tests__/safe1PureCore.test.js (21 tests) 18ms
     ✓ src/features/prompt-bar/__tests__/singleRefSerialization.test.js (2 tests) 8ms

     Test Files  2 passed (2)
          Tests  23 passed (23)
    ```

---

### C4.4 Inspection of Commit `2627032` (`pb7(FIX-4)`)

- **Tag**: `VERIFIED`
- **Command**: `git show 2627032 -- src/features/prompt-bar/core/serialization.js`

```javascript
      if (isMedia) {
        const norm = normalizeMediaParamValue(val);
        const isArrayType = def?.type === "image[]" || def?.type === "video[]" || def?.type === "array";
        if (isArrayType && norm !== undefined && norm !== null && !Array.isArray(norm)) {
          parameters[name] = [norm];
        } else {
          parameters[name] = norm;
        }
      }
```

- **3-Line Analysis**:
  The `[norm]` array wrapping triggers inside `serialize()` only when a parameter is a media parameter (`isMedia`), its normalized value `norm` is non-null/defined and not already an array, AND its parameter definition explicitly declares `def?.type === "image[]" || def?.type === "video[]" || def?.type === "array"`.
  In `adaptBackendParameter` (`src/features/prompt-bar/core/modelManagement.js:24-44`), all single-asset parameters (`input_image`, `start_frame`, `image_url`, `last_frame`, `end_frame`, `mask`, `input_video`) are assigned `type: "image"` or `type: "video"`.
  Therefore, `isArrayType` is strictly `false` for all string-typed media parameters, and `2627032` can **never** wrap a parameter that must remain a string.

---

## C5. Final Checks and Merge-Readiness Table

### C5.1 Verification Command Summary Lines

- **Tag**: `VERIFIED`
- **Commands & Summary Outputs**:
  1. **`npm test`**:
     ```text
      Test Files  72 passed (72)
           Tests  494 passed (494)
        Start at  10:06:50
        Duration  28.31s (import 45%, environment 41%, transform 9%, tests 5%)
     ```
  2. **`npm run build`**:
     ```text
     ✓ Compiled successfully in 14.6s
       Running TypeScript ...
       Finished TypeScript in 2.7s ...
     ✓ Generating static pages using 11 workers (12/12) in 447ms
       Finalizing page optimization ...
     (28 Next.js routes built with 0 errors)
     ```
  3. **`npm run lint` (totals only)**:
     ```text
     ✖ 278 problems (1 error, 277 warnings)
     ```
  4. **`git log --oneline --reverse 42c32fa..HEAD | Measure-Object`** (before `pb7(CHECK)` commit):
     ```text
     Count : 83
     ```
  5. **`git status --short`** (before staging `pb7(CHECK)`):
     ```text
      M docs/prompt-bar-plan/BACKLOG.md
      M docs/prompt-bar-plan/STATE.md
     ?? docs/prompt-bar-plan/reports/PRE-MERGE-CHECK.md
     ?? docs/prompt-bar-plan/reports/REVIEW-ALL-addendum.md
     ?? docs/prompt-bar-plan/reports/REVIEW-ALL.md
     ```

---

### C5.2 Merge Readiness Table

| Item | Status | Evidence |
|---|---|---|
| **build** | **OK** | `npm run build` compiled all 28 Next.js routes cleanly in 14.6s with 0 TypeScript or bundler errors (`VERIFIED`). |
| **tests** | **OK** | `npm test` passed 72 test files and 494 tests hermetically with 0 failures (`VERIFIED`). |
| **`9276cf6` differential (C1)** | **OK** | 7 deleted studio files were `IDENTICAL` (0 diff lines), 4 were re-export shims, 3 had 0 importers, 1 was `FORMAT-ONLY`, and none of the pure-function `LOGIC-DIFF` changes reach any `studio` consumer; redirecting `useCharacterStore` in `studio/index.js` fixed a duplicate Zustand singleton split on `/characters/new` (`VERIFIED`). |
| **lint added warnings (C2.1)** | **CONCERN** | `npx eslint src/features/prompt-bar` has **0 errors** (same as base), but warnings increased from **37 -> 71 (+34)**, all in `no-unused-vars` (+12 non-test, +22 test); `react-hooks/exhaustive-deps` (+0) and `@next/next/no-img-element` (+0) did not increase (`VERIFIED`). |
| **`MediaGridItem` hook (C2.2)** | **CONCERN** | Pre-existing ESLint error at `MediaGridItem.jsx:294` (introduced in `d77da18e` before `42c32fa`, 0 plan commits touched the file): `useStudioItemDrag` is called after `if (!item) return null;` at line 176, which can throw React's hook-order error if `item` transitions between `null` and non-null across renders (`VERIFIED`). |
| **effects (C3)** | **OK** | `PromptBarPlatform.jsx` reduced from 9 `useEffect` calls to 1 (`setTemplate(featureConfig)` at line 162); mode-switch and model-switch state-repair effects were eliminated in P4; non-test `prompt-bar` effects are 33 total (28 excluding P8 `CharacterFeatureEditor.jsx` vs 30 at baseline) (`VERIFIED`). |
| **backend array/ownership (C4)** | **CONCERN** | Frontend `serialize()` with `FIX-4` (`2627032`) always emits arrays for array-typed media parameters and changes 0 real model payloads today (`VERIFIED`). However, the backend (`schemaValidator.js:127-149`, `imageController.js:86,115-122`, `imageGenerationNode.js:66-74`) lacks `Array.isArray` enforcement in `schemaValidator` and skips controller ownership / URL checks when `parameters.images` is a non-array string or `{ url }` object; logged in `BACKLOG.md` as `[High]` (`VERIFIED`). |
| **`FINAL.md`/`DECISIONS.md` consistent with reality** | **CONCERN** | `DECISIONS.md` accurately documents `PB-D-21 (Unlock)` (P8-character unlock) and `PB-D-22` (`9276cf6` pending owner confirmation), though two rows share the prefix `PB-D-21`. In `FINAL.md`, minor stale details remain from pre-FIX-2/3/4: line 175 labels the 1 `useEffect` in `PromptBarPlatform.jsx` `"1 call (auto-expand textarea)"` instead of `setTemplate(featureConfig)`; lines 177–178 list `69 passed` files / `485 passed` tests instead of `72` / `494`; line 187 cites `safe3Store.test.js` instead of `safe5Platform.test.jsx` (`VERIFIED`). |
| **commit message format deviations** | **CONCERN** | Out of 83 commits since `42c32fa`, 9 commits lack a `pb<N>(<id>)` token: `9276cf6`, `78cfa2c`, `8b7bbc4`, `b05f6ff`, `9acb980`, `7039973`, `b58bfef`, `0ff9cdb`, `51ec356` (plus 19 commits in P7/P7-FIX that wrap `pb7(...)` inside conventional-commit prefixes like `feat(prompt-bar): pb7(...)`) (`VERIFIED`). |

---

### C5.3 Owner Decisions Needed

#### (a) Keep or Revert Commit `9276cf6`
- **What C1.6 concluded**: **SAFE to keep**.
- **What a revert of `9276cf6` would affect (from C1.3)**:
  1. `src/app/cinema-studio/[projectId]/characters/new/page.js:9` (`import { useCharacterStore } from "@/features/studio"`): Reverting `9276cf6` would restore `src/features/studio/useCharacterStore.js` and point `src/features/studio/index.js` back to it, **re-introducing two separate Zustand `useCharacterStore` singletons** between `characters/new/page.js` and `CharacterPromptBar.jsx` / `CharacterFeatureEditor.jsx` / `SyncFeaturesPlugin.jsx`!
  2. `src/features/workflows/model/elementSheetConfig.js:1`, `src/widgets/ImportMediaDialog/ImportMediaPopover.jsx:7`, and `src/features/workflows/model/useMediaActions.js:9`: Would revert to importing duplicate studio files (`feature-constants.js`, `useLibraryFilter.js`, `entityService.js`, `modelManagement.js`).
  3. 9 test files in `src/features/prompt-bar/__tests__/*`: Would revert to importing through the deleted shim files (`generatedMedia.config.js`, `generatedMedia.type.js`).
- **Recommendation**: Confirm **KEEP `9276cf6`** in `DECISIONS.md` (`PB-D-22`).

#### (b) Browser & Visual Smoke Checklist
Run the following interactive checks in a live browser (`http://localhost:3000`):
- [ ] **1. Route Persistence across Allowed Paths**: On `/cinema-studio/<projectId>/assets`, type a prompt and attach a reference image, then navigate to `/cinema-studio/<projectId>/collection/<collectionId>` — prompt and reference stay intact.
- [ ] **2. Route Reset on Disallowed Paths**: Navigate from collection page to `/cinema-studio/<projectId>/settings` (or `/characters`), then return to `/assets` — prompt bar resets to clean defaults.
- [ ] **3. Generation Submission & Loading State**: Click the circular generate button on `/assets` — spinner (`animate-spin`) displays, button disables during submit, and resets cleanly.
- [ ] **4. Media Grid Actions Integration**: Hover a completed gallery card and test **Animate** (switches to `video` / `frames`, sets `Start Frame`, focuses editor), **Add Reference** (adds to `Reference` slot), and **Reuse Settings** (restores model and parameters).
- [ ] **5. Gallery Drag-and-Drop & Animate**: Drag a completed media card from the gallery onto the Prompt Bar reference/start-frame drop zone and verify it attaches cleanly without console errors.
- [ ] **6. Build & Lint Verification**: `npm run build` and `npx eslint src/features/prompt-bar` pass with 0 errors.
- [ ] **7. Multi-Project Memory Pruning**: Switch from project A to project B and verify project A's unmounted store is pruned from memory while its `sessionStorage` snapshot remains intact.
- [ ] **8. Character Page — Generate Disabled Under 10 Characters**: On `/cinema-studio/<projectId>/characters/new`, type fewer than 10 characters (e.g. `"Hero"`) and verify Generate is disabled; type 10+ characters and verify Generate enables.
- [ ] **9. Character Page — Reference Accepts Image & Element Only**: Verify the Reference slot on `/characters/new` accepts images and elements only (rejects video assets).
- [ ] **10. Character Page — Traits Form Syncs with Prompt**: Select/deselect traits in `CharacterFeatureEditor` and verify `<Trait: ...>` chips sync bidirectionally with the prompt editor.
- [ ] **11. Character Page — No Model Selector or Mode Toggle**: Verify neither the model selector dropdown nor the image/video mode toggle is rendered on `/characters/new`.
- [ ] **12. Character Page — Reload With No Console Warning**: Reload `/cinema-studio/<projectId>/characters/new` and verify 0 hydration mismatches or console warnings/errors.

#### (c) Backend Security & Validation Finding (C4.2)
- In the backend repository (`apiOpenArt/`), address the `[High]` finding logged in `BACKLOG.md`:
  1. Enforce `Array.isArray(value)` and `value.length <= paramDef.max` when `paramDef.type === "array"` in `apiOpenArt/src/models/schema/schemaValidator.js:127-149`.
  2. In `apiOpenArt/controllers/imageController.js:85-94,115-122` and `apiOpenArt/controllers/videoController.js:84-93,117-124`, reject non-array `parameters.images` with HTTP 400, inspect `img?.url` inside array items for raw URLs or unowned IDs, and throw in `apiOpenArt/src/v2/nodes/imageGenerationNode.js:71-73` (`videoGenerationNode.js:106-108`) when `resolvePrimaryMediaUrl` returns `null`.
