# Phase P7 Gate Report: Wrappers, PersistRoutes, Template Consolidation

**Phase Status: PASSED**
**Date: 2026-10-15**

## Acceptance Checklist

| # | Check | Status | Evidence / Notes |
|---|---|---|---|
| 1 | Every page that used the pair (type, config) now uses `GeneratedPromptBar` (list pages with file:line). | VERIFIED | `src/app/cinema-studio/[projectId]/assets/page.js:235`<br>`src/app/cinema-studio/[projectId]/collection/[collectionId]/page.js:145`<br>`src/widgets/StudioLayout/NewProjectView/NewProjectView.jsx:136`<br>`src/app/cinema-studio/test/prompt-bar-compare/page.jsx:65` |
| 2 | Route-policy tests include the two real studio paths and pass. | VERIFIED | `src/features/prompt-bar/__tests__/routePolicy.test.js` (14/14 passed) includes `/cinema-studio/:projectId/assets`, `/cinema-studio/:projectId/collection/*`, and rejects `/cinema-studio/:projectId/settings`. |
| 3 | The watcher is mounted exactly once (file:line). | VERIFIED | `src/app/cinema-studio/[projectId]/layout.js:29` mounted inside `StudioLayout`. |
| 4 | SAFE-2 tables and golden payloads are unchanged and green. | VERIFIED | `safe2TemplateRules.test.js` (37/37 passed) and `safe5Platform.test.jsx` (6/6 passed). |
| 5 | W4: tests pass, or the size guard is documented with the BACKLOG line. | VERIFIED | `promptOnlyTemplate.test.jsx` (5/5 passed). Size guard respected: 80 total lines changed (<150 limit). |
| 6 | Shims left are listed. Nothing was removed. | VERIFIED | Listed: `generatedMedia.config.js`, `generatedMedia.type.js`, `getActivePromptBarStore`, `setActivePromptBarStore`, `features/studio/index.js`, `useMediaActions.js`, `usePromptStore.js`. |
| 7 | Full `npm test` passes. | VERIFIED | 68 test files passed (473 tests passed), 0 failures. |
| 8 | Manual smoke (NOT-RUN for the agent, human). | NOT-RUN | Instructions provided for human verification (persistence across allowed routes, reset on disallowed route, Animate/Reuse buttons). |

---

## Shims Inventory (Scheduled for Removal in Phase P8)
1. `src/features/prompt-bar/features/generated-media/generatedMedia.config.js` -> forwards to `templates/generatedMedia.template.js`
2. `src/features/prompt-bar/composition/generatedMedia.type.js` -> forwards to `templates/generatedMedia.template.js`
3. `src/features/prompt-bar/store/PromptBarStoreContext.js` (`getActivePromptBarStore`, `setActivePromptBarStore`)
4. `src/features/studio/PromptBarStoreContext.js` & `src/features/studio/index.js`
5. `src/features/workflows/hooks/useMediaActions.js`
6. `src/features/prompt-bar/model/usePromptStore.js`
