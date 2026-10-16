# Prompt Bar Refactor: Reconciliation Report (Phase P7-FIX)

> **Document**: `docs/prompt-bar-plan/reports/RECONCILE.md`  
> **Status**: PART A COMPLETE  
> **Basis**: Ground truth verified directly via `git` commands, file reads, and hermetic node executions.

---

## CORRECTED NUMBERS

The table below provides the single authoritative, verified value for every contentious metric across `REVIEW-ALL.md` and `REVIEW-ALL-addendum.md`.

| Metric | Correct Value | Verification Command | Notes & Reconciliation |
|---|---|---|---|
| **Platform Lines at HEAD** | **444 total lines** (443 trimmed, **412 non-empty lines**) | `git show HEAD:src/features/prompt-bar/platform/PromptBarPlatform.jsx` | `REVIEW-ALL.md` reported 443 lines (total lines with trailing newline trimmed). The addendum reported 412 lines using PowerShell `Measure-Object -Line` which omits 32 empty lines (412 non-empty + 32 empty = 444 total physical lines). Both measured the exact same file. |
| **`useEffect` Calls in Platform at HEAD** | **1 call** | `node` scan for `useEffect\(` in `PromptBarPlatform.jsx` | Exactly 1 hook invocation: auto-expanding textarea (`line 162`). The addendum counted 2 by matching the import statement on line 3 (`import React, { ..., useEffect }`). |
| **Files / Lines of Commit `9276cf6`** | **32 files changed** (+34 / -2,740) | `git show --stat 9276cf6` | 19 deleted files (-2,654 lines), 13 modified files (+34 / -86 lines: 9 tests, `index.platform.js`, `mediaReferenceService.js`, `studio/index.js`, `elementSheetConfig.js`). Exactly 0 test files deleted. |
| **Test Files Edited Since P0 Gate (`db3b38b`)** | **5 test files** (+ 1 test page) | `git diff --name-status db3b38b..HEAD -- "*test*"` | 5 test files in `__tests__/` modified (`modelEligibilityContract.test.mjs`, `safe1PureCore.test.js`, `safe2TemplateRules.test.js`, `safe4Persistence.test.jsx`, `safe5Platform.test.jsx`), plus 1 test page (`cinema-studio/test/prompt-bar-compare/page.jsx`). 0 tests deleted. |
| **Total Test Suite Count** | **69 test files passed, 485 tests passed** | `npm test` (vitest run) | Output: `Test Files 69 passed (69) | Tests 485 passed (485) | Duration 23.55s`. Hermetic, zero failures. |
| **`exhaustive-deps` Disables in `prompt-bar`** | **0** | `rg -n "exhaustive-deps" src/features/prompt-bar` | Zero `eslint-disable` or `exhaustive-deps` ignore comments anywhere in `src/features/prompt-bar`. |
| **`console.*` Hits in `prompt-bar` (non-test)** | **1 hit** | AST/regex scan of non-test files in `src/features/prompt-bar` | `src/features/prompt-bar/ui/common/editor/PromptEditor.jsx:266` (`console.error(error)`) inside Lexical editor's `onError` callback. |

---

## A1. Commit Facts (Phase P3 & P4 Task Alignments)

[VERIFIED: `git show --stat --format="%h %s" <sha>`]

| SHA | Git Subject | Plan Task Actually Implemented | Files Changed | Insertions / Deletions | What `REVIEW-ALL.md` Said | What Addendum Said | Which is Right |
|---|---|---|---|---|---|---|---|
| `3cffe6b` | `pb3(S4)` | **S4**: Project-scoped registry memory management (`pruneOtherProjects`) | 4 | +240 / -1 | Implemented S4 | Implemented S4 | **Both right** |
| `e4e507e` | `pb3(S5)` | **S5**: Submit lifecycle tracking (`beginSubmit` / `endSubmit`) | 4 | +244 / -3 | Implemented S5 | Implemented S5 | **Both right** |
| `b04b06b` | `pb3(S6)` | **S6**: Multi-instance isolation verification | 3 | +169 / -1 | Implemented S6 | Implemented S6 | **Both right** |
| `94a1133` | `pb4(T1)` | **T1 & T4**: Atomic `switchMode` command + Strict payload serialization (`serialize`) | 4 | +182 / -23 | Claimed only T1 | Stated T1 + early T4 (strict serialization & payload contract) | **Addendum right** (`serialization.js` was introduced here) |
| `3902ba5` | `pb4(T2)` | **T2**: Atomic `selectModel` command | 3 | +184 / -2 | Implemented T2 | Implemented T2 | **Both right** |
| `5dd24a0` | `pb3(S3)` | **S3**: Debounced storage writes & unmount flush (`persistence.js`) | 4 | +244 / -35 | Claimed S3 | Claimed S3 | **Both right** |
| `d5f069a` | `pb5(X1)` | **X1**: Public facade `promptBarService` implementation | 4 | +319 / -1 | Implemented X1 | Implemented X1 | **Both right** |
| `9276cf6` | `refactor(prompt-bar): remove obsolete shims...` | **Unplanned Shim & Duplicate Cleanup** | 32 | +34 / -2,740 | "P7 unannounced deletion" | Unplanned cleanup executed outside plan cards | **Addendum right** |

---

## A2. Platform Size Per Phase Gate

[VERIFIED: `git show <sha>:src/features/prompt-bar/platform/PromptBarPlatform.jsx`]

| Phase Gate | Commit SHA | Total Physical Lines | Non-Empty Lines | `useEffect(` Calls | `useState(` Calls | `useMemo(` Calls | `useCallback(` Calls |
|---|---|---|---|---|---|---|---|
| **Baseline** | `42c32fa` | 1,112 | 1,027 | 9 | 7 | 20 | 13 |
| **P0 Gate** | `db3b38b` | 1,112 | 1,027 | 9 | 7 | 20 | 13 |
| **P1 Gate** | `1b0be77` | 1,112 | 1,027 | 9 | 7 | 20 | 13 |
| **P2 Gate** | `7716098` | 1,085 | 1,003 | 9 | 7 | 19 | 13 |
| **P3 Gate** | `67d1055` | 1,095 | 1,012 | 9 | 7 | 19 | 13 |
| **P4 Gate** | `2ffe865` | 935 | 868 | 8 | 7 | 19 | 13 |
| **P5 Gate** | `adabbe7` | 918 | 852 | 7 | 7 | 19 | 13 |
| **P6 Gate** | `8fc6c7d` | 400 | 370 | 1 | 1 | 0 | 2 |
| **P7 Gate** | `89ff498` | 403 | 373 | 1 | 1 | 0 | 2 |
| **HEAD** | `b58bfef` | 444 (443 trimmed) | 412 | 1 | 1 | 0 | 2 |

### Explaining the Contradictory Historical Numbers:
1. **The 443 vs 412 lines discrepancy**: `REVIEW-ALL.md` reported 443 lines by counting total physical lines of `PromptBarPlatform.jsx` at HEAD (minus trailing newline: 443). The addendum reported 412 lines by executing `git show HEAD:... | Measure-Object -Line` in PowerShell. In PowerShell, piping lines into `Measure-Object` ignores blank lines (412 non-empty lines + 32 blank lines = 444 total lines). Both were measuring the exact same commit and file.
2. **The 1,239 lines baseline claim**: The number 1,239 originated in early pre-plan audit estimations (`00_CORE.md` table draft). The real git baseline at `42c32fa` was verified as exactly 1,112 physical lines (1,027 non-empty).

---

## A3. Commit `9276cf6` (Unplanned Shim & Duplicate Removal)

[VERIFIED: `git show --stat 9276cf6`, `git diff-tree -r 9276cf6`, `rg`]

1. **Complete Inventory**:
   - 32 files touched: +34 insertions, -2,740 deletions.
   - 19 files deleted (-2,654 lines): 15 duplicated legacy studio core files, 3 obsolete prompt-bar shim files, 1 deprecated promptBarState file.
   - 13 files modified (+34 / -86 lines): 9 test files updated to modern import paths, `src/features/studio/index.js`, `src/features/studio/core/mediaReferenceService.js`, `src/features/prompt-bar/index.platform.js`, `src/features/workflows/model/elementSheetConfig.js`.
   - **0 tests were deleted**.

   | # | Status | File Path | Lines (+/-) | Importers at Parent (`9276cf6^`) | Referenced at HEAD (`rg`) |
   |---|---|---|---|---|---|
   | 1 | **M** | `src/features/prompt-bar/__tests__/editorFocus.test.jsx` | +1 / -1 | Test file | Import updated to `generatedMedia.template.js` |
   | 2 | **M** | `src/features/prompt-bar/__tests__/modelEligibilityContract.test.mjs` | +1 / -1 | Test file | Import updated to `generatedMedia.template.js` |
   | 3 | **M** | `src/features/prompt-bar/__tests__/multiInstanceLifecycle.test.jsx` | +2 / -2 | Test file | Import updated to `generatedMedia.template.js` |
   | 4 | **M** | `src/features/prompt-bar/__tests__/safe2TemplateRules.test.js` | +2 / -2 | Test file | Import updated to `generatedMedia.template.js` |
   | 5 | **M** | `src/features/prompt-bar/__tests__/safe5Platform.test.jsx` | +2 / -2 | Test file | Import updated to `generatedMedia.template.js` |
   | 6 | **M** | `src/features/prompt-bar/__tests__/selectModelTrimming.test.jsx` | +2 / -2 | Test file | Import updated to `generatedMedia.template.js` |
   | 7 | **M** | `src/features/prompt-bar/__tests__/templateContract.test.js` | +8 / -10 | Test file | Import updated to `generatedMedia.template.js` |
   | 8 | **M** | `src/features/prompt-bar/__tests__/usePromptBarReferences.test.jsx` | +1 / -1 | Test file | Import updated to `generatedMedia.template.js` |
   | 9 | **M** | `src/features/prompt-bar/__tests__/usePromptBarSlots.test.jsx` | +1 / -1 | Test file | Import updated to `generatedMedia.template.js` |
   | 10 | **D** | `src/features/prompt-bar/composition/generatedMedia.type.js` | +0 / -8 | `index.platform.js`, 4 test files | 0 references |
   | 11 | **D** | `src/features/prompt-bar/composition/resolveUI.js` | +0 / -32 | 0 importers | 0 references |
   | 12 | **D** | `src/features/prompt-bar/features/generated-media/generatedMedia.config.js` | +0 / -14 | `index.platform.js`, `elementSheetConfig.js`, 9 tests | 0 references |
   | 13 | **M** | `src/features/prompt-bar/index.platform.js` | +2 / -3 | Barrel file | Re-exports from `generatedMedia.template.js` |
   | 14 | **D** | `src/features/prompt-bar/model/core/promptBarState.js` | +0 / -39 | 0 importers | 0 references |
   | 15 | **D** | `src/features/studio/PromptBarStoreContext.js` | +0 / -15 | `studio/index.js` | 0 references (`studio/index.js` points to `@/features/prompt-bar`) |
   | 16 | **D** | `src/features/studio/core/entityService.js` | +0 / -224 | `studio/index.js`, `mediaReferenceService.js` | 0 references |
   | 17 | **D** | `src/features/studio/core/initialization.js` | +0 / -40 | `studio/createPromptBarStore.js` | 0 references |
   | 18 | **M** | `src/features/studio/core/mediaReferenceService.js` | +4 / -4 | `studio/index.js`, `usePromptStore.js` | Imports from `@/features/prompt-bar/core/*` |
   | 19 | **D** | `src/features/studio/core/modelManagement.js` | +0 / -244 | `studio/index.js`, `mediaReferenceService.js` | 0 references |
   | 20 | **D** | `src/features/studio/core/parameterState.js` | +0 / -47 | `studio/createPromptBarStore.js` | 0 references |
   | 21 | **D** | `src/features/studio/core/promptBarRules.js` | +0 / -119 | `studio/core/reconciliation.js` | 0 references |
   | 22 | **D** | `src/features/studio/core/promptBarState.js` | +0 / -39 | 0 importers | 0 references |
   | 23 | **D** | `src/features/studio/core/reconciliation.js` | +0 / -103 | `studio/createPromptBarStore.js` | 0 references |
   | 24 | **D** | `src/features/studio/core/serialization.js` | +0 / -93 | `studio/createPromptBarStore.js` | 0 references |
   | 25 | **D** | `src/features/studio/core/tagsService.js` | +0 / -260 | `studio/index.js`, `mediaReferenceService.js` | 0 references |
   | 26 | **D** | `src/features/studio/core/types.js` | +0 / -145 | JSDoc only | 0 references |
   | 27 | **D** | `src/features/studio/createPromptBarStore.js` | +0 / -319 | `studio/PromptBarStoreContext.js` | 0 references |
   | 28 | **D** | `src/features/studio/feature-constants.js` | +0 / -524 | `studio/useCharacterStore.js` | 0 references |
   | 29 | **M** | `src/features/studio/index.js` | +7 / -7 | Studio barrel | Exports byte-identical to parent, routed to `@/features/prompt-bar` |
   | 30 | **D** | `src/features/studio/useCharacterStore.js` | +0 / -242 | `studio/index.js` | 0 references (`studio/index.js` points to `@/features/prompt-bar/model/useCharacterStore`) |
   | 31 | **D** | `src/features/studio/useLibraryFilter.js` | +0 / -196 | `studio/index.js` | 0 references (`studio/index.js` points to `@/features/prompt-bar/model/useLibraryFilter`) |
   | 32 | **M** | `src/features/workflows/model/elementSheetConfig.js` | +1 / -1 | Workflow config | Import updated to `generatedMedia.template.js` |

2. **Importers at Parent Commit (`9276cf6^`) vs HEAD**:
   - Every file deleted was either:
     - (a) A dead duplicate under `src/features/studio/core/` that had zero external callers outside `studio/index.js` (which was already re-exporting from `@/features/prompt-bar`).
     - (b) A shim file whose only remaining importers were tests that were updated in the same commit to import canonical modules (`characterTemplate`, `generatedMedia.template.js`, `templateContract.js`).
   - At HEAD, `rg` confirms zero broken imports.

3. **Status of Specific Old Paths and `studio/index.js`**:
   - `src/features/prompt-bar/composition/generatedMedia.type.js`: **DOES NOT EXIST** at HEAD (`exists: false`).
   - `src/features/prompt-bar/composition/resolveUI.js`: **DOES NOT EXIST** at HEAD (`exists: false`).
   - `src/features/prompt-bar/features/generated-media/generatedMedia.config.js`: **DOES NOT EXIST** at HEAD (`exists: false`).
   - **`src/features/studio/index.js` Exports**: Verbatim byte-identical between `9276cf6^` and `HEAD` (`Equal exports: true`). Zero public studio exports disappeared.

4. **Tests Touched**:
   - Exactly 9 test files were touched: `editorFocus.test.jsx`, `modelEligibilityContract.test.mjs`, `multiInstanceLifecycle.test.jsx`, `safe2TemplateRules.test.js`, `safe5Platform.test.jsx`, `selectModelTrimming.test.jsx`, `templateContract.test.js`, `usePromptBarReferences.test.jsx`, `usePromptBarSlots.test.jsx`.
   - **All 9 changes were 100% import-path updates only** (`import-path only: true`). No test assertions or logic were altered.

5. **Evidence of Owner Authorization**:
   - Searches across `docs/prompt-bar-plan/DECISIONS.md`, `STATE.md`, and `FINAL.md`: **NO RECORD**.
   - Note: The prompt logs confirm the human gave conversational instructions to clean up duplicate files ("fassa5hom"), but this was executed outside the plan cards without recording a decision card.

6. **Plan Conflict Check**:
   - PB-D-02 explicitly specified: "Shim removal and renames are strictly phase P8 (locked)".
   - Commit `9276cf6` conflicts directly with PB-D-02 and the P7 gate report claim that "nothing was removed", because 19 files were removed prior to P8 formal unlock.

---

## A4. Test Files Changed Since P0 Gate (`db3b38b`)

[VERIFIED: `git diff --name-status db3b38b..HEAD -- "*test*"`]

| Test File | Status | Commits Touching | Plan Card | Decision ID | Type of Change |
|---|---|---|---|---|---|
| `src/features/prompt-bar/__tests__/safe1PureCore.test.js` | **M** | `94a1133` | T1/T4 | PB-D-12 | **Logic change**: Replaced assertion of PB-K2 symptom (leaking undeclared media parameters) with assertion of PB-D-12 resolution (undeclared media parameters safely omitted). |
| `src/features/prompt-bar/__tests__/safe4Persistence.test.jsx` | **M** | `5dd24a0` | S3 | PB-D-06, PB-D-08 | **Logic change**: Replaced assertion of known issues (PB-K4a active store overwrite, PB-K4b blob leak) with assertion of resolved behavior (active store returns null on multi-mount; blob URLs stripped). |
| `src/features/prompt-bar/__tests__/safe5Platform.test.jsx` | **M** | `a037992`, `9276cf6` | T3, Unplanned | PB-D-03 | **Logic change** in `a037992`: Replaced assertion of PB-K1 symptom (input_image surviving mode transition) with PB-D-03 resolution (clean purge on mode change). **Import change** in `9276cf6`. |
| `src/features/prompt-bar/__tests__/safe2TemplateRules.test.js` | **M** | `9276cf6` | Unplanned | PB-D-02 (pending) | **Import-path only**: Updated import from deleted `generatedMedia.config.js` to `generatedMedia.template.js`. |
| `src/features/prompt-bar/__tests__/modelEligibilityContract.test.mjs` | **M** | `9276cf6` | Unplanned | PB-D-02 (pending) | **Import-path only**: Updated import from deleted `generatedMedia.config.js` to `generatedMedia.template.js`. |
| `src/app/cinema-studio/test/prompt-bar-compare/page.jsx` | **M** | `f3df10c` | W1 | PB-D-13 | Test page migration to `<GeneratedPromptBar />`. |

### Comparison with Reports:
- `REVIEW-ALL.md` Section 6.3 claimed: "Zero tests were modified since P0" — **REFUTED / INCORRECT**.
- `REVIEW-ALL-addendum.md` Section 5 correctly documented these 5 modified test files and their respective decisions — **VERIFIED / CORRECT**.

---

## A5. Effects at the P4 Gate (`67d1055` vs `2ffe865`)

[VERIFIED: `git show 67d1055:...`, `git show 2ffe865:...`]

### First line of each `useEffect(` in `PromptBarPlatform.jsx`:

#### At Commit `67d1055` (P3 Gate - 9 calls):
1. `Line 175: useEffect(() => {` — Sync incoming models into store (`setModels`).
2. `Line 183: useEffect(() => {` — Consume cross-page pending prompt action (`executedPendingRef`).
3. `Line 199: useEffect(() => {` — Auto-expand textarea height.
4. `Line 240: useEffect(() => {` — Auto-select first eligible model if current ineligible (`setSelectedId`).
5. `Line 324: useEffect(() => {` — **Mode switch cleanup effect** (`prevModeRef` resetting slots).
6. `Line 488: useEffect(() => {` — **Model switch reference trimming effect** (`prevModelIdRef` trimming references).
7. `Line 604: useEffect(() => {` — Close quick mention dropdown on outside click.
8. `Line 617: useEffect(() => {` — Close parameter drawer on outside click / Escape.
9. `Line 867: useEffect(() => {` — Close parameter popover on outside click / Escape.

#### At Commit `2ffe865` (P4 Gate - 8 calls):
1. `Line 179: useEffect(() => {` — Sync incoming models into store.
2. `Line 187: useEffect(() => {` — Consume cross-page pending prompt action.
3. `Line 203: useEffect(() => {` — Auto-expand textarea height.
4. `Line 244: useEffect(() => {` — Auto-select first eligible model.
5. `Line 272: useEffect(() => {` — **Sync template/featureConfig into store (`setTemplate`)** (*New in P4*).
6. `Line 517: useEffect(() => {` — Close quick mention dropdown.
7. `Line 530: useEffect(() => {` — Close parameter drawer.
8. `Line 684: useEffect(() => {` — Close parameter popover.

### Confirmation:
- **Mode-switch cleanup effect** (was line 324): **GONE** at `2ffe865` (deleted in T3 `a037992`; replaced by atomic `switchMode` store command).
- **Model-switch trimming effect** (was line 488): **GONE** at `2ffe865` (deleted in T4 `d01c3a2`; replaced by atomic `selectModel` store command).
- **Effects writing store state at `2ffe865`**:
  - Line 179: `setModels(models)`
  - Line 187: Pending action replay (`setPrompt`, `setMode`, etc.)
  - Line 244: Auto-selection `setSelectedId(eligibleModels[0].id)`
  - Line 272: `setTemplate(featureConfig)`
- The net decrease was 9 - 2 (deleted) + 1 (added `setTemplate`) = 8 effects.

---

## A6. Server-Side Rendering (SSR) Check of Store Registry

[VERIFIED: Node.js execution with `ReactDOMServer.renderToString`]

1. **Code Path Analysis**:
   - In `src/features/prompt-bar/store/PromptBarStoreContext.js:131`, `registry.getOrCreate(identity, ...)` is called directly inside the render body of `PromptBarStoreProvider`.
   - When running on server (`typeof window === "undefined"`), React renders synchronously.
   - `React.useEffect` does **NOT** run on the server.
   - Therefore, `registry.markMounted` is never called, `registry.markUnmounted` is never called, and `registry.pruneOtherProjects` is never called.
   - Every store created during an SSR render call is stored in module-scoped `registry.entries` Map indefinitely.

2. **Empirical Reproduction Script**:
   - Executed 50 consecutive `renderToString` calls for 50 distinct `projectId` values:
     ```javascript
     console.log('Before count:', registry.list().length); // 0
     for (let i = 0; i < 50; i++) {
       ReactDOMServer.renderToString(React.createElement(PromptBarStoreProvider, {
         projectId: 'proj_' + i,
         type: { id: 'generated-media', defaultModel: 'm1' },
         children: React.createElement('div', null, 'hello ' + i)
       }));
     }
     console.log('After count:', registry.list().length);  // 50
     ```
   - Real output:
     ```
     Before count: 0
     After count: 50
     ```

3. **Verdict**: **CONFIRMED (Server-Side Leak)**.
   - The server-side registry grows linearly with each SSR request across projects.
   - On server (`typeof window === "undefined"`), `PromptBarStoreProvider` must create an ephemeral, non-registered store rather than polluting the shared module registry.

---

## A7. Template Literals Outside Templates

[VERIFIED: AST / regex search across `src/features/prompt-bar`, `src/features/workflows`, `src/app`]

| File:Line | Code Excerpt | Classification | Note |
|---|---|---|---|
| `src/features/prompt-bar/platform/hooks/usePromptBarGenerate.js:55` | `const minPromptLength = effectiveTemplate?.minPromptLength ?? (effectiveTemplate?.id === "character" ? 10 : 0);` | **(a) Template-specific rule outside template** | Violates PB-D-19 / Anti-pattern 1.9. Must be driven strictly by `effectiveTemplate?.minPromptLength ?? 0`. |
| `src/features/workflows/model/useMediaActions.js:132,170,194` | `promptBarService({ templateId: "generated-media", ... })` | **(b) Wrapper / caller constant** | Legitimate consumer targeting the generated-media template. |
| `src/features/workflows/model/elementSheetConfig.js:180` | `templateId: "generated-media"` | **(b) Wrapper / caller constant** | Legitimate caller constant. |
| `src/app/cinema-studio/[projectId]/characters/new/page.js:166` | `promptBarService({ templateId: "character", ... })` | **(b) Wrapper / caller constant** | Legitimate page targeting the character template. |
| `src/features/prompt-bar/composition/character.type.js:11` | `id: "character"` | **(c) Legitimate** | Composition type definition. |
| `src/features/prompt-bar/core/entityService.js:14,23,27,35` | `defaultType === "character" ? "Character" : "Element"` | **(c) Legitimate** | Entity domain model logic (Character vs Element sheets). |
| `src/features/prompt-bar/core/media.js:184,191,218,230` | `allowed.includes("character")` | **(c) Legitimate** | Media slot allowedTypes validation. |
| `src/features/prompt-bar/core/mediaRef.js:101-102` | `kind = "character"` | **(c) Legitimate** | Media reference normalization. |
| `src/features/prompt-bar/core/tagsService.js:108,197` | `isCharacter = asset.type === "character" ...` | **(c) Legitimate** | Prompt `@mention` tag parsing. |

---

## A8. Single-Reference Value Shape (Scenario 2)

[VERIFIED: Execution of `serialize()` + read-only inspection of backend contracts]

1. **Real Output of `serialize()`**:
   - Model parameter declared: `images: { type: "image[]", group: "media", max: 1 }`.
   - Store state after `selectModel`: `parameterValues.images = { workflow_id: "ref_1" }` (unwrapped by `selectModel.js:57-67` for single-ref compatibility).
   - Real output of `serialize()`:
     ```json
     {
       "model": "model_single_ref",
       "prompt": "Scene with <media:ref_1> and",
       "parameters": {
         "images": "ref_1",
         "aspect_ratio": "16:9"
       },
       "references": ["ref_1"],
       "elements": [],
       "characters": []
     }
     ```
   - Notice: `parameters.images` is serialized as a **string** (`"ref_1"`), not an array (`["ref_1"]`), because `normalizeMediaParamValue` extracted the workflow ID from the unwrapped object.

2. **Backend Contract Expectations**:
   - Backend canonical validator (`apiOpenArt/src/models/schema/schemaValidator.js:151-161`):
     ```javascript
     // Handle unknown parameters from rawInput
     for (const key of Object.keys(rawInput)) {
       if (key in schema || FRAMEWORK_EXEMPT.has(key)) {
         continue;
       }
       if (allowUnknown) {
         cleanInput[key] = rawInput[key];
       } else {
         throw new UnknownParameterError(key);
       }
     }
     ```
   - Backend controllers (`apiOpenArt/controllers/imageController.js:115`):
     ```javascript
     if (Array.isArray(parameters.images)) {
       for (const img of parameters.images) {
         const imgId = typeof img === "string" ? img : (img?.workflow_id || img?.id);
         if (typeof imgId === "string" && !imgId.startsWith("http")) {
           await assertOwnsAny(["workflow", "media"], imgId.trim(), userId);
         }
       }
     }
     ```
   - Backend execution node (`apiOpenArt/src/v2/nodes/imageGenerationNode.js:66`):
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

3. **Verdict**: **MISMATCH**.
   - If a model declares `images` as `image[]` (array), the backend controllers and execution nodes explicitly check `Array.isArray(parameters.images)`.
   - Emitting `"ref_1"` as a scalar string bypasses media URL resolution in `imageGenerationNode.js:66`.
   - Smallest fix: In `serialize()`, when a parameter definition specifies an array type (`def?.type?.endsWith("[]")` or `def?.type === "array"`), ensure the emitted value is wrapped in an array (`["ref_1"]`).

---

## A9. Contradictions Between Documentation and Reality

| File:Line | Documented Statement | Reality | Verified Evidence |
|---|---|---|---|
| `FINAL.md:180` | "Phase P8 (new templates, renames, shim removal) was not started because it is locked." | P8-character template and integration **WAS built** after owner instructions. | Commits `78cfa2c`, `b05f6ff`, `9acb980`, `7039973`. |
| `FINAL.md:36` | Task S3 lists commit `5dd24a0`. | Commit `5dd24a0` is `pb3(S3)`. | `git log 5dd24a0` matches `pb3(S3)`. |
| `FINAL.md:145-146` | Lists `generatedMedia.config.js` and `generatedMedia.type.js` as active shims in inventory. | Both files were deleted in commit `9276cf6`. | `Test-Path` confirms both files are absent. |
| `FINAL.md:158` | "`PromptBarPlatform.jsx` lines: 443 lines (-60.1%)". | Platform is 444 physical lines (443 trimmed, 412 non-empty). Baseline was 1,112 lines (-60.1%). | `git show HEAD:PromptBarPlatform.jsx`. |
| `FINAL.md:159` | "Number of `useEffect` in `PromptBarPlatform.jsx`: 2 calls". | Exactly 1 `useEffect` call at HEAD (line 162). | File AST / regex inspection. |

---

## OWNER DECISIONS NEEDED

Before final merge of the Prompt Bar platform branch, three decisions/actions require the human owner:

1. **Keep or Revert Commit `9276cf6`**:
   - **Current State**: Commit `9276cf6` deleted 19 files (-2,654 lines) and updated import paths in 9 tests and 4 source files.
   - **What a Revert Would Restore**:
     - 15 duplicate legacy files under `src/features/studio/core/` and `src/features/studio/createPromptBarStore.js`.
     - 3 legacy shim files (`generatedMedia.type.js`, `resolveUI.js`, `generatedMedia.config.js`).
     - Legacy `promptBarState.js`.
   - **Dependencies at HEAD**: Zero files at HEAD depend on the deleted files. All tests and pages pass hermetically without them.
   - **Decision**: Keep commit `9276cf6` as an authorized cleanup, or revert it to adhere strictly to PB-D-02 until Phase P8 is formally unlocked.

2. **Browser & Visual Smoke Checklist Execution**:
   - Verify all 7 items from `HUMAN_GUIDE.md` Section 6 in a live browser (route persistence across `/assets` and `/collection`, route reset on `/settings`, circular generate button animation, grid actions Animate/Add Reference/Reuse Settings).

3. **Single-Reference Shape Alignment**:
   - Confirm whether single-reference models (`max: 1`) should emit a 1-element array `["ref_1"]` (standard backend array contract) or scalar `"ref_1"` (legacy UI convention). Part B implements array wrapping in `serialize()` for all parameters declared with array types.
