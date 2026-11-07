# [projectId]

## Overview
Component package providing implementations for `src/app/cinema-studio/[projectId]`.

## Interface
- [layout.js] `StudioLayout` (default export)
- [page.js] `ProjectDetailPage` (default export)

### Subdirectories
- **[assets](./assets/README.md)**
- **[characters](./characters/README.md)**
- **[collection](./collection/README.md)**
- **[collections](./collections/README.md)**
- **[edit](./edit/README.md)**
- **[elements](./elements/README.md)**
- **[generations](./generations/README.md)**
- **[trash](./trash/README.md)**

## Invariants
- None

## Side Effects
- [layout.js] Performs network I/O via HTTP API requests.
- [layout.js] Reads/writes client browser storage.
- [layout.js] Mutates React Query cache.

## Verification
- Run: `npm test`
