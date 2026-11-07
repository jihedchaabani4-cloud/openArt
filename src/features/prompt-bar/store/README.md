# store

## Overview
Component package providing implementations for `src/features/prompt-bar/store`.

## Interface
- [createPromptBarStore.js] `createPromptBarStore` (function)
- [pendingActions.js] `DEFAULT_PENDING_TTL_MS` (const)
- [pendingActions.js] `PENDING_QUEUE_STORAGE_KEY` (const)
- [pendingActions.js] `enqueuePendingAction` (function)
- [pendingActions.js] `drainPendingActions` (function)
- [pendingActions.js] `clearPendingActions` (function)
- [persistence.js] `DEFAULT_PERSIST_DEBOUNCE_MS` (const)
- [persistence.js] `selectPersistable` (function)
- [persistence.js] `loadSaved` (function)
- [persistence.js] `createSaver` (function)
- [persistence.js] `removeSaved` (function)
- [PromptBarStoreContext.js] `setActivePromptBarStore` (function)
- [PromptBarStoreContext.js] `getActivePromptBarStore` (function)
- [PromptBarStoreContext.js] `PromptBarStoreContext` (const)
- [PromptBarStoreContext.js] `clearPersistentPromptBarStores` (function)
- [PromptBarStoreContext.js] `PromptBarStoreProvider` (function)
- [PromptBarStoreContext.js] `usePromptBarStoreInstance` (function)
- [registry.js] `identityKey` (function)
- [registry.js] `createRegistry` (function)
- [registry.js] `registry` (const)
- [routePolicy.js] `normalizePathSegments` (function)
- [routePolicy.js] `matchRoute` (function)
- [routePolicy.js] `isPathAllowed` (function)
- [usePromptBarRouteWatcher.js] `usePromptBarRouteWatcher` (function)
- [usePromptBarStore.js] `usePromptBarStore` (function)

### Subdirectories
- **[commands](./commands/README.md)**

## Invariants
- [pendingActions.js] Throws error on invalid arguments or missing context.
- [persistence.js] Guard clauses return `null` when required state or props are absent.
- [PromptBarStoreContext.js] Throws error on invalid arguments or missing context.
- [PromptBarStoreContext.js] Guard clauses return `null` when required state or props are absent.
- [registry.js] Throws error on invalid arguments or missing context.

## Side Effects
- [createPromptBarStore.js] Mutates Zustand global store state.
- [pendingActions.js] Reads/writes client browser storage.
- [PromptBarStoreContext.js] Reads/writes client browser storage.
- [usePromptBarRouteWatcher.js] Reads/writes client browser storage.

## Verification
- Run: `npm test`
