# Phase P0: setup and safety net (tests only)

> Read `00_CORE.md` completely BEFORE this file (rules, loop, rubric, decisions).
> Scope of THIS file: SETUP-1 and SAFE-1 to SAFE-5. Do not read or start other phase files.
> Prerequisites: none. You must be in the FRONTEND repo (the one with `src/features/prompt-bar/`). If you are in the backend repo, STOP and say so.

## Order of work in this session

1. SETUP-1.
2. SAFE-1 to SAFE-5 in order (tests only; ZERO production code change in this phase).
3. Phase gate, acceptance test, STOP.

Purpose of the phase: later phases move and change a lot of code. Before touching anything we pin what the code does TODAY with tests, so every later refactor can be proven not to change behavior. Where today's behavior is a known problem, the test pins it and carries a comment `// CURRENT BEHAVIOR (known issue PB-Kx)`; the phase that fixes it changes that test on purpose.

Known issues referenced by tests (from the audit, to be proven by the tests themselves):
- PB-K1: switching from image mode to video/frames keeps `input_image`, so a reference silently becomes the Start Frame.
- PB-K2: `serialize` appends media parameters present in state even if the selected model does not declare them.
- PB-K3: model-switch reference trimming and tag cleaning exist both in the store and in the Platform.

---

## SETUP-1: baseline, folders, AGENTS.md

1. Confirm you are in the right repo: `src/features/prompt-bar/` exists and `package.json` is a Next.js app. List the files of `src/features/prompt-bar/` with line counts (`git ls-files src/features/prompt-bar | xargs wc -l`) and compare with the audit (about 36 source files, `PromptBarPlatform.jsx` about 1239 lines, `createPromptBarStore.js` about 333, `PromptBarStoreContext.js` about 181). Write differences in DECISIONS.md.
2. Find the test commands (1.7). Run `npm test`. Record the BASELINE: number of files and tests, and any failure. The audit says 9 files / 53 tests, all passing. The repo wins. Run `npm run lint` (if it exists) and `npm run build` (if it works without secrets). Record results as the baseline in `reports/SETUP-1.md`; later phases compare to it.
3. AGENTS.md: check for the block "Prompt bar plan rules" (section 9.3 of `00_CORE.md`). If missing, add it ABOVE any Spec Kit markers. Do not touch the Spec Kit pointer line.
4. Create `docs/prompt-bar-plan/STATE.md`, `DECISIONS.md` (seed: the table of section 12 of `00_CORE.md`, copied as is), `BACKLOG.md`, and the folders `reports/`, `escalations/`, `scratch/`. Exclude scratch locally: add `docs/prompt-bar-plan/scratch/` to `.git/info/exclude` (this is not a tracked file).
5. Find where the existing tests live and how they are written: open `promptBarPersistence.test.jsx`, `tagsContract.test.mjs`, `modelEligibilityContract.test.mjs`. Write the conventions (folder, imports, how they mock `next/navigation` and storage) in `reports/SETUP-1.md`. Every later test follows them.
6. Commit: `pb0(SETUP-1)`.

DoD: baseline recorded; AGENTS.md block present; plan folders exist; STATE.md lists all P0 tasks.

---

## SAFE-1: pure core characterization + shared fixtures

Files under test (pure, no React): `core/reconciliation.js`, `core/serialization.js`, `core/tagsService.js`, `core/modelManagement.js` (normalization only), `core/parameterState.js`.

Steps
1. Create ONE shared fixtures file (follow the repo's convention for test helpers) with three raw backend model manifests and their normalized form (run the real normalizer to get the normalized form, do not hand-write it):
   - `frames` model: `prompt`, `input_image`, `last_frame`, `duration` (values 5 and 10), `aspect_ratio`, `resolution` (shape of the audit's `seedance_2_5`).
   - `imagesList` model: `prompt`, `images` (array, max 14), `input_image`, `resolution`, `aspect_ratio` (shape of `nanobana_pro`).
   - `promptOnly` model: `prompt`, `resolution`, `aspect_ratio` (shape of `seedream_v5`).
2. Tests for `reconciliation`: switching `frames` to `imagesList` keeps `aspect_ratio` when valid, resets invalid values to defaults, drops `last_frame`; switching to `promptOnly` drops all media parameters. Assert exact output objects.
3. Tests for `serialize` (golden payloads): for each of the three models, a state with a prompt and the parameters that model supports gives exactly one expected payload (full object equality). Add the PB-K2 test: state holds `input_image` but the model is `promptOnly` and assert what the payload contains TODAY (write the observed result and mark `CURRENT BEHAVIOR (known issue PB-K2)`).
4. Tests for `tagsService.cleanTagsForAsset`: removes each tag kind it supports for one id and for a list of ids; leaves other tags; cleans doubled commas and spaces; empty or non-string prompt returns `""`; regex special characters in an id do not break it.
5. Tests for `modelManagement` normalization: raw `input_image`, `last_frame`, `images`, plain parameters map to the declared types (`image`, `image[]`, `select`, `number`...) as the code does today.

DoD: tests pass; mutation check done on at least 3 tests (name them in the report).

---

## SAFE-2: template rules characterization

Files under test: `features/generated-media/generatedMedia.config.js`, `composition/generatedMedia.type.js`, `composition/character.type.js`, `composition/createPromptBarType.js`.

Steps
1. `resolveParameterMapping`: a table test with roles `start`, `end`, `reference`, unknown role, crossed with the 3 fixture models plus a model declaring `start_frame`, one declaring `last_image`, one declaring `reference_images`. Assert today's result for every cell (including the cells that return `input_image` for both `start` and `reference`; mark that cell `CURRENT BEHAVIOR (known issue PB-K1)`).
2. `filterEligibleModels`: for `image`, `video/frames`, `video/reference`, with a mixed model list; assert exactly which ids come back. Also assert it filters the list it receives (not a global one).
3. `COMPOSITION_REQUIREMENTS`: the slot list per mode and sub-mode.
4. `createPromptBarType`: returns a frozen object; `generatedMediaType` and `characterType` expose the layout flags they declare today.

DoD: all pass; mutation check on 2 tests.

---

## SAFE-3: store characterization (vanilla store, no React)

File under test: `store/createPromptBarStore.js`.

Steps (use the fixtures; call actions through `store.getState()`)
1. `setModels` picks a default model and default parameter values; honors an initial `selectedModelId` when valid.
2. `selectModel` frames to imagesList: reconciliation result, `reconciliationLog` is non-empty, prompt tags of dropped media removed.
3. `selectModel` to a model with a LOWER max image count: extra references trimmed and their tags removed (PB-K3: assert the store does this on its own).
4. `setParameter`, `setPrompt`, `addElement`/`removeElement` (tag cleaned), `addCharacter`/`removeCharacter`, `clearEntities`, `clearMediaReferences`, `reset` (back to model defaults), `serialize` writes `lastSerializedRequest`.
5. `setIsGenerating` only touches `isGenerating`.

DoD: all pass; mutation check on 3 tests.

---

## SAFE-4: registry, key and persistence characterization

Files under test: `store/PromptBarStoreContext.js`, `store/usePromptBarStore.js`. Start from the existing `promptBarPersistence.test.jsx` (do NOT edit it; add a new test file next to it).

Steps
1. Key format: for a project id and the default persist key the effective key is `<persistKey>_<projectId>`; without a project it ends with `_global`.
2. Same key mounted twice gives the same store instance; different project gives a different instance.
3. The saved subset: after a state change the storage holds exactly `prompt`, `selectedModelId`, `parameterValues`, `elements`, `characters`, `activeMode`, `activeSubMode` and nothing else (no `isGenerating`).
4. Invalid JSON in storage is ignored and the store starts with defaults.
5. Document the known issues with tests named `CURRENT BEHAVIOR`: (a) the module-level "active store" variable is replaced by whichever provider rendered last; (b) a `blob:` string inside `parameterValues` is written to storage as is.

If a provider cannot be mounted without heavy mocks, mock `next/navigation` the way the existing test does. If you still cannot mount it after 3 attempts, mark the sub-step BLOCKED with an escalation and continue.

DoD: all pass; mutation check on 3 tests.

---

## SAFE-5: Platform integration harness

File under test: `platform/PromptBarPlatform.jsx` (mounted).

Steps
1. Build a small test harness helper `mountPromptBar({ models, type, featureConfig, projectId })` returning the rendered tree, the store (via the provider/context or the registry as it exists today) and a spy `onGenerate`. Mock only what is unavoidable: `next/navigation`, `PromptEditor` (Lexical) if it cannot run in the test DOM, network hooks (`useRealBackendModels` must not call the network; pass models in). Everything else is real.
2. Tests (pin TODAY'S behavior):
   - image mode renders one Reference slot; selecting video then Frames shows Start and End slots; Reference sub-mode shows one Reference slot.
   - with the `frames` model selected, putting an image into `input_image` and another into `last_frame` and clicking Generate calls `onGenerate` once with the golden payload of SAFE-1.
   - switching from Frames to Reference clears `last_frame` and `input_image` as it does today.
   - PB-K1: with a reference stored in `input_image` in image mode, switching to video/frames leaves `input_image` set (`CURRENT BEHAVIOR (known issue PB-K1)`).
   - a prompt-only model hides the reference slots.
   - Generate is disabled while `isGenerating` is true.
3. Record how many `useEffect`s the Platform runs for a mode switch (render counter or spy) only if it is easy; otherwise skip.

If the Platform cannot be mounted at all after 3 attempts, escalate (1.5.1), mark SAFE-5 BLOCKED, and continue to the gate. Later phases then rely on store-level tests only, and the human must run the smoke checklist (HUMAN_GUIDE section 6) after every phase.

DoD: harness helper exists and is documented in one comment block; tests pass; mutation check on 3 tests.

---

## Phase end: gate and acceptance test

1. When every task above is DONE, BLOCKED or SKIPPED, run the phase gate (`00_CORE.md` section 10).
2. Phase acceptance test; paste results (command or test name + result, tagged VERIFIED / NOT-RUN) into `docs/prompt-bar-plan/reports/PHASE-P0-GATE.md`:

| # | Check |
|---|---|
| 1 | `git diff --stat <phase start>..HEAD` shows ONLY test files, fixtures and `docs/prompt-bar-plan/` and AGENTS.md. No production file changed. |
| 2 | Full `npm test` passes; the new test count is higher than the baseline by the number of tests added. |
| 3 | Each of PB-K1, PB-K2, PB-K3 has at least one test that pins it (list test names). |
| 4 | The shared fixtures file contains the three model shapes and is imported by SAFE-1..SAFE-5. |
| 5 | `STATE.md` baseline numbers are written. |

3. Write the gate report, update STATE.md with `Next step: P1 (human gives you 02_P1_verification_audits.md in a new session)`, print a summary (max 15 lines) and STOP.
