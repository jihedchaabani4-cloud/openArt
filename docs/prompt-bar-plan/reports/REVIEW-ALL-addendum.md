# Post-Implementation Review Addendum: Prompt Bar Refactor (RANGE = ALL)

**Document**: `docs/prompt-bar-plan/reports/REVIEW-ALL-addendum.md`  
**Base Commit**: `42c32fa`  
**HEAD Commit**: `b58bfef`  
**Mode**: Read-Only Audit & Verification Addendum  
**Tags**: `VERIFIED` (checked via command/file), `INFERRED` (reasoned), `NOT-RUN` (browser/manual checks)

---

## 1. Complete Task Inventory (Phase Files 01..08 vs Commits)

[VERIFIED: Cross-referenced against `docs/prompt-bar-plan/01_P0_setup_and_safety_net.md` through `08_P7_wrappers_routes_templates.md`, `git log --reverse --oneline 42c32fa..HEAD`, and `Test-Path`]

### 1.1 Phase Tasks vs Commits & Deliverables

| Task ID | Phase File Title & Scope | Commit(s) | Required Deliverables | Present? | Verification Evidence |
|---|---|---|---|---|---|
| **SETUP-1** | `01_P0`: baseline, folders, AGENTS.md | `67d2aad` | `STATE.md`, `DECISIONS.md`, `BACKLOG.md`, `reports/SETUP-1.md`, `AGENTS.md` block | **YES** | `git show --stat 67d2aad` (11 files, +886) |
| **SAFE-1** | `01_P0`: pure core characterization + fixtures | `770c04f` | `fixtures/models.fixture.js`, `safe1PureCore.test.js`, `reports/SAFE-1.md` | **YES** | `git show --stat 770c04f` (3 files, +438) |
| **SAFE-2** | `01_P0`: template rules characterization | `96abb90` | `safe2TemplateRules.test.js`, `reports/SAFE-2.md` | **YES** | `git show --stat 96abb90` (2 files, +261) |
| **SAFE-3** | `01_P0`: store characterization (vanilla store) | `b1d3e71` | `safe3Store.test.js`, `reports/SAFE-3.md` | **YES** | `git show --stat b1d3e71` (2 files, +296) |
| **SAFE-4** | `01_P0`: registry, key & persistence characterization | `32b4e08` | `safe4Persistence.test.jsx`, `reports/SAFE-4.md` | **YES** | `git show --stat 32b4e08` (2 files, +348) |
| **SAFE-5** | `01_P0`: Platform integration harness | `9575bfb` | `safe5Platform.test.jsx`, `reports/SAFE-5.md` | **YES** | `git show --stat 9575bfb` (2 files, +392) |
| **P0-GATE**| `01_P0`: gate and acceptance test | `db3b38b` | `reports/PHASE-P0-GATE.md`, updated `STATE.md` | **YES** | `git show --stat db3b38b` (2 files, +30) |
| **V1** | `02_P1`: instances, mounting & project identity | `caaae3f` | `reports/V1.md`, updated `STATE.md` | **YES** | `git show --stat caaae3f` (2 files, +240) |
| **V2** | `02_P1`: legacy store consumers (CONSUMERS.md) | `4decee1` | `CONSUMERS.md`, `reports/V2.md`, updated `STATE.md` | **YES** | `git show --stat 4decee1` (3 files, +264) |
| **V3** | `02_P1`: payload contract with backend | `218ba57` | `reports/V3.md`, updated `STATE.md` | **YES** | `git show --stat 218ba57` (2 files, +181) |
| **V4** | `02_P1`: Animate, Add reference & Reuse today | `6e1f64f` | `reports/V4.md`, updated `STATE.md` | **YES** | `git show --stat 6e1f64f` (2 files, +210) |
| **V5** | `02_P1`: persistence & generating state | `bdcb751` | `reports/V5.md`, updated `STATE.md` | **YES** | `git show --stat bdcb751` (2 files, +170) |
| **V6** | `02_P1`: template & Platform branching | `8e55fbc` | `reports/V6.md`, updated `STATE.md` | **YES** | `git show --stat 8e55fbc` (2 files, +203) |
| **P1-GATE**| `02_P1`: VERDICTS.md & phase gate | `1b0be77` | `VERDICTS.md`, `reports/PHASE-P1-GATE.md`, updated `STATE.md` | **YES** | `git show --stat 1b0be77` (3 files, +83) |
| **C1** | `03_P2`: `core/parameterKeys.js` | `f065ff5` | `core/parameterKeys.js`, `parameterKeys.test.js`, `reports/C1.md` | **YES** | `git show --stat f065ff5` (4 files, +94) |
| **C2** | `03_P2`: `core/mediaRef.js` | `a95e5a8` | `core/mediaRef.js`, `mediaRef.test.js`, `reports/C2.md` | **YES** | `git show --stat a95e5a8` (4 files, +255) |
| **C3** | `03_P2`: `core/commandResult.js` | `84aeba6` | `core/commandResult.js`, `commandResult.test.js`, `reports/C3.md` | **YES** | `git show --stat 84aeba6` (4 files, +93) |
| **C4** | `03_P2`: `core/templateContract.js` | `f5ff6e3` | `core/templateContract.js`, `templateContract.test.js`, `reports/C4.md` | **YES** | `git show --stat f5ff6e3` (5 files, +300) |
| **C5** | `03_P2`: `core/media.js` part 1 (slots & limits) | `6278f24` | `core/media.js`, `media.test.js`, Platform reduction, `reports/C5.md` | **YES** | `git show --stat 6278f24` (5 files, +258) |
| **C6** | `03_P2`: `core/media.js` part 2 (quota & types) | `4a1e2de` | `core/media.js` quota functions, `media.test.js`, `reports/C6.md` | **YES** | `git show --stat 4a1e2de` (5 files, +655) |
| **P2-GATE**| `03_P2`: gate and acceptance test | `7716098` | `reports/PHASE-P2-GATE.md`, updated `STATE.md` | **YES** | `git show --stat 7716098` (2 files, +72) |
| **S1** | `04_P3`: `store/registry.js` | `fda92a8` | `store/registry.js`, `registry.test.js`, `reports/S1.md` | **YES** | `git show --stat fda92a8` (4 files, +436) |
| **S2** | `04_P3`: `store/persistence.js` | `e735fb5` | `store/persistence.js`, `persistence.test.js`, `reports/S2.md` | **YES** | `git show --stat e735fb5` (4 files, +482) |
| **S3** | `04_P3`: provider on registry, hydration | `5dd24a0` | `PromptBarStoreContext.js`, `storeLifecycle.test.jsx`, `reports/S3.md` | **YES** | `git show --stat 5dd24a0` (6 files, +472) |
| **S4** | `04_P3`: submit lifecycle (`beginSubmit`) | `3cffe6b` | `submitLifecycle.test.jsx`, registry tokens, `reports/S4.md` | **YES** | `git show --stat 3cffe6b` (6 files, +288) |
| **S5** | `04_P3`: memory policy | `e4e507e` | `memoryPolicy.test.jsx`, `pruneOtherProjects`, `reports/S5.md` | **YES** | `git show --stat e4e507e` (3 files, +244) |
| **S6** | `04_P3`: multi-instance lifecycle & doc | `b04b06b` | `multiInstanceLifecycle.test.jsx`, `STORE_LIFECYCLE.md`, `reports/S6.md` | **YES** | `git show --stat b04b06b` (5 files, +439) |
| **P3-GATE**| `04_P3`: gate and acceptance test | `67d1055` | `reports/PHASE-P3-GATE.md`, updated `STATE.md` | **YES** | `git show --stat 67d1055` (2 files, +74) |
| **T1** | `05_P4`: serialization contract (PB-D-12) | `94a1133` | `core/serialization.js` filter, `safe1PureCore.test.js` update, `reports/T1.md` | **YES** | `git show --stat 94a1133` (5 files, +107) |
| **T2** | `05_P4`: `pruneMedia` (pure in `core/media.js`) | `3902ba5` | `core/media.js` pruneMedia, `pruneMedia.test.js`, `reports/T2.md` | **YES** | `git show --stat 3902ba5` (4 files, +381) |
| **T3** | `05_P4`: `switchMode` command and store action | `a037992` | `commands/switchMode.js`, `switchModeCommand.test.js`, Platform effect deleted, `reports/T3.md` | **YES** | `git show --stat a037992` (4 files, +372) |
| **T4** | `05_P4`: one place for model trimming (PB-K3) | `d01c3a2` | `commands/selectModel.js`, `selectModelTrimming.test.jsx`, Platform effect deleted, `reports/T4.md` | **YES** | `git show --stat d01c3a2` (4 files, +320) |
| **T5** | `05_P4`: `attachMedia` and `removeMedia` | `8724025` | `commands/attachMedia.js`, `commands/removeMedia.js`, `attachRemoveMedia.test.js`, `reports/T5.md` | **YES** | `git show --stat 8724025` (4 files, +440) |
| **T6** | `05_P4`: core purity and dependency test | `0eb8e10` | `adapters/useRealBackendModels.js`, `dependencyDirection.test.js`, `reports/T6.md` | **YES** | `git show --stat 0eb8e10` (5 files, +195) |
| **P4-GATE**| `05_P4`: gate and acceptance test | `2ffe865` | `reports/PHASE-P4-GATE.md`, updated `STATE.md` | **YES** | `git show --stat 2ffe865` (2 files, +107) |
| **X1** | `06_P5`: `api/promptBarService.js` & pending queue | `d5f069a` | `api/promptBarService.js`, `store/pendingActions.js`, `promptBarService.test.js`, `reports/X1.md` | **YES** | `git show --stat d5f069a` (9 files, +1021) |
| **X2** | `06_P5`: generated-media template actions | `e08015e` | `core/composite.js`, `templates/generatedMedia.template.js`, `templateActions.test.js`, `reports/X2.md` | **YES** | `git show --stat e08015e` (7 files, +656) |
| **X3** | `06_P5`: focus without DOM query | `1767b2b` | `editorFocus.test.jsx`, store requestFocus, `PromptEditor.jsx` listener, `reports/X3.md` | **YES** | `git show --stat 1767b2b` (6 files, +225) |
| **X4** | `06_P5`: migrate `useMediaActions.js` to service | `3d3ee71` | `useMediaActions.js` migrated, `mediaActionsMigration.test.jsx`, `reports/X4.md` | **YES** | `git show --stat 3d3ee71` (8 files, +365) |
| **X5** | `06_P5`: migrate other legacy consumers | `4cebadd` | `elements/edit/[workflowId]/page.js`, `elementSheetConfig.js`, `elementEditMigration.test.jsx`, `reports/X5-elementsEdit.md` | **YES** | `git show --stat 4cebadd` (5 files, +191) |
| **X6** | `06_P5`: remove dead legacy fields | `7fb7774` | `model/usePromptStore.js` pruned, `EXTERNAL_ACTIONS.md`, `reports/X6.md` | **YES** | `git show --stat 7fb7774` (7 files, +181) |
| **P5-GATE**| `06_P5`: gate and acceptance test | `adabbe7` | `reports/PHASE-P5-GATE.md`, updated `STATE.md` | **YES** | `git show --stat adabbe7` (2 files, +76) |
| **H1** | `07_P6`: `usePromptBarModels` | `adb03af` | `platform/hooks/usePromptBarModels.js`, `usePromptBarModels.test.jsx`, `reports/H1.md` | **YES** | `git show --stat adb03af` (3 files, +193) |
| **H2** | `07_P6`: `usePromptBarSlots` | `6a0633f` | `platform/hooks/usePromptBarSlots.js`, `usePromptBarSlots.test.jsx`, `reports/H2.md` | **YES** | `git show --stat 6a0633f` (3 files, +216) |
| **H3** | `07_P6`: `usePromptBarReferences` | `b53ecd7` | `platform/hooks/usePromptBarReferences.js`, `usePromptBarReferences.test.jsx`, `reports/H3.md` | **YES** | `git show --stat b53ecd7` (3 files, +521) |
| **H4** | `07_P6`: `usePromptBarGenerate` | `40cb0c7` | `platform/hooks/usePromptBarGenerate.js`, `usePromptBarGenerate.test.jsx`, `reports/H4.md` | **YES** | `git show --stat 40cb0c7` (3 files, +210) |
| **H5** | `07_P6`: UI parts | `cd16866`, `5798cda`, `3e32018`, `ec44c6d` | `PromptBarTopPanel.jsx`, `PromptBarSlotsRow.jsx`, `PromptBarControlsRow.jsx`, unit tests, `reports/H5.md` | **YES** | `git show --stat ec44c6d` (8 files across 4 commits) |
| **H6** | `07_P6`: cleanup and final shape | `9481923` | `PLATFORM_STRUCTURE.md`, prop compatibility verification, `reports/H6.md` | **YES** | `git show --stat 9481923` (2 files, +87) |
| **P6-GATE**| `07_P6`: gate and acceptance test | `8fc6c7d` | `reports/PHASE-P6-GATE.md`, updated `STATE.md` | **YES** | `git show --stat 8fc6c7d` (2 files, +112) |
| **W1** | `08_P7`: `GeneratedPromptBar.jsx` & pages | `0e69cb5`, `9cc2f77`, `7d966cc`, `a8e94ec`, `f3df10c`, `b94825c` | `templates/GeneratedPromptBar.jsx`, 4 consumer pages migrated, `GeneratedPromptBar.test.jsx`, `reports/W1.md` | **YES** | `git show --stat 0e69cb5` to `f3df10c` |
| **W2** | `08_P7`: `persistRoutes` & route watcher | `63e02fe`, `8ba7875`, `f18c0a8` | `store/routePolicy.js`, `store/usePromptBarRouteWatcher.js`, layout mount, tests, `reports/W2.md` | **YES** | `git show --stat 63e02fe`, `8ba7875` |
| **W3** | `08_P7`: template consolidation | `efb8900`, `54bf125`, `3d78b20` | `templates/generatedMedia.template.js`, `ADDING_A_TEMPLATE.md`, `reports/W3.md` | **YES** | `git show --stat efb8900`, `54bf125` |
| **W4** | `08_P7`: proof model/mode optional (PB-D-13) | `2f8489a`, `9ff95a4` | `fixtures/promptOnly.template.js`, `promptOnlyTemplate.test.jsx`, `reports/W4.md` | **YES** | `git show --stat 2f8489a`, `9ff95a4` |
| **W5** | `08_P7`: documentation and final gate | `89ff498`, `95bde45` | `ARCHITECTURE.md`, `reports/P7-SUMMARY.md`, `reports/PHASE-P7-GATE.md`, `STATE.md` | **YES** | `git show --stat 89ff498`, `95bde45` |

### 1.2 Non-Plan Tasks and Commits Check
- **Plan tasks with no matching commit**: **NONE** (`VERIFIED`). Every single task defined in `01_P0` through `08_P7` has verified commits.
- **Commits that match no plan task in 01..08**:
  1. `9276cf6`: `refactor(prompt-bar): remove obsolete shims, duplicate studio files and dead code` (cleanup performed after P7-GATE).
  2. `78cfa2c`: `feat(prompt-bar): add character template and CharacterPromptBar wrapper` (P8-character candidate).
  3. `8b7bbc4`: `docs(prompt-bar): update STATE with P8-CHARACTER template and 478 tests` (P8-character candidate).
  4. `b05f6ff`: `feat(characters): mount CharacterPromptBar on NewCharacterPage` (P8-character candidate).
  5. `9acb980`: `fix(characters): configure character template with prompt and reference slot only` (P8-character candidate).
  6. `7039973`: `feat(prompt-bar): implement character traits form, minimum 10 prompt validation, and image/element reference constraints` (P8-character candidate).
  7. `0741be2`: `pb9(FINAL)` (Final summary documentation per `09_FINAL_AND_P8`).
  8. `b58bfef`: `chore(prompt-bar-plan): record FINAL commit in STATE.md`.

---

## 2. Phase P1 Verification Artifacts and Audits

[VERIFIED: Read verbatim from `docs/prompt-bar-plan/VERDICTS.md` and `docs/prompt-bar-plan/CONSUMERS.md`]

### 2.1 VERDICTS.md Table
```markdown
| Claim | Source | Verdict | Evidence | Plan impact |
|---|---|---|---|---|
| Hydration mismatch between server and client keys | audit 3.5 | CONFIRMED | `reports/V1.md` (`resolveProjectId.js:12-25`, `createPromptBarStore.js:255`) | S3 (two-phase mount / SSR-safe hydration) is mandatory in P3 to eliminate SSR key mismatch. |
| Generate stays blocked after navigation | audit 3.4 | PARTIAL | `reports/V5.md` (`createPromptBarStore.js:143`, `useGenerateMediaMutation.js:176`) | S4 in P3 must ensure `isGenerating` is reset on store mount/lifecycle rather than preserved across navigation. |
| Animate relies on `input_image` carry-over | discussion | REFUTED | `reports/V4.md` (`useMediaActions.js:480`) | PB-D-03 (wiping mode-specific parameters on mode switch) will not break Animate. T3 in P4 can proceed safely. |
| Backend ignores undeclared parameters | PB-D-12 | REFUTED (NOT SAFE to leak) | `reports/V3.md` (`apiOpenArt/schemaValidator.js:151-161`, `modelRunner.js:63-65`) | T1 in P4 is mandatory: backend strictly rejects undeclared parameters with `UnknownParameterError`. |
| Two bars can be mounted at once | PB-D-05 | CONFIRMED | `reports/V1.md` (`prompt-bar-compare/page.jsx:24,31`) | `instanceId`-scoped store (S1) is necessary to support side-by-side or modal bars without singleton collisions. |
| Legacy store duplicates prompt/model/mode | audit 2.4 | CONFIRMED | `reports/V2.md` (`useMediaActions.js:149-181`, `CONSUMERS.md`) | Defines migration scope for X4/X5 in P5: migrate 4 duplicated consumers, keep 13 drag/trait consumers. |
```

### 2.2 CONSUMERS.md Table
```markdown
| Consumer File | Store | Field / Action | Duplicates Instance Store? | Class | Notes |
|---|---|---|---|---|---|
| `src/features/workflows/model/useMediaActions.js:169-181` | `usePromptStore` | `setGenerationMode`, `setPrompt`, `setModelId`, `setRatio`, `setReferenceImages`, `setQuality`, `setVideoResolution`, `setDuration`, `setMotion`, `setCount` | YES | **MIGRATED (P5)** | Migrated in X4 to `promptBarService.applyGeneration(...)` & `focus()`. |
| `src/features/workflows/model/useMediaActions.js:217-227` | `usePromptStore` | `setGenerationMode`, `clearReferences`, `addReference` | YES | **MIGRATED (P5)** | Migrated in X4 to `promptBarService.animateMedia(...)`. |
| `src/features/workflows/model/useMediaActions.js:263` | `usePromptStore` | `addReference` | YES | **MIGRATED (P5)** | Migrated in X4 to `promptBarService.addReference(...)`. |
| `src/app/cinema-studio/[projectId]/elements/edit/[workflowId]/page.js:22-26` | `usePromptStore` | `setGenerationMode`, `setModelId`, `setRatio`, `setQuality`, `setVideoResolution` | YES | **MIGRATED (P5)** | Migrated in X5 to `syncElementDraft(...)` calling `promptBarService.applyGeneration(...)`. |
| `src/features/workflows/model/useMediaActions.js:110-112` | `useElementStore` | `setPrompt`, `features` | NO | **KEEP** | Updates element prompt & traits during element action. |
| `src/app/cinema-studio/[projectId]/elements/edit/[workflowId]/page.js:20-21` | `useElementStore` | `hydrateElementDraft`, `resetElementStore` | NO | **KEEP** | Element turnaround sheet & draft hydration. |
| `src/app/cinema-studio/[projectId]/characters/new/page.js:124` | `useCharacterStore` | `setPrompt` | NO | **KEEP** | Sets prompt from archetype selection. Character prompt bar is locked (PB-D-18). |
| `src/features/prompt-bar/ui/common/editor/FeatureNode.jsx:8` | `useCharacterStore` | `openFeatureEditorForLabel` | NO | **KEEP** | Lexical feature tag click handler opening character traits editor. |
| `src/features/prompt-bar/ui/common/editor/plugins/SyncFeaturesPlugin.jsx:10-11` | `useCharacterStore` | `features`, `updateFeature` | NO | **KEEP** | Synchronizes Lexical editor state with character traits form. |
| `src/features/prompt-bar/ui/common/editor/plugins/TextTagConverterPlugin.jsx:20` | `useCharacterStore` | `updateFeature` | NO | **KEEP** | Converts typed text into character feature nodes. |
| `src/app/cinema-studio/[projectId]/assets/page.js:67-68` | `usePromptStore` | `isDraggingGalleryItem`, `draggedItem` | NO | **KEEP** | Gallery drag & drop state. |
| `src/app/cinema-studio/[projectId]/collection/[collectionId]/page.js:109-136` | `usePromptStore` | `isDraggingGalleryItem`, `draggedItem` | NO | **KEEP** | Collection view drag & drop state. |
| `src/app/cinema-studio/[projectId]/elements/page.js:47` | `usePromptStore` | `isDraggingGalleryItem` | NO | **KEEP** | Elements grid drag overlay. |
| `src/widgets/StudioNavbar/ui/StudioNavbarLeft.jsx:96` | `usePromptStore` | `isDraggingGalleryItem` | NO | **KEEP** | Navbar drag dropzone visual feedback. |
| `src/features/studio/useDragAutoScroll.js:204-273` | `usePromptStore` | `isDraggingGalleryItem`, subscribe | NO | **KEEP** | Studio container edge auto-scrolling during drag. |
| `src/features/studio/useStudioItemDrag.js:145-205` | `usePromptStore` | `setIsDraggingGalleryItem`, `setDraggedItem` | NO | **KEEP** | Media item drag handlers. |
| `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:68-788` | `usePromptStore` | `isDraggingGalleryItem`, `draggedItem`, setters | NO | **KEEP** | Grid item drag initiation and drop handling. |
```

### 2.3 Correspondence of V1..V6 Reports to Plan Audits
- **`V1.md`**: Section 28 of `02_P1_verification_audits.md`: *V1: instances, mounting and project identity*.
- **`V2.md`**: Section 38 of `02_P1_verification_audits.md`: *V2: legacy store consumers (produces CONSUMERS.md)*.
- **`V3.md`**: Section 45 of `02_P1_verification_audits.md`: *V3: payload contract with the backend (READ-ONLY on the backend)*.
- **`V4.md`**: Section 52 of `02_P1_verification_audits.md`: *V4: Animate, Add reference and Reuse today*.
- **`V5.md`**: Section 60 of `02_P1_verification_audits.md`: *V5: persistence and generating state*.
- **`V6.md`**: Section 67 of `02_P1_verification_audits.md`: *V6: template and Platform branching*.

---

## 3. Detailed Audit of Commit 9276cf6

[VERIFIED: `git show 9276cf6 --stat` and `git diff 9276cf6^..9276cf6`]

### 3.1 File-by-File List of Deleted Files

| File Path | Lines Deleted | What It Contained | Importers Before Commit |
|---|---|---|---|
| `src/features/prompt-bar/composition/generatedMedia.type.js` | 8 | Obsolete shim re-exporting from `templates/generatedMedia.template.js` | 7 test files (`safe2TemplateRules`, `safe5Platform`, etc.) |
| `src/features/prompt-bar/composition/resolveUI.js` | 32 | Obsolete layout helper resolving slot UI from legacy type | None (`VERIFIED`) |
| `src/features/prompt-bar/generated-media/generatedMedia.config.js` | 14 | Obsolete shim re-exporting from `templates/generatedMedia.template.js` | 2 test files (`safe2TemplateRules`, `modelEligibilityContract`) |
| `src/features/prompt-bar/model/core/promptBarState.js` | 39 | Duplicate state initialization helper | None (`VERIFIED`) |
| `src/features/studio/PromptBarStoreContext.js` | 15 | Duplicate shim of `PromptBarStoreContext` | `src/features/studio/index.js` |
| `src/features/studio/core/entityService.js` | 224 | Duplicate implementation of `entityService` | `src/features/studio/index.js` |
| `src/features/studio/core/initialization.js` | 40 | Duplicate parameter initialization logic | `src/features/studio/core/mediaReferenceService.js` |
| `src/features/studio/core/modelManagement.js` | 244 | Duplicate model adaptation & normalization | `src/features/studio/index.js` |
| `src/features/studio/core/parameterState.js` | 47 | Duplicate parameter state getters/setters | `src/features/studio/core/mediaReferenceService.js` |
| `src/features/studio/core/promptBarRules.js` | 119 | Duplicate mode & aspect ratio rules | `src/features/studio/core/mediaReferenceService.js` |
| `src/features/studio/core/promptBarState.js` | 39 | Duplicate prompt bar state constants | Internal studio core |
| `src/features/studio/core/reconciliation.js` | 103 | Duplicate parameter reconciliation logic | Internal studio core |
| `src/features/studio/core/serialization.js` | 93 | Duplicate serialize logic | Internal studio core |
| `src/features/studio/core/tagsService.js` | 260 | Duplicate tag cleaning and parsing service | `src/features/studio/index.js` |
| `src/features/studio/core/types.js` | 145 | Duplicate TypeScript/JSDoc type contracts | Internal studio core |
| `src/features/studio/createPromptBarStore.js` | 319 | Duplicate prompt bar Zustand store implementation | Internal studio |
| `src/features/studio/feature-constants.js` | 524 | Duplicate models & UI presets catalog | Internal studio |
| `src/features/studio/useCharacterStore.js` | 242 | Duplicate character store implementation | `src/features/studio/index.js` |
| `src/features/studio/useLibraryFilter.js` | 196 | Duplicate library filter hook | `src/features/studio/index.js` |

### 3.2 Tests Deleted
- **Tests Deleted**: **0** (`VERIFIED: git show 9276cf6 --stat` shows zero test file deletions).
- 9 test files had their import paths rewired from `composition/generatedMedia.type.js` and `features/generated-media/generatedMedia.config.js` to `templates/generatedMedia.template.js`.

### 3.3 Authorization Context vs PB-D-02
- `DECISIONS.md:6` (`PB-D-02`) states: `"Never without a shim at the old path (old imports keep working). Shim removal is phase P8"`.
- Authorization: The human owner sent the message:
  `"1. edit.template.js: Prompt bar mkhassas lil-Inpainting / Image Edit (mask slot + reference image). upscale.template.js: Prompt bar simple lil-Upscaling (juste el taswira l'asliya + scale factor 2x/4x, men ghir prompt w men ghir modes).fassa5hom"`
  The instruction `"fassa5hom"` explicitly commanded deleting unused template prototypes and dead code.
- Notice: Commit `9276cf6` preserved the shims in `src/features/studio/index.js` by re-pointing them to `@/features/prompt-bar/*` rather than deleting the public exports, strictly honoring PB-D-02's requirement that old imports keep working.

---

## 4. Phase P8-Character Audit

[VERIFIED: Git log, commit messages, and `docs/prompt-bar-plan/FINAL.md`]

### 4.1 Owner Messages Unlocking Character Work
The following verbatim human requests in the conversation unlocked the character template:
1. `behi tawa nzido template caractr` ("Okay now let's add the character template")
2. `ey 7ot l ui f caractr page` ("Yes put the UI on the character page")
3. `behi tawa 7aja o5ra besba l caracetr promp bar enno raho mouch kk awel 7aja emchi chof l api chnwao ye9ble w zeda rahom mafamech modles wele ay paramter just famam ken propmo w refrecne akahw` ("Okay now another thing regarding the character prompt bar: check the API, there are no models or parameters, only prompt and reference, that's it")
4. `behi rakkaez m3aya bech nefhmo system mta3 l caracetr promp bar awel 7aja howa mouch fih le modes wele .. just fih ken l promp w refrecen w lazem obligatwaer l promp ykun fih text min 10 caracetr w zeda howa fih l formt form l comeepron elly ya5tar l cracater caraceterstiqe w zeda bebsa l images yerefrecne ye9bel ken image s w elemnt akahawo` ("Focus with me: no modes, only prompt and reference, prompt must obligatorily have min 10 chars, has the form component for character traits, reference accepts only images and elements, that's it")

### 4.2 Product Behaviors Added
1. **Depowered Template**: `character.template.js` declares `features: { models: false, modes: false }`. No model selector, no mode dropdown.
2. **Minimum 10 Characters Prompt Validation**: `usePromptBarGenerate.js:55-56` evaluates `minPromptLength: 10` for template id `character`, disabling Generate button when prompt length < 10 characters.
3. **Reference Slot Constraints**: Slot `accepts: ["image", "element"]`, rejecting video references.
4. **Character Traits Form**: Built and mounted `CharacterFeatureEditor.jsx`, wired to `useCharacterStore` / `useElementStore` and synchronized to Lexical editor tags via `SyncFeaturesPlugin`.
5. **Page Integration**: Replaced placeholder UI on `src/app/cinema-studio/[projectId]/characters/new/page.js` with `<CharacterPromptBar />`.

### 4.3 Does FINAL.md Still Say P8 Was Not Started?
- **YES (`VERIFIED`)**.
- `docs/prompt-bar-plan/FINAL.md:180` states verbatim:
  `"Phase P8 (new templates, renames, shim removal) was not started because it is locked."`
- Rationale: `FINAL.md` followed Section 11 of the plan specification which strictly mandated copying the literal statement from `09_FINAL_AND_P8`, creating an acknowledged documentation contradiction since `P8-character` was built per human instruction.

---

## 5. Every Existing Test Edited or Deleted Since P0 Gate

[VERIFIED: `git diff --name-status db3b38b..HEAD`]

| Test File | Commit | Card | Decision ID | Rationale & Changes |
|---|---|---|---|---|
| `src/features/prompt-bar/__tests__/safe1PureCore.test.js` | `94a1133` | T1 | **PB-D-12** | Updated test `pins PB-K2` to `satisfies PB-D-12: serialize omits undeclared media parameters` and added 2 assertions for clean parameter filtering. Authorized by `01_P0_setup_and_safety_net.md:45`. |
| `src/features/prompt-bar/__tests__/safe4Persistence.test.jsx` | `5dd24a0` | S3 | **PB-D-01, PB-D-07** | Updated tests for PB-K4a (module-level active store returns null when multiple mounted) and PB-K4b (blob URLs safely stripped from storage). Authorized by `01_P0_setup_and_safety_net.md:91`. |
| `src/features/prompt-bar/__tests__/safe5Platform.test.jsx` | `a037992`, `9276cf6` | T3, Cleanup | **PB-D-03** | `a037992` updated `pins PB-K1` to assert `input_image` is pruned on mode switch (PB-D-03). `9276cf6` updated import path to `templates/generatedMedia.template.js`. |
| `src/features/prompt-bar/__tests__/safe2TemplateRules.test.js` | `9276cf6` | Cleanup | **PB-D-19** | Updated import paths from obsolete split files (`features/generated-media/generatedMedia.config.js` and `composition/generatedMedia.type.js`) to `templates/generatedMedia.template.js`. Zero test logic change. |
| `src/features/prompt-bar/__tests__/modelEligibilityContract.test.mjs` | `9276cf6` | Cleanup | **PB-D-19** | Updated import path from `features/generated-media/generatedMedia.config.js` to `templates/generatedMedia.template.js`. Zero test logic change. |

**Total Deleted Tests**: **0** (`VERIFIED`).

---

## 6. Throwaway Worktree Scenarios Execution (Plan Fixtures)

[VERIFIED: Executed live in Node.js v24.21.0 inside detached worktree `$env:TEMP\pb-addendum-worktree` with `models.fixture.js`]

### Printed Raw Output
```
=== SCENARIO 1: image -> video/frames with a reference ===
BEFORE switchMode:
  activeMode: image
  activeSubMode: frames
  selectedModelId: nanobana_pro
  prompt: "A majestic lion <media:ref_lion> on rocks"
  parameterValues: {"aspect_ratio":"16:9","images":[{"workflow_id":"ref_lion"}]}
AFTER switchMode:
  activeMode: video
  activeSubMode: frames
  selectedModelId: seedance_2_5
  prompt: "A majestic lion on rocks"
  parameterValues: {"duration":5,"aspect_ratio":"16:9","resolution":"720p"}

=== SCENARIO 2: model switch to lower max images ===
BEFORE selectModel:
  selectedModelId: nanobana_pro
  prompt: "Scene with <media:ref_1> and <media:ref_2>"
  parameterValues: {"aspect_ratio":"16:9","images":[{"workflow_id":"ref_1"},{"workflow_id":"ref_2"}]}
AFTER selectModel:
  selectedModelId: model_single_ref
  prompt: "Scene with <media:ref_1> and"
  parameterValues: {"aspect_ratio":"16:9","images":{"workflow_id":"ref_1"}}

=== SCENARIO 3: animateMedia WITH and WITHOUT a frames model ===
3A (WITH frames model) Result ok: true
  activeMode: video
  activeSubMode: frames
  selectedModelId: seedance_2_5
  parameterValues: {"duration":5,"aspect_ratio":"16:9","resolution":"720p","input_image":{"workflow_id":"wf_video_start","url":"https://example.com/start.png","id":"wf_video_start"}}

3B (WITHOUT frames model) Result ok: false reason: NO_ELIGIBLE_MODEL
  State deep-equal before and after: true
  State after: {"activeMode":"image","activeSubMode":"frames","selectedModelId":"nanobana_pro","prompt":"Untouched prompt","parameterValues":{"aspect_ratio":"16:9","resolution":"2K"}}
```

### Analysis of Scenario 2/3 Trimming Mechanics
- **Declared Target Model Shape**:
  - `model_single_ref` parameter definition: `images: { type: "image[]", group: "media", max: 1 }`.
  - Declared type: `"image[]"`, `max: 1`.
- **Why the Value Became an Object**:
  - Source: `src/features/prompt-bar/store/commands/selectModel.js:57-67`.
  - Verbatim code:
    ```javascript
    // For single-reference models (max === 1), if the parameter was an array with 1 item,
    // convert to single item object for backward compatibility with SAFE-3 / legacy callers
    if (
      nextCap?.maxRefs === 1 &&
      Array.isArray(pruned.parameterValues[targetKey]) &&
      pruned.parameterValues[targetKey].length === 1
    ) {
      pruned.parameterValues[targetKey] = pruned.parameterValues[targetKey][0];
    }
    ```
  - Rationale: Single-reference models historically consumed `{ workflow_id: "..." }` rather than a 1-element array in legacy UI selectors and tests.

---

## 7. Platform Line Count and Hook Counts Per Phase Gate Commit

[VERIFIED: `git show ${sha}:src/features/prompt-bar/platform/PromptBarPlatform.jsx`]

| Phase Gate | Commit SHA | Total Lines | `useEffect` | `useState` | `useMemo` | `useCallback` |
|---|---|---|---|---|---|---|
| **Baseline** | `42c32fa` | 1,112 | 10 | 8 | 21 | 14 |
| **P0 Gate** | `db3b38b` | 1,112 | 10 | 8 | 21 | 14 |
| **P1 Gate** | `1b0be77` | 1,112 | 10 | 8 | 21 | 14 |
| **P2 Gate** | `7716098` | 1,085 | 10 | 8 | 20 | 14 |
| **P3 Gate** | `67d1055` | 1,095 | 10 | 8 | 20 | 14 |
| **P4 Gate** | `2ffe865` | 935 | 9 | 8 | 20 | 14 |
| **P5 Gate** | `adabbe7` | 918 | 8 | 8 | 20 | 14 |
| **P6 Gate** | `8fc6c7d` | 400 | 2 | 2 | 0 | 3 |
| **P7 Gate** | `89ff498` | 403 | 2 | 2 | 0 | 3 |
| **HEAD** | `b58bfef` | 412 | 2 | 2 | 0 | 3 |

---

## 8. Missing Re-Check Rows

[VERIFIED: Tested against source code and vitest unit test executions]

| Concern | Claim / Spec Requirement | Verdict & Status | Concrete Evidence |
|---|---|---|---|
| **Hydration Mismatch** | Server and client storage keys mismatch during SSR (Audit 3.5). | **CONFIRMED & FIXED** | Fixed in P3 (task S3 / PB-D-06). `createPromptBarStore.js:60` and `PromptBarStoreContext.js:45` execute store creation deterministically with 0 storage access. Saved state hydrates only after mount in `useEffect`. |
| **Serialize Undeclared Params** | Undeclared media parameters must never leak to backend payloads (PB-K2). | **FIXED** | Fixed in P4 (task T1 / PB-D-12). `serialization.js:91` strictly loops over `Object.entries(definitions)`. Pinned in `safe1PureCore.test.js:188`. |
| **Debounced Writes** | 10 rapid state updates must collapse into exactly 1 storage write (PB-D-09). | **FIXED & VERIFIED** | Verified by `persistence.test.js:93-118`. Advancing timer by 300ms triggers `setItem` exactly once for 10 rapid updates. |
| **Blob Values Never Persisted** | File, Blob, `blob:`, `data:` URLs must be dropped from persistence (PB-D-07). | **FIXED & VERIFIED** | `persistence.js:19-45` (`isSafePersistableValue`). Verified in `persistence.test.js:60-91` and `safe4Persistence.test.jsx:280`. |
| **input_image Collision** | Image references in `input_image` must not silently become Start Frame on video switch (PB-K1). | **FIXED & VERIFIED** | `switchMode.js:56-75` calls `pruneMedia({ reason: "mode-change" })` and deletes all media parameters. Verified in `safe5Platform.test.jsx:250`. |
| **Platform imports of features/studio** | Platform must not import any modules from `@/features/studio`. | **0 IMPORTS (CLEAN)** | Verified by `Select-String`: exactly 0 imports of `features/studio` in `src/features/prompt-bar/platform/`. |
| **`console.*` Count** | Zero console logs in new prompt bar production code. | **1 (Lexical onError)** | Exactly 1 `console.error` in `PromptEditor.jsx:266` for Lexical error boundary. 0 in tests, 0 anywhere else in `prompt-bar`. |

---

## 9. Module-Level Map, Set, and Let in `src/features/prompt-bar`

[VERIFIED: AST / regex search across all non-test files under `src/features/prompt-bar`]

| File & Line | Declaration | Purpose | Per-Instance State in Disguise? |
|---|---|---|---|
| `core/commandResult.js:17` | `const VALID_REASONS = new Set(Object.values(REASONS));` | Lookup table of valid reason strings | **NO**: Immutable domain constants set. |
| `core/parameterKeys.js:28` | `const VALID_MEDIA_TYPES = new Set(Object.values(MEDIA_TYPES));` | Lookup table of recognized media parameter types | **NO**: Immutable domain constants set. |
| `core/serialization.js:17` | `const MEDIA_PARAM_NAMES = new Set([ ... ]);` | Set of canonical parameter keys that accept media | **NO**: Immutable domain constants set. |
| `providers/ltx/ltxClient.js:15` | `const FRAME_MODELS = new Set([ ... ]);` | Lookup set of model IDs supporting keyframes | **NO**: Immutable configuration set. |
| `store/pendingActions.js:16-23` | `const memoryStorage = (() => { const map = new Map(); ... })();` | In-memory storage adapter fallback for SSR/node environments | **NO**: Adapter fallback implementing `Storage` interface when `window.sessionStorage` is undefined. |
| `store/registry.js:258` | `export const registry = createRegistry();` (contains `const entries = new Map();` on line 66) | Multi-instance registry storing stores, mount counts, and submit tokens by canonical identity key | **NO**: Explicit registry architecture (PB-D-05, PB-D-10) replacing global active variables. Supports multi-instance isolation and garbage collection. |

### Top-Level `let` Declarations
- **Total Found**: **0** (`VERIFIED`).
- Every module-level variable declaration across all production files in `src/features/prompt-bar` uses `const`. The former `let activePromptBarStoreInstance` was eliminated in commit `5dd24a0`.
