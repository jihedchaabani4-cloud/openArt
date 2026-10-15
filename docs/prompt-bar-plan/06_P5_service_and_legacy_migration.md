# Phase P5: `promptBarService` and legacy store migration

> Read `00_CORE.md` completely BEFORE this file.
> Scope of THIS file: tasks X1 to X6. Do not read or start other phase files.
> Prerequisites: P4 is DONE (STATE.md). `CONSUMERS.md` and `VERDICTS.md` exist. If not, STOP and say so.
> Read `CONSUMERS.md` (migration order) and the V4 report (current semantics of Animate, Add reference, Reuse). The CURRENT semantics found in V4 are the ones to preserve, except where PB-D-03 says otherwise.

## Order of work in this session

1. X1 to X6 in order, one commit each (`pb5(X1)` ...). X5 may be several commits (one per consumer); name them `pb5(X5-<consumerName>)`.
2. Phase gate, acceptance test, STOP.

## Goal in plain words

Any component of the app (an asset card, a details modal, a navbar button) can act on a Prompt Bar with ONE line: add a reference, animate an image, reuse old generation settings. The action finds the right bar by identity (not by "whichever rendered last"), does everything inside the store through commands (T3 to T5), and answers `{ ok, reason }`. If the bar is not mounted yet, the action is queued and applied once when it mounts. The old duplicate store stops receiving the same data.

The service does NOT call the generation API and does NOT know any page. Sending a request stays the job of the parent's `onGenerate`.

---

## X1: `api/promptBarService.js` and the pending queue

Design
- `promptBarService(identity)` returns an object with ONE method per action and never returns `null`. Generic actions: `setPrompt(text)`, `focus()`, `reset()`, `getSnapshot()` (read-only copy of `prompt`, `selectedModelId`, `activeMode`, `activeSubMode`, `isGenerating`), and `run(actionName, args)`. Template-specific actions are added from the template's `createActions` (X2).
- Resolution: the instance comes from `registry.get(identity)` and `registry.isMounted(identity)` (S1). No module-level "active bar" anywhere.
- When the instance is NOT mounted: the action is stored in a pending queue (`store/pendingActions.js`, pure, storage passed in) keyed by identity key, and the call returns `fail(REASONS.NOT_MOUNTED, { queued: true })`. When that identity mounts (S3 mount effect), the queue for that key is drained in order, each action runs exactly once, and the entry is removed BEFORE it runs (no double run). Pending entries expire after a TTL constant (suggested 2 minutes) and are dropped when the project differs.
- Project guard: if the identity's `projectId` differs from the mounted instance's project, return `fail(PROJECT_MISMATCH)` and do nothing.
- The queue replaces `setPendingPromptAction` / `consumePendingPromptAction` from `features/studio` (V4 documents them). Those two functions stay exported from `features/studio` as thin wrappers that call the new queue (shims, PB-D-02), so existing callers keep working until X4.

Tests (hermetic, fake storage, fake timers)
- Mounted instance: `setPrompt` changes only that instance.
- Two mounted instances with different template ids: an action addressed to one never changes the other (the old singleton bug).
- Not mounted: queued once; on mount applied once; a second mount does not apply it again.
- Expired entry is dropped; entry of another project is dropped.
- Wrong project gives `PROJECT_MISMATCH` and no state change.

DoD: tests pass; the service module imports no React (it can import the registry and commands); `rg -n "document\.|window\." api/promptBarService.js store/pendingActions.js` is empty (focus is handled in X3).

## X2: generated-media template actions

Add `createActions(core)` to the generated-media template (the object from C4; extend it, do not touch the old type/config files). `core` offers the store's command wrappers (`switchMode`, `selectModel`, `attachMedia`, `removeMedia`, `setPrompt`, `setParametersBatch`, `getState`) and nothing else.

Actions (copy the CURRENT semantics from V4; below is the intended shape)
- `addReference(media)`: if the current sub-mode has no reference slot (for example video/frames) return `fail(NO_SLOT_FOR_ROLE)` (do NOT switch mode silently; PB-D-03); otherwise `attachMedia({ role: "reference", value })` and return its result.
- `animateMedia(media, options = {})`: explicit transition. Steps computed on a draft and applied as ONE patch: switch to video/frames; if there is no eligible frames model return `fail(NO_ELIGIBLE_MODEL)` with the state UNCHANGED; attach the media as `start`; set the prompt exactly as V4 says Animate does today (overwrite / append / only if empty); expose the choice as an option (`options.promptMode`) with the V4 behavior as the default.
- `applyGeneration(old)`: `old = { mode, subMode, modelId, prompt, parameters }`. Switch mode, select the model if it exists (`UNKNOWN_MODEL` otherwise, state unchanged), set the prompt, then apply `parameters` after filtering them through the model's declared parameters (unknown keys ignored). Media parameters inside `old.parameters` are applied only if their values pass `isPersistableMedia` and `canAttach`.

Atomicity: add a helper `applyComposite(store, steps)` (pure steps over a draft state, one `set` at the end, no partial result on failure). `animateMedia` and `applyGeneration` use it.

Tests (store level, generated-media template, three fixture models)
- `addReference` on image mode with an images-capable model attaches; on video/frames fails with `NO_SLOT_FOR_ROLE` and changes nothing.
- `animateMedia` from image mode with a reference present: ends in video/frames, `input_image` holds the animated media (not the old reference), `last_frame` empty, one store notification.
- `animateMedia` with no frames model: `NO_ELIGIBLE_MODEL`, state deep-equal to before.
- `applyGeneration` with an unknown parameter key ignores it; with an unknown model id fails and changes nothing.
- The prompt behavior equals the V4 table for each action.

DoD: tests pass; no template literal was added to Core or store code (`rg -n "\"frames\"|\"video\"" core/ store/` shows no new hit).

## X3: focus without the DOM query

Steps
1. Add a store field `focusRequest` (number) and an action `requestFocus()` that increments it. `promptBarService(...).focus()` calls it.
2. The Platform passes it to the editor: an effect in the editor wrapper focuses the editor when `focusRequest` changes (not on first render). Remove the `document.querySelector('[contenteditable="true"]')` call from `useMediaActions.js` in X4 (not here).
3. Tests: `requestFocus` increments; the effect focuses once per change and not on mount (use the editor mock from SAFE-5).

DoD: tests pass; behavior of focusing after Animate is covered by a test.

## X4: migrate `useMediaActions.js` and its callers to the service

Steps
1. Read `useMediaActions.js` fully (about lines 150 to 260 per the audit) and the V4 table.
2. Failing tests first (hook-level or function-level, mocking only the service boundary): the hook calls `promptBarService(identity).animateMedia(...)` and `.applyGeneration(...)` and `.addReference(...)`; it does NOT call `getActivePromptBarStore`, does NOT write prompt or model to `usePromptStore`, and does NOT query the DOM.
3. Replace the dual-write block (the audit points at about lines 150 to 180) with service calls. The identity comes from the project id the hook already knows and the template id constant of generated-media.
4. If the result is `fail(NOT_MOUNTED, { queued: true })`, keep the user-visible navigation that the hook does today (for example navigating to the assets page); the queue applies the action on mount.
5. `features/studio` functions `animateMedia`, `addMediaToPrompt`, `consumePendingPromptAction` become wrappers over the service/queue (shims). The Platform stops importing from `@/features/studio` (remove the three imports flagged by the audit; the Platform drains the queue through the S3 mount effect and the service).

DoD: tests pass; `rg -n "getActivePromptBarStore" src/` shows only the shim definition and tests; no import from `@/features/studio` remains in `platform/` (`rg -n "features/studio" src/features/prompt-bar` is empty or lists only shims with a reason).

## X5: migrate the other legacy-store consumers (one commit per consumer)

Work list: the consumers classified `MIGRATE` in `CONSUMERS.md`, in the order proposed there. Consumers classified `KEEP` or `UNKNOWN` are NOT touched; list the UNKNOWN ones in BACKLOG.

For each consumer
1. Failing test first (or, if the component has no test setup, a test of the extracted selector/hook it uses).
2. Replace reads of duplicated fields (prompt, model id, generation mode...) by `usePromptBarStore(selector)` from the correct instance (identity props or context), or by `promptBarService(identity).getSnapshot()` for non-React callers.
3. Do not remove the legacy field yet.

DoD per consumer: its tests pass; the legacy store field it used now has one reader less (count with `rg`).

## X6: remove dead legacy fields (not the file)

Steps
1. For each legacy field/action that duplicates the instance store (list from `CONSUMERS.md`), run `rg -n "<field>" src/` and confirm there is NO remaining reader or writer outside the legacy store file and its tests.
2. Remove only the fields with zero readers. Keep drag state and anything classified `KEEP`. Keep the file and its exports (shims, PB-D-17).
3. Remove the deprecated `getActivePromptBarStore` and `setActivePromptBarStore` ONLY if `rg` shows zero callers; otherwise leave them and write the count in BACKLOG.
4. Write `docs/prompt-bar/EXTERNAL_ACTIONS.md` (one page): the service API, the reasons table, the queue rule, an example for an asset card (add reference, animate, reuse).

DoD: tests pass; every removed field has a `rg` proof in the report.

---

## Phase end: gate and acceptance test

1. Run the phase gate (`00_CORE.md` section 10). Step 5: write the number of `getActivePromptBarStore` callers (target 0).
2. Acceptance test; paste into `docs/prompt-bar-plan/reports/PHASE-P5-GATE.md`:

| # | Check |
|---|---|
| 1 | Two-instance test passes: an action addressed to one bar never changes the other. |
| 2 | `animateMedia` with no frames model leaves the state deep-equal (test name in the report). |
| 3 | Queue test passes: applied once on mount, never twice. |
| 4 | `rg -n "usePromptStore" src/` readers of duplicated fields: before and after counts are in the report. |
| 5 | `rg -n "querySelector" src/features/workflows src/features/studio` shows no editor-focus query. |
| 6 | `rg -n "features/studio" src/features/prompt-bar/platform` is empty. |
| 7 | Full `npm test` passes; no P0 test changed except the ones listed on purpose. |
| 8 | Manual smoke (NOT-RUN for the agent, human): items 4 and 5 of `HUMAN_GUIDE.md` section 6, plus drag and drop from the library (KEEP consumers must still work). |

3. Write the gate report, update STATE.md with `Next step: human runs smoke items 4,5 and drag and drop, then gives P6 (07_P6_platform_split.md)`, print a summary (max 15 lines) and STOP.
