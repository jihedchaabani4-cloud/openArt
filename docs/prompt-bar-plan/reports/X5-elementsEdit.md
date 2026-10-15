# X5: Migrate ElementWorkflowEditPage from usePromptStore to promptBarService
Status: DONE
Commit: pending (not pushed)
Self-review score: 100/100 (loops: 1)
Baseline `npm test` before: PASS (56 files / 425 tests in Vitest; 7 files / 47 tests in node:test)   After: PASS (57 files / 427 tests in Vitest; 7 files / 47 tests in node:test)
Platform lines: 1005 lines
Exhaustive-deps count: 0 (clean)
Lint on touched files: clean (0 new errors, 0 new warnings)

## What changed (REUSED / EXTENDED / CREATED)
- EXTENDED  `src/features/workflows/model/elementSheetConfig.js`:
  - Added pure helper `syncElementDraft(draft, { elementStore, projectId, serviceFactory })` to synchronize element drafts into `elementStore` traits and dispatch `applyGeneration` settings to `promptBarService`.
- EXTENDED  `src/app/cinema-studio/[projectId]/elements/edit/[workflowId]/page.js`:
  - Migrated from legacy `usePromptStore` (`setGenerationMode`, `setModelId`, `setRatio`, `setQuality`, `setVideoResolution`) to `syncElementDraft`.
  - Removed `usePromptStore` import and hook subscriptions entirely.
- CREATED   `src/features/prompt-bar/__tests__/elementEditMigration.test.jsx`:
  - Unit tests for `syncElementDraft` verifying that draft parameters (`modelId`, `ratio`, `aspect_ratio`, `quality`, `videoResolution`) are passed through `promptBarService.applyGeneration(...)` with correct project scoping.
  - Verifies that `elementStore.resetElementStore` is invoked when `draft` is null.

## Evidence (tag each: VERIFIED / INFERRED / NOT-RUN)
- VERIFIED: `src/app/cinema-studio/[projectId]/elements/edit/[workflowId]/page.js` has 0 references to `usePromptStore`.
- VERIFIED: Readers of duplicated generation/prompt fields across `src/` is now 0 (only KEEP drag-and-drop state remains in `usePromptStore`).
- VERIFIED: All tests in `src/features/prompt-bar/__tests__/elementEditMigration.test.jsx` pass.
- VERIFIED: Full hermetic test suite passes: 427 Vitest tests across 57 test files, 47 node:test tests across 7 test files.

## Tests
- `src/features/prompt-bar/__tests__/elementEditMigration.test.jsx`:
  - `syncs draft to elementStore and dispatches applyGeneration through promptBarService`
  - `resets elementStore when draft is null`

## Decisions taken (refs to DECISIONS.md)
- Followed PB-D-16 and PB-D-17: Isolated form loader in `elements/edit` now dispatches generation parameters via `promptBarService` rather than mutating legacy global store.

## Follow-ups (also copied to BACKLOG.md)
- Next: Task X6: remove dead legacy fields from `usePromptStore.js` and write `docs/prompt-bar/EXTERNAL_ACTIONS.md`.

## Manual checks for the human (exact steps)
Navigating to the element edit page preserves turnaround draft in `elementStore` and queues/sets prompt bar parameters via `promptBarService`.
