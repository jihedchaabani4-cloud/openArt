# api

## Overview
Component package providing implementations for `src/features/prompt-bar/api`.

## Interface
- [promptBarService.js] `withPrimaryMediaFallback` (function)
- [promptBarService.js] `hasGeneratedPrimaryMedia` (function)
- [promptBarService.js] `resolveReusableGeneration` (function)
- [promptBarService.js] `promptBarService` (function)

## Invariants
- [promptBarService.js] Throws error on invalid arguments or missing context.
- [promptBarService.js] Guard clauses return `null` when required state or props are absent.

## Side Effects
- None

## Verification
- Run: `npm test`
