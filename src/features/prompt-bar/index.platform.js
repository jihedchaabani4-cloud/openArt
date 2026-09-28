/**
 * Prompt Bar Platform — Public API
 *
 * Clean public export for the new Platform architecture.
 * Does NOT re-export the existing production prompt bar.
 */

// ── Renderer ─────────────────────────────────────────────
export { PromptBarPlatform } from "./platform/PromptBarPlatform.jsx";

// ── Composition Types & Feature Configs ───────────────────────
export { createPromptBarType } from "./composition/createPromptBarType.js";
export { generatedMediaType }  from "./composition/generatedMedia.type.js";
export { characterType }       from "./composition/character.type.js";
export * as generatedMediaConfig from "./features/generated-media/generatedMedia.config.js";
export { resolveUI, filterEligibleModels } from "./composition/resolveUI.js";

// ── Store ─────────────────────────────────────────────────
export { createPromptBarStore }    from "./store/createPromptBarStore.js";
export { PromptBarStoreProvider, PromptBarStoreContext } from "./store/PromptBarStoreContext.js";
export { usePromptBarStore }       from "./store/usePromptBarStore.js";

// ── Core (for testing / advanced use) ────────────────────
export { reconcile, validateParameter } from "./core/reconciliation.js";
export { serialize }                    from "./core/serialization.js";
export { adaptBackendModel, adaptBackendCatalog, getModelReferenceCapability } from "./core/modelManagement.js";
export { useRealBackendModels }         from "./core/useRealBackendModels.js";
export * as tagsService                 from "./core/tagsService.js";
export * as tagsResolver                from "./core/tagsResolver.js";
export * as entityService               from "./core/entityService.js";

// ── Production Selectors (Reused) ─────────────────────────
export { PromptBarShell } from "./ui/common/PromptBarShell.jsx";
export { MediaInput } from "./ui/common/MediaInput.jsx";
export { ReferenceButton, ViewReference, SwapIcon } from "./ui/common/ReferenceButton.jsx";
export { RatioSelector } from "./ui/common/selectors/RatioSelector.jsx";
export { QualitySelector } from "./ui/common/selectors/QualitySelector.jsx";
export { VideoResolutionSelector } from "./ui/common/selectors/VideoResolutionSelector.jsx";
export { VariationSelector } from "./ui/common/selectors/VariationSelector.jsx";
export { DurationSelector } from "./ui/common/selectors/DurationSelector.jsx";
export { BaseSelector } from "./ui/common/selectors/BaseSelector.jsx";
export { FeatureModeSelector } from "./ui/common/selectors/FeatureModeSelector.jsx";
export { FlowPromptBoxSettings } from "./ui/common/selectors/FlowPromptBoxSettings.jsx";
