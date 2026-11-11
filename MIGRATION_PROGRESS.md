# MIGRATION PROGRESS

> Full design-system replacement tracking (rip-and-replace to Higgsfield "Cinema Studio" design system).
> Single source of truth: `design-system.md` (§1 Tokens, §2 Typography, §3 Buttons, §4 Chips, §5 Overlays, §6 Nav, §7 Cards, §8 Shell, §9 Motion).

## Summary

- Total items: 183 / 183 migrated (100% DONE)
- Shared primitives: 40 (DONE)
- Components: 1 (DONE)
- Widgets: 34 (DONE)
- Feature UI components: 59 (DONE)
- Views: 9 (DONE)
- Pages & layouts: 40 (DONE)
- Vitest suite: 141/141 test files passed, 924/924 tests passed (100%)
- Next.js build: Turbopack production build succeeded with 30/30 static and dynamic routes compiled.

## Component Inventory Table

| Component | File path(s) | Category | Used in (count) | Status |
|---|---|---|---|---|
| accordion | `src/shared/ui/accordion.jsx` | Shared Primitive | 1 | DONE |
| action-button | `src/shared/ui/action-button.jsx` | Shared Primitive | 6 | DONE |
| avatar | `src/shared/ui/avatar.jsx` | Shared Primitive | 3 | DONE |
| badge | `src/shared/ui/badge.jsx` | Shared Primitive | 14 | DONE |
| button-group | `src/shared/ui/button-group.jsx` | Shared Primitive | 7 | DONE |
| button | `src/shared/ui/button.jsx` | Shared Primitive | 87 | DONE |
| card | `src/shared/ui/card.jsx` | Shared Primitive | 31 | DONE |
| checkbox | `src/shared/ui/checkbox.jsx` | Shared Primitive | 4 | DONE |
| collapsible | `src/shared/ui/collapsible.jsx` | Shared Primitive | 3 | DONE |
| ConfirmDeleteDialog | `src/shared/ui/ConfirmDeleteDialog.jsx` | Shared Primitive | 15 | DONE |
| context-menu | `src/shared/ui/context-menu.jsx` | Shared Primitive | 4 | DONE |
| CreateFolderDialog | `src/shared/ui/CreateFolderDialog.jsx` | Shared Primitive | 4 | DONE |
| dialog | `src/shared/ui/dialog.jsx` | Shared Primitive | 16 | DONE |
| dropdown-menu | `src/shared/ui/dropdown-menu.jsx` | Shared Primitive | 10 | DONE |
| DropdownShell | `src/shared/ui/DropdownShell.jsx` | Shared Primitive | 1 | DONE |
| EditableDisplayName | `src/shared/ui/EditableDisplayName.jsx` | Shared Primitive | 3 | DONE |
| file-tree | `src/shared/ui/file-tree.jsx` | Shared Primitive | 1 | DONE |
| FlowErrorTile | `src/shared/ui/FlowErrorTile.jsx` | Shared Primitive | 2 | DONE |
| FolderGlyphIcon | `src/shared/ui/FolderGlyphIcon.jsx` | Shared Primitive | 2 | DONE |
| GoogleIcon | `src/shared/ui/GoogleIcon.jsx` | Shared Primitive | 77 | DONE |
| hover-card | `src/shared/ui/hover-card.jsx` | Shared Primitive | 2 | DONE |
| InlineRenamePill | `src/shared/ui/InlineRenamePill.jsx` | Shared Primitive | 1 | DONE |
| input | `src/shared/ui/input.jsx` | Shared Primitive | 34 | DONE |
| layout | `src/shared/ui/layout.jsx` | Shared Primitive | 23 | DONE |
| LoadingScreen | `src/shared/ui/LoadingScreen.jsx` | Shared Primitive | 12 | DONE |
| MoveToDialog | `src/shared/ui/MoveToDialog.jsx` | Shared Primitive | 3 | DONE |
| popover | `src/shared/ui/popover.jsx` | Shared Primitive | 6 | DONE |
| ProcessingCard | `src/shared/ui/ProcessingCard.jsx` | Shared Primitive | 5 | DONE |
| radio-group | `src/shared/ui/radio-group.jsx` | Shared Primitive | 3 | DONE |
| select | `src/shared/ui/select.jsx` | Shared Primitive | 61 | DONE |
| selector-card | `src/shared/ui/selector-card.jsx` | Shared Primitive | 1 | DONE |
| selector-slide | `src/shared/ui/selector-slide.jsx` | Shared Primitive | 1 | DONE |
| ShineText | `src/shared/ui/ShineText.jsx` | Shared Primitive | 4 | DONE |
| skeleton | `src/shared/ui/skeleton.jsx` | Shared Primitive | 5 | DONE |
| slider | `src/shared/ui/slider.jsx` | Shared Primitive | 2 | DONE |
| surface | `src/shared/ui/surface.jsx` | Shared Primitive | 44 | DONE |
| switch | `src/shared/ui/switch.jsx` | Shared Primitive | 7 | DONE |
| tabs | `src/shared/ui/tabs.jsx` | Shared Primitive | 2 | DONE |
| textarea | `src/shared/ui/textarea.jsx` | Shared Primitive | 9 | DONE |
| tooltip | `src/shared/ui/tooltip.jsx` | Shared Primitive | 2 | DONE |
| LoginDialog | `src/components/LoginDialog.jsx` | Component | 4 | DONE |
| CharacterEditNavbar | `src/widgets/CharacterEditNavbar/CharacterEditNavbar.jsx` | Widget | 3 | DONE |
| CoreMediaItemView | `src/widgets/CoreMediaItemView/CoreMediaItemView.jsx` | Widget | 6 | DONE |
| EditMediaView | `src/widgets/EditMediaView/EditMediaView.jsx` | Widget | 5 | DONE |
| EditNavbar | `src/widgets/EditNavbar/EditNavbar.jsx` | Widget | 5 | DONE |
| ElementEditNavbar | `src/widgets/ElementEditNavbar/ElementEditNavbar.jsx` | Widget | 3 | DONE |
| EntityEditNavbar | `src/widgets/EntityEditNavbar/EntityEditNavbar.jsx` | Widget | 4 | DONE |
| NavbarCore | `src/widgets/NavbarCore/NavbarCore.jsx` | Widget | 6 | DONE |
| NavbarAction | `src/widgets/NavbarCore/ui/NavbarAction.jsx` | Widget | 4 | DONE |
| NavbarBackButton | `src/widgets/NavbarCore/ui/NavbarBackButton.jsx` | Widget | 3 | DONE |
| NavbarDivider | `src/widgets/NavbarCore/ui/NavbarDivider.jsx` | Widget | 2 | DONE |
| NavbarInput | `src/widgets/NavbarCore/ui/NavbarInput.jsx` | Widget | 2 | DONE |
| NavbarSlots | `src/widgets/NavbarCore/ui/NavbarSlots.jsx` | Widget | 2 | DONE |
| NavbarTitle | `src/widgets/NavbarCore/ui/NavbarTitle.jsx` | Widget | 4 | DONE |
| UserDropdown | `src/widgets/navigation/UserDropdown.jsx` | Widget | 8 | DONE |
| NewElementDialog | `src/widgets/NewElementDialog/NewElementDialog.jsx` | Widget | 3 | DONE |
| ProjectsFloatingAction | `src/widgets/projects/ui/ProjectsFloatingAction.jsx` | Widget | 1 | DONE |
| ProjectsGrid | `src/widgets/projects/ui/ProjectsGrid.jsx` | Widget | 1 | DONE |
| projects | `src/widgets/projects.jsx` | Widget | 22 | DONE |
| ProjectsNavbar | `src/widgets/ProjectsNavbar/ProjectsNavbar.jsx` | Widget | 2 | DONE |
| PromoSlider | `src/widgets/PromoSlider.jsx` | Widget | 1 | DONE |
| CollectionMediaGridItem | `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/CollectionMediaGridItem.jsx` | Widget | 2 | DONE |
| MediaGridItem | `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx` | Widget | 10 | DONE |
| StudioItemMenu | `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu.jsx` | Widget | 4 | DONE |
| StudioMediaGridCard | `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioMediaGridCard.jsx` | Widget | 2 | DONE |
| TrashMediaGridCard | `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/TrashMediaGridCard.jsx` | Widget | 2 | DONE |
| LeftNavigationRail | `src/widgets/StudioLayout/LeftNavigationRail.jsx` | Widget | 1 | DONE |
| NewProjectView | `src/widgets/StudioLayout/NewProjectView/NewProjectView.jsx` | Widget | 2 | DONE |
| StudioNavbar | `src/widgets/StudioNavbar/StudioNavbar.jsx` | Widget | 3 | DONE |
| NavbarImportButton | `src/widgets/StudioNavbar/ui/NavbarImportButton.jsx` | Widget | 1 | DONE |
| NavbarRestoreAllButton | `src/widgets/StudioNavbar/ui/NavbarRestoreAllButton.jsx` | Widget | 1 | DONE |
| StudioNavbarCenter | `src/widgets/StudioNavbar/ui/StudioNavbarCenter.jsx` | Widget | 1 | DONE |
| StudioNavbarLeft | `src/widgets/StudioNavbar/ui/StudioNavbarLeft.jsx` | Widget | 1 | DONE |
| StudioNavbarRight | `src/widgets/StudioNavbar/ui/StudioNavbarRight.jsx` | Widget | 1 | DONE |
| StudioSettingsDropdown | `src/widgets/StudioNavbar/ui/StudioSettingsDropdown.jsx` | Widget | 1 | DONE |
| AssetDetailNavbar | `src/features/assets/ui/AssetDetailNavbar.jsx` | Feature UI | 2 | DONE |
| AssetsGroupSection | `src/features/assets/ui/AssetsGroupSection.jsx` | Feature UI | 2 | DONE |
| AssetsNavbar | `src/features/assets/ui/AssetsNavbar.jsx` | Feature UI | 2 | DONE |
| AssetsSelectionBar | `src/features/assets/ui/AssetsSelectionBar.jsx` | Feature UI | 2 | DONE |
| AssetsSidebar | `src/features/assets/ui/AssetsSidebar.jsx` | Feature UI | 2 | DONE |
| LibraryMediaGridItem | `src/features/assets/ui/LibraryMediaGridItem.jsx` | Feature UI | 2 | DONE |
| SidebarFilterButton | `src/features/assets/ui/SidebarFilterButton.jsx` | Feature UI | 2 | DONE |
| CharacterDetailsGallery | `src/features/characters/ui/CharacterDetailsGallery.jsx` | Feature UI | 2 | DONE |
| CharacterInfoSidebar | `src/features/characters/ui/CharacterInfoSidebar.jsx` | Feature UI | 2 | DONE |
| CharacterSheetSection | `src/features/characters/ui/CharacterSheetSection.jsx` | Feature UI | 2 | DONE |
| CharacterTabSwitch | `src/features/characters/ui/CharacterTabSwitch.jsx` | Feature UI | 2 | DONE |
| FlowCharacterImagePreview | `src/features/characters/ui/FlowCharacterImagePreview.jsx` | Feature UI | 3 | DONE |
| ElementDetailsGallery | `src/features/elements/ui/ElementDetailsGallery.jsx` | Feature UI | 2 | DONE |
| ElementInfoSidebar | `src/features/elements/ui/ElementInfoSidebar.jsx` | Feature UI | 2 | DONE |
| ElementsEmptyState | `src/features/elements/ui/ElementsEmptyState.jsx` | Feature UI | 2 | DONE |
| HowToDrawer | `src/features/elements/ui/HowToDrawer.jsx` | Feature UI | 3 | DONE |
| AssetListItem | `src/features/media/ui/AssetListItem.jsx` | Feature UI | 3 | DONE |
| ImportMediaListView | `src/features/media/ui/ImportMediaDialog/ImportMediaListView.jsx` | Feature UI | 3 | DONE |
| ImportMediaPopover | `src/features/media/ui/ImportMediaDialog/ImportMediaPopover.jsx` | Feature UI | 6 | DONE |
| KeyboardShortcutsHelp | `src/features/media/ui/ImportMediaDialog/keyboard/KeyboardShortcutsHelp.jsx` | Feature UI | 1 | DONE |
| MediaCard | `src/features/media/ui/MediaCard.jsx` | Feature UI | 3 | DONE |
| MediaRenderer | `src/features/media/ui/MediaRenderer.jsx` | Feature UI | 4 | DONE |
| MediaTile | `src/features/media/ui/MediaTile.jsx` | Feature UI | 3 | DONE |
| MediaView | `src/features/media/ui/MediaView.jsx` | Feature UI | 13 | DONE |
| MediaViewCard | `src/features/media/ui/MediaViewCard.jsx` | Feature UI | 3 | DONE |
| ReferenceMediaGalleryGrid | `src/features/media/ui/ReferenceMediaGalleryGrid.jsx` | Feature UI | 4 | DONE |
| SharedGalleryGrid | `src/features/media/ui/SharedGalleryGrid.jsx` | Feature UI | 8 | DONE |
| PackageSelectionDialog | `src/features/payments/ui/PackageSelectionDialog.jsx` | Feature UI | 3 | DONE |
| PricingSection | `src/features/payments/ui/PricingSection.jsx` | Feature UI | 2 | DONE |
| ProjectCard | `src/features/projects/ui/ProjectCard.jsx` | Feature UI | 1 | DONE |
| ProjectError | `src/features/projects/ui/ProjectError.jsx` | Feature UI | 3 | DONE |
| PromptBarControlsRow | `src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx` | Feature UI | 1 | DONE |
| PromptBarSlotsRow | `src/features/prompt-bar/platform/parts/PromptBarSlotsRow.jsx` | Feature UI | 1 | DONE |
| PromptBarTopPanel | `src/features/prompt-bar/platform/parts/PromptBarTopPanel.jsx` | Feature UI | 1 | DONE |
| PromptBarPlatform | `src/features/prompt-bar/platform/PromptBarPlatform.jsx` | Feature UI | 5 | DONE |
| CharacterPromptBar | `src/features/prompt-bar/templates/CharacterPromptBar.jsx` | Feature UI | 2 | DONE |
| GeneratedPromptBar | `src/features/prompt-bar/templates/GeneratedPromptBar.jsx` | Feature UI | 5 | DONE |
| CharacterFeatureEditor | `src/features/prompt-bar/ui/character/CharacterFeatureEditor.jsx` | Feature UI | 2 | DONE |
| AtMentionMenu | `src/features/prompt-bar/ui/common/editor/AtMentionMenu.jsx` | Feature UI | 3 | DONE |
| FeatureNode | `src/features/prompt-bar/ui/common/editor/FeatureNode.jsx` | Feature UI | 3 | DONE |
| MentionNode | `src/features/prompt-bar/ui/common/editor/MentionNode.jsx` | Feature UI | 4 | DONE |
| MentionPlugin | `src/features/prompt-bar/ui/common/editor/MentionPlugin.jsx` | Feature UI | 1 | DONE |
| MentionTag | `src/features/prompt-bar/ui/common/editor/MentionTag.jsx` | Feature UI | 3 | DONE |
| SyncFeaturesPlugin | `src/features/prompt-bar/ui/common/editor/plugins/SyncFeaturesPlugin.jsx` | Feature UI | 1 | DONE |
| TextTagConverterPlugin | `src/features/prompt-bar/ui/common/editor/plugins/TextTagConverterPlugin.jsx` | Feature UI | 1 | DONE |
| PromptEditor | `src/features/prompt-bar/ui/common/editor/PromptEditor.jsx` | Feature UI | 1 | DONE |
| MediaInput | `src/features/prompt-bar/ui/common/MediaInput.jsx` | Feature UI | 3 | DONE |
| PromptBarShell | `src/features/prompt-bar/ui/common/PromptBarShell.jsx` | Feature UI | 2 | DONE |
| ReferenceButton | `src/features/prompt-bar/ui/common/ReferenceButton.jsx` | Feature UI | 3 | DONE |
| BaseSelector | `src/features/prompt-bar/ui/common/selectors/BaseSelector.jsx` | Feature UI | 8 | DONE |
| DurationSelector | `src/features/prompt-bar/ui/common/selectors/DurationSelector.jsx` | Feature UI | 2 | DONE |
| FeatureModeSelector | `src/features/prompt-bar/ui/common/selectors/FeatureModeSelector.jsx` | Feature UI | 1 | DONE |
| FlowPromptBoxSettings | `src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx` | Feature UI | 3 | DONE |
| QualitySelector | `src/features/prompt-bar/ui/common/selectors/QualitySelector.jsx` | Feature UI | 1 | DONE |
| RatioSelector | `src/features/prompt-bar/ui/common/selectors/RatioSelector.jsx` | Feature UI | 2 | DONE |
| VariationSelector | `src/features/prompt-bar/ui/common/selectors/VariationSelector.jsx` | Feature UI | 2 | DONE |
| VideoResolutionSelector | `src/features/prompt-bar/ui/common/selectors/VideoResolutionSelector.jsx` | Feature UI | 1 | DONE |
| TrashView | `src/features/trash/ui/TrashView.jsx` | Feature UI | 2 | DONE |
| WorkflowMediaGallery | `src/features/workflows/ui/WorkflowMediaGallery.jsx` | Feature UI | 2 | DONE |
| AssetDetailPage | `src/views/AssetDetailPage.jsx` | View | 2 | DONE |
| AssetsLibraryPage | `src/views/AssetsLibraryPage.jsx` | View | 2 | DONE |
| BentoFeatures | `src/views/landing/components/BentoFeatures.jsx` | View | 1 | DONE |
| HeroSection | `src/views/landing/components/HeroSection.jsx` | View | 1 | DONE |
| ModelSlider | `src/views/landing/components/ModelSlider.jsx` | View | 1 | DONE |
| ModelsShowcase | `src/views/landing/components/ModelsShowcase.jsx` | View | 1 | DONE |
| LandingPage | `src/views/LandingPage.jsx` | View | 2 | DONE |
| NewProjectPage | `src/views/NewProjectPage.jsx` | View | 2 | DONE |
| ProjectsPage | `src/views/ProjectsPage.jsx` | View | 4 | DONE |
| apps/[slug]/page.js | `src/app/apps/[slug]/page.js` | Page / Layout | 1 | DONE |
| assets/layout.js | `src/app/assets/layout.js` | Page / Layout | 1 | DONE |
| assets/page.js | `src/app/assets/page.js` | Page / Layout | 1 | DONE |
| assets/[workflowId]/layout.js | `src/app/assets/[workflowId]/layout.js` | Page / Layout | 1 | DONE |
| assets/[workflowId]/page.js | `src/app/assets/[workflowId]/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/layout.js | `src/app/cinema-studio/layout.js` | Page / Layout | 1 | DONE |
| cinema-studio/new/page.js | `src/app/cinema-studio/new/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/page.js | `src/app/cinema-studio/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/test/processing-card/page.jsx | `src/app/cinema-studio/test/processing-card/page.jsx` | Page / Layout | 1 | DONE |
| cinema-studio/test/prompt-bar-compare/page.jsx | `src/app/cinema-studio/test/prompt-bar-compare/page.jsx` | Page / Layout | 1 | DONE |
| cinema-studio/test/testanimation/page.jsx | `src/app/cinema-studio/test/testanimation/page.jsx` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/assets/edit/[workflowId]/page.js | `src/app/cinema-studio/[projectId]/assets/edit/[workflowId]/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/assets/page.js | `src/app/cinema-studio/[projectId]/assets/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/characters/new/page.js | `src/app/cinema-studio/[projectId]/characters/new/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/characters/page.js | `src/app/cinema-studio/[projectId]/characters/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/characters/[workflowId]/layout.js | `src/app/cinema-studio/[projectId]/characters/[workflowId]/layout.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/characters/[workflowId]/page.js | `src/app/cinema-studio/[projectId]/characters/[workflowId]/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/collection/[collectionId]/page.jsx | `src/app/cinema-studio/[projectId]/collection/[collectionId]/page.jsx` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/collections/[collectionId]/page.js | `src/app/cinema-studio/[projectId]/collections/[collectionId]/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/edit/layout.js | `src/app/cinema-studio/[projectId]/edit/layout.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/edit/[workflowId]/page.js | `src/app/cinema-studio/[projectId]/edit/[workflowId]/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/elements/edit/layout.js | `src/app/cinema-studio/[projectId]/elements/edit/layout.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/elements/edit/[workflowId]/page.js | `src/app/cinema-studio/[projectId]/elements/edit/[workflowId]/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/elements/new/page.js | `src/app/cinema-studio/[projectId]/elements/new/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/elements/page.js | `src/app/cinema-studio/[projectId]/elements/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/elements/[workflowId]/layout.js | `src/app/cinema-studio/[projectId]/elements/[workflowId]/layout.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/elements/[workflowId]/page.js | `src/app/cinema-studio/[projectId]/elements/[workflowId]/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/generations/edit/layout.js | `src/app/cinema-studio/[projectId]/generations/edit/layout.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/generations/edit/[workflowId]/page.js | `src/app/cinema-studio/[projectId]/generations/edit/[workflowId]/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/generations/page.js | `src/app/cinema-studio/[projectId]/generations/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/layout.js | `src/app/cinema-studio/[projectId]/layout.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/page.js | `src/app/cinema-studio/[projectId]/page.js` | Page / Layout | 1 | DONE |
| cinema-studio/[projectId]/trash/page.js | `src/app/cinema-studio/[projectId]/trash/page.js` | Page / Layout | 1 | DONE |
| dev/ui/page.jsx | `src/app/dev/ui/page.jsx` | Page / Layout | 1 | DONE |
| layout.js | `src/app/layout.js` | Page / Layout | 1 | DONE |
| login/page.jsx | `src/app/login/page.jsx` | Page / Layout | 1 | DONE |
| page.js | `src/app/page.js` | Page / Layout | 1 | DONE |
| pricing/layout.js | `src/app/pricing/layout.js` | Page / Layout | 1 | DONE |
| pricing/page.js | `src/app/pricing/page.js` | Page / Layout | 1 | DONE |
| test-mention/page.jsx | `src/app/test-mention/page.jsx` | Page / Layout | 1 | DONE |
