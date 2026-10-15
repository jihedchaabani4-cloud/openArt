# SAFE-3: Store Characterization (Vanilla Store)
Status: DONE
Commit: pending (not pushed)
Self-review score: 100/100 (loops: 1)
Baseline `npm test` before: PASS (33 files / 246 tests)   After: PASS (34 files / 259 tests; +13 tests)
Lint on touched files: clean (0 errors, 0 warnings on touched files)

## What changed (REUSED / EXTENDED / CREATED)
- CREATED   src/features/prompt-bar/__tests__/safe3Store.test.js
- CREATED   docs/prompt-bar-plan/reports/SAFE-3.md
- EXTENDED  docs/prompt-bar-plan/STATE.md
- REUSED    src/features/prompt-bar/__tests__/fixtures/models.fixture.js

## Evidence (tag each: VERIFIED / INFERRED / NOT-RUN)
- VERIFIED: 13 characterization tests executed and passing:
  - `setModels`: defaults to first model and model parameter defaults when null; preserves initial selectedModelId and existing parameter values when valid.
  - `selectModel` (frames -> imagesList): parameter reconciliation, non-empty `reconciliationLog`, and cleans dropped media prompt tags.
  - PB-K3 pinned: when switching to a model with lower `maxRefs`, the store on its own trims excess references from `parameterValues` and cleans their tags from `prompt` (`CURRENT BEHAVIOR (known issue PB-K3)`).
  - CRUD operations: `setParameter`, `setPrompt`, `addElement`/`removeElement` (cascades tag cleanup), `addCharacter`/`removeCharacter` (cascades tag cleanup), `clearEntities`, `clearMediaReferences` (cascades tag cleanup), `reset` (restores model defaults), and `serialize` (records `lastSerializedRequest`).
  - `setIsGenerating`: isolated mutation of `isGenerating` flag without altering prompt or parameterValues.
- VERIFIED: Mutation checks passed on 3 tests:
  1. `setIsGenerating`: mutated setter in `createPromptBarStore.js` line 229 to `isGenerating: !isGenerating`. Verified test failure in `only modifies isGenerating without altering prompt or parameterValues`. Restored with `git checkout --`.
  2. `selectModel` reference trimming (PB-K3): mutated trimming assignment in `createPromptBarStore.js` line 188 to `nextValues[targetKey] = []`. Verified test failure in `pins PB-K3: store trims excess references and cleans orphan prompt tags`. Restored with `git checkout --`.
  3. `reset`: mutated reset prompt in `createPromptBarStore.js` line 322 to `"MUTATED_RESET"`. Verified test failure in `resets prompt, parameters, entities, and logs to model defaults with reset`. Restored with `git checkout --`.

## Tests
- New tests: 13 tests in `src/features/prompt-bar/__tests__/safe3Store.test.js`
- Mutation check: 3 tests mutated, verified red, restored clean.
- Full `npm test`: PASS (34 files, 259 tests passed).
- Node contracts: PASS (7 files, 47 tests passed).

## Decisions taken (refs to DECISIONS.md)
None new.

## Follow-ups (also copied to BACKLOG.md)
None.

## Manual checks for the human (exact steps)
None required.
