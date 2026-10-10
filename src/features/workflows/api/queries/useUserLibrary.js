// [FSD Layer: features/workflows/api/queries] — Library/media re-exports (1 hook/file).
// These hooks conceptually live under "project workflows" — import contract from
// baseline.md 0.2 T1 (useUserLibrary, useInfiniteUserLibrary, useLibraryWorkflowDetail,
// useAssets via workflows) lists them as workflows exports. Bodies are re-exported
// VERBATIM from @/features/media/api/* via the media barrel (no copy).
// NOTE: These are separate files (not just barrel re-exports) per plan "1 hook / file".
export { useUserLibrary } from "@/features/media/api";
