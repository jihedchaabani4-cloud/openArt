# hooks

## Overview
Component package providing implementations for `src/features/prompt-bar/platform/hooks`.

## Interface
- [usePromptBarGenerate.js] `usePromptBarGenerate` (function)
- [usePromptBarModels.js] `usePromptBarModels` (function)
- [usePromptBarReferences.js] `usePromptBarReferences` (function)
- [usePromptBarSlots.js] `usePromptBarSlots` (function)

## Invariants
- [usePromptBarModels.js] Guard clauses return `null` when required state or props are absent.

## Side Effects
- [usePromptBarReferences.js] Registers global window/DOM event listeners.

## Verification
- Run: `npm test`
