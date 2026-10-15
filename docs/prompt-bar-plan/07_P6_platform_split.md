# Phase P6: split `PromptBarPlatform.jsx`

> Read `00_CORE.md` completely BEFORE this file.
> Scope of THIS file: tasks H1 to H6. Do not read or start other phase files.
> Prerequisites: P5 is DONE (STATE.md). If not, STOP and say so.

## Order of work in this session

1. H1 to H6 in order, one commit each (`pb6(H1)` ...).
2. Phase gate, acceptance test, STOP.

## Goal in plain words

After P2 to P5 the Platform no longer owns business rules: they live in pure functions, commands and the store. What remains is orchestration (wiring) and a lot of JSX. This phase moves that code into small hooks and components, so each file has one job and can be tested. NOTHING changes for the user.

## Rules of this phase (strict)

- MOVE, do not rewrite. Copy the code, then adapt only imports and parameters (checklist 9.2 of `00_CORE.md`). Moving and changing code are separate commits.
- The Platform's public props and exports stay exactly as they are. No prop is renamed or removed.
- No markup, class name or text change. No new CSS.
- The P0 characterization tests and the P3/P4/P5 tests stay green and UNTOUCHED. Run them after every task.
- Size targets are goals, not excuses to rewrite: write before and after line counts of `PromptBarPlatform.jsx` in every report.
- Do NOT create dozens of tiny files: a hook or component is created only when it owns a clear responsibility and at least about 40 lines.
- Line ranges below come from the audit and are hints (0.2): find the real blocks by reading.
- Files go under `platform/hooks/` and `platform/parts/` (or the repo's equivalent).

Per-task method
1. Run the whole suite green. Record Platform line count.
2. Identify the block, list the state/props/refs it reads and writes.
3. Create the hook/component with exactly those inputs as parameters/props.
4. Replace the block in the Platform by the call/usage.
5. Run the whole suite green. Record the new line count. Commit.

---

## H1: `usePromptBarModels`

Block: model syncing from props or the query, eligible model filtering, default model auto-selection (about lines 159 to 237 of the audit's numbering, the parts about models).
Returns what the Platform needs: eligible models, current model, helpers the JSX uses.
DoD: suite green; Platform shrinks.

## H2: `usePromptBarSlots`

Block: active slots resolution (uses `getActiveSlots`, C5), drawer parameter partitioning, the frame swap handler (about lines 280 to 319 and the swap part of 372 to 403).
DoD: suite green; the slots shown in SAFE-5 tests are unchanged.

## H3: `usePromptBarReferences`

Block: active references list, "all selected media" memo, quota memos (use C6 functions), dialog open/close state for the import and mention dialogs, outside-click and Escape listeners (about lines 404 to 664 and 835 to 923).
Rules: listeners keep their cleanup functions and complete dependency arrays; no new `eslint-disable`.
If this block is large, split it in two commits: `useReferenceDialogs` (UI state, listeners) and `useReferenceActions` (calls to `attachMedia` / `removeMedia` from T5).
DoD: suite green; the Platform no longer contains `addEventListener` calls (`rg -n "addEventListener" platform/PromptBarPlatform.jsx` is empty).

## H4: `usePromptBarGenerate`

Block: credits estimate (calls the existing credit service; PB-D-16, do not change it), aspect ratio resolution, the generate handler with `beginSubmit` / `endSubmit` (S4).
DoD: suite green; the golden payload test of SAFE-5 passes untouched.

## H5: UI parts

Create presentational components with props only (no store access, no business logic) for the pure JSX blocks (about lines 924 to 1238): `PromptBarTopPanel` (mention menu and import popover area), `PromptBarSlotsRow` (media inputs, references view, swap icon, reference button), `PromptBarControlsRow` (settings button, model label, ratio, variations, generate button), and `PromptBarModeSelector` only if the Platform itself renders the mode toggle (the audit says mode toggles live in `FlowPromptBoxSettings.jsx`; in that case do not create it and note why).
One commit per component.
DoD: suite green; each new component receives data and callbacks as props; `rg -n "usePromptBarStore" platform/parts` is empty.

## H6: cleanup and final shape

Steps
1. `PromptBarPlatform.jsx` should now be orchestration only: it calls the hooks, passes props to the parts, wraps the provider. Target about 300 lines; if it is above 450, write why in the report and add a BACKLOG item.
2. `rg -n "exhaustive-deps" src/features/prompt-bar`: for every remaining disable, either fix the dependency array (with a test if behavior could change) or log it in BACKLOG with the reason. Target: zero in `platform/`.
3. Remove code that became dead during the split (unused imports, unused memos). Do not remove anything still referenced.
4. `FlowPromptBoxSettings.jsx` (about 845 lines, hardcoded mode toggles and ratio/variation blocks) is OUT OF SCOPE: add a BACKLOG item `[Medium] FlowPromptBoxSettings.jsx | hardcoded mode/ratio blocks should be driven by the template | found during H6`.
5. Write `docs/prompt-bar/PLATFORM_STRUCTURE.md` (one page): the list of hooks and parts, what each owns, and the data flow (store, commands, hooks, parts).

DoD: suite green; docs written; line counts table in the report.

---

## Phase end: gate and acceptance test

1. Run the phase gate (`00_CORE.md` section 10).
2. Acceptance test; paste into `docs/prompt-bar-plan/reports/PHASE-P6-GATE.md`:

| # | Check |
|---|---|
| 1 | `git diff --stat <phase start>..HEAD -- tests/` shows NO edit of existing test files (only new ones, if any). |
| 2 | Full `npm test` passes. |
| 3 | `PromptBarPlatform.jsx` before and after line counts, and the number of `useEffect`, `useState`, `useMemo`, `useCallback` calls before and after. |
| 4 | Public props of the Platform are identical (diff of the props destructuring). |
| 5 | `rg -n "exhaustive-deps" src/features/prompt-bar/platform` is empty or each hit is in BACKLOG. |
| 6 | No new `.css` change and no JSX class name changed in moved blocks (state how you checked, for example a diff of class strings). |
| 7 | Manual smoke (NOT-RUN for the agent, human): ALL items of `HUMAN_GUIDE.md` section 6, with extra attention to the visual look of the bar in image, video/frames and video/reference modes. |

3. Write the gate report, update STATE.md with `Next step: human runs the full smoke checklist and compares the look of the bar, then gives P7 (08_P7_wrappers_routes_templates.md)`, print a summary (max 15 lines) and STOP.
