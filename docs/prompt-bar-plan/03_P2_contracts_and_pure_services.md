# Phase P2: contracts and pure services (no behavior change)

> Read `00_CORE.md` completely BEFORE this file.
> Scope of THIS file: tasks C1 to C6. Do not read or start other phase files.
> Prerequisites: P0 and P1 are DONE (STATE.md). `VERDICTS.md` and `CONSUMERS.md` exist. If not, STOP and say so.

## Order of work in this session

1. C1 to C6 in order, one commit each (`pb2(C1)` ...).
2. Phase gate, acceptance test, STOP.

## Rules of this phase

- NOTHING changes for the user. Every task is behavior-preserving (loop 2.1 step 3, case b): the P0 characterization tests stay green and UNTOUCHED.
- New code is created in new files. Old code either calls the new code or stays as is. Old paths keep working (shims, PB-D-02).
- Pure modules: no React, no Next, no storage, no store imports. One comment line per exported function.
- Use REAL names found in the repo; the names below are suggestions. Place new files following the repo's folder style (suggested: `core/` for pure logic).

---

## C1: `core/parameterKeys.js` (one place for parameter-name literals)

Purpose: the literals `input_image`, `last_frame`, `images`, `start_frame`, `end_frame`, `reference_images`, `input_video`, `reference_videos`, `aspect_ratio`, `duration` are repeated across many files (the audit counts about 11 files). One constants module makes later changes safe. It does NOT solve semantic differences between models; PB-D-03 does.

Steps
1. Find every literal: `rg -n "\"(input_image|last_frame|images|start_frame|end_frame|reference_images|input_video|reference_videos)\"" src/features/prompt-bar`. Save the list in scratch.
2. Create the constants module with frozen objects: `PARAM` (names), `MEDIA_TYPES` (`image`, `image[]`, `video`, `video[]`), and `isMediaType(type)`.
3. Replace the literals ONLY inside `core/` files (`modelManagement.js`, `serialization.js`, `types.js`, `parameterState.js`, `tagsResolver.js` if present). Do NOT touch the Platform, the config file or the UI in this task (they are handled by later phases).
4. Tests: a test for `isMediaType`; the whole P0 suite stays green.

DoD: the literal list for `core/` is empty (`rg` shows only the constants module); P0 tests untouched and green.

## C2: `core/mediaRef.js` (one shape for a media value)

Purpose: today a media value can be an object, a string id, or a URL, and `getAssetId` helpers are scattered. One module answers: what is the asset id, is it persistable, are two values the same asset.

Steps
1. Find the existing helpers (`rg -n "getAssetId|extractWorkflowId|assetId" src/features/prompt-bar src/features/studio`). Read them. REUSE their logic; do not invent new rules.
2. Create `mediaRef.js` with: `getAssetId(value)`, `sameAsset(a, b)`, `isPersistableMedia(value)` (false for `File`, `Blob`, strings starting with `blob:` or `data:`, objects whose `url` starts with those; true otherwise), `describeMedia(value)` (id + kind for logs and reasons, never the URL).
3. Re-point the existing helper to the new function through a shim (old name still exported from the old file).
4. Tests: every value shape found in step 1 plus the persistability table.

DoD: tests pass; old helper names still work; V5's list of value shapes is covered by tests.

## C3: `core/commandResult.js`

Steps
1. Create `ok(patch = {}, extra = {})` returning `{ ok: true, patch, ...extra }` and `fail(reason, details = {})` returning `{ ok: false, reason, details }`.
2. Create a frozen `REASONS` object: `NOT_MOUNTED`, `PROJECT_MISMATCH`, `NO_ELIGIBLE_MODEL`, `NO_SLOT_FOR_ROLE`, `MAX_MEDIA_REACHED`, `DUPLICATE_MEDIA`, `TYPE_NOT_ALLOWED`, `UNKNOWN_MODEL`, `INVALID_ARGUMENT`.
3. Tests: shapes are exact; `REASONS` is frozen; `fail` with an unknown reason throws in test mode (use the repo's convention for dev-only assertions) or is rejected by a documented rule.

DoD: tests pass; module has no imports.

## C4: `core/templateContract.js` and the generated-media template object

Purpose: one object per template, validated, instead of "type file + config file + props passed by hand".

Steps
1. Define the contract in one JSDoc block at the top of the file:
   - `id` (string, required), `persistRoutes` (array of route patterns, optional, default `[]`), `layout` (the flags of `createPromptBarType`), `features: { models: boolean, modes: boolean }` (default both true), `defaultState` (partial: mode, sub-mode), `getSlots(mode, subMode, model)`, `filterEligibleModels(models, mode, subMode, parameterValues)`, `resolveParameterMapping(model, role)`, `createActions(core)` (optional; used in P5).
2. `defineTemplate(def)`: validates (throws an Error with ALL problems listed, not just the first), freezes, fills defaults.
3. Create `templates/generatedMedia.template.js` that BUILDS the template from the EXISTING `generatedMediaType` and `generatedMediaConfig` (compose; do not move their code and do not change those two files). `getSlots` wraps `COMPOSITION_REQUIREMENTS` exactly as the Platform derives slots today (read Platform lines about 282 to 306 first; the derivation that depends on the model capability stays in the Platform until C5).
4. Tests: valid template passes; each missing or wrong field gives a clear message; result is frozen; `generatedMedia.template` validates and its `filterEligibleModels` / `resolveParameterMapping` give the same results as the config for the SAFE-2 tables.

DoD: nothing imports the new template yet (wrappers come in P7); tests pass.

## C5: `core/media.js` part 1: slots and limits (pure functions)

Extract from `PromptBarPlatform.jsx` the READ-ONLY computations (the audit points at about lines 280 to 319 for slots and 537 to 600 for max refs).

Steps
1. Read those blocks fully. Write in scratch the inputs each one uses (mode, sub-mode, model, template config, current parameter values).
2. Create pure functions in `core/media.js` (names are suggestions): `getActiveSlots({ template, mode, subMode, model })`, `getSlotMaxRefs({ slot, model, parameterDef })`, `getModelReferenceCapability(model)` (if it lives elsewhere, REUSE it and re-export).
3. Characterization-first: add unit tests of the new functions using the SAME vectors the Platform currently produces (frames model gives Start and End; images-list model in reference mode gives one multi slot with max 14; prompt-only model gives zero slots). Compare with what SAFE-5 shows.
4. Make the Platform call the new functions in place of its inline code (one `useMemo` at a time). The JSX must not change.

DoD: Platform lines drop (write before and after in the report); SAFE tests green and untouched; new unit tests pass.

## C6: `core/media.js` part 2: quota and allowed types

Extract the quota computations (the audit points at about lines 835 to 889: used count, remaining quota, allowed media type per slot) and the "can this media be added?" decision.

Steps
1. Same method as C5. Functions: `countUsedRefs(parameterValues, slots, entities)`, `remainingQuota({ model, used })`, `allowedTypeForSlot({ mode, slot })`, `canAttach({ model, slot, value, used, existing })` returning `ok()` or `fail(REASONS.MAX_MEDIA_REACHED | DUPLICATE_MEDIA | TYPE_NOT_ALLOWED)` using C3.
2. Dedupe rule: REUSE what `entityService.canAddReference` does today (same-asset detection); do not change it.
3. Tests: limit exactly at max, one below, one above; duplicates; video into an image-only slot; entities counted in the quota the way the Platform counts them today.
4. Platform calls the new functions; same JSX.

DoD: Platform lines drop again; SAFE tests green and untouched; new tests pass; `core/media.js` has no React import (`rg -n "from \"react" core/media.js` empty).

---

## Phase end: gate and acceptance test

1. Run the phase gate (`00_CORE.md` section 10).
2. Acceptance test; paste into `docs/prompt-bar-plan/reports/PHASE-P2-GATE.md`:

| # | Check |
|---|---|
| 1 | `git diff --stat <phase start>..HEAD -- tests/` shows NO edit of P0 test files (only new files). |
| 2 | Full `npm test` passes; P0 tests unchanged. |
| 3 | `rg -n "from \"(react|next)" src/features/prompt-bar/core` prints only files that already imported React before this phase (list them; target: only `useRealBackendModels.js`, handled in T6). |
| 4 | Literal check from C1 is empty for `core/` except the constants module. |
| 5 | `PromptBarPlatform.jsx` line count before and after is in the report. |
| 6 | Smoke checklist items 1 to 5 of `HUMAN_GUIDE.md` section 6 are listed as NOT-RUN for the human (the agent has no browser). |

3. Write the gate report, update STATE.md with `Next step: P3 (human gives you 04_P3_store_lifecycle.md)`, print a summary (max 15 lines) and STOP.
