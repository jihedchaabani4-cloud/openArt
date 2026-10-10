// Legacy shim: all bodies moved to ./queries/ and ./mutations/ (see index.js barrel).
// Also preserves the char/element domain re-exports block (now handled in index.js).
// Keeping this one-line re-export so old import paths like `@/features/workflows/api/workflowsApi`
// and barrel chains (features/workflows/index.js → ./api/workflowsApi) continue to resolve.
export * from "./index";
