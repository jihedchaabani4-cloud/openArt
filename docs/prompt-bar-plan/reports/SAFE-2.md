# SAFE-2: Template Rules Characterization
Status: DONE
Commit: pending (not pushed)
Self-review score: 100/100 (loops: 1)
Baseline `npm test` before: PASS (32 files / 209 tests)   After: PASS (33 files / 246 tests; +37 tests)
Lint on touched files: clean (0 errors, 0 warnings on touched files)

## What changed (REUSED / EXTENDED / CREATED)
- CREATED   src/features/prompt-bar/__tests__/safe2TemplateRules.test.js
- CREATED   docs/prompt-bar-plan/reports/SAFE-2.md
- EXTENDED  docs/prompt-bar-plan/STATE.md
- REUSED    src/features/prompt-bar/__tests__/fixtures/models.fixture.js

## Evidence (tag each: VERIFIED / INFERRED / NOT-RUN)
- VERIFIED: 37 characterization tests executed and passing:
  - `resolveParameterMapping`: 24 table test cases covering 6 model definitions (`seedance_2_5`, `nanobana_pro`, `seedream_v5`, `model_start_frame`, `model_last_image`, `model_ref_images`) across 4 roles (`start`, `end`, `reference`, `unknown`).
  - PB-K1 pinned: image-domain model declaring `input_image` maps both `start` and `reference` to `input_image` (`CURRENT BEHAVIOR (known issue PB-K1)`).
  - `filterEligibleModels`: dynamically returns image models when empty; narrows to reference-capable models when references attached; filters frame models on `video/frames`; verifies argument list isolation.
  - `COMPOSITION_REQUIREMENTS`: exact slot requirements pinned for `image`, `video.frames`, and `video.reference`.
  - `createPromptBarType`: verifies deeply frozen object return, requires `config.id`, and pins layout configs for `generatedMediaType` and `characterType`.
- VERIFIED: Mutation checks passed on 2 tests:
  1. `filterEligibleModels`: mutated `videoDomainModels.filter(isFrameModel)` in `generatedMedia.config.js` line 113 to `() => false`. Verified test failure in `returns only frame models for video mode with frames subMode`. Restored with `git checkout --`.
  2. `resolveParameterMapping`: mutated `return "input_image"` in `generatedMedia.config.js` line 142 to `"mutated_input_image"`. Verified 3 test failures (`maps role "start" for model "seedance_2_5"`, `maps role "start" for model "nanobana_pro"`, and PB-K1 test). Restored with `git checkout --`.

## Tests
- New tests: 37 tests in `src/features/prompt-bar/__tests__/safe2TemplateRules.test.js`
- Mutation check: 2 tests mutated, verified red, restored clean.
- Full `npm test`: PASS (33 files, 246 tests passed).
- Node contracts: PASS (7 files, 47 tests passed).

## Decisions taken (refs to DECISIONS.md)
None new.

## Follow-ups (also copied to BACKLOG.md)
None.

## Manual checks for the human (exact steps)
None required.
