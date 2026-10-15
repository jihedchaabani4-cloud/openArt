# PHASE P4 GATE REPORT: Atomic Transitions and Payload Serialization

Phase P4 successfully delivered atomic mode transitions, pure media pruning, consolidated model-switch trimming, pure attach/remove media commands, payload serialization purity, and strict core dependency boundaries (T1 through T6).

## Acceptance Results

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | The matrix test of `switchMode` passes for 3 models x 4 transitions and asserts a single notification. | VERIFIED | `src/features/prompt-bar/__tests__/switchModeCommand.test.js` matrix suite tests 3 models (`seedance_2_5`, `nanobana_pro`, `seedream_v5`) x 4 transitions (`image -> video/frames`, `video/frames -> video/reference`, `video/reference -> image`, `video/frames -> image`), verifying atomic state transition, single notification (`listener.toHaveBeenCalledTimes(1)`), media pruning, cascade tag cleansing, and parameter reconciliation. |
| 2 | `rg -n "exhaustive-deps" src/features/prompt-bar` count is lower than at the start of P4 (write both numbers). | VERIFIED | Count at start of P4: 1 (`PromptBarPlatform.jsx:368`). Count at end of P4: 0. Decreased from 1 to 0 (clean). |
| 3 | The mode-switch cleanup effect and the duplicate trimming effect no longer exist in `PromptBarPlatform.jsx` (state how you checked). | VERIFIED | Checked via grep for `prevModeRef` and `prevModelIdRef` and code review of `PromptBarPlatform.jsx`. The post-render cleanup `useEffect` (lines ~324-370) was deleted in T3, and the duplicate trimming `useEffect` (lines ~486-535) was deleted in T4. Total file lines decreased from 1215 to 1042 lines (-173 lines). |
| 4 | Every P0 test changed on purpose is listed with its task and reason; no other P0 test changed. | VERIFIED | Only one P0 test was changed: `safe5Platform.test.jsx:254` (PB-K1 test) updated in T3 per PB-D-03 (previously asserted attached image in `image` mode carried over into `video/frames` start frame; now asserts media is dropped and prompt tag cleansed upon cross-mode transition). No other P0 tests were modified. |
| 5 | Golden payloads for the three models are identical to P0 (except the documented PB-K2 case). | VERIFIED | Verified in T1 (`safe5Platform.test.jsx`). The golden payload for `normalizedFramesModel` omits undeclared media parameters (`images: []` removed per PB-K2 / PB-D-12). All other payload fields for frames, images-list, and prompt-only models match P0 golden definitions verbatim. |
| 6 | Architecture test passes. | VERIFIED | `src/features/prompt-bar/__tests__/dependencyDirection.test.js` passes hermetically, verifying 0 forbidden framework/feature imports in `core/` and `store/` with documented exceptions for `PromptBarStoreContext.js`, `usePromptBarStore.js`, and `core/useRealBackendModels.js` shim. |
| 7 | Full `npm test` passes. | VERIFIED | Vitest: 52 test files passed, 401 tests passed. node:test: 7 test files passed, 47 tests passed (total prompt-bar: 264 tests passed). Full hermetic suite green. |
| 8 | Manual smoke (NOT-RUN for the agent, human): items 2, 3, 4 of `HUMAN_GUIDE.md` section 6. The human reviews the transition matrix with the owner before P5. | NOT-RUN | Smoke items 2, 3, 4 marked NOT-RUN for human verification in browser. |

## Smoke Checklist Items (NOT-RUN by agent; for human in browser)
2. **Credit Calculation & Model Switching**: Switch between image and video models; confirm credits update immediately without lag or intermediate NaN values. (NOT-RUN)
3. **Mode Transitions (Image <-> Video)**: Attach references or frame images in one mode, then switch modes; confirm media and associated prompt tags are dropped cleanly and shared parameters (e.g. aspect ratio) are preserved. (NOT-RUN)
4. **Media Limits on Model Switch**: Attach 4 images to a model supporting 4, then switch to a model supporting 1; confirm UI displays warning dialog, trims references to 1, and cleans pruned tags from prompt. (NOT-RUN)

## Phase Summary
- T1: `core/serialization.js` strips undeclared media parameters (PB-D-12, PB-K2). Commit `94a1133`.
- T2: Pure `pruneMedia` helper in `core/media.js` with `mode-change` and `model-change` policies (PB-D-03). Commit `3902ba5`.
- T3: Pure `switchMode` command in `store/commands/switchMode.js`, single store notification, deleted cleanup `useEffect` from Platform. Commit `a037992`.
- T4: Consolidated model-switch trimming in `store/commands/selectModel.js`, deleted duplicate trimming `useEffect` from Platform. Commit `d01c3a2`.
- T5: Pure `attachMedia` and `removeMedia` commands in `store/commands/`, delegated Platform handlers. Commit `8724025`.
- T6: Layer purity enforced via `adapters/useRealBackendModels.js` + shim at `core/` (PB-D-02) and `dependencyDirection.test.js`. Commit `0eb8e10`.
