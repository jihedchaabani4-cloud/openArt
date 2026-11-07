# Consolidated Optimistic Hooks & Tracker Report

**Commit:** `7d49223` (my-app) · **Tests:** 62/62 passing (+6 new tests in `consolidatedMutations.test.jsx`) · **ESLint:** 0 errors, 0 warnings.

## Overview
Replaced all remaining hand-rolled `useMutation` implementations with `useOptimisticMutation` and integrated them into the `entityTracker` (`workflowEntity` / `mediaEntity`). This closes the race condition window where standalone delete or like mutations could clobber concurrent updates, and standardizes error rollback and toast feedback.

## What Changed

| Hook / File | Role | Changes |
|---|---|---|
| `features/workflows/api/mutations/useRemoveWorkflow.js` | Remove workflow | Converted to `useOptimisticMutation`. Uses `workflowEntity(targetId)` to participate in tracker concurrency. Uses `matchWorkflowId` for prefix-safe deletion. Cascades to matching media. |
| `features/workflows/model/useWorkflowDelete.js` | Modal workflow delete | Converted inner `deleteMutation` to `useOptimisticMutation` with `workflowEntity(workflowId)`. Removes from workflows, characters, elements, and media. |
| `features/media/api/mutations/useRemoveAsset.js` | Delete asset | Converted to `useOptimisticMutation` with `mediaEntity(assetId)` tracking and workflow cascade removal. |
| `features/workflows/api/mutations/useToggleWorkflowLike.js` | Toggle workflow favorited | Converted to `useOptimisticMutation` with `workflowEntity` tracking. |
| `features/workflows/api/mutations/useToggleLike.js` | Toggle media item like | Converted to `useOptimisticMutation` with `mediaEntity` tracking. |
| `features/characters/hooks/useRemoveMediaFromCharacter.js` | Remove character media | Added `getEntityKey: ({ mediaId }) => mediaEntity(mediaId)`. |
| `shared/lib/optimistic/notifyOptimisticError.js` | Error notification | Added recursive `sanitizeLogContext` that redacts prompts, tokens, and secrets (`"[REDACTED]"`) before structured logging, strictly enforcing AGENTS.md privacy rules. |

## Verification
- **Failing-first:** All 6 tests in `consolidatedMutations.test.jsx` failed on pre-existing code and passed immediately once implemented.
- **Hermetic tests:** Full test suite executed with `npm test`: 62/62 passing across 10 test files.
- **ESLint:** 0 errors and 0 warnings on all touched files.
