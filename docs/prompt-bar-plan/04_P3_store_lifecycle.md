# Phase P3: store identity, lifecycle and persistence

> Read `00_CORE.md` completely BEFORE this file.
> Scope of THIS file: tasks S1 to S6. Do not read or start other phase files.
> Prerequisites: P2 is DONE (STATE.md). `VERDICTS.md` exists. If not, STOP and say so.
> Read `VERDICTS.md` first. If a verdict REFUTES a claim this phase relies on (hydration mismatch, stuck Generate), keep the task but reduce it to the part that is still true, and log the change in DECISIONS.md.

## Order of work in this session

1. S1 to S6 in order, one commit each (`pb3(S1)` ...).
2. Phase gate, acceptance test, STOP.

## Goal in plain words

Each Prompt Bar instance must have its own store with a clear identity. Stores are created and found by a registry that lives OUTSIDE React. Nothing reads or writes storage while a component renders. Saved state is restored after mount. Writes are debounced. A bar can never be stuck "generating" because of a stale flag. No module-level variable says "this is the active bar".

Public names that other code imports today (`PromptBarStoreProvider`, `usePromptBarStore`, `getActivePromptBarStore`, `setActivePromptBarStore`, `clearPersistentPromptBarStores`) KEEP working (shims, PB-D-02). `getActivePromptBarStore` becomes deprecated and is removed from callers in P5.

---

## S1: `store/registry.js` (pure module, no React)

API (names are suggestions)
- `identityKey({ templateId, projectId, instanceId = "default" })` returns `pb2:<templateId>:<instanceId>:<projectId or "global">` (PB-D-05). Throws if `templateId` is missing.
- `getOrCreate(identity, factory)` returns the existing store for that key or calls `factory()` once and keeps it. Idempotent, safe to call twice in a row (React Strict Mode).
- `get(identity)`, `has(identity)`, `reset(identity)` (state back to defaults, keeps the object), `dispose(identity)`, `list()`.
- Mount tracking: `markMounted(identity)` / `markUnmounted(identity)` with a counter per key (two mounts of the same key need two unmounts). `isMounted(identity)`.
- `pruneOtherProjects(currentProjectId)`: disposes instances that are NOT mounted and belong to another project (PB-D-10).
- In-flight tracking: `beginSubmit(identity)` returns a token; `endSubmit(identity, token)`; `isSubmitting(identity)`.

Rules: no `window`, no storage, no React. The factory is passed in; the registry never imports the store factory.

Tests (hermetic): same identity gives the same object; different project or template or `instanceId` gives different objects; factory called once; double `markMounted` needs double `markUnmounted`; `pruneOtherProjects` keeps mounted ones and the current project's ones; `isSubmitting` follows begin/end and ignores a stale token.

DoD: tests pass; `rg -n "window|sessionStorage|from \"react" store/registry.js` is empty.

## S2: `store/persistence.js` (pure module, storage passed in)

API
- `selectPersistable(state)`: returns the PB-D-07 subset plus `v: 2`, with every non-persistable media value removed (use `isPersistableMedia` from C2). Never includes `isGenerating`.
- `loadSaved(storage, key)`: returns the parsed object, or `null` for missing, invalid JSON, wrong `v`, or a storage that throws.
- `createSaver({ storage, key, getState, subscribe, debounceMs })`: subscribes to the store, writes `selectPersistable(state)` with a trailing debounce (PB-D-09), returns `{ flush, cancel, stop }`. Writes are wrapped in try/catch (quota errors are swallowed and reported through the return value or the repo's logger, never thrown).
- `removeSaved(storage, key)`.
- The debounce constant lives in ONE config module (`DEFAULT_PERSIST_DEBOUNCE_MS = 300`).

Tests (fake storage, fake timers): ten state changes within the window cause one write; `flush` writes immediately; `stop` cancels pending writes; a `File`, a `blob:` string and a `data:` string never reach the stored JSON (check the raw string); `isGenerating` never appears; invalid JSON gives `null`; wrong version gives `null`; a throwing storage does not throw.

DoD: tests pass; mutation check on the blob test and the debounce test.

## S3: provider on the registry, hydration after mount

Files: `store/PromptBarStoreContext.js` (EXTENDED), `store/usePromptBarStore.js` (REUSED).

Required behavior
1. Store creation in the provider body is allowed ONLY through `registry.getOrCreate(identity, factory)` and must not read storage. The first render (server and client) uses defaults plus `initialConfig` only (PB-D-06).
2. The identity is built from `templateId` (new optional prop; the Platform passes `type.id`; default `"default"` for old callers), `instanceId` (optional prop, default `"default"`), and the project id from the existing `resolveProjectId` (do NOT change where it comes from).
3. In `useEffect` after mount: `registry.markMounted`, then `loadSaved` and apply with a new store action `hydrate(saved)`, then start the saver (S2). On unmount or identity change: `saver.flush()`, `saver.stop()`, `registry.markUnmounted`. Call `registry.pruneOtherProjects(projectId)` after mount.
4. Remove the module-level `activePromptBarStoreInstance` write from the render body. Keep `getActivePromptBarStore()` as a deprecated shim with this exact rule: it returns the store of the most recently MOUNTED instance (set in the mount effect, not in render) if exactly one instance is mounted for the current project; if more than one is mounted it returns `null`. Mark it `@deprecated`. `setActivePromptBarStore` stays exported and becomes a documented no-op that does not write a global.
5. `clearPersistentPromptBarStores()` stays and now calls `registry.list()` and `registry.dispose` for each, plus `removeSaved`.

Pitfall (important): models usually load AFTER the first render (React Query), and `setModels` picks a default model and default parameters. If `hydrate` runs before `setModels`, the saved `selectedModelId` and `parameterValues` must survive; if after, they must be reconciled against the loaded model. Implement `hydrate` so it stores the saved values as `pendingHydration` when `modelsMap` is still empty, and have `setModels` consume it (validate the saved model id exists, run the saved parameters through the normal reconcile). Write the test for BOTH orders.

Tests
- Server safety: `renderToString` of a tree with the provider does not throw and does not touch storage (assert the fake storage got zero calls during render).
- After mount, saved state is applied (both orders of models loading).
- Two providers with different identities do not overwrite each other (this is the old "last render wins" bug; add a test that failed before: `getActivePromptBarStore` after rendering A then B no longer returns B just because B rendered last).
- React Strict Mode double mount gives one store and a correct mounted counter.
- The old exported names exist.
- The P0 characterization tests still pass; the two named `CURRENT BEHAVIOR` tests about the active-store variable are changed on purpose (list them in the report with the reason).

DoD: tests pass; no storage call and no registry write remain in the render body (`rg` the file and read it).

## S4: submit lifecycle (`beginSubmit` / `endSubmit`)

Steps
1. Add store actions `beginSubmit()` and `endSubmit(token)`: they set `isGenerating` true/false and talk to the registry's in-flight tracking. Keep `setIsGenerating` working (shim: it only sets the flag, as today).
2. In the Platform's generate handler (`handleGenerate`), wrap the `onGenerate` call: `const token = beginSubmit(); try { await onGenerate(result) } finally { endSubmit(token) }`. Keep the existing prop `isGenerating` semantics from the parent exactly as they are today (read V5 to know which one wins in the UI).
3. On mount (inside the S3 mount effect), if the store says `isGenerating` is true and `registry.isSubmitting(identity)` is false, set it to false.

Tests
- A stale `isGenerating: true` in a store is reset on mount.
- A submit that is really in flight is NOT reset by a second mount.
- `endSubmit` with an old token does nothing.
- `onGenerate` that throws still ends the submit.
- `isGenerating` never appears in the saved JSON.

DoD: tests pass; V5 verdict referenced in the report.

## S5: memory policy

Steps
1. Confirm `registry.pruneOtherProjects` is called after mount (S3) and that unmounted instances of other projects disappear from `registry.list()`.
2. Confirm that their saved copy is still in storage and is restored when the user returns to that project.

Tests: navigate project A to B to A with a fake storage: instance A is disposed while B is mounted, and A's prompt and parameters come back after returning.

DoD: tests pass; no store of another project stays in memory.

## S6: multi-instance and lifecycle integration test

One integration test file using the SAFE-5 harness (or the store-level equivalent if SAFE-5 is BLOCKED):
1. Two bars with different `templateId` in the same project: typing in one does not change the other; resetting one does not reset the other.
2. Same template, two `instanceId` values: same.
3. Same template, two projects: same.
4. Unmount and remount with the same identity: state is restored from storage after mount.
5. Generate in one bar: the other bar's `isGenerating` stays false.

Write `docs/prompt-bar/STORE_LIFECYCLE.md` (max one page): identity, key format, what is persisted, when it is written, when it is cleared, the in-flight rule. This replaces the claims of the old analysis document for these topics.

DoD: tests pass; doc exists.

---

## Phase end: gate and acceptance test

1. Run the phase gate (`00_CORE.md` section 10). In step 5 the expected count of `activePromptBarStoreInstance` is 0; `getActivePromptBarStore` callers may remain (shim) and their count must be written in the report.
2. Acceptance test; paste into `docs/prompt-bar-plan/reports/PHASE-P3-GATE.md`:

| # | Check |
|---|---|
| 1 | `rg -n "activePromptBarStoreInstance" src/` prints nothing. |
| 2 | The provider body has no `sessionStorage` / `localStorage` access and no registry write (state the lines read). |
| 3 | Full `npm test` passes; every P0 test that was changed on purpose is listed with the reason. |
| 4 | Server-render test passes (zero storage calls). |
| 5 | Both models-loading orders are tested for hydration. |
| 6 | Manual smoke (NOT-RUN for the agent, human): items 1, 2, 6 and 7 of `HUMAN_GUIDE.md` section 6. |

3. Write the gate report, update STATE.md with `Next step: human runs smoke items 1,2,6,7 and CONFIRMS PB-D-03 in DECISIONS.md, then gives P4 (05_P4_atomic_transitions_and_payload.md)`, print a summary (max 15 lines) and STOP.
