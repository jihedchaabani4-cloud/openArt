# api

## Overview
Component package providing implementations for `src/features/projects/api`.

## Interface
- [projectsApi.js] `useProjects` (function)
- [projectsApi.js] `useCreateProject` (function)
- [projectsApi.js] `useDeleteProject` (function)
- [projectsApi.js] `useUpdateProject` (function)

## Invariants
- [projectsApi.js] Throws error on invalid arguments or missing context.
- [projectsApi.js] Preserves optimistic rollback invariants on mutation failure.

## Side Effects
- [projectsApi.js] Mutates React Query cache.

## Verification
- Run: `npm test`
