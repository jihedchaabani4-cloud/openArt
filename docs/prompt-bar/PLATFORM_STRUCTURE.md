# Platform Architecture & Component Structure

This document details the modular structure of `PromptBarPlatform.jsx` following Phase P6. The Platform acts purely as an orchestration shell with zero direct business rules or inline DOM listeners.

---

## 1. Overview and Data Flow

The platform separates state management, domain rules, orchestration, and presentation into strict architectural layers:

```
┌────────────────────────────────────────────────────────┐
│            PromptBarStore (Vanilla Zustand)            │
│  State: prompt, activeMode, activeSubMode, params...   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Platform Hooks                      │
│   usePromptBarModels      usePromptBarSlots            │
│   usePromptBarReferences  usePromptBarGenerate         │
└───────────────────────────┬────────────────────────────┘
                            │ (data & callbacks)
┌───────────────────────────▼────────────────────────────┐
│                PromptBarPlatform (Shell)               │
│   Orchestration only; renders providers & parts        │
└───────────────────────────┬────────────────────────────┘
                            │ (props only, 0 store access)
┌───────────────────────────▼────────────────────────────┐
│                  Platform UI Parts                     │
│   PromptBarTopPanel       PromptBarSlotsRow            │
│   PromptBarControlsRow    (FlowPromptBoxSettings)      │
└────────────────────────────────────────────────────────┘
```

---

## 2. Platform Hooks (`platform/hooks/`)

Each hook owns a single domain concern and exposes view-model state and callbacks to the Platform:

### `usePromptBarModels.js` (H1)
- **Ownership**: Model synchronization, capability filtering, default model auto-selection.
- **Inputs**: `models`, `type`, `featureConfig`, `activeMode`, `activeSubMode`.
- **Outputs**: `allModelsList`, `eligibleModels`, `currentModel`, `isCurrentEligible`, `selectedId`, `parameters`, `currentModelIcon`, `availableModes`, `availableSubModes`, `selectModel`.

### `usePromptBarSlots.js` (H2)
- **Ownership**: Active slot resolution via `getActiveSlots` (C5), drawer parameter partitioning, keyframe swap handler.
- **Inputs**: `featureConfig`, `type`, `activeMode`, `activeSubMode`, `currentModel`, `parameters`.
- **Outputs**: `activeSlots`, `showSwap`, `drawerParams`, `startVal`, `swapEnabled`, `handleSwapFrames`.

### `usePromptBarReferences.js` (H3)
- **Ownership**: Active reference resolution, unified media list, quota calculations (C6), dialog open/close states (mention menu & media library), and encapsulated outside-click/Escape listeners.
- **Inputs**: `activeSlots`, `featureConfig`, `currentModel`, `activeMode`, `drawerOpen`, `setDrawerOpen`, `containerRef`, `tuneButtonRef`, `settingsOverlayRef`.
- **Outputs**: `activeReferences`, `allSelectedMedia`, `dialogOpen`, `dialogAnchorRef`, `quickMentionOpen`, `quickMentionAnchorRef`, `mentionQuery`, `remainingImagesQuota`, `activeSlotAllowedType`, `activeSlotMaxAllowed`, `dialogSelectedItems`, callbacks (`handleOpenDialog`, `handleSelectMedia`, `handleRemoveReferenceItem`, `handleRemoveSlot`, `handleCloseQuickMention`, `handleOpenChangeDialog`, etc.).

### `usePromptBarGenerate.js` (H4)
- **Ownership**: Generation credit estimation via `calculateModelCredits`, aspect ratio & variation resolution, generate button disabled validation, submission lifecycle (`beginSubmit` / `endSubmit`).
- **Inputs**: `currentModel`, `selectedId`, `isCurrentEligible`, `activeMode`, `activeSubMode`, `startVal`, `onGenerate`, `isGenerating`.
- **Outputs**: `currentRatio`, `currentRatioIcon`, `currentCount`, `estimatedCredits`, `isGenerateDisabled`, `isGenerating`, `handleGenerate`.

---

## 3. Platform UI Parts (`platform/parts/`)

Presentational components with props only. `rg -n "usePromptBarStore" platform/parts` returns 0 hits.

### `PromptBarTopPanel.jsx` (H5)
- **Ownership**: Renders above the prompt bar shell: `@` mention dropdown (`AtMentionMenu`) and media library popover (`ImportMediaPopover`) wrapped in `AnimatePresence`.
- **Props**: Data and callbacks for mention search, media selection, quotas, and anchor refs.

### `PromptBarSlotsRow.jsx` (H5)
- **Ownership**: Renders reference thumbnails (`ViewReference`), "Add Ref" button (`ReferenceButton`), video start/end keyframe slots (`MediaInput`), and keyframe swap icon (`SwapIcon`).
- **Props**: `activeSlots`, `paramValues`, slot callbacks (`handleOpenDialog`, `setParameter`, `handleRemoveReferenceItem`, `handleSwapFrames`, etc.).

### `PromptBarControlsRow.jsx` (H5)
- **Ownership**: Bottom control row of the prompt bar shell: settings drawer trigger (model icon/name, aspect ratio icon, variation multiplier), optional `renderRightActions`, and circular generate button (spinner / arrow icon).
- **Props**: `showSettingsButton`, `onToggleDrawer`, `currentModel`, `currentModelIcon`, `currentRatioIcon`, `currentCount`, `estimatedCredits`, `isGenerateDisabled`, `handleGenerate`.

*(Note: `PromptBarModeSelector` was not extracted as a separate component because mode toggles are housed within `FlowPromptBoxSettings.jsx`; the Platform wires mode state as props).*

---

## 4. Orchestration Shell (`PromptBarPlatform.jsx`)

The Platform file is strictly responsible for:
1. Exposing the public API (`PromptBarPlatform` component) and wiring `PromptBarStoreProvider`.
2. Calling the 4 platform hooks (`usePromptBarModels`, `usePromptBarSlots`, `usePromptBarReferences`, `usePromptBarGenerate`).
3. Connecting hook outputs to the 3 UI parts (`PromptBarTopPanel`, `PromptBarSlotsRow`, `PromptBarControlsRow`) and `FlowPromptBoxSettings`.
4. Rendering outer wrapper positioning (`fixed` vs embedded `relative` mode).
