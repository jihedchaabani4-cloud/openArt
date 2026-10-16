# BACKLOG

Format: `- [Severity] path/file.js:123 | what is wrong in one line | found during <task-id>`

- [Low] src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:294 | React Hook useStudioItemDrag is called conditionally | found during SETUP-1
- [Medium] src/features/prompt-bar/store/PromptBarStoreContext.js:142 | Render side-effect setActivePromptBarStore called directly in render body | found during V1
- [Medium] src/features/prompt-bar/store/PromptBarStoreContext.js:37 | resolveProjectId reads window.location.pathname causing SSR vs client key divergence | found during V1
- [Low] src/features/workflows/model/useMediaActions.js:185 | Direct DOM query document.querySelector('[contenteditable="true"]') used for focus | found during V4
- [Low] src/features/studio/core/mediaReferenceService.js:27 | setPendingPromptAction stores single object in sessionStorage rather than queue | found during V4
- [Medium] src/features/prompt-bar/store/PromptBarStoreContext.js:30 | clearPersistentPromptBarStores never called in production leading to persistentStoreRegistry memory leak | found during V5
- [Medium] src/features/prompt-bar/ui/common/MediaInput.jsx:51 | Temporary blob: URLs saved to sessionStorage and broken upon reload | found during V5
- [Medium] FlowPromptBoxSettings.jsx | hardcoded mode/ratio blocks should be driven by the template | found during H6
- [Medium] src/features/studio/useCharacterStore.js / SyncFeaturesPlugin | useCharacterStore singleton plus SyncFeaturesPlugin drive the character traits form outside the instance store | found during P7-FIX
- [Low] src/features/prompt-bar/ui/common/editor/PromptEditor.jsx:266 | PromptEditor.jsx console.error in Lexical onError | found during P7-FIX
- [Low] src/features/studio/index.js & src/features/workflows/hooks/useMediaActions.js | Remaining shims list: legacy studio re-exports (usePromptStore, useCharacterStore, tagsService, entityService) and useMediaActions delegation | found during P7-FIX
- [Low] git history | Commits 78cfa2c, b05f6ff, 9acb980, 7039973 and the P7 commits lack the pb<N>(<id>) prefix | found during P7-FIX
- [Medium] src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:176,294 | Pre-existing (d77da18e, non-prompt-bar): useStudioItemDrag is called after early return `if (!item) return null`, risking React hook-order crash if `item` transitions between null and object across renders | found during CHECK
- [Resolved] src/features/prompt-bar/**, src/features/studio/core/mediaReferenceService.js, src/features/workflows/model/useMediaActions.js, src/shared/ui/selector-card.jsx | 44 plan-added `no-unused-vars` warnings (`+22` prod, `+22` test) removed (`src/features/prompt-bar` warnings 71 -> 35 <= 37 base) | resolved in e54265f (CLEAN-1a) and 18856ef (CLEAN-1b)
- [Resolved] src/features/prompt-bar/platform/PromptBarPlatform.jsx & src/features/prompt-bar/store/PromptBarStoreContext.js | Template injected at store creation (PB-D-23); post-render `setTemplate(featureConfig)` `useEffect` removed from `PromptBarPlatform.jsx`; `setTemplate` retained as first-wins deprecated shim | resolved in b1c9d84 (CLEAN-2)
- [High] (backend repo) imageController.js / videoController.js / schemaValidator.js | parameters.images sent as a string bypasses Array.isArray ownership check while schemaValidator accepts non-array and imageGenerationNode resolves string IDs | found during CHECK — fix in backend task OWN-IMG
