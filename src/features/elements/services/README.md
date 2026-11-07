# services

## Overview
Component package providing implementations for `src/features/elements/services`.

## Interface
- [elementService.js] `elementService` (const)
- [elementService.js] `default` (default export)

## Invariants
- [elementService.js] Throws error on invalid arguments or missing context.
- [elementService.js] Preserves optimistic rollback invariants on mutation failure.

## Side Effects
- None

## Verification
- Run: `npm test`
