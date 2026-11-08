# selectors

## Overview
Component package providing implementations for `src/features/prompt-bar/ui/common/selectors`.

## Interface
- [BaseSelector.jsx] `BaseSelector` (const)
- [DurationSelector.jsx] `DurationSelector` (const)
- [FeatureModeSelector.jsx] `FeatureModeSelector` (function)
- [FlowPromptBoxSettings.jsx] `getRatioIcon` (function)
- [FlowPromptBoxSettings.jsx] `formatParamLabel` (function)
- [FlowPromptBoxSettings.jsx] `FlowSelect` (function)
- [FlowPromptBoxSettings.jsx] `FlowPromptBoxSettings` (function)
- [QualitySelector.jsx] `QualitySelector` (const)
- [RatioSelector.jsx] `RatioIcon` (const)
- [RatioSelector.jsx] `RatioSelector` (const)
- [VariationSelector.jsx] `VariationSelector` (const)
- [VideoResolutionSelector.jsx] `VideoResolutionSelector` (const)

## Invariants
- [FlowPromptBoxSettings.jsx] Guard clauses return `null` when required state or props are absent.

## Side Effects
- None

## Verification
- Run: `npm test`
