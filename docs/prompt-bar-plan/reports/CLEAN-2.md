# CLEAN-2 Report: Inject Template at Store Creation & Remove Post-Render `setTemplate` Effect

## 1. Decision Recorded (`PB-D-23`)
Recorded `PB-D-23` in `docs/prompt-bar-plan/DECISIONS.md` prior to code edits:
> The template is static per instance identity and is passed to the store factory at creation; later calls to `setTemplate` are ignored (first template wins) and the action stays exported as a deprecated shim.

## 2. Failing Tests First (`src/features/prompt-bar/__tests__/templateAtCreation.test.jsx`)
Added 4 hermetic tests and verified all 4 failed before implementation (`[VERIFIED]`):
1. **(a)** Store created through `PromptBarStoreProvider`/registry has `template` (`filterEligibleModels`, `resolveParameterMapping`, `createActions`, `minPromptLength`) synchronously during render BEFORE any React `useEffect` runs; `switchMode("video", "frames")` returns `ok` (not `MISSING_TEMPLATE`), with `setTemplate` spy call count `0`.
2. **(b)** Pending-actions drain path (`promptBarService({ templateId: "generated-media", projectId }).animateMedia(media)` called before mount, then mounting `PromptBarStoreProvider` without `PromptBarPlatform` child effects) applies the queued action on mount (`activeMode: "video"`, `activeSubMode: "frames"`, `input_image` attached) with `setTemplate` spy call count `0`.
3. **(c)** `renderToString` on the server (`window === undefined`) creates a non-registered store (`registry.list().length === 0`) that also has the template (`ssrStore.getState().template === generatedMediaTemplate`).
4. **(d)** Calling `setTemplate(characterTemplate)` after store creation with `generatedMediaTemplate` is ignored (`first template wins`).

## 3. Implementation Summary (`43 insertions(+), 35 deletions(-)` outside tests)
- `src/features/prompt-bar/store/PromptBarStoreContext.js`: Accepts `featureConfig` and `template` alongside `type`, resolves `effectiveTemplate`, and passes `{ template: effectiveTemplate }` to `createPromptBarStore` at creation time.
- `src/features/prompt-bar/platform/PromptBarPlatform.jsx`: Passes `featureConfig` to `<PromptBarStoreProvider>` and removes the post-render `useEffect(() => { if (featureConfig && setTemplate) setTemplate(featureConfig); }, ...)` and unused `setTemplate` selector. `PromptBarPlatform.jsx` now has `0` `useEffect` calls (`0` references to `setTemplate` in `src/features/prompt-bar/platform`).
- `src/features/prompt-bar/store/createPromptBarStore.js`: `setTemplate` kept as a deprecated shim that returns early if `deps.template || get().template` is already populated (first template wins).
- `src/features/prompt-bar/api/promptBarService.js` & `src/features/prompt-bar/templates/generatedMedia.template.js`: Fixed `animateMedia(media, options)` when drained from `sessionStorage` JSON queue where trailing `undefined` `options` was previously serialized as `null`.

## 4. Verification (`[VERIFIED]`)
- `Select-String -Pattern "setTemplate" src/features/prompt-bar/platform/*`: empty (`0` matches).
- `npx vitest run src/features/prompt-bar/__tests__/templateAtCreation.test.jsx`: `4 passed (4)`.
- Full `npm test -- --run`: `73 passed (73)`, `498 passed (498)`.
- `npm run build`: Passes cleanly.

## 5. Self-Review Rubric (2.3)
- Scope & Minimality: 20/20 (78 lines changed outside tests, <= 120 target)
- Tests & Hermeticity: 20/20
- Architecture & Purity: 20/20
- Honesty & Evidence: 20/20
- Zero Visual Change: 20/20
- **Total: 100/100**
