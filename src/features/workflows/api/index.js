// [FSD Layer: features/workflows/api] — Barrel export for workflows hooks (1 hook/file pattern).
// Exact export names preserved to match legacy workflowsApi.js contract (baseline.md 0.2 T1 + T4):
//   5 queries   → useProjectData, useAssets, useUserLibrary, useInfiniteUserLibrary, useLibraryWorkflowDetail
//   10 mutations → useGenerateMutation, useRemoveWorkflow, useRemoveWorkflowItem,
//                  useToggleLike, useToggleWorkflowLike, useUpdateWorkflow, useSetPrimaryMedia,
//                  useMoveWorkflow, useDetachMedia, useDeleteMedia
//   9+8 char/element domain exports (Single Source of Truth re-exports from @/features/characters, @/features/elements).
// NOTE: characters/elements barrels DON'T import back from workflows/api/ — only vice-versa.
// This avoids the phase-C circular import warning mentioned in hooks-split-plan.md.

// ── Queries
export { useProjectData } from "./queries/useProjectData";
export { useAssets } from "./queries/useAssets";
export { useInfiniteUserLibrary } from "./queries/useInfiniteUserLibrary";
export { useLibraryWorkflowDetail } from "@/features/media";

// ── Mutations
export { useGenerateMutation } from "./mutations/useGenerateMutation";

export { useRemoveWorkflow } from "./mutations/useRemoveWorkflow";
export { useRemoveWorkflowItem } from "./mutations/useRemoveWorkflowItem";
export { useToggleLike } from "./mutations/useToggleLike";
export { useToggleWorkflowLike } from "./mutations/useToggleWorkflowLike";
export { useUpdateWorkflow } from "./mutations/useUpdateWorkflow";
export { useSetPrimaryMedia } from "./mutations/useSetPrimaryMedia";
export { useMoveWorkflow } from "./mutations/useMoveWorkflow";
export { useDetachMedia } from "./mutations/useDetachMedia";
export { useDeleteMedia } from "./mutations/useDeleteMedia";

// ─── Character & Element Domain Re-exports (Single Source of Truth) ───────────
export {
  useCharacter,
  useCharacterWorkflows,
  useCreateCharacterMutation,
  useUpdateCharacter,
  useGenerateCharacterSheetMutation,
  useGenerateCharacterDescriptionMutation,
  useAddMediaToCharacter,
  useRemoveMediaFromCharacter,
  useSetCharacterSheetMedia,
} from '@/features/characters';

export {
  useElement,
  useElementSheetWorkflows,
  useCreateElementSheetMutation,
  useUpdateElementMetadata,
  useAddImageToElement,
  useDeleteMediaItem,
  useAnalyzeElementVision,
} from '@/features/elements';
