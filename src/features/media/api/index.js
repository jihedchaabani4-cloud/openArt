// [FSD Layer: features/media/api] — Barrel export for media hooks (1 hook / file pattern).
// Exact export names preserved to match legacy mediaApi.js contract (baseline.md §0.2 T3):
//   4 queries (useAssets, useUserLibrary, useInfiniteUserLibrary, useLibraryWorkflowDetail)
//   2 mutations (useBatchUploadAssets, useRemoveAsset)
//   1 utility (downloadMediaItem)
export { useAssets } from "./queries/useAssets";
export { useUserLibrary } from "./queries/useUserLibrary";
export { useInfiniteUserLibrary } from "./queries/useInfiniteUserLibrary";
export { useLibraryWorkflowDetail } from "./queries/useLibraryWorkflowDetail";
export { useBatchUploadAssets } from "./mutations/useBatchUploadAssets";
export { useRemoveAsset } from "./mutations/useRemoveAsset";
export { downloadMediaItem } from "./lib/downloadMediaItem";
