# StudioLayout

## Overview
Component package providing implementations for `src/widgets/StudioLayout`.

## Interface
- [LeftNavigationRail.jsx] `LeftNavigationRail` (function)

### Subdirectories
- **[GenerationsStudio](./GenerationsStudio/README.md)**
- **[NewProjectView](./NewProjectView/README.md)**

## Invariants
- [LeftNavigationRail.jsx] Guard clauses return `null` when required state or props are absent.
- [LeftNavigationRail.jsx] Preserves optimistic rollback invariants on mutation failure.

## Side Effects
- None

## Verification
- Run: `npm test`
