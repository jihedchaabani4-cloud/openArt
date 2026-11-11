# MIGRATION PROGRESS

> Full design-system replacement tracking (rip-and-replace to Higgsfield "Cinema Studio" dark UI design system).
> Single source of truth: `docs/design-system/` (`tokens.css`, `00-README.md`, `01`–`09` spec files).

---

## Phase 0 — Audit & System Maps

### A. Where the Old Design System Lived
1. **Global CSS & Token Files:**
   - `src/app/google-flow-tokens.css` (old Google Flow design tokens) → **DELETED**
   - `src/app/saas-tokens.css` (old SaaS palette tokens) → **DELETED**
   - `src/app/globals.css` (old utility classes, old theme provider references) → **REPLACED** with `@theme inline` mapping to canonical tokens and `01`–`09` classes.
2. **Font Files & External Fonts:**
   - `public/fonts/GoogleSans-*.ttf` → **DELETED**
   - `public/fonts/GT-Walsheim-*.woff2` → **DELETED**
   - `public/fonts/GoogleSymbols.woff2` → **DELETED**
   - Google Fonts links for Google Sans / Symbols in `src/app/layout.js` → **REMOVED**; only `Inter` and `Space Grotesk` wired.
3. **Tailwind Config & Utility Overrides:**
   - `src/shared/lib/utils.js`: Custom `tailwind-merge` config with legacy tokens mapped cleanly.
   - Component-level hardcoded hex values replaced with CSS variables (`var(--*)`).
4. **Icon Sets:**
   - Replaced custom font icons with accessible stroke SVG icons (`Icon.jsx`, `GoogleIcon.jsx` SVG fallback).

---

### B. Token Mapping Table (`old token/variable → new token` / `DELETE`)

| Old Token / Variable | Old Value / Role | New Token | Status / Action |
|---|---|---|---|
| `--color-surface-canvas` / `qc-background-primary` | `#131416` Canvas | `--bg-page` (`#131416`) | Replaced |
| `--color-surface-base` / `qc-background-root` | `#0F1113` Root | `--bg-root` (`#0F1113`) | Replaced |
| `--color-surface-panel` / `surface-primary` | `#1C1E20` Surface | `--bg-surface` (`#1C1E20`) | Replaced |
| `--color-surface-card` / `q-background-secondary` | `#1C1E21` Surface 2 | `--bg-surface-2` (`#1C1E21`) | Replaced |
| `--color-surface-processing` / `--color-surface-elevated` | `#24272B` Elevated | `--bg-surface-elevated` (`#24272B`) | Replaced |
| `--color-surface-input` | `#181A1D` Inputs | `--bg-surface-input` (`#181A1D`) | Replaced |
| `--color-line-subtle` / `qc-border-subtle` | `rgba(255,255,255,0.05)` | `--border-subtle` | Replaced |
| `--color-line-default` / `q-border-default` | `rgba(255,255,255,0.10)` | `--border-default` | Replaced |
| `--color-line-interactive` | `rgba(255,255,255,0.20)` | `--border-strong` | Replaced |
| `neutral-primary-reverted-5` | `rgba(255,255,255,0.05)` | `--overlay-5` | Replaced |
| `neutral-primary-reverted-10` | `rgba(255,255,255,0.10)` | `--overlay-10` (`--state-hover`) | Replaced |
| `neutral-primary-reverted-20` | `rgba(255,255,255,0.20)` | `--overlay-20` (`--state-pressed`) | Replaced |
| `font-primary` / `--color-content-base` | `#FFFFFF` Text | `--text-primary` (`#FFFFFF`) | Replaced |
| `font-secondary` / `--color-content-muted` | `#898A8B` Secondary | `--text-secondary` (`#898A8B`) | Replaced |
| `q-text-secondary` / `--color-content-subtle` | `#828282` Tertiary | `--text-tertiary` (`#828282`) | Replaced |
| `icon-brand` / `surface-brand` / `--color-brand-neon` | `#D1FE17` Electric Lime | `--brand` (`#D1FE17`) | Replaced |
| `font-primary-reverted` | `#131517` On Lime | `--text-on-brand` (`#131517`) | Replaced |
| `--color-accent-pink` | `#ED2D84` Pink Accent | `--pink-400` / `--danger` | Replaced |
| `--color-accent-blue` | `#0256FE` Special Offer | `--blue-promo` | Replaced |
| `--font-google-sans` | Google Sans font | `--font-ui` (Inter) | DELETE |
| `--font-gt-walsheim` | GT Walsheim font | `--font-display` (Space Grotesk) | DELETE |
| `light-theme` / `data-theme="light"` | Light Mode variables | *None (Dark only)* | DELETE |

---

### C. Variant Mapping Table (`old component/variant → new spec/variant`)

| Component Category | Old Component / Variant | New Spec File | New Spec Variant |
|---|---|---|---|
| **Buttons / Actions** | Primary CTA / Submit / Generate | `01-buttons-primary.md` | `generate-hero` / `primary` (electric lime) |
| **Buttons / Actions** | Compact Generate / Sparkle button | `01-buttons-primary.md` | `generate-compact` |
| **Buttons / Actions** | Mobile Action button | `01-buttons-primary.md` | `mobile-create` |
| **Buttons / Actions** | Marketing / Landing Hero CTA | `01-buttons-primary.md` | `marketing` (with arrow & sheen) |
| **Buttons / Actions** | Promo bar CTA / Pill | `01-buttons-primary.md` | `pill` (dark pill) |
| **Quiet Actions** | Ghost button / Icon button | `02-buttons-quiet.md` | `qa` / `icon-24` |
| **Quiet Actions** | Navigation row / Sidebar item | `02-buttons-quiet.md` | `qa-row` |
| **Quiet Actions** | Sidebar action with tile ("New project") | `02-buttons-quiet.md` | `qa-sidebar-action` |
| **Quiet Actions** | Header notification bell / User button | `02-buttons-quiet.md` | `qa-icon-36` / `notification` |
| **Chips & Navigation** | Secondary button / Filter chip | `03-chips-navigation.md` | `chip` (28px height, 8px radius) |
| **Chips & Navigation** | Model selector chip | `03-chips-navigation.md` | `chip--model` (lime text & icon) |
| **Chips & Navigation** | Segmented button group / action bar | `03-chips-navigation.md` | `chip-group` / `ButtonGroup` |
| **Chips & Navigation** | Mode switch (Image / Video) | `03-chips-navigation.md` | `mode-tab` + `mode-rail` |
| **Chips & Navigation** | Mobile tab item | `03-chips-navigation.md` | `nav-m` |
| **Inputs** | Text input / Search input | `04-inputs.md` | `field` / `SearchInput` |
| **Inputs** | Form textarea | `04-inputs.md` | `field--textarea` / `Textarea` |
| **Inputs** | Generation prompt box | `04-inputs.md` | `prompt` / `Prompt` |
| **Menus** | Select / Dropdown menu | `05-dropdown-menu.md` | `menu` + `menu-item` |
| **Cards** | Project card | `06-cards.md` | `card-project` (16:9 thumb, 16px radius) |
| **Cards** | Create new project card | `06-cards.md` | `tile-create` / `card-create` |
| **Cards** | Skeleton loader | `06-cards.md` | `skeleton` |
| **Badges & Tags** | Discount / Promo badge | `07-badges-tags.md` | `badge-pink` (skewed) |
| **Badges & Tags** | Feature tag | `07-badges-tags.md` | `tag-blue` ("Special offer") |
| **Badges & Tags** | Status badge | `07-badges-tags.md` | `badge-neutral`, `badge-brand`, `badge-success`, etc. |
| **Feedback** | Toast notification | `08-feedback.md` | `toast` + `toast-viewport` |
| **Feedback** | Top progress loader | `08-feedback.md` | `top-loader` |
| **Feedback** | Empty state view | `08-feedback.md` | `EmptyState` |
| **Overlays & Controls** | Modal / Dialog | `09-overlays-controls.md` | `modal` + `modal-backdrop` |
| **Overlays & Controls** | Checkbox | `09-overlays-controls.md` | `checkbox` (16x16, lime checked) |
| **Overlays & Controls** | Radio | `09-overlays-controls.md` | `radio` (16x16 circle, lime dot) |
| **Overlays & Controls** | Switch toggle | `09-overlays-controls.md` | `switch` (36x20 track, lime on) |
| **Overlays & Controls** | Tooltip | `09-overlays-controls.md` | `tooltip` |

---

## Component Inventory Table

| Component | File path(s) | Category | Spec File | Status |
|---|---|---|---|---|
| button | `src/shared/ui/button.jsx` | Shared Primitive | `01-buttons-primary.md` / `02-buttons-quiet.md` | DONE |
| Chip | `src/shared/ui/Chip.jsx` | Shared Primitive | `03-chips-navigation.md` | DONE |
| button-group / ChipGroup | `src/shared/ui/button-group.jsx` | Shared Primitive | `03-chips-navigation.md` | DONE |
| QuietAction | `src/shared/ui/QuietAction.jsx` | Shared Primitive | `02-buttons-quiet.md` | DONE |
| IconButton | `src/shared/ui/IconButton.jsx` | Shared Primitive | `02-buttons-quiet.md` | DONE |
| ModeTab | `src/shared/ui/ModeTab.jsx` | Shared Primitive | `03-chips-navigation.md` | DONE |
| NavItem | `src/shared/ui/NavItem.jsx` | Shared Primitive | `03-chips-navigation.md` | DONE |
| NavRow | `src/shared/ui/NavRow.jsx` | Shared Primitive | `02-buttons-quiet.md` | DONE |
| Field / Form controls | `src/shared/ui/Field.jsx` | Shared Primitive | `04-inputs.md` | DONE |
| input | `src/shared/ui/input.jsx` | Shared Primitive | `04-inputs.md` | DONE |
| textarea | `src/shared/ui/textarea.jsx` | Shared Primitive | `04-inputs.md` | DONE |
| SearchInput | `src/shared/ui/SearchInput.jsx` | Shared Primitive | `04-inputs.md` | DONE |
| Prompt | `src/shared/ui/Prompt.jsx` | Shared Primitive | `04-inputs.md` | DONE |
| select | `src/shared/ui/select.jsx` | Shared Primitive | `05-dropdown-menu.md` | DONE |
| dropdown-menu | `src/shared/ui/dropdown-menu.jsx` | Shared Primitive | `05-dropdown-menu.md` | DONE |
| context-menu | `src/shared/ui/context-menu.jsx` | Shared Primitive | `05-dropdown-menu.md` | DONE |
| popover | `src/shared/ui/popover.jsx` | Shared Primitive | `05-dropdown-menu.md` | DONE |
| DropdownShell | `src/shared/ui/DropdownShell.jsx` | Shared Primitive | `05-dropdown-menu.md` | DONE |
| card | `src/shared/ui/card.jsx` | Shared Primitive | `06-cards.md` | DONE |
| surface | `src/shared/ui/surface.jsx` | Shared Primitive | `06-cards.md` | DONE |
| skeleton | `src/shared/ui/skeleton.jsx` | Shared Primitive | `06-cards.md` | DONE |
| GlassTile | `src/shared/ui/GlassTile.jsx` | Shared Primitive | `06-cards.md` | DONE |
| badge | `src/shared/ui/badge.jsx` | Shared Primitive | `07-badges-tags.md` | DONE |
| Tag | `src/shared/ui/Tag.jsx` | Shared Primitive | `07-badges-tags.md` | DONE |
| Toast | `src/shared/ui/Toast.jsx` | Shared Primitive | `08-feedback.md` | DONE |
| LoadingScreen | `src/shared/ui/LoadingScreen.jsx` | Shared Primitive | `08-feedback.md` | DONE |
| ProcessingCard | `src/shared/ui/ProcessingCard.jsx` | Shared Primitive | `08-feedback.md` | DONE |
| tooltip | `src/shared/ui/tooltip.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| dialog | `src/shared/ui/dialog.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| Modal | `src/shared/ui/Modal.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| ConfirmDeleteDialog | `src/shared/ui/ConfirmDeleteDialog.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| CreateFolderDialog | `src/shared/ui/CreateFolderDialog.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| MoveToDialog | `src/shared/ui/MoveToDialog.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| checkbox | `src/shared/ui/checkbox.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| radio-group | `src/shared/ui/radio-group.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| switch | `src/shared/ui/switch.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| slider | `src/shared/ui/slider.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| tabs | `src/shared/ui/tabs.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| accordion | `src/shared/ui/accordion.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| collapsible | `src/shared/ui/collapsible.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| hover-card | `src/shared/ui/hover-card.jsx` | Shared Primitive | `09-overlays-controls.md` | DONE |
| file-tree | `src/shared/ui/file-tree.jsx` | Shared Primitive | `02-buttons-quiet.md` | DONE |
| avatar | `src/shared/ui/avatar.jsx` | Shared Primitive | `02-buttons-quiet.md` | DONE |
| Icon | `src/shared/ui/Icon.jsx` | Shared Primitive | `02-buttons-quiet.md` | DONE |
| GoogleIcon | `src/shared/ui/GoogleIcon.jsx` | Shared Primitive | `02-buttons-quiet.md` | DONE |
| action-button | `src/shared/ui/action-button.jsx` | Shared Primitive | `02-buttons-quiet.md` | DONE |
| EditableDisplayName | `src/shared/ui/EditableDisplayName.jsx` | Shared Primitive | `04-inputs.md` | DONE |
| InlineRenamePill | `src/shared/ui/InlineRenamePill.jsx` | Shared Primitive | `03-chips-navigation.md` | DONE |
| FlowErrorTile | `src/shared/ui/FlowErrorTile.jsx` | Shared Primitive | `08-feedback.md` | DONE |
| FolderGlyphIcon | `src/shared/ui/FolderGlyphIcon.jsx` | Shared Primitive | `06-cards.md` | DONE |
| selector-card | `src/shared/ui/selector-card.jsx` | Shared Primitive | `06-cards.md` | DONE |
| selector-slide | `src/shared/ui/selector-slide.jsx` | Shared Primitive | `06-cards.md` | DONE |
| ShineText | `src/shared/ui/ShineText.jsx` | Shared Primitive | `07-badges-tags.md` | DONE |
| layout | `src/shared/ui/layout.jsx` | Shared Primitive | `06-cards.md` | DONE |
| LoginDialog | `src/components/LoginDialog.jsx` | Component | `09-overlays-controls.md` | DONE |
| CharacterEditNavbar | `src/widgets/CharacterEditNavbar/CharacterEditNavbar.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| CoreMediaItemView | `src/widgets/CoreMediaItemView/CoreMediaItemView.jsx` | Widget | `06-cards.md` | DONE |
| EditMediaView | `src/widgets/EditMediaView/EditMediaView.jsx` | Widget | `06-cards.md` | DONE |
| EditNavbar | `src/widgets/EditNavbar/EditNavbar.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| ElementEditNavbar | `src/widgets/ElementEditNavbar/ElementEditNavbar.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| EntityEditNavbar | `src/widgets/EntityEditNavbar/EntityEditNavbar.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| NavbarCore | `src/widgets/NavbarCore/NavbarCore.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| NavbarAction | `src/widgets/NavbarCore/ui/NavbarAction.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| NavbarBackButton | `src/widgets/NavbarCore/ui/NavbarBackButton.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| NavbarDivider | `src/widgets/NavbarCore/ui/NavbarDivider.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| NavbarTitle | `src/widgets/NavbarCore/ui/NavbarTitle.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| NewElementDialog | `src/widgets/NewElementDialog/NewElementDialog.jsx` | Widget | `09-overlays-controls.md` | DONE |
| ProjectsFloatingAction | `src/widgets/projects/ui/ProjectsFloatingAction.jsx` | Widget | `01-buttons-primary.md` | DONE |
| ProjectsGrid | `src/widgets/projects/ui/ProjectsGrid.jsx` | Widget | `06-cards.md` | DONE |
| ProjectsNavbar | `src/widgets/ProjectsNavbar/ProjectsNavbar.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| PromoSlider | `src/widgets/PromoSlider.jsx` | Widget | `07-badges-tags.md` | DONE |
| LeftNavigationRail | `src/widgets/StudioLayout/LeftNavigationRail.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| LeftSidebar | `src/widgets/StudioLayout/LeftSidebar.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| NewProjectView | `src/widgets/StudioLayout/NewProjectView/NewProjectView.jsx` | Widget | `06-cards.md` | DONE |
| StudioLayout | `src/widgets/StudioLayout/StudioLayout.jsx` | Widget | `06-cards.md` | DONE |
| StudioNavbar | `src/widgets/StudioNavbar/StudioNavbar.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| NavbarImportButton | `src/widgets/StudioNavbar/ui/NavbarImportButton.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| NavbarRestoreAllButton | `src/widgets/StudioNavbar/ui/NavbarRestoreAllButton.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| StudioNavbarLeft | `src/widgets/StudioNavbar/ui/StudioNavbarLeft.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| StudioNavbarTitle | `src/widgets/StudioNavbar/ui/StudioNavbarTitle.jsx` | Widget | `02-buttons-quiet.md` | DONE |
| StudioSettingsDropdown | `src/widgets/StudioNavbar/ui/StudioSettingsDropdown.jsx` | Widget | `05-dropdown-menu.md` | DONE |
| UserDropdown | `src/widgets/navigation/UserDropdown.jsx` | Widget | `05-dropdown-menu.md` | DONE |
| LibraryMediaGridItem | `src/features/assets/ui/LibraryMediaGridItem.jsx` | Feature UI | `06-cards.md` | DONE |
| CharacterDetailsGallery | `src/features/characters/ui/CharacterDetailsGallery.jsx` | Feature UI | `06-cards.md` | DONE |
| ElementDetailsGallery | `src/features/elements/ui/ElementDetailsGallery.jsx` | Feature UI | `06-cards.md` | DONE |
| ElementsEmptyState | `src/features/elements/ui/ElementsEmptyState.jsx` | Feature UI | `08-feedback.md` | DONE |
| ReferenceMediaGalleryGrid | `src/features/media/ui/ReferenceMediaGalleryGrid.jsx` | Feature UI | `06-cards.md` | DONE |
| MediaView | `src/features/media/ui/MediaView.jsx` | Feature UI | `06-cards.md` | DONE |
| MediaViewCard | `src/features/media/ui/MediaViewCard.jsx` | Feature UI | `06-cards.md` | DONE |
| SharedGalleryGrid | `src/features/media/ui/SharedGalleryGrid.jsx` | Feature UI | `06-cards.md` | DONE |
| ProjectCard | `src/features/projects/ui/ProjectCard.jsx` | Feature UI | `06-cards.md` | DONE |
| PromptBarPlatform | `src/features/prompt-bar/platform/PromptBarPlatform.jsx` | Feature UI | `04-inputs.md` | DONE |
| PromptBarControlsRow | `src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx` | Feature UI | `01-buttons-primary.md` / `03-chips-navigation.md` | DONE |
| PromptEditor | `src/features/prompt-bar/ui/common/editor/PromptEditor.jsx` | Feature UI | `04-inputs.md` | DONE |
| VariationSelector | `src/features/prompt-bar/ui/common/selectors/VariationSelector.jsx` | Feature UI | `03-chips-navigation.md` | DONE |
| VideoResolutionSelector | `src/features/prompt-bar/ui/common/selectors/VideoResolutionSelector.jsx` | Feature UI | `03-chips-navigation.md` | DONE |
| TrashView | `src/features/trash/ui/TrashView.jsx` | Feature UI | `06-cards.md` | DONE |
| WorkflowMediaGallery | `src/features/workflows/ui/WorkflowMediaGallery.jsx` | Feature UI | `06-cards.md` | DONE |
| AssetDetailPage | `src/views/AssetDetailPage.jsx` | View | `06-cards.md` | DONE |
| AssetsLibraryPage | `src/views/AssetsLibraryPage.jsx` | View | `06-cards.md` | DONE |
| BentoFeatures | `src/views/landing/components/BentoFeatures.jsx` | View | `06-cards.md` | DONE |
| HeroSection | `src/views/landing/components/HeroSection.jsx` | View | `01-buttons-primary.md` | DONE |
| ModelSlider | `src/views/landing/components/ModelSlider.jsx` | View | `06-cards.md` | DONE |
| ModelsShowcase | `src/views/landing/components/ModelsShowcase.jsx` | View | `06-cards.md` | DONE |
| LandingPage | `src/views/LandingPage.jsx` | View | `01-buttons-primary.md` | DONE |
| NewProjectPage | `src/views/NewProjectPage.jsx` | View | `06-cards.md` | DONE |
| ProjectsPage | `src/views/ProjectsPage.jsx` | View | `06-cards.md` | DONE |
| apps/[slug]/page.js | `src/app/apps/[slug]/page.js` | Page / Layout | `06-cards.md` | DONE |
| assets/layout.js | `src/app/assets/layout.js` | Page / Layout | `06-cards.md` | DONE |
| assets/page.js | `src/app/assets/page.js` | Page / Layout | `06-cards.md` | DONE |
| assets/[workflowId]/layout.js | `src/app/assets/[workflowId]/layout.js` | Page / Layout | `06-cards.md` | DONE |
| assets/[workflowId]/page.js | `src/app/assets/[workflowId]/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/layout.js | `src/app/cinema-studio/layout.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/new/page.js | `src/app/cinema-studio/new/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/page.js | `src/app/cinema-studio/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/test/processing-card/page.jsx | `src/app/cinema-studio/test/processing-card/page.jsx` | Page / Layout | `08-feedback.md` | DONE |
| cinema-studio/test/prompt-bar-compare/page.jsx | `src/app/cinema-studio/test/prompt-bar-compare/page.jsx` | Page / Layout | `04-inputs.md` | DONE |
| cinema-studio/test/testanimation/page.jsx | `src/app/cinema-studio/test/testanimation/page.jsx` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/assets/edit/[workflowId]/page.js | `src/app/cinema-studio/[projectId]/assets/edit/[workflowId]/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/assets/page.js | `src/app/cinema-studio/[projectId]/assets/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/characters/new/page.js | `src/app/cinema-studio/[projectId]/characters/new/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/characters/page.js | `src/app/cinema-studio/[projectId]/characters/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/characters/[workflowId]/layout.js | `src/app/cinema-studio/[projectId]/characters/[workflowId]/layout.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/characters/[workflowId]/page.js | `src/app/cinema-studio/[projectId]/characters/[workflowId]/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/collection/[collectionId]/page.jsx | `src/app/cinema-studio/[projectId]/collection/[collectionId]/page.jsx` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/collections/[collectionId]/page.js | `src/app/cinema-studio/[projectId]/collections/[collectionId]/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/edit/layout.js | `src/app/cinema-studio/[projectId]/edit/layout.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/edit/[workflowId]/page.js | `src/app/cinema-studio/[projectId]/edit/[workflowId]/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/elements/edit/layout.js | `src/app/cinema-studio/[projectId]/elements/edit/layout.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/elements/edit/[workflowId]/page.js | `src/app/cinema-studio/[projectId]/elements/edit/[workflowId]/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/elements/new/page.js | `src/app/cinema-studio/[projectId]/elements/new/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/elements/page.js | `src/app/cinema-studio/[projectId]/elements/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/elements/[workflowId]/layout.js | `src/app/cinema-studio/[projectId]/elements/[workflowId]/layout.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/elements/[workflowId]/page.js | `src/app/cinema-studio/[projectId]/elements/[workflowId]/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/generations/edit/layout.js | `src/app/cinema-studio/[projectId]/generations/edit/layout.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/generations/edit/[workflowId]/page.js | `src/app/cinema-studio/[projectId]/generations/edit/[workflowId]/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/generations/page.js | `src/app/cinema-studio/[projectId]/generations/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/layout.js | `src/app/cinema-studio/[projectId]/layout.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/page.js | `src/app/cinema-studio/[projectId]/page.js` | Page / Layout | `06-cards.md` | DONE |
| cinema-studio/[projectId]/trash/page.js | `src/app/cinema-studio/[projectId]/trash/page.js` | Page / Layout | `06-cards.md` | DONE |
| dev/ui/page.jsx | `src/app/dev/ui/page.jsx` | Page / Layout | `01`–`09` showcase | DONE |
| layout.js | `src/app/layout.js` | Page / Layout | Root Shell | DONE |
| login/page.jsx | `src/app/login/page.jsx` | Page / Layout | `09-overlays-controls.md` | DONE |
| page.js | `src/app/page.js` | Page / Layout | `01-buttons-primary.md` | DONE |
| pricing/layout.js | `src/app/pricing/layout.js` | Page / Layout | `07-badges-tags.md` | DONE |
| pricing/page.js | `src/app/pricing/page.js` | Page / Layout | `07-badges-tags.md` | DONE |
| test-mention/page.jsx | `src/app/test-mention/page.jsx` | Page / Layout | `04-inputs.md` | DONE |

---

## E. Verification & Quality Gates

### 1. Legacy Token Deprecation Audit
Zero matches found in production codebase for deprecated token prefixes:
```bash
git grep -E "surface-base|surface-panel|surface-canvas|surface-card|surface-processing|line-subtle|line-default|line-interactive|qc-[a-z]" -- ":!docs" ":!*.md"
# Exit code 1 (0 matches found)
```

### 2. Vitest Test Suite
Full test suite executed cleanly with zero failures or regressions:
```bash
npx vitest run
# Test Files  141 passed (141)
# Tests       924 passed (924)
# Duration    173.55s
```

### 3. Production Build Validation
All 30 static and dynamic routes compiled without syntax, token, or TypeScript errors:
```bash
npm run build
# ▲ Next.js 16.2.1 (Turbopack)
# ✓ Compiled successfully in 14.5s
# ✓ Generating static pages (13/13)
# ✓ All 30 routes built cleanly
```

