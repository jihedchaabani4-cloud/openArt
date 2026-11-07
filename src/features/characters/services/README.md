# services

## Overview
Component package providing implementations for `src/features/characters/services`.

## Interface
- [characterService.js] `characterService` (const)
- [characterService.js] `default` (default export)

## Invariants
- [characterService.js] Throws error on invalid arguments or missing context.
- [characterService.js] Preserves optimistic rollback invariants on mutation failure.

## Side Effects
- [characterService.js] Performs network I/O via HTTP API requests.

## Verification
- Run: `npm test`
