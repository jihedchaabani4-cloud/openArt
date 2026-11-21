/**
 * Prompt Bar Platform — Public API (Sealed Black-Box Core)
 *
 * Exports ONLY the public service contract, provider, read-only hooks,
 * public template descriptors/constants, and UI host components.
 * Private store internals and raw mutators are NOT exported here.
 */

// ── Public Service & React Hooks ──────────────────────────
export {
  promptBarService,
  resolveReusableGeneration,
  hasGeneratedPrimaryMedia,
  withPrimaryMediaFallback,
} from "./api/promptBarService.js";
export {
  PromptBarStoreProvider,
  usePromptBarService,
  usePromptBarState,
  usePromptBarSnapshot,
} from "./store/PromptBarStoreContext.js";
export { usePromptBarRouteWatcher } from "./store/usePromptBarRouteWatcher.js";

// ── Read-Only Derived Selectors, Helpers & Constants ──────
export {
  selectElements,
  selectCharacters,
  deriveEntitiesFromParameters,
  getEntityImageCount,
} from "./core/entityService.js";
export { resolveMediaUrl } from "./core/mediaRef.js";
export { resolveModelIcon, getModelReferenceCapability } from "./core/modelManagement.js";
export { calculateModelCredits } from "./core/creditCalculationService.js";
export { REASONS } from "./core/commandResult.js";

// ── Public Templates & Model Adapter ──────────────────────
export { defineTemplate } from "./core/templateContract.js";
export {
  generatedMediaTemplate,
  filterEligibleModels,
  COMPOSITION_REQUIREMENTS,
  resolveParameterMapping,
} from "./templates/generatedMedia.template.js";
export { characterTemplate } from "./templates/character.template.js";
export { useRealBackendModels } from "./adapters/useRealBackendModels.js";

// ── UI Wrappers & Layout Helpers Needed by Consumers ──────
export { PromptBarPlatform } from "@/components/cinema-studio/prompt-bar/PromptBarPlatform.jsx";
export { GeneratedPromptBar } from "@/components/cinema-studio/prompt-bar/GeneratedPromptBar.jsx";
export { CharacterPromptBar } from "@/components/cinema-studio/prompt-bar/CharacterPromptBar.jsx";
export { CharacterFeatureEditor, ElementFeatureEditor } from "@/components/cinema-studio/prompt-bar/CharacterFeatureEditor.jsx";
export { PromptBarShell } from "@/components/cinema-studio/prompt-bar/PromptBarShell.jsx";
export { MediaInput } from "@/components/cinema-studio/prompt-bar/MediaInput.jsx";
export { ReferenceButton, ViewReference, SwapIcon } from "@/components/cinema-studio/prompt-bar/ReferenceButton.jsx";
export { FlowPromptBoxSettings } from "@/components/cinema-studio/prompt-bar/selectors/FlowPromptBoxSettings.jsx";
