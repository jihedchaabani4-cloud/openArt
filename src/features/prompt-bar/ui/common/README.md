# common

## Overview
Component package providing implementations for `src/features/prompt-bar/ui/common`.

## Interface
- [MediaInput.jsx] `MediaInput` (function)
- [MediaInput.jsx] `default` (default export)
- [PromptBarShell.jsx] `PromptBarShell` (function)
- [ReferenceButton.jsx] `ReferenceButton` (function)
- [ReferenceButton.jsx] `SwapIcon` (function)
- [ReferenceButton.jsx] `ViewReference` (function)

### Subdirectories
- **[editor](./editor/README.md)**
- **[selectors](./selectors/README.md)**

## Invariants
- [ReferenceButton.jsx] Guard clauses return `null` when required state or props are absent.

## Side Effects
- None

## Verification
- Run: `npm test`
