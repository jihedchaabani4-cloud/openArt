# SETUP-1: Baseline, Folders, AGENTS.md
Status: DONE
Commit: pending (not pushed)
Self-review score: 100/100 (loops: 1)
Baseline `npm test` before: PASS (31 files / 190 tests in Vitest; 7 files / 47 tests in node:test; total 53 prompt-bar tests)   After: PASS (same)
Lint on touched files: clean (0 new warnings/errors; 1 pre-existing error in MediaGridItem.jsx:294, 236 warnings in repo)
Build baseline: PASS (`npm run build` succeeded with exit code 0)

## What changed (REUSED / EXTENDED / CREATED)
- CREATED   AGENTS.md (in frontend root `my-app/` with Prompt bar plan rules)
- EXTENDED  ../AGENTS.md (added Prompt bar plan rules above Spec Kit markers in workspace root)
- CREATED   docs/prompt-bar-plan/STATE.md
- CREATED   docs/prompt-bar-plan/DECISIONS.md
- CREATED   docs/prompt-bar-plan/BACKLOG.md
- CREATED   docs/prompt-bar-plan/reports/
- CREATED   docs/prompt-bar-plan/escalations/
- CREATED   docs/prompt-bar-plan/scratch/
- EXTENDED  .git/info/exclude (excluded `docs/prompt-bar-plan/scratch/`)
- CREATED   docs/prompt-bar-plan/reports/SETUP-1.md

## Evidence (tag each: VERIFIED / INFERRED / NOT-RUN)
- VERIFIED: `src/features/prompt-bar/` exists and `package.json` defines a Next.js 16.2.1 app with React 19.2.3.
- VERIFIED: Inventory comparison:
  - Audit estimates: ~36 source files, `PromptBarPlatform.jsx` ~1239 lines, `createPromptBarStore.js` ~333 lines, `PromptBarStoreContext.js` ~181 lines.
  - Actual repo counts: 61 tracked files in `src/features/prompt-bar/` (9 test files, 52 source files including Lexical editor components), `PromptBarPlatform.jsx` is 1112 lines, `createPromptBarStore.js` is 289 lines, `PromptBarStoreContext.js` is 153 lines. Recorded in DECISIONS.md (PB-D-21).
- VERIFIED: Test baselines:
  - `npm test` (Vitest): 31 test files, 190 tests passed (including 2 prompt-bar test files: `PromptBarLayout.test.jsx`, `promptBarPersistence.test.jsx` = 6 tests).
  - `node --test` (Node test runner): 7 prompt-bar test files (`creditCalculationService`, `entityContract`, `layoutContract`, `libraryExclusionContract`, `ltxClientContract`, `modelEligibilityContract`, `tagsContract`), 47 tests passed.
  - Total prompt-bar tests: 9 files, 53 tests passed (exact match with audit).
- VERIFIED: Lint baseline: 237 problems (1 pre-existing error in `MediaGridItem.jsx:294` conditional hook call, 236 warnings, 0 errors/warnings in `features/prompt-bar/`).
- VERIFIED: Build baseline: `npm run build` succeeds (Turbopack production build, exit code 0).
- VERIFIED: Scratch directory exclusion: `docs/prompt-bar-plan/scratch/` added to `.git/info/exclude`.

## Existing Test Conventions
Based on inspection of `promptBarPersistence.test.jsx`, `tagsContract.test.mjs`, and `modelEligibilityContract.test.mjs`:
1. **Folder structure**:
   All prompt-bar tests reside in `src/features/prompt-bar/__tests__/`.
2. **Test Styles**:
   - **Pure Logic & Contracts (`*.test.mjs`)**:
     Uses native ESM Node test runner (`node:test`) and strict assertions (`node:assert/strict`).
     Imports pure functions and models directly from `../core/`, `../composition/`, `../features/`.
     No React, no DOM, no mocked environment needed.
   - **React Components & Integration (`*.test.jsx`)**:
     Uses `vitest` (`describe`, `it`, `expect`, `beforeEach`, `vi`) and `@testing-library/react` (`render`, `act`).
     Runs in `jsdom` environment.
     Mocks: Clears `window.sessionStorage` and calls `clearPersistentPromptBarStores()` in `beforeEach`.
     If `next/navigation` mocking is required, uses `vi.mock("next/navigation", ...)` returning `{ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/cinema-studio/proj-1" }`.
     Store interaction: accesses state and triggers actions through `store.getState()` captured from provider or hook.

## Tests
- Baseline test run verified: 190 passed in Vitest, 47 passed in node:test.
- All tests green before and after setup.

## Decisions taken (refs to DECISIONS.md)
- PB-D-01 to PB-D-20: Seed table copied as default rules.
- PB-D-21: Inventory count and line number drift recorded; repo facts win over audit estimations.

## Follow-ups (also copied to BACKLOG.md)
- Pre-existing lint error in `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:294` logged to BACKLOG.md.

## Manual checks for the human (exact steps)
None required for SETUP-1.
