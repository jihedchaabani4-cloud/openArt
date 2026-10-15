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
