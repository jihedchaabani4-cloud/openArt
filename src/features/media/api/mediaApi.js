// Legacy shim: all bodies moved to ./queries/, ./mutations/, ./lib/ (see index.js barrel).
// Keeping this one-line re-export so old import paths like `@/features/media/api/mediaApi`
// and `@/features/media` (root barrel re-exports this file) continue to resolve unchanged.
export * from "./index";
