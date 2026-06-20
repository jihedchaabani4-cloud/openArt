# Architecture Audit Report: Labveil Frontend

**Date**: 2026-06-19
**Total Files Scanned**: 204
**Total Mixed Concerns Files**: 13
**Total Violations Detected**: 14

## Summary Dashboard

| Metric | Count |
|--------|-------|
| Files Scanned | 204 |
| Files with Mixed Concerns | 13 |
| Total Violations | 14 |

## Problem Clusters

### Direct API / Fetch Calls (4 items)

| File Path | Line | Severity | Violation Details |
|-----------|------|----------|-------------------|
| [`AssetsPageClient.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/assets/AssetsPageClient.jsx#L183) | 183 | **HIGH** | Direct fetch() call found outside shared api services. |
| [`layout.js`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/cinema-studio/[projectId]/layout.js#L118) | 118 | **HIGH** | Direct fetch() call found outside shared api services. |
| [`utils.js`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/shared/lib/utils.js#L23) | 23 | **HIGH** | Direct fetch() call found outside shared api services. |
| [`ImageInfoSidebar.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/dialogs/ImageInfoSidebar.jsx#L79) | 79 | **HIGH** | Direct fetch() call found outside shared api services. |

### Frontend AI SDK Violations (1 items)

| File Path | Line | Severity | Violation Details |
|-----------|------|----------|-------------------|
| [`page.js`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/page.js#L55) | 55 | **HIGH** | Direct frontend import/usage of AI SDK: "openai". Violation of Principle II. |

### God Components / Mixed Concerns (9 items)

| File Path | Line | Severity | Violation Details |
|-----------|------|----------|-------------------|
| [`page.js`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/app/page.js#L1) | 1 | **MEDIUM** | File has 769 lines. God component candidate; should be decomposed. |
| [`PackageSelectionDialog.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/payments/ui/PackageSelectionDialog.jsx#L1) | 1 | **MEDIUM** | File has 462 lines. God component candidate; should be decomposed. |
| [`PricingSection.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/payments/ui/PricingSection.jsx#L1) | 1 | **MEDIUM** | File has 732 lines. God component candidate; should be decomposed. |
| [`Angles.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/edit/tabs/Angles.jsx#L1) | 1 | **MEDIUM** | File has 512 lines. God component candidate; should be decomposed. |
| [`Lighting.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/edit/tabs/Lighting.jsx#L1) | 1 | **MEDIUM** | File has 603 lines. God component candidate; should be decomposed. |
| [`ElementFeatureEditor.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/elements/ElementFeatureEditor.jsx#L1) | 1 | **MEDIUM** | File has 488 lines. God component candidate; should be decomposed. |
| [`PromptBar.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/prompt-bar/ui/generation/PromptBar.jsx#L1) | 1 | **MEDIUM** | File has 412 lines. God component candidate; should be decomposed. |
| [`ImportMediaPopover.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/ImportMediaDialog/ImportMediaPopover.jsx#L1) | 1 | **MEDIUM** | File has 411 lines. God component candidate; should be decomposed. |
| [`MediaGridItem.jsx`](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx#L1) | 1 | **MEDIUM** | File has 436 lines. God component candidate; should be decomposed. |

### Other Concerns (0 items)

*No violations found in this cluster.*

## File Classification Summary

| File Type | Count |
|-----------|-------|
| PAGE | 37 |
| COMPONENT | 117 |
| UTIL | 22 |
| SERVICE | 8 |
| HOOK | 20 |
