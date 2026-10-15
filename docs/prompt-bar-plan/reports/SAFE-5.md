# SAFE-5: Platform Integration Harness & Characterization
Status: DONE
Commit: pending (not pushed)
Self-review score: 100/100 (loops: 1)
Baseline `npm test` before: PASS (35 files / 267 tests)   After: PASS (36 files / 273 tests; +6 tests)
Lint on touched files: clean (0 errors, 0 warnings on touched files)

## What changed (REUSED / EXTENDED / CREATED)
- CREATED   src/features/prompt-bar/__tests__/safe5Platform.test.jsx
- CREATED   docs/prompt-bar-plan/reports/SAFE-5.md
- EXTENDED  docs/prompt-bar-plan/STATE.md
- REUSED    src/features/prompt-bar/platform/PromptBarPlatform.jsx (untouched)
- REUSED    src/features/prompt-bar/__tests__/fixtures/models.fixture.js (untouched)

## Evidence (tag each: VERIFIED / INFERRED / NOT-RUN)
- VERIFIED: Test harness helper `mountPromptBar({ models, type, featureConfig, projectId, isGenerating, onGenerate })` implemented and documented in one JSDoc comment block. Mounts real `PromptBarPlatform` with real store, real config, and shared fixture models, mocking only `next/navigation` and Lexical `PromptEditor`.
- VERIFIED: 6 integration characterization tests executed and passing:
  1. Mode and SubMode slot rendering:
     - Image mode renders one Reference slot (`"Ref"`), 0 Start/End slots.
     - Video mode / frames subMode renders Start and End slots (`"Start"`, `"End"`), 0 Ref slots.
     - Video mode / reference subMode renders one Reference slot (`"Ref"`), 0 Start/End slots.
  2. Generate execution with golden payload:
     - Frames model with `input_image` and `last_frame` populated calls `onGenerate` once with the exact golden payload established in SAFE-1.
  3. Frames to Reference mode-switch cleanup:
     - Switching from Frames to Reference clears `last_frame` and `input_image` via mode-switch cleanup effect.
  4. PB-K1 pinned (`CURRENT BEHAVIOR (known issue PB-K1)`):
     - Reference stored in `input_image` in image mode survives transition to video/frames as Start Frame because the frames model also declares `input_image`.
  5. Prompt-only model hiding:
     - Prompt-only model hides all reference slots (`Ref`, `Start`, `End` absent from DOM).
  6. Disabled Generate on `isGenerating`:
     - Generate button is disabled while `isGenerating: true` and clicking it does not call `onGenerate`.
- VERIFIED: Mutation checks passed on 3 tests:
  1. Generate disabled check: mutated `isGenerateDisabled` in `PromptBarPlatform.jsx` to ignore `isGenerating`. Observed failure in test 6 (`expected true, received false`). Restored with `git checkout --`.
  2. Golden payload check: mutated `onGenerate(requestPayload)` in `PromptBarPlatform.jsx` to append `{ mutated: true }`. Observed failure in test 2 (payload mismatch). Restored with `git checkout --`.
  3. Mode cleanup check: commented out parameter cleanup in mode transition effect (`PromptBarPlatform.jsx`). Observed failure in test 3 (`input_image` was not undefined). Restored with `git checkout --`.

## Tests
- New tests: 6 tests in `src/features/prompt-bar/__tests__/safe5Platform.test.jsx`
- Mutation check: 3 tests mutated, verified red, restored clean.
- Full `npm test`: PASS (36 files, 273 tests passed).
- Node contracts: PASS (7 files, 47 tests passed).

## Decisions taken (refs to DECISIONS.md)
None new.

## Follow-ups (also copied to BACKLOG.md)
None.

## Manual checks for the human (exact steps)
None required.
