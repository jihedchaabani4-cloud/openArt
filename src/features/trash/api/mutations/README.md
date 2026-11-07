# mutations

## Overview
Component package providing implementations for `src/features/trash/api/mutations`.

## Interface
- [useRestoreAllWorkflows.js] `useRestoreAllWorkflows` (function)
- [useRestoreAllWorkflows.js] `default` (default export)
- [useRestoreWorkflow.js] `useRestoreWorkflow` (function)
- [useRestoreWorkflow.js] `default` (default export)

## Invariants
- [useRestoreAllWorkflows.js] Throws error on invalid arguments or missing context.
- [useRestoreAllWorkflows.js] Preserves optimistic rollback invariants on mutation failure.
- [useRestoreWorkflow.js] Throws error on invalid arguments or missing context.
- [useRestoreWorkflow.js] Preserves optimistic rollback invariants on mutation failure.

## Side Effects
- None

## Verification
- Run: `npm test`
