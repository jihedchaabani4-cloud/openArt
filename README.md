# my-app Blueprint

## System Overview
LabVeil App is a Next.js (React 19, Tailwind CSS v4) creative studio and media generation platform supporting characters, elements, workflows, and cinema studio features.

## Local Interface & Invariants
- [eslint.config.mjs] `default` (default export)
- [next.config.mjs] `default` (default export)
- [postcss.config.mjs] `default` (default export)
- [vitest.config.mjs] `default` (default export)

## Subdirectories & System Boundaries
- **[scripts](./scripts/README.md)**: Subsystem handling `scripts` functionality.
- **[src](./src/README.md)**: Subsystem handling `src` functionality.

## Global Invariants
- Preserves React 19 Concurrent Root and Next.js App Router layout invariants.
- Enforces strict UI border radius tokens (max `rounded-md`) and design system primitives.
- Ensures optimistic mutations roll back on network or server error.

## Global Side Effects
- Interacts with backend API endpoints for asset generation, project storage, and billing.
- Manages local client cache and Zustand global state.

## System Verification
- Run: `npm test`
