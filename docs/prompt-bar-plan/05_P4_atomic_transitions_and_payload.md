# Phase P4: atomic transitions, payload contract, media commands

> Read `00_CORE.md` completely BEFORE this file.
> Scope of THIS file: tasks T1 to T6. Do not read or start other phase files.
> Prerequisites: P3 is DONE (STATE.md), and the human wrote "CONFIRMED" (or an edited line) for decision PB-D-03 in `DECISIONS.md`. If PB-D-03 is not confirmed, STOP and say so. Read `VERDICTS.md` (rows: Animate relies on carry-over; backend ignores undeclared parameters).

## Order of work in this session

1. T1 to T6 in order, one commit each (`pb4(T1)` ...).
2. Phase gate, acceptance test, STOP.

## Goal in plain words

Changing the mode or the model is ONE operation that produces ONE new state: the new mode, the right model, the media that survive, the prompt without the tags of removed media. It happens inside the store through a pure command, not in an effect after render. The payload sent to the backend respects the model's declared parameters. Attaching and removing media are commands too, so the future service (P5) and the UI use the same code.

Read PB-D-03 now and follow the line in DECISIONS.md (the version of the human wins over the seed).

## Shared design (use in T3 to T5)

- Commands are pure functions in `store/commands/` (or the repo's equivalent): `(state, args, deps) => CommandResult` (from C3). `deps` is `{ template, models }`: the template object (from C4 or the config pair), and the normalized models map. A command never calls `set`, never reads storage, never touches the DOM.
- The store receives `deps` at creation time through a SECOND argument: `createPromptBarStore(initialConfig, deps = {})`. Old callers that pass one argument keep working. The registry factory (S1/S3) passes the template.
- The store wrapper: `switchMode: (mode, subMode) => { const r = switchModeCommand(get(), {mode, subMode}, deps); if (r.ok) set(r.patch); return r; }`. ONE `set` per user intention.

---

## T1: serialization contract (PB-D-12)

Steps
1. Read V3 in `VERDICTS.md`. If verdict B (not safe), implement the "smallest rule" it proposes instead of the default and log a decision.
2. Failing tests first on `core/serialization.js` (golden payloads from SAFE-1, plus new cases):
   - state holds `input_image` and `last_frame`, selected model is `promptOnly`: payload `parameters` has NEITHER (changes the PB-K2 test on purpose; update that one test and name the card in the report).
   - state holds a stale `images` while the model declares only `input_image`: `images` is not in the payload.
   - media values still produce the same `references` array as today for supported models (golden).
   - `elements` and `characters` contract fields unchanged.
3. Implement: the loop that appends media parameters from state only emits keys the model declares. Keep everything else byte-identical.

DoD: tests pass; SAFE-1 golden payloads for the three models unchanged; the PB-K2 test updated on purpose.

## T2: `pruneMedia` (pure, in `core/media.js`)

Signature suggestion: `pruneMedia({ parameterValues, prevModel, nextModel, reason })` where `reason` is `"mode-change"` or `"model-change"`. Returns `{ parameterValues, removed: [{ key, assetIds }] }`.

Rules (PB-D-03, using the human's edited line if any)
- `mode-change`: remove every parameter whose declared type is a media type (`isMediaType`, C1) in EITHER the previous or the next model. Do this by declared type, NOT by a hard-coded list of key names.
- `model-change` (same mode): keep a media parameter only if the next model declares the same key with a compatible type (`image` stays `image`, `image[]` stays `image[]`); trim lists to the next model's max; drop everything else.
- Collect the asset ids of everything removed (`getAssetId`, C2) so tags can be cleaned.
- Non-media parameters are untouched here (reconciliation handles them).

Tests: matrix of reasons x the three fixture models x filled/empty states; list trimming; the `input_image` collision case (image mode reference then video/frames gives NO `input_image`); asset ids returned for removed values; a value of another type is untouched.

DoD: tests pass; the function has no imports from React or the store.

## T3: `switchMode` command and store action

Steps
1. Failing tests first on a store created with the registry factory and the generated-media template (store level, no React):
   - image to video/frames with a filled reference: new mode, a frames-capable model selected (the current one if eligible, else the first eligible), `input_image` absent, the reference tag removed from the prompt, ratio and other shared parameters kept by reconciliation.
   - video/frames to video/reference: `input_image` and `last_frame` absent, an images-capable model selected.
   - reference to frames and video to image: same logic.
   - no eligible model for the target: returns `fail(NO_ELIGIBLE_MODEL)` and the state is UNCHANGED.
   - exactly ONE store notification per `switchMode` call (subscribe counter).
2. Implement `store/commands/switchMode.js` composing, in order: eligible models from `template.filterEligibleModels`; model choice; reconciliation (existing `reconcile`); `pruneMedia` with `reason: "mode-change"`; `cleanTagsForAsset` for the removed asset ids (existing function); build one patch `{ activeMode, activeSubMode, selectedModelId, parameterValues, prompt, reconciliationLog }`.
3. Wire the Platform: `handleModeChange` and `handleSubModeChange` call `store.switchMode(...)`. Then DELETE the mode-switch cleanup `useEffect` (about lines 324 to 370) and its `eslint-disable` line. Keep `prevModeRef` only if something else uses it.
4. Update on purpose the P0 tests that pin PB-K1 (reference stays as Start Frame): they now assert it is gone. List them in the report with "changed on purpose by T3 (PB-D-03)".

DoD: tests pass; the cleanup effect is gone; `rg -n "exhaustive-deps" platform/PromptBarPlatform.jsx` count decreased by one; SAFE-5 tests updated only where listed.

Pitfall: UI state derived from `activeSlots` (empty-state placeholders) must keep rendering identically; check SAFE-5.

## T4: one place for model-switch trimming (PB-K3)

Steps
1. Failing test first: a store-level test that selecting a model with a lower max image count trims AND cleans tags exactly once, and a Platform-level test with a spy proving the Platform does not trim again (the spy on `setParameter`/`setPrompt` calls count is zero after `selectModel`).
2. Move the store's trimming (`createPromptBarStore.js` about lines 123 to 205) to use `pruneMedia` with `reason: "model-change"` inside a `selectModel` command (`store/commands/selectModel.js`), keeping the results identical to today's for the SAFE-3 vectors.
3. Delete the duplicate effect in the Platform (about lines 486 to 535, the "model switch reference trimming effect"). Keep the dialog state in that block untouched.

DoD: tests pass; SAFE-3 unchanged and green; the duplicate effect is gone; one implementation remains.

## T5: `attachMedia` and `removeMedia` commands

Purpose: the media handlers living in the Platform (about lines 665 to 834: media selection, reference removal, slot removal with cascade cleanup of the prompt) become store commands that the UI and the future service both call.

Steps
1. Read those handlers completely. Write their rules in scratch: which parameter key a slot role writes to (`template.resolveParameterMapping`), single vs list parameters, how entities and tags are updated.
2. Failing tests first (store level):
   - `attachMedia({ role, value })` on frames model: `start` writes `input_image`, `end` writes `last_frame`; on images-list model `reference` appends to `images`.
   - Limits and duplicates return `fail(MAX_MEDIA_REACHED)` / `fail(DUPLICATE_MEDIA)` / `fail(TYPE_NOT_ALLOWED)` (use `canAttach`, C6); the state is unchanged on failure.
   - `removeMedia({ role, value? })` removes the value and its tag from the prompt; removing from a list removes only that item.
   - A role with no slot in the current mode returns `fail(NO_SLOT_FOR_ROLE)`.
   - One notification per command.
3. Implement `store/commands/attachMedia.js` and `removeMedia.js` and the store wrappers. REUSE `cleanTagsForAsset`, `canAttach`, `getAssetId`.
4. Make the Platform handlers delegate to the store wrappers. UI components and dialogs stay in the Platform.

DoD: tests pass; the handlers in the Platform shrink to dialog/UI code plus calls to the store; SAFE-5 green and untouched.

## T6: core purity and dependency test

Steps
1. Move `core/useRealBackendModels.js` (React Query hook) to `adapters/useRealBackendModels.js`. Leave a shim at the old path that re-exports it (PB-D-02).
2. Create an architecture test (`tests/architecture/dependencyDirection.test.mjs` or the repo's convention): it reads the files of `core/` and `store/` (except the provider file `PromptBarStoreContext.js`, `usePromptBarStore.js`) and fails if any import matches `react`, `next`, `@/features/studio`, `@/widgets`, `@/app`, or a path inside `ui/`, `platform/`, `templates/`. Allow the shim files explicitly by name.
3. Fix violations the test finds in `core/` and `store/` using the smallest change; log anything bigger in BACKLOG (for example, a violation that needs P5's service). The Platform's imports of `@/features/studio` are removed in P5, not here.

DoD: the test passes and is part of `npm test`; shim works; the list of allowed exceptions in the test has a reason next to each entry.

---

## Phase end: gate and acceptance test

1. Run the phase gate (`00_CORE.md` section 10).
2. Acceptance test; paste into `docs/prompt-bar-plan/reports/PHASE-P4-GATE.md`:

| # | Check |
|---|---|
| 1 | The matrix test of `switchMode` passes for 3 models x 4 transitions and asserts a single notification. |
| 2 | `rg -n "exhaustive-deps" src/features/prompt-bar` count is lower than at the start of P4 (write both numbers). |
| 3 | The mode-switch cleanup effect and the duplicate trimming effect no longer exist in `PromptBarPlatform.jsx` (state how you checked). |
| 4 | Every P0 test changed on purpose is listed with its task and reason; no other P0 test changed. |
| 5 | Golden payloads for the three models are identical to P0 (except the documented PB-K2 case). |
| 6 | Architecture test passes. |
| 7 | Full `npm test` passes. |
| 8 | Manual smoke (NOT-RUN for the agent, human): items 2, 3, 4 of `HUMAN_GUIDE.md` section 6. The human reviews the transition matrix with the owner before P5. |

3. Write the gate report, update STATE.md with `Next step: human runs smoke items 2,3,4 and reviews the transition matrix, then gives P5 (06_P5_service_and_legacy_migration.md)`, print a summary (max 15 lines) and STOP.
