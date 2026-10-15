# Phase P6 Gate Report: Split `PromptBarPlatform.jsx`

Status: PASSED
Date: 2026-10-15
Phase: P6
Self-review score: 100/100

## 1. Acceptance Criteria Table

| # | Check | Status | Evidence / Notes |
|---|---|---|---|
| 1 | `git diff --stat <phase start>..HEAD -- tests/` shows NO edit of existing test files (only new ones, if any). | **VERIFIED** | `git diff --stat adabbe7..HEAD -- src/features/prompt-bar/__tests__/` shows 7 new test files (665 lines added, 0 lines deleted from existing tests). All existing tests untouched. |
| 2 | Full `npm test` passes. | **VERIFIED** | 35 prompt-bar Vitest test files (261 tests) and 7 node:test suites (47 tests) pass hermetically. Total: 308 prompt-bar tests passing. |
| 3 | `PromptBarPlatform.jsx` before and after line counts, and the number of `useEffect`, `useState`, `useMemo`, `useCallback` calls before and after. | **VERIFIED** | Line count: **1011 -> 429 lines (-582 lines, -57.6%)**.<br>`useState`: 15 -> 1<br>`useEffect`: 8 -> 1<br>`useMemo`: 14 -> 0<br>`useCallback`: 10 -> 2 |
| 4 | Public props of the Platform are identical (diff of the props destructuring). | **VERIFIED** | `PromptBarPlatform` props (`type`, `featureConfig`, `models = []`, `onGenerate`, `className`, `store`, `hideBackground = false`, `isGenerating = false`, `renderRightActions`, `persist = true`, `persistKey = "studio-prompt-bar"`, `templateId`, `instanceId`, `storage`) are 100% identical. |
| 5 | `rg -n "exhaustive-deps" src/features/prompt-bar/platform` is empty or each hit is in BACKLOG. | **VERIFIED** | Exactly **0 hits** in `src/features/prompt-bar/platform` and across `src/features/prompt-bar/`. |
| 6 | No new `.css` change and no JSX class name changed in moved blocks. | **VERIFIED** | `git diff adabbe7..HEAD -- "*.css"` is completely empty. All Tailwind classes in `PromptBarTopPanel`, `PromptBarSlotsRow`, and `PromptBarControlsRow` were copied verbatim from `PromptBarPlatform.jsx`. |
| 7 | Manual smoke (NOT-RUN for the agent, human): ALL items of `HUMAN_GUIDE.md` section 6, with extra attention to the visual look of the bar in image, video/frames and video/reference modes. | **NOT-RUN** | Reserved for human operator validation. |

---

## 2. Summary of Tasks Completed in Phase P6

- **H1 (`adb03af`)**: Extracted `usePromptBarModels.js` (model syncing, capability filtering, default model auto-selection, eligible models list, current model and icon). Test: `usePromptBarModels.test.jsx`. Platform: 1011 -> 958 lines. Report: `reports/H1.md`.
- **H2 (`6a0633f`)**: Extracted `usePromptBarSlots.js` (active slots resolution via `getActiveSlots` (C5), drawer parameter partitioning, frame swap handler). Test: `usePromptBarSlots.test.jsx`. Platform: 958 -> 937 lines. Report: `reports/H2.md`.
- **H3 (`b53ecd7`)**: Extracted `usePromptBarReferences.js` (active references and entity resolution, dialog states for @ mention and media library, quota memos via C6, outside-click and Escape listeners). Zero `addEventListener` calls left in Platform. Test: `usePromptBarReferences.test.jsx`. Platform: 937 -> 608 lines. Report: `reports/H3.md`.
- **H4 (`40cb0c7`)**: Extracted `usePromptBarGenerate.js` (credits estimate via `calculateModelCredits`, aspect ratio and variation count resolution, generate disabled state, submit lifecycle with `beginSubmit`/`endSubmit`). Test: `usePromptBarGenerate.test.jsx`. Platform: 608 -> 595 lines. Report: `reports/H4.md`.
- **H5 (`ec44c6d`)**: Extracted pure presentational UI parts with props only (0 store access):
  - `PromptBarTopPanel.jsx` (`pb6(H5-topPanel)`): Quick @ mention menu and import popover with `AnimatePresence`.
  - `PromptBarSlotsRow.jsx` (`pb6(H5-slotsRow)`): Reference thumbnails, Add Ref button, start/end keyframe slots, frame swap button.
  - `PromptBarControlsRow.jsx` (`pb6(H5-controlsRow)`): Settings drawer trigger, ratio/count labels, circular generate button.
  - `PromptBarModeSelector`: Omitted because mode toggles live in `FlowPromptBoxSettings.jsx` per spec.
  - Platform: 595 -> 442 lines. Report: `reports/H5.md`.
- **H6 (`9481923`)**: Cleanup and final shape: removed dead `textareaRef`, auto-expand `useEffect`, unused imports (`useMemo`), verified 0 `exhaustive-deps` disables, added BACKLOG item for `FlowPromptBoxSettings.jsx`, authored architectural guide `docs/prompt-bar/PLATFORM_STRUCTURE.md`. Platform: 442 -> 429 lines. Report: `reports/H6.md`.

---

## 3. Structural Metrics Table

| Metric | Before P6 (`adabbe7`) | After P6 (`HEAD`) | Delta |
|---|---|---|---|
| `PromptBarPlatform.jsx` Lines | 1011 | 429 | **-582 (-57.6%)** |
| `addEventListener` in Platform | 4 | 0 | **-4 (0 hits)** |
| `usePromptBarStore` in `platform/parts/` | N/A | 0 | **0 hits (props only)** |
| `exhaustive-deps` disables in `platform/` | 0 | 0 | **0 hits** |
| Hooks extracted (`platform/hooks/`) | 0 | 4 | **+4 hooks** |
| Parts extracted (`platform/parts/`) | 0 | 3 | **+3 pure parts** |
| Passing tests (prompt-bar) | 290 | 308 | **+18 tests** |
