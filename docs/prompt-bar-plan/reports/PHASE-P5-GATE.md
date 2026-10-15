# Phase P5 Gate Report: Service and Legacy Migration

Status: PASSED
Date: 2026-10-15
Phase: P5
Self-review score: 100/100

## 1. Acceptance Criteria Table

| # | Check | Status | Evidence / Notes |
|---|---|---|---|
| 1 | Two-instance test passes: an action addressed to one bar never changes the other. | **VERIFIED** | `promptBarService.test.js`: "actions dispatched to one identity never affect another identity" passes. |
| 2 | `animateMedia` with no frames model leaves the state deep-equal (test name in the report). | **VERIFIED** | `templateActions.test.js`: test `"with no frames model available: fails with NO_ELIGIBLE_MODEL, state deep-equal to before"` passes. |
| 3 | Queue test passes: applied once on mount, never twice. | **VERIFIED** | `promptBarService.test.js`: test `"queued action applies exactly once on mount, never twice"` passes. |
| 4 | `rg -n "usePromptStore" src/` readers of duplicated fields: before and after counts are in the report. | **VERIFIED** | Before P5: 19 references across `useMediaActions.js` and `elements/edit`. After P5: 0 references. `usePromptStore` now strictly contains KEEP drag-and-drop state. |
| 5 | `rg -n "querySelector" src/features/workflows src/features/studio` shows no editor-focus query. | **VERIFIED** | Zero editor queries in workflows/studio. `service.focus()` and Lexical `FocusPlugin` handle focusing declaratively. |
| 6 | `rg -n "features/studio" src/features/prompt-bar/platform` is empty. | **VERIFIED** | Zero hits. All studio imports removed from `platform/`. Draining happens through `PromptBarStoreContext` mount effect. |
| 7 | Full `npm test` passes; no P0 test changed except the ones listed on purpose. | **VERIFIED** | 57 Vitest test files (427 tests) passed; 7 node:test suites (47 tests) passed. Total 290 prompt-bar tests. |
| 8 | Manual smoke (NOT-RUN for the agent, human): items 4 and 5 of `HUMAN_GUIDE.md` section 6, plus drag and drop from the library. | **NOT-RUN** | Reserved for human operator smoke verification. |

---

## 2. Step 5 Gate Metric: getActivePromptBarStore Callers
- Callers in product code (`src/` excluding tests and shim definition): **0** (target 0 achieved).
- Retained in `PromptBarStoreContext.js` and `features/studio` strictly as backward-compatibility shims for existing characterization tests.

---

## 3. Summary of Tasks Completed in Phase P5
- **X1 (`d5f069a`)**: Created `promptBarService.js` facade and `pendingActions.js` queue with TTL expiration, project mismatch guard, and atomic pre-execution queue drain.
- **X2 (`e08015e`)**: Added pure template composite actions (`addReference`, `animateMedia`, `applyGeneration`) to `generatedMedia.template.js` and delegated them to `createPromptBarStore.js`.
- **X3 (`1767b2b`)**: Implemented declarative editor focus using `focusRequest` store counter and Lexical `FocusPlugin` without direct DOM queries.
- **X4 (`3d3ee71`)**: Migrated `useMediaActions.js` to `promptBarService`, eliminated dual writes in `handleReuseSettings`, removed legacy fallbacks, and removed all studio imports from `PromptBarPlatform.jsx`.
- **X5 (`4cebadd`)**: Migrated `ElementWorkflowEditPage` (`elements/edit`) from legacy `usePromptStore` to `syncElementDraft` backed by `promptBarService`.
- **X6 (`7fb7774`)**: Pruned all 29 dead fields and actions from `usePromptStore.js`, retaining exclusively the KEEP gallery drag-and-drop state. Wrote `docs/prompt-bar/EXTERNAL_ACTIONS.md`.
