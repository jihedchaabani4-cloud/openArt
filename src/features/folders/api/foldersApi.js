// Legacy shim: all bodies moved to ../queries/ and ../mutations/ (see index.js barrel).
// Keeping this one-line re-export so old import paths like `@/features/folders/api/foldersApi`
// and `@/features/folders` (root barrel re-exports this file) continue to resolve unchanged.
export * from "./index";
