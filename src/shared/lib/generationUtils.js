// src/shared/lib/generationUtils.js
// ⚠️  BACKWARD-COMPAT SHIM — do not add new logic here.
//     Import directly from referenceUtils or displayUtils instead.
//     This file exists only so old imports don't break during migration.

export { adaptReferences, validateReference, buildReferencesPayload, getGenerationConfig } from "./referenceUtils";
export {
  getGridClass,
  formatGenerationDate,
  formatPromptForDisplay,
  getItemMetadata,
  getPrimaryMedia,
  getPrimaryMediaConfig,
  intrinsicSizeToCssAspect,
  intrinsicSizeToRatioLabel,
} from "./displayUtils";
