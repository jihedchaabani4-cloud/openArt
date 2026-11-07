# [collectionId]

## Overview
Component package providing implementations for `src/app/cinema-studio/[projectId]/collection/[collectionId]`.

## Interface
- [page.jsx] `CollectionDetailPage` (default export)

## Invariants
- [page.jsx] Guard clauses return `null` when required state or props are absent.

## Side Effects
- [page.jsx] Registers global window/DOM event listeners.
- [page.jsx] Mutates React Query cache.

## Verification
- Run: `npm test`
