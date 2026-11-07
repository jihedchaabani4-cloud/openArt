# ImportMediaDialog

## Overview
Component package providing implementations for `src/features/media/ui/ImportMediaDialog`.

## Interface
- [ImportMediaListView.jsx] `ImportMediaListView` (function)
- [ImportMediaPopover.jsx] `ImportMediaPopover` (function)

### Subdirectories
- **[keyboard](./keyboard/README.md)**

## Invariants
- [ImportMediaListView.jsx] Guard clauses return `null` when required state or props are absent.
- [ImportMediaPopover.jsx] Guard clauses return `null` when required state or props are absent.

## Side Effects
- [ImportMediaPopover.jsx] Registers global window/DOM event listeners.

## Verification
- Run: `npm test`
