// [FSD Layer: features/elements/hooks] — Barrel index (Phase-E).
// Single source of truth for all element hooks.
// Consumers: import from "@/features/elements/hooks/useElement" (shim) or "@/features/elements".

// Composer (unified element hook)
export { useElement, default } from "./useElementComposer";

// Query hooks
export { useElementSheetWorkflows } from "./useElementSheetWorkflows";

// Mutation hooks (1 hook / file)
export { useCreateElementSheetMutation } from "./useCreateElementSheetMutation";
export { useUpdateElementMetadata } from "./useUpdateElementMetadata";
export { useAddImageToElement } from "./useAddImageToElement";
export { useDeleteMediaItem } from "./useDeleteMediaItem";
export { useAnalyzeElementVision } from "./useAnalyzeElementVision";

// UI / controller hooks — exported directly from root features/elements/index.js
// NOT re-exported here to avoid circular: these hooks import from ./useElement (shim → this barrel)
