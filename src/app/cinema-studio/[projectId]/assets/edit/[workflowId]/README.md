# [workflowId]

## Overview
Thin Next.js App Router composition shell for the Asset Edit Page (`src/app/cinema-studio/[projectId]/assets/edit/[workflowId]`). All state, queries, mutations, and UI regions are delegated to dedicated modular building blocks:

- **Controller Hook**: `src/features/workflows/model/useAssetEditController.js` — manages workflow/folder queries, folder-scoped switch-bar list (`filterWorkflowsByFolderScope`), missing-workflow redirects, external route sync, version selection, download/rename/delete/detach actions, credit-modal state, and Angles / Relight / Remove Background mutations.
- **Pure Helpers**: `src/features/workflows/lib/assetEditHelpers.js` — pure workflow/media ID, thumbnail, video, trash, active-item, preview-URL, and display-title selectors.
- **Switch Bar Filmstrip**: `src/components/cinema-studio/media/AssetSwitchBar.jsx` — centered sliding workflow filmstrip with prev/next arrows, pointer drag-to-scrub, non-passive wheel scrolling, and spring active ring.
- **Preview Stage**: `src/components/cinema-studio/media/EditStageCanvas.jsx` — zoomable (`0.5x`–`4x`) full-bleed `EditMediaView` stage with floating zoom controls (auto-reset on workflow switch, hidden for video workflows).
- **Inspector Rail**: `src/components/cinema-studio/media/EditInspectorRail.jsx` — right-docked `.ds-edit-sidebar-rail` animating between `EditToolsSidebar` and the `AnglesPanel`, `RelightPanel`, and `RemoveBackgroundPanel` drawers.

## Interface
- [page.js] `AssetEditPage` (default export only; Next.js App Router page contract)

## Invariants
- [page.js] Renders `<LoadingScreen />` while project workflows load and returns `null` when the target workflow is absent so the controller's redirect handles navigation cleanly.
- [page.js] Preserves folder-scoped `?collectionId=` query context across workflow switches via `useAssetEditController`.

## Side Effects
- Delegated to `useAssetEditController` (project cache queries, workflow/media mutations, missing-workflow redirect, and `window.history.replaceState` URL sync on filmstrip switch).

## Verification
- Lint: `npx eslint "src/app/cinema-studio/[projectId]/assets/edit/[workflowId]/page.js"`
- Tests: `npx vitest run src/features/workflows/lib/__tests__/assetEditHelpers.test.js src/components/cinema-studio/media/__tests__/AssetSwitchBar.test.jsx src/components/cinema-studio/media/__tests__/EditStageCanvas.test.jsx`
