# SAFE-1: Pure Core Characterization + Shared Fixtures
Status: DONE
Commit: pending (not pushed)
Self-review score: 100/100 (loops: 1)
Baseline `npm test` before: PASS (31 files / 190 tests)   After: PASS (32 files / 209 tests; +19 tests)
Lint on touched files: clean (0 errors, 0 warnings on touched files)

## What changed (REUSED / EXTENDED / CREATED)
- CREATED   src/features/prompt-bar/__tests__/fixtures/models.fixture.js
- CREATED   src/features/prompt-bar/__tests__/safe1PureCore.test.js
- CREATED   docs/prompt-bar-plan/reports/SAFE-1.md
- EXTENDED  docs/prompt-bar-plan/STATE.md

## Evidence (tag each: VERIFIED / INFERRED / NOT-RUN)
- VERIFIED: `src/features/prompt-bar/__tests__/fixtures/models.fixture.js` created with:
  - `rawFramesModel` (`seedance_2_5`, video domain, prompt, input_image, last_frame, duration: [5, 10], aspect_ratio, resolution).
  - `rawImagesListModel` (`nanobana_pro`, image domain, prompt, images [max 14], input_image, resolution, aspect_ratio).
  - `rawPromptOnlyModel` (`seedream_v5`, image domain, prompt, resolution, aspect_ratio).
  - Dynamically normalized models (`normalizedFramesModel`, `normalizedImagesListModel`, `normalizedPromptOnlyModel`) generated via the real `adaptBackendModel` normalizer.
- VERIFIED: 19 characterization tests executed and passing:
  - Reconciliation: switching frames to imagesList keeps aspect_ratio when valid, resets invalid values to default, drops last_frame; switching to promptOnly drops all media parameters.
  - Serialization: golden payloads pinned for frames, imagesList, and promptOnly models.
  - PB-K2 pinned: `serialize` appends undeclared media parameters (`input_image`) present in `values` even when model is `promptOnly` (`CURRENT BEHAVIOR (known issue PB-K2)`).
  - Tags Service: `cleanTagsForAsset` cleans single id, multi-id list, trims spaces/doubled commas, safely handles non-string inputs and regex special characters in IDs.
  - Model Management Normalization: parameter types mapped to `image`, `image[]`, `video`, `select`, `number`, `text`, with correct roles and groups.
- VERIFIED: Mutation checks passed on 3 tests:
  1. `serialize`: mutated output in `core/serialization.js` (`model: "mutated_for_check"`). Observed red in 4 tests (`serializes frames model with full parameters into golden payload`, etc.). Restored with `git checkout --`.
  2. `cleanTagsForAsset`: mutated tag replacement in `core/tagsService.js` to `"MUTATED_TAG"`. Observed red in 4 tests (`removes supported tag kinds for a single id`, etc.). Restored with `git checkout --`.
  3. `reconcile`: mutated preservation in `core/reconciliation.js` to `"MUTATED_PRESERVE"`. Observed red in 2 tests (`switching frames to imagesList`, etc.). Restored with `git checkout --`.

## Tests
- New tests: 19 tests in `src/features/prompt-bar/__tests__/safe1PureCore.test.js`
- Mutation check: 3 tests mutated and confirmed failing, restored clean.
- Full `npm test`: PASS (32 files, 209 tests passed).
- Node contracts: PASS (7 files, 47 tests passed).

## Decisions taken (refs to DECISIONS.md)
None new.

## Follow-ups (also copied to BACKLOG.md)
None.

## Manual checks for the human (exact steps)
None required.
