/**
 * Prompt Bar Platform — Public API
 *
 * Clean public export for the new Platform architecture.
 * Does NOT re-export the existing production prompt bar.
 */

// ── Renderer & Wrappers ──────────────────────────────────
export { PromptBarPlatform } from "@/components/cinema-studio/prompt-bar/PromptBarPlatform.jsx";
export { GeneratedPromptBar } from "@/components/cinema-studio/prompt-bar/GeneratedPromptBar.jsx";
export { generatedMediaTemplate } from "./templates/generatedMedia.template.js";
export { CharacterPromptBar } from "@/components/cinema-studio/prompt-bar/CharacterPromptBar.jsx";
export { characterTemplate } from "./templates/character.template.js";
export { CharacterFeatureEditor, ElementFeatureEditor } from "@/components/cinema-studio/prompt-bar/CharacterFeatureEditor.jsx";
export { useCharacterStore, useElementStore } from "./model/useCharacterStore.js";
export { promptBarService } from "./api/promptBarService.js";


// ── Composition Types & Feature Configs ───────────────────────
export { createPromptBarType } from "./composition/createPromptBarType.js";
export { generatedMediaType, filterEligibleModels } from "./templates/generatedMedia.template.js";
export { characterType }       from "./composition/character.type.js";
export * as generatedMediaConfig from "./templates/generatedMedia.template.js";

// ── Store & Route Policy ──────────────────────────────────
export { createPromptBarStore }    from "./store/createPromptBarStore.js";
export { PromptBarStoreProvider, PromptBarStoreContext } from "./store/PromptBarStoreContext.js";
export { usePromptBarStore }       from "./store/usePromptBarStore.js";
export { matchRoute, isPathAllowed, normalizePathSegments } from "./store/routePolicy.js";
export { usePromptBarRouteWatcher } from "./store/usePromptBarRouteWatcher.js";

// ── Core (for testing / advanced use) ────────────────────
export { reconcile, validateParameter } from "./core/reconciliation.js";
export { serialize }                    from "./core/serialization.js";
export { adaptBackendModel, adaptBackendCatalog, getModelReferenceCapability } from "./core/modelManagement.js";
export { useRealBackendModels }         from "./core/useRealBackendModels.js";
export * as tagsService                 from "./core/tagsService.js";
export * as tagsResolver                from "./core/tagsResolver.js";
export * as entityService               from "./core/entityService.js";

// ── Production Selectors (Reused) ─────────────────────────
export { PromptBarShell } from "@/components/cinema-studio/prompt-bar/PromptBarShell.jsx";
export { MediaInput } from "@/components/cinema-studio/prompt-bar/MediaInput.jsx";
export { ReferenceButton, ViewReference, SwapIcon } from "@/components/cinema-studio/prompt-bar/ReferenceButton.jsx";
export { RatioSelector } from "@/components/cinema-studio/prompt-bar/selectors/RatioSelector.jsx";
export { QualitySelector } from "@/components/cinema-studio/prompt-bar/selectors/QualitySelector.jsx";
export { VideoResolutionSelector } from "@/components/cinema-studio/prompt-bar/selectors/VideoResolutionSelector.jsx";
export { VariationSelector } from "@/components/cinema-studio/prompt-bar/selectors/VariationSelector.jsx";
export { DurationSelector } from "@/components/cinema-studio/prompt-bar/selectors/DurationSelector.jsx";
export { BaseSelector } from "@/components/cinema-studio/prompt-bar/selectors/BaseSelector.jsx";
export { FeatureModeSelector } from "@/components/cinema-studio/prompt-bar/selectors/FeatureModeSelector.jsx";
export { FlowPromptBoxSettings } from "@/components/cinema-studio/prompt-bar/selectors/FlowPromptBoxSettings.jsx";
