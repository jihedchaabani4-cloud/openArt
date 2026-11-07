# api

## Overview
Component package providing implementations for `src/shared/api`.

## Interface
- [assets.js] `downloadAssetsAsZip` (function)
- [auth.js] `useAuthSession` (function)
- [auth.js] `useWalletBalance` (function)
- [client.js] `apiRequest` (function)
- [client.js] `api` (const)
- [queryKeys.js] `queryKeys` (const)

## Invariants
- [client.js] Throws error on invalid arguments or missing context.
- [client.js] Guard clauses return `null` when required state or props are absent.

## Side Effects
- [client.js] Performs network I/O via HTTP API requests.

## Verification
- Run: `npm test`
