# DECISIONS

| ID | Decision | Default |
|---|---|---|
| PB-D-01 | Approach | No rewrite. Refactor in place with small commits. After every commit the app still works and all tests are green |
| PB-D-02 | Renames and moves | Never without a shim at the old path (old imports keep working). Shim removal is phase P8 |
| PB-D-03 | Media on transitions | (a) Changing mode or sub-mode removes EVERY media parameter (declared type image, image[], video, video[]) from `parameterValues` and removes their `@tags` from the prompt. (b) Changing model inside the same mode keeps media parameters the new model declares with a compatible type, trims lists to the new max, drops the rest and their tags. (c) A media value is NEVER moved to another parameter implicitly; moving media between roles happens only inside an explicit service action (Animate, Add reference, Reuse). (d) Entities (`elements`, `characters`) are not parameters: their behavior stays as today. **OWNER MUST CONFIRM before P4 starts.** If the human edits this line, P4 follows the edited line |
| PB-D-04 | External actions | Animate, Add reference, Reuse settings go only through `promptBarService`. They are explicit transitions and return `{ ok, reason }` |
| PB-D-05 | Instance identity and storage key | `{ templateId, projectId, instanceId = "default" }`. Storage key `pb2:<templateId>:<instanceId>:<projectId or "global">`. Old keys (`<persistKey>_<projectId>`) are ignored (sessionStorage is per tab) |
| PB-D-06 | Store creation and hydration | Store creation is deterministic and never reads storage. Saved state is applied AFTER mount in an effect. The first client render equals the server render |
| PB-D-07 | What is persisted | `prompt`, `selectedModelId`, `parameterValues`, `elements`, `characters`, `activeMode`, `activeSubMode` (as they are today) with a `v: 2` field. Values that are `File`, `Blob`, `blob:` or `data:` are dropped. `isGenerating` is never persisted |
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
| PB-D-21 | 2026-10-15 | Inventory drift | Audit estimated ~36 source files, PromptBarPlatform.jsx ~1239 lines, createPromptBarStore.js ~333, PromptBarStoreContext.js ~181. Verified in repo: 61 total tracked files (9 test files, 52 source files including ui/editor components), PromptBarPlatform.jsx is 1112 lines, createPromptBarStore.js is 289 lines, PromptBarStoreContext.js is 153 lines. Repo facts win. |
