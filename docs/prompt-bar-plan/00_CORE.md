# 00_CORE: rules, loop, review, decisions (read this with EVERY phase file)

> Place all plan files in `docs/prompt-bar-plan/` of the FRONTEND repo (the folder that contains `src/features/prompt-bar/`).
> Audience: the coding agent. Assume you are a careful junior engineer who has never seen this repo before.
> Everything is explained step by step on purpose. Follow the steps literally. Do not skip steps because they look obvious.
> You review your own work (section 2.3), record your decisions (section 12), and stop only for the reasons in section 1.5 and at the end of your phase (RUN MODE).

## Where is each section

| Section | File |
|---|---|
| RUN MODE, 0, 1, 2, 9, 10, 12 | `00_CORE.md` (this file) |
| P0: SETUP-1 and safety-net tests | `01_P0_setup_and_safety_net.md` |
| P1: read-only verification audits | `02_P1_verification_audits.md` |
| P2: contracts and pure services | `03_P2_contracts_and_pure_services.md` |
| P3: store identity, lifecycle, persistence | `04_P3_store_lifecycle.md` |
| P4: atomic transitions and payload | `05_P4_atomic_transitions_and_payload.md` |
| P5: promptBarService and legacy store migration | `06_P5_service_and_legacy_migration.md` |
| P6: split of `PromptBarPlatform.jsx` | `07_P6_platform_split.md` |
| P7: wrappers, persistRoutes, template consolidation | `08_P7_wrappers_routes_templates.md` |
| P8 (LOCKED), final summary | `09_FINAL_AND_P8.md` |
| Prompts and human checklist | `HUMAN_GUIDE.md` (for the human, not for the agent) |

When a text says "section N", open the file given by this table.

---

## RUN MODE (read this first)

`RUN_MODE = PHASE_STOP`. The human gives you ONE phase file per session and controls the pace.

- Read `AGENTS.md`, then this file completely, then ONLY the phase file named in the prompt. Do not open or start other phase files.
- Run ALL tasks of that phase without stopping between tasks (loop in section 2.1).
- When the last task is done: do the phase gate (section 10) and the acceptance test written at the END of the phase file. Write the gate report, set in STATE.md the line `Next step: <what> (waiting for the human)`, print a summary of at most 15 lines (what was done, test results, what failed or is NOT-RUN, report file names), and STOP.
- Never start another phase by yourself. Starting early is a violation of this plan.
- `SPEC_KIT` is always OFF for this plan. The task cards are the only spec. Never run `specify init`.

Stops from section 1.5 always apply.

---

## 0. How to read these files

### 0.1 Reading order

1. Read `AGENTS.md` first. If AGENTS.md and the plan files disagree, AGENTS.md wins. AGENTS.md may contain a line written by Spec Kit that points to `specs/033-prompt-bar-platform/plan.md`. That is an EARLIER plan of the same platform. You may read it as background to understand the original intent. It is NOT your task. If it disagrees with these plan files, these plan files win. Never edit that line or anything between Spec Kit markers (`<!-- SPECKIT ... -->`).
2. Read this file completely.
3. Read ONLY the phase file named in the prompt.
4. Your current position is always in `docs/prompt-bar-plan/STATE.md`.

### 0.2 Facts in the plan files are hints, not truth

Names, file paths, line numbers and behaviors below come from an earlier read-only audit ("Technical Audit: Current State of the Prompt Bar System") and from design conversations. Line numbers drift. Some audit claims were INFERRED, not run. Names used in these files include: `PromptBarPlatform.jsx`, `createPromptBarStore.js`, `PromptBarStoreContext.js`, `usePromptBarStore.js`, `reconciliation.js`, `serialization.js`, `modelManagement.js`, `tagsService.js`, `entityService.js`, `creditCalculationService.js`, `useRealBackendModels.js`, `generatedMedia.config.js`, `generatedMedia.type.js`, `character.type.js`, `usePromptStore.js`, `useCharacterStore.js`, `useMediaActions.js`, `getActivePromptBarStore`, `setPendingPromptAction`, `animateMedia`, `FlowPromptBoxSettings.jsx`.

Rule: before you rely on any name or line number, run a search and open the file. If the repo disagrees with this plan:
- For FACTS (what exists, what a function does): the repo wins.
- For INTENT (what we want to achieve): this plan wins.
- Write the difference as one line in `docs/prompt-bar-plan/DECISIONS.md`.

### 0.3 Phase map (one phase = one file = one session)

| Phase | Content | Kind | File |
|---|---|---|---|
| P0 | Setup + characterization tests (tests only, no production change) | tests | `01_...` |
| P1 | Verify the audit's unproven claims; map every consumer of the legacy store | read-only | `02_...` |
| P2 | Contracts (template, media ref, command result) and pure services extracted from the Platform | refactor | `03_...` |
| P3 | Registry outside React, hydration after mount, debounce, submit lifecycle | fixes | `04_...` |
| P4 | Atomic mode/model transitions, serialization contract, media commands | fixes | `05_...` |
| P5 | `promptBarService` facade, Animate/Reuse/Add reference, legacy store migration | feature + migration | `06_...` |
| P6 | Split `PromptBarPlatform.jsx` into hooks and UI parts | refactor | `07_...` |
| P7 | `GeneratedPromptBar` wrapper, `persistRoutes`, template consolidation, optional model/mode proof | feature | `08_...` |
| P8 | Character, Edit, Upscale templates, renames, shim removal | LOCKED, never start | `09_...` |

---

## 1. Operating contract (non-negotiable)

### 1.1 Glossary (plain words)

- **Instance**: one mounted Prompt Bar with its own state. Two bars on the same page are two instances.
- **Identity**: what tells instances apart: `{ templateId, projectId, instanceId }`. `instanceId` defaults to `"default"`.
- **Template**: the rules of one kind of bar (generated-media, character...): modes, slots, eligible models, mapping, extra actions. Today it is split into a "type" file and a "feature config" file.
- **Core**: shared logic with no knowledge of any template, no React, no Next.js, no UI.
- **Store**: the per-instance state container (vanilla Zustand). **Registry**: the module that creates and finds stores by identity. It lives OUTSIDE React.
- **Command**: a pure function `(state, args, deps) => result` that returns a patch. The store applies the patch in ONE `set()` call. No effect, no DOM, no network inside.
- **Service (facade)**: the public entry (`promptBarService`) that other parts of the app call to act on a bar. It routes the action to the right instance. It does not call the generation API.
- **Transition**: a change of mode, sub-mode or model, and everything that must be cleaned or converted because of it.
- **Media parameter**: a model parameter whose declared type is `image`, `image[]`, `video` or `video[]`.
- **Characterization test**: a test that pins what the code does TODAY (even if ugly) so a refactor can be proven not to change behavior.
- **Mutation check**: temporarily break the code under test and confirm the new test goes red, then restore. Proves the test can fail.
- **Shim**: a tiny file at an OLD path that re-exports from the NEW path so old imports keep working.
- **Hydration**: restoring saved state into a store after the component has mounted. **Hydration mismatch**: server HTML differs from the first client render.
- **Render side effect**: anything that writes (storage, Map, module variable, store) or reads storage while a component body runs. Forbidden.
- **Singleton**: one module-level variable that stands for "the current X". Forbidden for bar instances.
- **Hermetic test**: needs nothing from outside: no `.env`, no network, no backend, no real clock.
- **Failing test first**: write the test, see it FAIL for the right reason, then fix, then see it PASS.
- **REUSED / EXTENDED / CREATED**: for every file you touch, say whether you used it as is, changed it, or made it new.
- **Escalation**: a short file telling the human exactly what blocks you (format 2.6). **Backlog**: problems you noticed but are NOT fixing now.

### 1.2 Rules inherited from AGENTS.md (AGENTS.md wins on conflict)

If AGENTS.md lacks some of these rules, they STILL apply (block in 9.3).

1. One commit per task. Message: `pb<N>(<task-id>)`, for example `pb3(S2)`.
2. Failing test FIRST wherever behavior changes (see 2.1 step 3 for refactors and tests-only tasks).
3. Full `npm test` before every commit. Run `npm run lint` too if the script exists, and make sure it reports nothing NEW in the files you touched.
4. Secrets scan on `git diff --cached` before every commit (1.7).
5. Every report classifies touched things as REUSED / EXTENDED / CREATED.
6. No `console.*` in new or changed code. Use the repo's logger if one exists in the frontend (`rg -n "logger" src/shared src/lib`); if none exists, return a result object (`{ ok:false, reason }`) instead of logging. Never log prompts, tokens or signed URLs.
7. Do NOT push, tag, merge, rebase published history, or use `--force` / `--no-verify`.
8. Do NOT edit the backend (`apiOpenArt/` or any sibling backend folder). You MAY read it, read-only, for verification (phase P1 and card T1 say when).
9. No new dependency. If you believe one is unavoidable, escalate (1.5.1 style) instead of installing.

### 1.3 Autonomy rules

- Between TASKS of the same phase do NOT stop and do NOT wait for approval. Finish the task, write the report, update STATE.md, start the next. Between PHASES you never continue by yourself.
- Do NOT ask the human a question that this plan, AGENTS.md or DECISIONS.md already answers.
- Never invent product behavior. When a product choice is open, use the default in section 12 and log that you used it.
- Priority when two goals conflict: (1) the app keeps working for users, (2) data is not lost or leaked between instances/projects, (3) backward compatibility of imports and props, (4) simplicity, (5) convenience.
- NEVER rename or move an existing file, export, prop, hook, store field or route without leaving a shim at the old path (decision PB-D-02). Deleting shims is phase P8.
- Reuse first (REUSED > EXTENDED > CREATED).
- Fix only what is clearly wrong AND inside the current task. Everything else goes to `docs/prompt-bar-plan/BACKLOG.md` (format 2.8).
- No visual change. No CSS or markup change except moving code as-is.

### 1.4 Ambiguity decision tree (use it instead of asking the human)

1. Does this plan answer it? Use that.
2. Does AGENTS.md answer it? Use that.
3. Does section 12 (decisions) answer it? Use that.
4. Does the existing code already do something similar? Follow that pattern.
5. Otherwise choose the option that is: safer first, then more reversible, then smaller. Add a new decision line `PB-D-xx` in DECISIONS.md. Continue working.

### 1.5 The ONLY reasons to stop

1. A task still fails after 3 serious attempts (each = you read the error, changed something meaningful, re-ran). Write `docs/prompt-bar-plan/escalations/<task-id>.md` (format 2.6), mark the task `BLOCKED` in STATE.md, continue with tasks that do not depend on it. If every remaining task depends on it, stop.
2. The next step would be destructive or irreversible (force push, push, tag, merge, deleting someone's uncommitted work). Do not do it. Log it, continue.
3. The change would alter visible behavior that no decision allows (a user-visible regression you cannot avoid). Escalate, finish the current task without that change, stop at the phase gate.
4. The repo contradicts the plan so deeply that its intent cannot be applied (example: the Platform cannot be mounted in any test and the store has no seam for commands). Escalate and stop THAT phase only.

NOT stop reasons: no browser available, no backend, missing env vars, no network. For those, mark the check `NOT-RUN`, write the exact steps for the human in the report, and continue.

### 1.6 Honesty rules for reports

Tag every factual claim:
- `VERIFIED`: you ran a command or read the code. Add evidence: a command and a one-line result, or `path/file.js:123`.
- `INFERRED`: you reasoned about it but did not check it.
- `NOT-RUN`: could not be done here. Say why. Give the exact steps for the human.

Never write "should work", "probably passes", "looks fine" without a tag. Never write that tests pass unless you ran the FULL `npm test` in this session and saw it pass.

### 1.7 Cheat sheet of commands (adapt if a command is missing)

```
rg -n "pattern" src/ tests/                 # find usages (else: grep -rn)
rg -n --glob '!node_modules' "pattern"
git ls-files | rg "pattern"                 # find files by name
git status --short ; git diff ; git diff --cached --stat ; git diff --cached ; git log --oneline -n 10
cat package.json | rg -n '"test|"lint|"build|vitest|jest|node --test'
npm test ; npm run lint
npx vitest run path/to/file.test.jsx        # vitest files
node --test path/to/file.test.mjs           # node:test files
```
The repo currently has TWO test styles (per the audit: `*.test.jsx` with vitest and `*.test.mjs` with `node --test`). Find how `npm test` runs both. Write new tests in the style that fits the module (pure logic: `.mjs` + node:test if the neighbors do that; anything with React: vitest).

Secrets scan (fallback when AGENTS.md gives none). It must print NOTHING:
```
git diff --cached | rg -i "(secret|token|apikey|api_key|password|bearer\s+[a-z0-9]|sk-[a-z0-9]{10,}|eyJ[a-zA-Z0-9_-]{20,}|-----BEGIN)"
```
A variable NAME is fine; a real VALUE is not.

### 1.8 Working method

1. Before you edit a file, read the whole file (or the whole function and its imports).
2. Never guess a signature or a store field. Open the definition and search usages.
3. Before you change an exported function, run `rg -n "functionName"` and list the callers.
4. Keep diffs small. One concern per commit. Moving code and changing code are DIFFERENT commits.
5. After every edit run the relevant test file. Do not wait until the end.
6. If a command fails, read the whole error. Do not retry blindly.
7. Scratch notes and throwaway scripts go in `docs/prompt-bar-plan/scratch/` (never committed; the SETUP-1 task excludes it locally).
8. Write short reports. No full diffs.
9. No `TODO` in code without a matching BACKLOG line.
10. Before committing, re-read your own diff as if someone else wrote it.

### 1.9 Anti-patterns (forbidden)

- Editing or deleting an existing test only to make it pass. Allowed ONLY when a card says the behavior changes on purpose (name the card in the report), or the test is provably wrong (say so).
- Mocking the exact function you are supposed to test.
- A test that cannot fail.
- Claiming a check passed when you did not run it.
- Fixing unrelated things "while you are here".
- Adding `if (mode === "video")`, `if (templateId === ...)` or any template/mode literal to Core or store code. Rules of a template belong in the template.
- A module-level variable that remembers "the active bar" (or any per-instance state).
- Reading or writing `sessionStorage`/`localStorage`, creating stores, or writing to a registry inside a component body (render phase).
- A new `eslint-disable react-hooks/exhaustive-deps`. Existing ones in code you touch must be removed or logged in BACKLOG with the reason.
- A `useEffect` whose job is to repair state after a render (derive it, or do it in the command that changed the state).
- Importing React, Next, UI components or `features/<other>` into `core/` or into store modules.
- Persisting `File`, `Blob`, `blob:` URLs, `data:` URLs, or `isGenerating`.
- Moving a media value from one parameter key to another implicitly (decision PB-D-03).
- Silent no-ops: an action that cannot do its job returns `{ ok:false, reason }`.
- Running several tasks in one commit.

---

## 2. Task loop, test-writing guide, self-review, templates

### 2.1 The loop (do these steps in this order for EVERY task)

**Step 0: Preflight**
- `git status --short` must be clean (except `docs/prompt-bar-plan/`). Otherwise find out why.
- Run `npm test` once. Note the BASELINE (file and test counts). If red, say so in the report and list pre-existing failures; do not blame yourself for them.

**Step 1: Read** `docs/prompt-bar-plan/STATE.md`, the task card, the files the card names.

**Step 2: Inspect.** Use the searches in the card. Write `file:line: what it does` notes in `docs/prompt-bar-plan/scratch/<task-id>.md`.

**Step 3: Tests first.** Pick the case:
- (a) The task CHANGES behavior: write the failing test, run only that file, confirm it FAILS for the right reason.
- (b) The task is a behavior-PRESERVING refactor: the characterization tests from P0 (and any earlier tests) must already cover the area. Run them green BEFORE you edit. They stay UNTOUCHED. If coverage is missing, add characterization tests first (own commit, tests-only).
- (c) The task is tests-only: do the mutation check (break the code under test, see red, restore with `git checkout -- <file>` on your own unstaged edit).

**Step 4: Implement** the smallest change that satisfies the card.

**Step 5: Run tests.** The new/related test file, then full `npm test`, then lint on touched files. If an unrelated old test fails, your change is too broad.

**Step 6: Secrets scan.** `git add <specific files>` (never `git add -A`), run the scan on `git diff --cached`; it must print nothing.

**Step 7: Self-review** (2.3). Max 2 loops.

**Step 8: Commit** (one commit, correct message). Do not push.

**Step 9: Report and state.** `docs/prompt-bar-plan/reports/<task-id>.md` (2.4), STATE.md, BACKLOG.md.

**Step 10: Next task** (do not stop).

### 2.2 How to write a good test here

1. Open 2 or 3 existing tests near the code (for example `promptBarPersistence.test.jsx`, `tagsContract.test.mjs`) and copy their structure and helpers.
2. Name tests as sentences: `switching mode drops every media parameter and its prompt tag`.
3. Arrange / Act / Assert. Assert exact results (state fields, returned `{ok, reason}`, notification counts), not implementation details.
4. Stores: build with the vanilla factory, call actions via `store.getState()`, read via `store.getState()`. Count notifications with `store.subscribe` to prove "one `set()`".
5. Time: use fake timers for debounce. Storage: pass a fake object `{ getItem, setItem, removeItem }`; never touch the real one in pure tests. Pathname: pass it as an argument or mock `next/navigation` the way existing tests do.
6. SSR safety: call `renderToString` (from `react-dom/server`) on the provider tree in an environment without `window` access in the code path; assert it does not throw and renders default state.
7. Fixtures for models: three shapes (frames model with `input_image` + `last_frame`; images-list model with `images` + `input_image`; prompt-only model). Build them once in a shared fixtures file created in P0 (`SAFE-1`) and reuse everywhere. Shapes come from the audit section 4.1 (backend manifests: `canonicalInputs`, `capabilities`). Do not copy real secrets or URLs.
8. A test must be able to fail (mutation check).
9. When asserting "was NOT called", use a spy and assert call count 0.

### 2.3 Self-review (this replaces the external reviewer)

Review your own diff as a hostile reviewer. If your tool supports sub-agents, start a fresh one that sees ONLY: the diff, the task card, this rubric. Otherwise re-read the whole diff from scratch.

For each line write PASS or FAIL plus evidence (file:line or test name). Any open Critical or High blocks the commit.

**Architecture and lifecycle**

| Sev | Question | How to check |
|---|---|---|
| Critical | Can one instance's action change another instance's (or another project's) state? | Read how the target store is resolved. Is any module-level "active" variable involved? |
| High | Any render side effect (storage, registry write, store creation with side effects, module variable write) in a component body? | Read component bodies in the diff. |
| High | Does `core/` or a store module import React, Next, UI, or `features/<other>`? | `rg -n "from \"(react|next|@/features|@/widgets)" <touched core/store files>`. |
| High | Does a template/mode literal (`"video"`, `"frames"`, `"character"`, `"input_image"`) appear in Core or store code outside the constants module? | `rg` the diff. |
| High | Is any media value moved between parameter keys implicitly? | Read transition code against PB-D-03. |
| High | Does a state change happen in more than one `set()` for one user intention, or through an effect after render? | Count `set(` per command; look for new `useEffect` that writes state. |
| High | Do old import paths, exports, props and store fields still work (shims present)? | `rg` old names; run old tests untouched. |
| Medium | New or remaining `eslint-disable react-hooks/exhaustive-deps`? | `rg -n "exhaustive-deps" <touched files>`. |
| Medium | Hooks: complete dependency arrays, cleanup functions for listeners/timers/subscriptions? | Read each effect. |
| Medium | Any visible UI change (markup, classes, text)? | Read the JSX diff; moved code must be identical. |

**Data and persistence**

| Sev | Question | How to check |
|---|---|---|
| High | Could `File`, `Blob`, `blob:`, `data:` URLs or `isGenerating` reach storage? | Read the persisted-subset function and its test. |
| High | Is user data possibly lost on a normal path (navigation inside the allowed routes, model switch inside the same mode)? | Trace with the test fixtures. |
| Medium | Storage reads/writes wrapped in try/catch with a safe fallback? | Read each call. |
| Medium | Secrets, tokens, signed URLs in tests, docs, reports? | Secrets scan + read. |

**Tests and honesty**

| Sev | Question | How to check |
|---|---|---|
| High | Failing-first (or mutation check) done and shown in the report? Negative cases exist (wrong project, wrong instance, unmounted, no eligible model)? | Name the output. |
| High | Characterization tests untouched (unless the card allows)? | `git diff --stat tests/`. |
| High | Tests hermetic (no network, no backend, no `.env`)? | Read imports. |
| Medium | Tests assert behavior, not internals? | Would it pass after a harmless refactor? |
| High | Every report claim tagged VERIFIED / INFERRED / NOT-RUN? | Re-read the report. |

Scoring: start at 100. Critical = -40, High = -15, Medium = -5, Low = -2. To commit you need score >= 85 AND no open Critical or High. Put the score and findings in the report.

### 2.4 Report template (`docs/prompt-bar-plan/reports/<task-id>.md`)

```
# <task-id>: <title>
Status: DONE | DONE-WITH-FOLLOWUPS | BLOCKED
Commit: <sha> (not pushed)
Self-review score: NN/100 (loops: N)
Baseline `npm test` before: PASS|FAIL (N files / N tests)   After: PASS (N files / N tests)
Lint on touched files: clean | N new warnings

## What changed (REUSED / EXTENDED / CREATED)
- EXTENDED  src/features/prompt-bar/store/createPromptBarStore.js
- CREATED   src/features/prompt-bar/store/registry.js
- REUSED    tests fixtures

## Evidence (tag each: VERIFIED / INFERRED / NOT-RUN)
- VERIFIED: rg -n "activePromptBarStoreInstance" src/ => 0 hits after the change
- NOT-RUN: browser smoke test. Steps for the human: ...

## Tests
- New tests: (names)   - Failing-first or mutation check: <output line>   - Full npm test: PASS (N)

## Decisions taken (refs to DECISIONS.md)
## Follow-ups (also copied to BACKLOG.md)
## Manual checks for the human (exact steps)
```

### 2.5 STATE.md format

```
# STATE
Current phase: P<n>    Current task: <id>
Updated: <date>
Test status: <N pass, N fail>
Next step: <...>

| Task | Status (TODO/DONE/BLOCKED/SKIPPED) | Commit | Report |
|---|---|---|---|
| SETUP-1 | TODO | | |
```

### 2.6 Escalation file format (`docs/prompt-bar-plan/escalations/<task-id>.md`)

Write it so the human can paste it into a chat assistant in ONE message:
```
Task: <id>    Severity: CRITICAL | BLOCKER
Goal of the task (1 line):
What I tried (3 attempts, 1 line each):
Exact error or failing test output (only the relevant lines):
Relevant code (file:line, max 10 lines each):
Why I cannot decide alone:
The 2 options I see + my recommendation:
```

### 2.7 DECISIONS.md line format

```
PB-D-20 | 2026-10-16 | Question: ... | Options: A ..., B ... | Chosen: A | Reason: safer and reversible
```

### 2.8 BACKLOG.md line format

```
- [Severity] path/file.js:123 | what is wrong in one line | found during <task-id>
```

### 2.9 Failure and rollback

- If your change breaks unrelated tests, revert your own unstaged edit in that file (`git checkout -- <file>`) and approach again. Do not edit unrelated tests.
- If a move/rename would break an import you cannot shim, stop that task (1.5.3).
- Never rewrite or squash commits that exist before you started.

---

## 9. Appendix: checklists

### 9.1 Pre-commit checklist (run mentally before EVERY commit)

- [ ] Failing test first (or characterization green before + mutation check for tests-only).
- [ ] New tests pass; FULL `npm test` passes; lint shows nothing new in touched files.
- [ ] `git diff --cached --stat` shows only files that belong to this task.
- [ ] Secrets scan printed nothing.
- [ ] `rg -n "console\." <touched src files>` prints nothing NEW.
- [ ] No render side effect, no module-level "active" variable, no new `exhaustive-deps` disable.
- [ ] Old import paths and props still work (shims).
- [ ] No backend file edited. Nothing pushed.
- [ ] Self-review score >= 85, no open Critical or High.
- [ ] Report exists, claims tagged, STATE.md updated.

### 9.2 Move/extract checklist (for P2, P5, P6)

- [ ] The moved code is byte-for-byte the same logic (copy, then adapt only imports and parameters).
- [ ] The old location calls the new one or re-exports it.
- [ ] Characterization tests green before AND after, untouched.
- [ ] Line count of the source file dropped (write the before/after numbers in the report).
- [ ] The move is its own commit, separate from any behavior change.

### 9.3 `Project rules` block for AGENTS.md (SETUP-1 adds it if missing)

Put it ABOVE any Spec Kit markers. Never edit or delete anything between Spec Kit markers or the pointer line to `specs/.../plan.md`.

```
## Prompt bar plan rules
- Before any task, read docs/prompt-bar-plan/00_CORE.md and the phase file the human names. The plan files win over any Spec Kit file.
- One commit per task (`pb<N>(<id>)`). Failing test first. Full `npm test` before every commit (no network, no backend).
- Secrets scan on `git diff --cached` before every commit.
- No console.* in new code. Never log prompts, tokens or signed URLs.
- Never push, tag, merge, or edit the backend. No new dependencies.
- No render side effects, no module-level "active bar" variable, no new exhaustive-deps disables.
- Never rename or move existing exports without leaving a shim at the old path.
- No visual change.
```

---

## 10. Phase gates (do these at the end of EVERY phase, without asking the human)

1. Full `npm test` is green (or the same pre-existing failures as the P0 baseline, listed).
2. `npm run lint` shows nothing new in files changed in this phase. `npm run build`: run it if it works without secrets, otherwise `NOT-RUN` with the reason.
3. `git status --short` shows nothing uncommitted except `docs/prompt-bar-plan/scratch/`. Nothing pushed.
4. STATE.md updated; every task has a report (or a SKIPPED/BLOCKED note with its escalation file).
5. Cross-checks (fix tiny things inside the phase scope; everything else to BACKLOG):
   - `rg -n "console\." <files changed in this phase>`: nothing new.
   - `rg -n "exhaustive-deps" src/features/prompt-bar`: count is not higher than at the start of the phase.
   - `rg -n "activePromptBarStoreInstance|getActivePromptBarStore" src/`: the count matches what the phase file says.
6. Write `docs/prompt-bar-plan/reports/PHASE-P<n>-GATE.md`: max 10 lines of summary, open follow-ups, manual checks for the human (browser smoke steps from `HUMAN_GUIDE.md` section 6 that apply).
7. Run the phase acceptance test at the END of the phase file; paste results in the gate report.
8. Set `Next step: <what the human should do next> (waiting for the human)` in STATE.md, print the summary (max 15 lines), STOP.

---

## 12. DECISIONS.md seed (use these defaults, do not ask)

| ID | Decision | Default |
|---|---|---|
| PB-D-01 | Approach | No rewrite. Refactor in place with small commits. After every commit the app still works and all tests are green |
| PB-D-02 | Renames and moves | Never without a shim at the old path (old imports keep working). Shim removal is phase P8 |
| PB-D-03 | Media on transitions | (a) Changing mode or sub-mode removes EVERY media parameter (declared type image, image[], video, video[]) from `parameterValues` and removes their `@tags` from the prompt. (b) Changing model inside the same mode keeps media parameters the new model declares with a compatible type, trims lists to the new max, drops the rest and their tags. (c) A media value is NEVER moved to another parameter implicitly; moving media between roles happens only inside an explicit service action (Animate, Add reference, Reuse). (d) Entities (`elements`, `characters`) are not parameters: their behavior stays as today. **OWNER MUST CONFIRM before P4 starts.** If the human edits this line, P4 follows the edited line |
| PB-D-04 | External actions | Animate, Add reference, Reuse settings go only through `promptBarService`. They are explicit transitions and return `{ ok, reason }` |
| PB-D-05 | Instance identity and storage key | `{ templateId, projectId, instanceId = "default" }`. Storage key `pb2:<templateId>:<instanceId>:<projectId or "global">`. Old keys (`<persistKey>_<projectId>`) are ignored (sessionStorage is per tab) |
| PB-D-06 | Store creation and hydration | Store creation is deterministic and never reads storage. Saved state is applied AFTER mount in an effect. The first client render equals the server render |
| PB-D-07 | What is persisted | `prompt`, `selectedModelId`, `parameterValues`, `activeMode`, `activeSubMode`, `elements`, `characters` (as they are today) with a `v: 2` field. Values that are `File`, `Blob`, `blob:` or `data:` are dropped. `isGenerating` is never persisted |
| PB-D-08 | `isGenerating` | It is UI submit state. Set only through `beginSubmit`/`endSubmit`. On mount, if the store says generating but the registry has no in-flight submit for it, reset to false. The generation job state belongs to the backend |
| PB-D-09 | Persistence writes | Trailing debounce 300 ms, flush on unmount and on `pagehide`. Constant lives in one config file |
| PB-D-10 | Registry memory | When a provider mounts for project P, unmounted instances of OTHER projects are disposed from memory (their sessionStorage copy stays). Mounted instances are never disposed |
| PB-D-11 | Core purity | `core/` and the store modules (except the React provider file) import no React, Next, UI, or other features. The React Query hook moves to `adapters/` with a shim at the old path |
| PB-D-12 | Payload contract | `serialize` emits only parameters the selected model declares, plus the contract fields it emits today (`references`, `elements`, `characters`). Phase P1 card V3 verifies this against the backend (read-only). If V3 shows the backend REQUIRES an undeclared key, keep it and log a BACKLOG item instead |
| PB-D-13 | Model and mode optional | A template may have no model selector and no modes. This is proven by a test-only template in P7 (W4), not by changing the UI |
| PB-D-14 | `persistRoutes` | Segment-aware match with `:param` wildcards (for example `/cinema-studio/:projectId/assets`). Leaving the allowed routes resets that instance and removes its storage key, unless a submit is in flight. Evaluated by one watcher hook in the studio layout |
| PB-D-15 | Zustand | Stay on vanilla stores created per instance. No `persist` middleware, no new dependency |
| PB-D-16 | Credits and pricing | Client estimate only. The backend is authoritative. Do not touch pricing code |
| PB-D-17 | Legacy `usePromptStore` | Stays until each consumer is migrated one by one (P5). Drag state stays there. No deletion of the file in this plan |
| PB-D-18 | New templates | Character, Edit, Upscale are LOCKED (P8). The generated-media template is the only real template in this plan |
| PB-D-19 | Template shape | Template rules are plain data plus small pure functions in one object validated by `defineTemplate` |
| PB-D-20 | Unknown scope | If a card mentions a file or behavior you cannot find, search first; if still missing, write one line in DECISIONS.md and skip only that sub-step |

Add new decisions as `PB-D-21`, `PB-D-22`, ... using the line format in 2.7. Never deviate silently.
