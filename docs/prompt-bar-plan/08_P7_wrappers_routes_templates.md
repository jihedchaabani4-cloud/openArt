# Phase P7: wrappers, `persistRoutes`, template consolidation

> Read `00_CORE.md` completely BEFORE this file.
> Scope of THIS file: tasks W1 to W5. Do not read or start other phase files.
> Prerequisites: P6 is DONE (STATE.md) and the human ran the full smoke checklist. If not, STOP and say so.

## Order of work in this session

1. W1 to W5 in order, one commit each (`pb7(W1)` ...). W1 may be several commits (one per page): `pb7(W1-<page>)`.
2. Phase gate, acceptance test, write `reports/P7-SUMMARY.md`, STOP.

## Goal in plain words

1. Pages stop repeating the same boilerplate (`type`, `featureConfig`, `persistKey`, project id). They render one ready-to-use component: `<GeneratedPromptBar />`.
2. A template can say on which pages its state survives (`persistRoutes`). When the user goes to any other page, that bar is reset automatically. The rule is written once, in the template.
3. The generated-media template becomes the single source of its own rules; the old type/config files remain as shims.
4. We PROVE (with a test-only template) that a bar can exist without a model selector and without modes, which is what the future Character bar needs. We do not build that bar here.

---

## W1: `templates/GeneratedPromptBar.jsx` and the pages

Steps
1. Find every page or widget that renders `PromptBarPlatform` with `generatedMediaType` (the audit lists `assets/page.js`, `collection/[collectionId]/page.js`, `NewProjectView.jsx`, and a test page `prompt-bar-compare`). Use V1's table.
2. Create `templates/GeneratedPromptBar.jsx`: it renders `PromptBarPlatform` with the generated-media template (C4 object), the right `persistKey`, the project id, and passes ALL other props through (`models`, `onGenerate`, `isGenerating`, layout props...). It must accept an `instanceId` prop and forward it (default `"default"`).
3. Failing test first (React test with the SAFE-5 harness): the wrapper renders the same slots and produces the same golden payload as the bare Platform with the old props; props passed to the wrapper reach the Platform; `instanceId` changes the identity (two wrappers with different `instanceId` do not share state).
4. Replace usage page by page, one commit each. The page's behavior must not change: same props, same handlers.
5. After the last page: `rg -n "type=\{generatedMediaType\}" src/` is empty except tests of the old API and the shim.

DoD: tests pass; pages shorter; the wrapper is the only place that knows the pair (type, config) for generated-media.

## W2: `persistRoutes` and the route watcher (PB-D-14)

### W2a: pure route matching

Create `store/routePolicy.js` (pure): `matchRoute(pattern, pathname)` and `isPathAllowed(pathname, patterns)`.
Pattern rules: segments separated by `/`; `:name` matches exactly one segment; a trailing `/*` matches that path and anything below it; everything else must match exactly. Query strings and a trailing slash are ignored. Empty or missing `patterns` means "always allowed" (persist everywhere, as today).
IMPORTANT: real URLs contain more than the page name. The studio pages are under `/cinema-studio/<projectId>/assets` and `/cinema-studio/<projectId>/collection/<collectionId>`, so a rule like `/assets` would never match. Read the real route folders in `src/app/` first and write the patterns from them, for example `/cinema-studio/:projectId/assets` and `/cinema-studio/:projectId/collection/*`.

Tests (write first): exact match; `:param`; trailing `/*`; `/collection` does not match `/collections`; trailing slash; query string; root; empty patterns means allowed; the two real studio paths match, `/cinema-studio/p1/settings` does not.

### W2b: the watcher and the reset

1. Add `persistRoutes` to the generated-media template (C4 object) with the patterns from W2a.
2. Create `usePromptBarRouteWatcher()` (React hook, small): reads `usePathname()`; for every registered instance whose template has `persistRoutes` and whose current pathname is NOT allowed: if `registry.isSubmitting(identity)` do nothing; otherwise `registry.reset(identity)` and `removeSaved(storage, key)`. The registry needs the template's `persistRoutes` per identity: store them when the instance is created through `getOrCreate` (add an optional `meta` argument) and expose `registry.list()` with it.
3. Mount the hook ONCE in the studio layout that wraps the bar pages (find it: the audit mentions `StudioLayout` under `src/widgets/`; if the layout is a server component, put the hook in a small client component rendered by it).
4. No effect writes store state on every render: the watcher effect depends on `pathname` only.

Tests
- Allowed to allowed navigation: state kept.
- Allowed to not allowed (`/cinema-studio/p1/settings`): that instance is reset and its storage key removed; another template's instance (without `persistRoutes`) is untouched.
- Coming back later: defaults, not the old state.
- A submit in flight: not reset.
- Two projects: leaving project A's allowed pages for project B's allowed pages resets nothing of A's saved copy unless A's pathname is no longer allowed (state the rule you implemented in one comment and test it).

DoD: tests pass; `usePromptBarRouteWatcher` has a documented one-line contract; the layout renders it exactly once.

## W3: template consolidation

Steps
1. Make `templates/generatedMedia.template.js` the SOURCE of the generated-media rules: move the logic of `generatedMedia.config.js` into it (slots per mode, `filterEligibleModels`, `resolveParameterMapping`, actions from X2, `persistRoutes`). Move code, then clean, in two commits.
2. Leave the OLD files as shims that re-export from the template: `generatedMediaConfig` (`COMPOSITION_REQUIREMENTS`, `filterEligibleModels`, `resolveParameterMapping`) and `generatedMediaType`. Their exports and results stay identical (SAFE-2 tables must pass untouched).
3. In the move, use the constants from C1 instead of literals, and remove the dead ternary fallbacks the audit found in `resolveParameterMapping` ONLY IF the SAFE-2 table proves the result is identical (otherwise leave them and BACKLOG).
4. Write `docs/prompt-bar/ADDING_A_TEMPLATE.md` (one page, with a real example using the contract of C4): which fields to fill, what the Core already does for you, how actions are added, how persistRoutes works, which files to create (target: one template file and one wrapper component).

DoD: SAFE-2 tests green and untouched; old import paths work; the doc exists.

## W4: proof that model and mode are optional (PB-D-13)

Purpose: the Character bar and others may have no model selector and no modes. We prove the base can do it, without building a Character bar.

Steps
1. Create a TEST-ONLY template in the tests folder (`promptOnly.template.js`): `features: { models: false, modes: false }`, a fixed list of static parameters, slots `front`, `side`, `closeup` mapped by a static `mediaMapping`, a media limit of 3, mentions enabled, no `createActions`.
2. Failing tests first (store + Platform harness): with this template, (a) the bar renders with no model selector and no mode toggle (the layout flags already exist); (b) attaching media in the three roles works through `attachMedia`; (c) `serialize` produces a payload with the prompt, the mapped media keys, the static parameters and NO model id; (d) `switchMode`/`selectModel` are not required to exist and are not called.
3. Make the smallest changes the tests demand in the store and `serialize`: the model id is optional in the payload when `features.models` is false; static parameters from the template replace `model.parameters` in that case. Everything for templates WITH a model stays identical (golden payloads untouched).
4. Size guard: if making this work needs more than about 150 changed lines in Core/store, STOP the task, keep the failing tests as `it.todo` with the reasons, add a BACKLOG item, and continue. It is only needed when a prompt-only template is unlocked (P8).

DoD: either the tests pass with a small diff, or the guard was applied and documented. Golden payloads of the three models unchanged.

## W5: documentation and final regression

Steps
1. Replace outdated claims: the old analysis document `prompt_bar_platform_architecture_analysis.md` (if it is in the repo) contains statements the audit proved wrong (Core has no domain knowledge; `serialize` only includes declared parameters; credits formula; Character front/side/closeup exists; Edit/Upscale exist). Do not delete it. Add a banner at its top: `SUPERSEDED: see docs/prompt-bar/ARCHITECTURE.md`.
2. Write `docs/prompt-bar/ARCHITECTURE.md` (max about 2 pages): layers (template, core, store/registry, service, platform, UI), the identity and key format, lifecycle, transitions rule (PB-D-03), external actions, `persistRoutes`, how to add a template (link to W3 doc), and a table "claim in the old analysis | reality now".
3. Run the full regression: `npm test`, lint on touched files, `npm run build` if it works without secrets. Count: `rg -n "exhaustive-deps|activePromptBarStoreInstance|getActivePromptBarStore" src/features/prompt-bar src/features/workflows src/features/studio`.
4. Write `docs/prompt-bar-plan/reports/P7-SUMMARY.md`: what changed per phase, files added, shims left (list, to remove in P8), numbers before and after (Platform lines, effects count, tests count), manual checks for the human.

DoD: docs exist; summary written; gate passed.

---

## Phase end: gate and acceptance test

1. Run the phase gate (`00_CORE.md` section 10).
2. Acceptance test; paste into `docs/prompt-bar-plan/reports/PHASE-P7-GATE.md`:

| # | Check |
|---|---|
| 1 | Every page that used the pair (type, config) now uses `GeneratedPromptBar` (list pages with file:line). |
| 2 | Route-policy tests include the two real studio paths and pass. |
| 3 | The watcher is mounted exactly once (file:line). |
| 4 | SAFE-2 tables and golden payloads are unchanged and green. |
| 5 | W4: tests pass, or the size guard is documented with the BACKLOG line. |
| 6 | Shims left are listed. Nothing was removed. |
| 7 | Full `npm test` passes. |
| 8 | Manual smoke (NOT-RUN for the agent, human): all items of `HUMAN_GUIDE.md` section 6, especially item 1 (persist between allowed pages, reset on a non-allowed page). |

3. Write the gate report, update STATE.md with `Next step: human reviews P7-SUMMARY.md and writes the final summary request (09_FINAL_AND_P8.md)`, print a summary (max 15 lines) and STOP.
