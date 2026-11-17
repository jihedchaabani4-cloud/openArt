"use client";

import { useState, useRef, useCallback, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";

// Production UI Components integrated directly
import { PromptBarShell } from "@/components/cinema-studio/prompt-bar/PromptBarShell.jsx";
import { PromptEditor } from "@/components/cinema-studio/prompt-bar/editor/PromptEditor.jsx";
import { FlowPromptBoxSettings } from "@/components/cinema-studio/prompt-bar/selectors/FlowPromptBoxSettings.jsx";
import { PromptBarTopPanel } from "@/components/cinema-studio/prompt-bar/parts/PromptBarTopPanel.jsx";
import { PromptBarSlotsRow } from "@/components/cinema-studio/prompt-bar/parts/PromptBarSlotsRow.jsx";
import { PromptBarControlsRow } from "@/components/cinema-studio/prompt-bar/parts/PromptBarControlsRow.jsx";
import { Button } from "@/components/base/button";
import { GoogleIcon } from "@/components/primitives/GoogleIcon";

// Platform Architecture
import { PromptBarStoreProvider, PromptBarStoreContext } from "@/features/prompt-bar/store/PromptBarStoreContext.js";
import { usePromptBarStore } from "@/features/prompt-bar/store/usePromptBarStore.js";
import { usePromptBarModels } from "@/features/prompt-bar/platform/hooks/usePromptBarModels.js";
import { usePromptBarSlots } from "@/features/prompt-bar/platform/hooks/usePromptBarSlots.js";
import { usePromptBarReferences } from "@/features/prompt-bar/platform/hooks/usePromptBarReferences.js";
import { usePromptBarGenerate } from "@/features/prompt-bar/platform/hooks/usePromptBarGenerate.js";

const NOOP = () => {};

/**
 * PromptBarPlatform
 * Prompt Bar Platform — Generic, feature-agnostic renderer with Feature Mode Composition.
 *
 * Props:
 *   type:          CompositionType — layout config from createPromptBarType() (required)
 *   featureConfig: FeatureConfig — { COMPOSITION_REQUIREMENTS, filterEligibleModels,
 *                  resolveParameterMapping } from the feature's *.config.js (required)
 *   models:        ModelContract[] — from useRealBackendModels (required)
 *   onGenerate:    (SerializedRequest) => void — called on Generate (required)
 *   className:     string — optional Tailwind overrides
 *   store:         ZustandStore — optional external store for inspection/testing
 *
 * v3 contract: Platform MUST NOT own COMPOSITION_REQUIREMENTS or filterEligibleModels.
 * Platform MUST NOT call setParameter(slot.role, val) — must always resolve role to
 * backend key via featureConfig.resolveParameterMapping first.
 */
export function PromptBarPlatform({
  type,
  featureConfig,
  models = [],
  onGenerate,
  className,
  store,
  hideBackground = false,
  isGenerating = false,
  renderRightActions,
  renderPopover,
  persist = true,
  persistKey = "studio-prompt-bar",
  templateId,
  instanceId,
  projectId,
  storage,
  editorPlugins,
}) {
  const contextStore = useContext(PromptBarStoreContext);
  const activeStore = store || contextStore;

  if (activeStore) {
    return (
      <PromptBarStoreContext.Provider value={activeStore}>
        <PromptBarPlatformInner
          type={type}
          featureConfig={featureConfig}
          models={models}
          onGenerate={onGenerate}
          className={className}
          hideBackground={hideBackground}
          isGenerating={isGenerating}
          renderRightActions={renderRightActions}
          renderPopover={renderPopover}
          editorPlugins={editorPlugins}
        />
      </PromptBarStoreContext.Provider>
    );
  }

  return (
    <PromptBarStoreProvider
      type={type}
      featureConfig={featureConfig}
      templateId={templateId}
      instanceId={instanceId}
      projectId={projectId}
      initialModels={models}
      persist={persist}
      persistKey={persistKey}
      storage={storage}
    >
      <PromptBarPlatformInner
        type={type}
        featureConfig={featureConfig}
        models={models}
        onGenerate={onGenerate}
        className={className}
        hideBackground={hideBackground}
        isGenerating={isGenerating}
        renderRightActions={renderRightActions}
        renderPopover={renderPopover}
        editorPlugins={editorPlugins}
      />
    </PromptBarStoreProvider>
  );
}

/** Inner renderer — lives inside the store provider, has access to usePromptBarStore */
function PromptBarPlatformInner({
  type,
  featureConfig,
  models,
  onGenerate,
  className,
  hideBackground = false,
  isGenerating: propIsGenerating = false,
  renderRightActions,
  renderPopover,
  editorPlugins,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false); // Collapsed by default (FR-COMP-04)
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const containerRef = useRef(null);
  const tuneButtonRef = useRef(null);
  const settingsOverlayRef = useRef(null);

  // Feature Mode State (Image vs Video, Frames vs Reference)
  const { layout = {} } = type || {};
  const hasModes = layout.showModeSelector !== false;

  // Store subscriptions
  const storeActiveMode    = usePromptBarStore((s) => s.activeMode);
  const storeActiveSubMode = usePromptBarStore((s) => s.activeSubMode);
  const storeSetActiveMode = usePromptBarStore((s) => s.setActiveMode);
  const storeSetActiveSubMode = usePromptBarStore((s) => s.setActiveSubMode);
  const storeSwitchMode = usePromptBarStore((s) => s.switchMode);

  const activeMode    = storeActiveMode || "image";
  const activeSubMode = storeActiveSubMode || "frames";
  const setActiveMode = storeSetActiveMode || NOOP;
  const setActiveSubMode = storeSetActiveSubMode || NOOP;

  const prompt         = usePromptBarStore((s) => s.prompt);
  const paramValues    = usePromptBarStore((s) => s.parameterValues);
  const validationErrs = usePromptBarStore((s) => s.validationErrors);

  // Store actions
  const setPrompt        = usePromptBarStore((s) => s.setPrompt);
  const setParameter     = usePromptBarStore((s) => s.setParameter);
  const focusRequest     = usePromptBarStore((s) => s.focusRequest);
  const promptFillNonce  = usePromptBarStore((s) => s.promptFillNonce);
  const clearEntities    = usePromptBarStore((s) => s.clearEntities);
  const removeMedia      = usePromptBarStore((s) => s.removeMedia);

  // Model state and synchronization (H1)
  const {
    allModelsList,
    eligibleModels,
    currentModel,
    isCurrentEligible,
    selectedId,
    parameters,
    currentModelIcon,
    availableModes,
    availableSubModes,
    selectModel,
  } = usePromptBarModels({
    models,
    type,
    featureConfig,
    activeMode,
    activeSubMode,
  });

  const handleModeChange = useCallback((newMode) => {
    if (storeSwitchMode) {
      storeSwitchMode(newMode, activeSubMode);
    } else {
      setActiveMode(newMode);
      if (featureConfig?.filterEligibleModels) {
        const eligible = featureConfig.filterEligibleModels(allModelsList, newMode, activeSubMode, {});
        if (eligible.length > 0 && !eligible.some((m) => m.id === selectedId)) {
          selectModel(eligible[0].id);
        }
      }
    }
  }, [storeSwitchMode, activeSubMode, setActiveMode, featureConfig, allModelsList, selectedId, selectModel]);

  const handleSubModeChange = useCallback((newSubMode) => {
    if (storeSwitchMode) {
      storeSwitchMode(activeMode, newSubMode);
    } else {
      setActiveSubMode(newSubMode);
      if (featureConfig?.filterEligibleModels) {
        const eligible = featureConfig.filterEligibleModels(allModelsList, activeMode, newSubMode, {});
        if (eligible.length > 0 && !eligible.some((m) => m.id === selectedId)) {
          selectModel(eligible[0].id);
        }
      }
    }
  }, [storeSwitchMode, activeMode, setActiveSubMode, featureConfig, allModelsList, selectedId, selectModel]);

  // Active slots, drawer parameters, and swap handler (H2)
  const {
    activeSlots,
    showSwap,
    drawerParams,
    startVal,
    swapEnabled,
    handleSwapFrames,
  } = usePromptBarSlots({
    featureConfig,
    type,
    activeMode,
    activeSubMode,
    currentModel,
    parameters,
  });

  // Generation credits, ratios, and submission lifecycle (H4)
  const {
    currentRatioIcon,
    currentCount,
    estimatedCredits,
    isGenerateDisabled,
    isGenerating,
    handleGenerate,
  } = usePromptBarGenerate({
    currentModel,
    selectedId,
    isCurrentEligible,
    activeMode,
    activeSubMode,
    startVal,
    onGenerate,
    isGenerating: propIsGenerating,
    hasModels: (type?.features?.models ?? featureConfig?.features?.models) !== false && type?.layout?.showModelSelector !== false,
    template: type || featureConfig,
  });



  // References, dialogs, media quotas, and outside-click listeners (H3)
  const {
    activeReferences,
    allSelectedMedia,
    dialogOpen,
    setDialogOpen,
    activeDialogSlot,
    activeDialogMode,
    dialogAnchorRef,
    quickMentionOpen,
    setQuickMentionOpen,
    mentionQuery,
    setMentionQuery,
    quickMentionAnchorRef,
    handleCloseQuickMention,
    handleOpenChangeDialog,
    handleOpenDialog,
    getSlotMaxRefs,
    handleTriggerMentionDialog,
    handleSelectExistingReference,
    handleOpenMediaLibraryFromMention,
    handleSelectMedia,
    handleRemoveReferenceItem,
    handleRemoveSlot,
    getReferenceItems,
    calculateUsedImages,
    remainingImagesQuota,
    activeSlotAllowedType,
    activeSlotMaxAllowed,
    dialogSelectedItems,
  } = usePromptBarReferences({
    activeSlots,
    featureConfig,
    currentModel,
    activeMode,
  });

  const hasReferences = (activeReferences && activeReferences.length > 0) ||
    (allSelectedMedia && allSelectedMedia.length > 0) ||
    (activeSlots && activeSlots.length > 0 && activeSlots.some((slot) => {
      const backendKey = featureConfig?.resolveParameterMapping
        ? featureConfig.resolveParameterMapping(currentModel, slot.role) || slot.role
        : slot.role;
      const val = paramValues?.[backendKey];
      if (Array.isArray(val)) return val.length > 0;
      return Boolean(val);
    }));

  const hasAnyContent = Boolean(prompt?.trim()) || Boolean(hasReferences);

  // Expand button only appears when input exceeds character threshold (gets filled: 60+ chars or newlines), or is already expanded
  const EXPAND_THRESHOLD_CHARS = 60;
  const canShowExpandButton = Boolean(
    prompt && (prompt.trim().length >= EXPAND_THRESHOLD_CHARS || prompt.includes("\n"))
  ) || isPromptExpanded;

  const handleClearAll = useCallback(() => {
    setPrompt("");
    if (activeSlots && activeSlots.length > 0) {
      activeSlots.forEach((slot) => {
        const backendKey = featureConfig?.resolveParameterMapping
          ? featureConfig.resolveParameterMapping(currentModel, slot.role) || slot.role
          : slot.role;
        setParameter(backendKey, undefined);
        if (typeof removeMedia === "function") {
          removeMedia({ role: slot.role });
        }
      });
    }
    if (typeof clearEntities === "function") {
      clearEntities();
    }
    setIsPromptExpanded(false);
  }, [setPrompt, activeSlots, featureConfig, currentModel, setParameter, removeMedia, clearEntities]);

  // Close parameter drawer on click outside or Escape key
  useEffect(() => {
    if (!drawerOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef?.current && containerRef.current.contains(event.target)) {
        return;
      }
      if (tuneButtonRef?.current && tuneButtonRef.current.contains(event.target)) {
        return;
      }
      if (settingsOverlayRef?.current && settingsOverlayRef.current.contains(event.target)) {
        return;
      }
      const isPortalClick = event.target.closest?.(
        "[data-radix-popper-content-wrapper], [role='dialog'], [role='listbox'], .radix-portal, [data-portal]"
      );
      if (isPortalClick) {
        return;
      }

      setDrawerOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  // ── Top Panel Zone (H5) ─────────────────────────────────────────────────────
  const topPanelZone = (
    <PromptBarTopPanel
      quickMentionOpen={quickMentionOpen}
      quickMentionAnchorRef={quickMentionAnchorRef}
      onCloseQuickMention={handleCloseQuickMention}
      activeReferences={activeReferences}
      onSelectReference={handleSelectExistingReference}
      onOpenMediaLibrary={handleOpenMediaLibraryFromMention}
      mentionQuery={mentionQuery}
      dialogOpen={dialogOpen}
      onOpenChangeDialog={handleOpenChangeDialog}
      dialogAnchorRef={dialogAnchorRef}
      activeSlotAllowedType={activeSlotAllowedType}
      activeSlotMaxAllowed={activeSlotMaxAllowed}
      remainingImagesQuota={remainingImagesQuota}
      activeDialogSlot={activeDialogSlot}
      activeDialogMode={activeDialogMode}
      dialogSelectedItems={dialogSelectedItems}
      allSelectedMedia={allSelectedMedia}
      onSelectMedia={handleSelectMedia}
    />
  );

  // ── Outer wrapper + Settings overlay ─────────────────────────────────────
  const settingsOverlay = (
    <AnimatePresence>
      {drawerOpen && layout.showParameterDrawer && (hasModes || drawerParams.length > 0) && (
        <motion.div
          ref={settingsOverlayRef}
          key="flow-settings-overlay"
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="absolute bottom-[calc(100%+12px)] right-3 z-50 pointer-events-auto"
        >
          <FlowPromptBoxSettings
            activeMode={activeMode}
            onModeChange={handleModeChange}
            activeSubMode={activeSubMode}
            onSubModeChange={handleSubModeChange}
            availableModes={availableModes}
            availableSubModes={availableSubModes}
            hasModes={hasModes}
            currentModel={currentModel}
            models={eligibleModels}
            onSelectModel={selectModel}
            parameters={drawerParams}
            paramValues={paramValues}
            onParamChange={setParameter}
            validationErrors={validationErrs}
            creditCost={estimatedCredits}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  const shellContent = (
    <PromptBarShell
      containerRef={hideBackground ? containerRef : undefined}
      variant="generation"
      hideBackground={true}
      className={cn("w-full", className)}
      innerClassName="w-full flex flex-col gap-1 p-2"
      popover={
        <>
          {settingsOverlay}
          {renderPopover ? renderPopover() : null}
        </>
      }
    >

      {/* ── Top Row: Reference & Media Slots (left) + Corner Expand/Collapse Button (right) ─── */}
      <div className="flex items-start justify-between gap-2 w-full">
        <PromptBarSlotsRow
          activeSlots={activeSlots}
          featureConfig={featureConfig}
          currentModel={currentModel}
          paramValues={paramValues}
          dialogAnchorRef={dialogAnchorRef}
          getReferenceItems={getReferenceItems}
          getSlotMaxRefs={getSlotMaxRefs}
          calculateUsedImages={calculateUsedImages}
          handleRemoveReferenceItem={handleRemoveReferenceItem}
          handleOpenDialog={handleOpenDialog}
          setParameter={setParameter}
          handleRemoveSlot={handleRemoveSlot}
          showSwap={showSwap}
          swapEnabled={swapEnabled}
          handleSwapFrames={handleSwapFrames}
        />
        <div className="ml-auto shrink-0 self-start flex items-center gap-1">
          <AnimatePresence>
            {hasAnyContent && (
              <motion.div
                key="clear-all-btn"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Effacer tout"
                  title="Effacer tout (texte et références)"
                  onClick={handleClearAll}
                  className="size-8 p-0 border-0 flex items-center justify-center shrink-0 cursor-pointer text-white/70 hover:text-white transition-colors"
                >
                  <GoogleIcon
                    iconName="close"
                    className="text-base leading-none"
                  />
                </Button>
              </motion.div>
            )}
            {canShowExpandButton && (
              <motion.div
                key="expand-btn"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={isPromptExpanded ? "Réduire le champ de saisie" : "Agrandir le champ de saisie"}
                  title={isPromptExpanded ? "Collapse prompt input" : "Expand prompt input"}
                  onClick={() => setIsPromptExpanded((v) => !v)}
                  className={cn(
                    "size-8 p-0 border-0 flex items-center justify-center shrink-0 cursor-pointer text-white/70 hover:text-white transition-colors",
                    isPromptExpanded && "is-active bg-white/10 text-white"
                  )}
                >
                  <GoogleIcon
                    iconName={isPromptExpanded ? "close_fullscreen" : "open_in_full"}
                    className="text-base leading-none"
                  />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Prompt Input & Controls Row (on the same line) ─── */}
      <div className="flex items-end gap-2 w-full">
        {layout.showPromptInput && (
          <motion.div
            animate={{ height: isPromptExpanded ? 200 : 38 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 min-w-0 ds-composer-well ds-input-ghost bg-transparent border-none shadow-none px-1 py-0.5 overflow-hidden"
          >
            <PromptEditor
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleGenerate}
              referenceImages={activeReferences}
              onTriggerMentionDialog={handleTriggerMentionDialog}
              onMentionQueryChange={setMentionQuery}
              mentionOpen={quickMentionOpen || dialogOpen}
              placeholder="Describe what you want to create..."
              focusRequest={focusRequest}
              fillNonce={promptFillNonce}
              plugins={editorPlugins}
              isExpanded={isPromptExpanded}
            />
          </motion.div>
        )}

        {/* ── Controls (Settings Dropdown Trigger + Send Button) ─── */}
        <PromptBarControlsRow
          renderRightActions={renderRightActions}
          isGenerating={isGenerating}
          showSettingsButton={((layout.showParameterDrawer && (hasModes || drawerParams.length > 0)) || layout.showModelSelector)}
          tuneButtonRef={tuneButtonRef}
          drawerOpen={drawerOpen}
          onToggleDrawer={() => {
            setDrawerOpen((v) => {
              const next = !v;
              if (next) {
                setQuickMentionOpen(false);
                setDialogOpen(false);
              }
              return next;
            });
          }}
          currentModel={currentModel}
          currentModelIcon={currentModelIcon}
          currentRatioIcon={currentRatioIcon}
          currentCount={currentCount}
          estimatedCredits={estimatedCredits}
          isGenerateDisabled={isGenerateDisabled}
          handleGenerate={handleGenerate}
        />
      </div>
    </PromptBarShell>
  );

  // ── Final render ──────────────────────────────────────────────────────────
  // When hideBackground=false (default): outer fixed wrapper handles positioning.
  // When hideBackground=true (embedded): use relative wrapper so parent controls layout.
  if (hideBackground) {
    return (
      <div ref={containerRef} className="relative w-full flex flex-col items-center gap-2 pointer-events-none">
        {topPanelZone}
        <div className="w-full pointer-events-auto">
          {shellContent}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[650px] px-6 flex flex-col items-center gap-2 pointer-events-none"
    >
      {topPanelZone}
      <div className="w-full pointer-events-auto">
        {shellContent}
      </div>
    </div>
  );
}
