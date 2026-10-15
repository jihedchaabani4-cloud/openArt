# SAFE-4: Registry, Key and Persistence Characterization
Status: DONE
Commit: pending (not pushed)
Self-review score: 100/100 (loops: 1)
Baseline `npm test` before: PASS (34 files / 259 tests)   After: PASS (35 files / 267 tests; +8 tests)
Lint on touched files: clean (0 errors, 0 warnings on touched files)

## What changed (REUSED / EXTENDED / CREATED)
- CREATED   src/features/prompt-bar/__tests__/safe4Persistence.test.jsx
- CREATED   docs/prompt-bar-plan/reports/SAFE-4.md
- EXTENDED  docs/prompt-bar-plan/STATE.md
- REUSED    src/features/prompt-bar/__tests__/fixtures/models.fixture.js
- REUSED    src/features/prompt-bar/__tests__/promptBarPersistence.test.jsx (untouched)

## Evidence (tag each: VERIFIED / INFERRED / NOT-RUN)
- VERIFIED: 8 characterization tests executed and passing:
  - Key formatting: formats as `<persistKey>_<projectId>` on project routes (`/cinema-studio/project_xyz`) and `<persistKey>_global` on non-project routes.
  - In-memory registry: same effective key reuses exact store instance across unmount/remount; different project IDs create isolated store instances.
  - Saved subset: sessionStorage contains only `prompt`, `selectedModelId`, `parameterValues`, `elements`, `characters`, `activeMode`, `activeSubMode`. Transient fields (`isGenerating`, `modelsMap`, `reconciliationLog`, `validationErrors`, `lastSerializedRequest`) are not saved.
  - Corrupted storage: invalid JSON in sessionStorage is caught safely by try/catch and starts with model defaults without crashing.
  - PB-K4a pinned: module-level `activePromptBarStoreInstance` is overwritten by whichever provider renders last (`CURRENT BEHAVIOR (known issue PB-K4a)`).
  - PB-K4b pinned: `blob:` URLs in `parameterValues` are written to sessionStorage as-is without sanitization (`CURRENT BEHAVIOR (known issue PB-K4b)`).
- VERIFIED: Mutation checks passed on 3 tests:
  1. Key formatting: mutated `effectiveKey` in `PromptBarStoreContext.js` line 98 to `"MUTATED_KEY"`. Observed 6 test failures in `safe4Persistence.test.jsx`. Restored with `git checkout --`.
  2. Saved subset: mutated `prompt` in `saveState` payload (`PromptBarStoreContext.js` line 66) to `"MUTATED_SAVED_PROMPT"`. Observed 3 test failures. Restored with `git checkout --`.
  3. Active store overwrite (PB-K4a): commented out `setActivePromptBarStore` calls in `PromptBarStoreContext.js`. Observed test failure in `pins PB-K4a`. Restored with `git checkout --`.

## Tests
- New tests: 8 tests in `src/features/prompt-bar/__tests__/safe4Persistence.test.jsx`
- Mutation check: 3 tests mutated, verified red, restored clean.
- Full `npm test`: PASS (35 files, 267 tests passed).
- Node contracts: PASS (7 files, 47 tests passed).

## Decisions taken (refs to DECISIONS.md)
None new.

## Follow-ups (also copied to BACKLOG.md)
None.

## Manual checks for the human (exact steps)
None required.
