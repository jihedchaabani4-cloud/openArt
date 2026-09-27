/**
 * Prompt Bar Platform — Composition Type Factory
 *
 * Creates a frozen CompositionType configuration object.
 * Composition types define the feature-specific behavior: reference slots, layout, domain filter, modes.
 * Core has zero knowledge of composition types.
 *
 * US7: Reference slots are defined here — never in Core or Controls.
 */

const DEFAULT_LAYOUT = {
  showPromptInput: true,
  showModelSelector: true,
  showParameterDrawer: true,
  showAttachmentBar: false,
  showModeSelector: false,
};

/**
 * Creates a frozen CompositionType object.
 *
 * @param {object}          config
 * @param {string}          config.id                 - Unique type identifier
 * @param {string|null}     [config.defaultModelId]   - Starting model id; null = use first available
 * @param {string[]}        [config.supportedDomains] - Domain filter for model list (e.g. ["image"])
 * @param {ReferenceSlot[]} [config.referenceSlots]   - Feature-specific attachment slots
 * @param {object}          [config.modes]            - Feature-specific mode hierarchy (e.g. image vs video, frames vs reference)
 * @param {object}          [config.layout]           - Section visibility overrides
 * @returns {Readonly<CompositionType>}
 */
export function createPromptBarType(config) {
  if (!config?.id) {
    throw new Error("createPromptBarType: config.id is required");
  }

  const referenceSlots = config.referenceSlots || [];
  const hasModes = Boolean(config.modes);

  const layout = {
    ...DEFAULT_LAYOUT,
    // Auto-enable attachment bar when slots or modes are defined
    showAttachmentBar: referenceSlots.length > 0 || hasModes,
    showModeSelector: hasModes,
    ...(config.layout || {}),
  };

  return Object.freeze({
    id: config.id,
    defaultModelId: config.defaultModelId || null,
    supportedDomains: config.supportedDomains || [],
    referenceSlots: Object.freeze(referenceSlots.map(Object.freeze)),
    modes: config.modes ? Object.freeze(config.modes) : null,
    layout: Object.freeze(layout),
  });
}
