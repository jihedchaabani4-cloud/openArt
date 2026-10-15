# Phase P7 Summary: Wrappers, PersistRoutes, Template Consolidation

## Executive Summary
Phase P7 completes the refactoring of the Prompt Bar Platform architecture. Pages now consume ready-to-use domain wrappers (`<GeneratedPromptBar />`), route persistence policies (`persistRoutes`) ensure automatic reset and storage cleanup upon navigating away from studio pages, `generatedMedia.template.js` serves as the consolidated source of truth for generation rules, and task W4 proved that model-less and mode-less bars (for future features like Character sheets) are fully supported without domain leakage into Core.

---

## 1. Accomplishments by Task

### Task W1: GeneratedPromptBar Wrapper & Page Migrations
- **Created**: `src/features/prompt-bar/templates/GeneratedPromptBar.jsx` wrapper with `instanceId`, `projectId`, and `persistKey`.
- **Created**: `src/features/prompt-bar/__tests__/GeneratedPromptBar.test.jsx` test suite (4 tests passing).
- **Migrated bare Platform usage in 4 locations**:
  1. `src/app/cinema-studio/[projectId]/assets/page.js:235`
  2. `src/app/cinema-studio/[projectId]/collection/[collectionId]/page.js:145`
  3. `src/widgets/StudioLayout/NewProjectView/NewProjectView.jsx:136`
  4. `src/app/cinema-studio/test/prompt-bar-compare/page.jsx:65`
- Residual check: `rg "type=\{generatedMediaType\}" src/` returns 0 production usages.

### Task W2: Route Policy & Route Watcher (`persistRoutes`)
- **Created**: Pure route policy `src/features/prompt-bar/store/routePolicy.js` (`matchRoute`, `isPathAllowed`). Tested with 14 unit tests.
- **Created**: React hook `src/features/prompt-bar/store/usePromptBarRouteWatcher.js`.
- **Mounted**: Mounted exactly once in `src/app/cinema-studio/[projectId]/layout.js:29` inside `StudioLayout`.
- Contract: Watches pathname navigation. Resets any non-submitting registered instance whose template's `persistRoutes` disallow current pathname and purges saved storage snapshots.

### Task W3: Template Consolidation
- **Consolidated**: `src/features/prompt-bar/templates/generatedMedia.template.js` owns:
  - `COMPOSITION_REQUIREMENTS`
  - `isFrameModel` / `isReferenceModel`
  - `filterEligibleModels`
  - `resolveParameterMapping`
  - `getSlots`
  - `createActions`
  - `generatedMediaType`
  - `generatedMediaTemplate`
- **Replaced**: `generatedMedia.config.js` and `generatedMedia.type.js` converted into zero-breakage compatibility shims.
- **Authored**: `docs/prompt-bar/ADDING_A_TEMPLATE.md` authoring guide.

### Task W4: Proof of Optional Model & Mode (PB-D-13)
- **Created**: `src/features/prompt-bar/__tests__/fixtures/promptOnly.template.js` fixture.
- **Created**: `src/features/prompt-bar/__tests__/promptOnlyTemplate.test.jsx` integration test suite (5 tests passing).
- Verified: Bar renders without model selector and mode toggles; media attaches to custom slots (`front`, `side`, `closeup`); serialization omits `model` and emits static parameters; generate executes cleanly.
- Size guard satisfied: 80 total changed lines across Core/platform/store (limit was ~150).

### Task W5: Architecture Documentation & Regression
- **Created**: `docs/prompt-bar/ARCHITECTURE.md` describing layers, identity format, lifecycle, transitions rule (PB-D-03), and claim vs. reality comparison table.
- **Regression**: Full hermetic test suite passes (68 test files, 473 tests). Zero ESLint errors on prompt-bar. Zero `exhaustive-deps` disables or `activePromptBarStoreInstance` module variables.

---

## 2. Inventory of Files Added & Touched

### Files Created in P7
- `src/features/prompt-bar/templates/GeneratedPromptBar.jsx`
- `src/features/prompt-bar/__tests__/GeneratedPromptBar.test.jsx`
- `src/features/prompt-bar/store/routePolicy.js`
- `src/features/prompt-bar/__tests__/routePolicy.test.js`
- `src/features/prompt-bar/store/usePromptBarRouteWatcher.js`
- `src/features/prompt-bar/__tests__/usePromptBarRouteWatcher.test.jsx`
- `docs/prompt-bar/ADDING_A_TEMPLATE.md`
- `src/features/prompt-bar/__tests__/fixtures/promptOnly.template.js`
- `src/features/prompt-bar/__tests__/promptOnlyTemplate.test.jsx`
- `docs/prompt-bar/ARCHITECTURE.md`
- `docs/prompt-bar-plan/reports/W1.md`
- `docs/prompt-bar-plan/reports/W2.md`
- `docs/prompt-bar-plan/reports/W3.md`
- `docs/prompt-bar-plan/reports/W4.md`
- `docs/prompt-bar-plan/reports/P7-SUMMARY.md`

### Shims Left (To Remove in Phase P8)
1. `src/features/prompt-bar/features/generated-media/generatedMedia.config.js` (shims `generatedMedia.template.js`)
2. `src/features/prompt-bar/composition/generatedMedia.type.js` (shims `generatedMedia.template.js`)
3. `src/features/prompt-bar/store/PromptBarStoreContext.js`: `getActivePromptBarStore()`, `setActivePromptBarStore()`
4. `src/features/studio/PromptBarStoreContext.js` & `src/features/studio/index.js` (legacy studio re-exports)
5. `src/features/workflows/hooks/useMediaActions.js` (delegates to `promptBarService`)
6. `src/features/prompt-bar/model/usePromptStore.js` (delegates to `promptBarService`)

---

## 3. Metrics Before vs. After P7

| Metric | Before P7 | After P7 |
|---|---|---|
| Total Vitest Test Files | 62 passed | 68 passed |
| Total Vitest Tests | 447 passed | 473 passed |
| Prompt Bar Test Files | 33 passed | 39 passed |
| Prompt Bar Tests | 263 passed | 289 passed |
| Bare `PromptBarPlatform` usages in Pages | 4 pages | 0 pages (all use `GeneratedPromptBar`) |
| Platform lines of code | 432 lines | 432 lines |
| Render-level storage reads | 0 | 0 |
| `exhaustive-deps` disables | 0 | 0 |
| `activePromptBarStoreInstance` occurrences | 0 | 0 |

---

## 4. Manual Smoke Checklist for Human Review
1. **Route Persistence**:
   - Navigate to `/cinema-studio/<projectId>/assets`, type a prompt and attach a reference.
   - Click a collection link (`/cinema-studio/<projectId>/collection/<id>`). Verify the prompt and reference remain intact.
   - Navigate to settings or a non-allowed page (`/cinema-studio/<projectId>/settings`). Verify prompt bar resets to defaults.
2. **Generation from Pages**:
   - Test generating from `assets/page.js` and `collection/[collectionId]/page.js`.
   - Verify circular generate button triggers generation with spinner and sends correct payload.
3. **Actions Integration**:
   - In studio media grid, click **Animate** on an image. Verify bar opens in video mode with image in Start Frame.
   - Click **Add Reference**. Verify image appears in reference slot.
