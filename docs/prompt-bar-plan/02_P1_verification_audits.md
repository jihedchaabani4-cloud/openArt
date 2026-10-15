# Phase P1: read-only verification audits

> Read `00_CORE.md` completely BEFORE this file.
> Scope of THIS file: audits V1 to V6. Do not read or start other phase files.
> Prerequisites: Phase P0 is DONE (check `docs/prompt-bar-plan/STATE.md`). If not, STOP and say so.

## Order of work in this session

1. Audits V1 to V6 in order. STRICTLY read-only on production code and on existing tests.
2. Write `VERDICTS.md` and `CONSUMERS.md`.
3. Phase gate, acceptance test, STOP.

## Why this phase exists

The earlier audit contains claims that were read from code but never run (for example the server/client hydration mismatch, the "stuck Generate button", and "Animate works because `input_image` stays"). The next phases change real behavior. We must not fix problems that do not exist, and we must not break behavior that something depends on. This phase turns each claim into CONFIRMED, REFUTED or PARTIAL, with evidence.

## Rules for ALL audits

- No change to production code, no migration, no change to existing tests. The only things you write are reports and, if you need to prove a claim, throwaway scripts or tests in `docs/prompt-bar-plan/scratch/` (never committed).
- You MAY read the backend folder (read-only) where a card says so. Never edit it.
- Evidence format: `path/file.js:123` plus a one-line statement. Tag VERIFIED / INFERRED / NOT-RUN.
- Findings go to BACKLOG.md; do not fix as you go.
- Report structure for `reports/<id>.md`: (1) scope in your own words, (2) method (commands run), (3) findings table, (4) answers to the questions, (5) verdict, (6) risks, (7) what you could not verify.
- Commit only reports, VERDICTS.md, CONSUMERS.md, BACKLOG.md, STATE.md: `pb1(<id>)`.

---

## V1: instances, mounting and project identity

Questions (answer all with evidence)
1. Where is a Prompt Bar mounted today? List every file that renders `PromptBarPlatform` (pages, widgets, test pages) and the props each passes (`persistKey`, `projectId`, `type`, `featureConfig`, `models`, `onGenerate`, `isGenerating`).
2. Can two bars be mounted at the SAME time (a modal over a page, `NewProjectView` plus a page, a character form)? Name the screens. This decides whether `instanceId` matters in practice.
3. How does `resolveProjectId()` (or its equivalent) get the project id: route params, pathname parsing, context, a store? Is that value available during server rendering of the page?
4. Are the pages that mount the bar client components only? Is the bar rendered during SSR or loaded with `dynamic(..., { ssr: false })`? Check `"use client"` boundaries and `next.config.*` (`reactStrictMode`).
5. Callers of `getActivePromptBarStore` and `setActivePromptBarStore` (file:line), and what each one expects.
6. Claim to settle: "Server renders with key `<persistKey>_global` and the client with `<persistKey>_<projectId>`, causing hydration mismatch." Verdict CONFIRMED / REFUTED / PARTIAL. If you can, prove it with `renderToString` in a scratch script.

## V2: legacy store consumers (produces CONSUMERS.md)

1. For `usePromptStore`, `useCharacterStore`, `useElementStore`: list every import and every field or action each consumer reads or writes (file:line).
2. Produce `docs/prompt-bar-plan/CONSUMERS.md`: table `consumer file | field/action | duplicates a field of the instance store? | class`, where class is `MIGRATE` (the same information also lives in the instance store: prompt, model id, mode, ratio...), `KEEP` (genuinely separate: drag state, character traits form), or `UNKNOWN`.
3. Dual-write sites: every place that writes the same information to both the instance store and `usePromptStore` (the audit points at `useMediaActions.js` around lines 150 to 180). Quote them.
4. Order proposal for the migration in P5: from the most isolated consumer to the least.

## V3: payload contract with the backend (READ-ONLY on the backend)

1. Where does the payload produced by `serialize` go? Follow `onGenerate` in each page to the API call (file:line) and the route it calls.
2. In the backend folder (sibling of the frontend, for example `apiOpenArt/`; find it with `ls ..`), find the validator or controller of those routes. Does it REJECT, IGNORE or ACCEPT parameters that the selected model does not declare? Does it require `references`, `elements` or `characters`? Does it read `input_image` / `images` from `parameters`, from `references`, or both?
3. Show, for the three fixture models, what the frontend sends today and what the backend reads. Mark any key that the backend needs but the model manifest does not declare.
4. Verdict for decision PB-D-12: A) "emit only declared parameters" is SAFE; B) NOT SAFE because of key X (say which and why). If B, propose the smallest rule that keeps the backend working.

## V4: Animate, Add reference and Reuse today

1. Trace `animateMedia`, `addMediaToPrompt`, `consumePendingPromptAction` (in `features/studio`) and `useMediaActions.js`: every step, in order, with file:line. Which store(s) are written, which are read?
2. Claim to settle: "Animate works because the image already sits in `input_image` when mode switches." Show the exact write that sets the Start Frame during Animate. Does Animate set `input_image` itself, or does it depend on the value that was already there? Prove with a scratch script or by reading. Verdict CONFIRMED / REFUTED / PARTIAL.
3. What does Animate do with the prompt (overwrite, append, only if empty)? What does Reuse set (mode, sub-mode, model, prompt, parameters)? Write the CURRENT semantics as a table: action | mode | model | prompt | parameters | media.
4. What happens when the bar is not mounted (the `setPendingPromptAction` queue in storage): who consumes it, when, how often? Can an action be consumed twice or lost?
5. How is the editor focused after an action (`document.querySelector('[contenteditable="true"]')` per the audit)? List the file:line.

## V5: persistence and generating state

1. What shapes can a media value have inside `parameterValues` and `elements` / `characters` (string, object with id and url, `File`)? Follow each upload and library-selection flow to the value that ends in the store. Can a `blob:` or `data:` value reach the store?
2. Every call site of `setIsGenerating` (file:line). In the pages' `handleGenerate`: is the reset in a `finally`? When the user navigates away mid-request, does the `finally` still run (the promise continues after unmount) and does it still reach the store instance? Verdict on the claim "Generate stays blocked after navigating back": CONFIRMED / REFUTED / PARTIAL. Say under what exact conditions it happens, if any.
3. Is `isGenerating` also passed from the parent as a prop (`isGenerating={isGeneratingMutation}`) and which one wins in the Platform?
4. Which keys exist in storage after a normal session (`Object.keys(sessionStorage)` reasoning from code), and does anything ever call `clearPersistentPromptBarStores`?

## V6: template and Platform branching

1. List every place in `PromptBarPlatform.jsx`, `FlowPromptBoxSettings.jsx`, `core/` and `store/` that branches on a mode, sub-mode, template id, or a parameter-name literal (file:line, the literal). Group them: (a) must move to the template, (b) legitimately generic, (c) UI-only.
2. Who consumes `characterType` today? Is there any screen that mounts a bar with it? What would be missing for a Character bar (the audit says: no slots, attachment bar off)?
3. Read `specs/033-prompt-bar-platform/` (if present) as background: list in 5 lines what it intended and where reality differs.
4. How many `useEffect`, `useState`, `useMemo`, `useCallback` calls does `PromptBarPlatform.jsx` have, and which effects write store state? (This list is the work list for P4 and P6.)

---

## VERDICTS.md (mandatory)

Create `docs/prompt-bar-plan/VERDICTS.md`:

| Claim | Source | Verdict | Evidence | Plan impact |
|---|---|---|---|---|
| Hydration mismatch between server and client keys | audit 3.5 | | V1 | decides how urgent task S3 is |
| Generate stays blocked after navigation | audit 3.4 | | V5 | decides scope of S4 |
| Animate relies on `input_image` carry-over | discussion | | V4 | decides whether PB-D-03 breaks Animate |
| Backend ignores undeclared parameters | PB-D-12 | | V3 | decides T1 |
| Two bars can be mounted at once | PB-D-05 | | V1 | decides whether `instanceId` is needed now |
| Legacy store duplicates prompt/model/mode | audit 2.4 | | V2 | defines X4/X5 |

Under the table write, for each phase P3 to P5, "tasks that become unnecessary or need a change" (one line each). Do NOT edit the phase files yourself; the human decides.

## Phase end: gate and acceptance test

1. Run the phase gate (`00_CORE.md` section 10).
2. Acceptance test; paste results into `docs/prompt-bar-plan/reports/PHASE-P1-GATE.md`:

| # | Check |
|---|---|
| 1 | A report exists for each of V1 to V6, with every claim tagged. |
| 2 | `git diff --stat <phase start>..HEAD` shows only files under `docs/prompt-bar-plan/`. |
| 3 | `VERDICTS.md` has a verdict (not blank) for all six rows. |
| 4 | `CONSUMERS.md` exists and classifies every consumer as MIGRATE, KEEP or UNKNOWN (UNKNOWN count is stated). |
| 5 | Full `npm test` passes unchanged. |

3. Write the gate report, update STATE.md with `Next step: human reads VERDICTS.md and CONSUMERS.md, confirms PB-D-03, then gives P2 (03_P2_contracts_and_pure_services.md)`, print a summary (max 15 lines) and STOP.
