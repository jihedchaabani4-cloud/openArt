"use client";

import React, { useState, useRef, useEffect, useCallback, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";

// Production UI Components integrated directly
import { PromptBarShell } from "../ui/common/PromptBarShell.jsx";
import { PromptEditor } from "../ui/common/editor/PromptEditor.jsx";
import { FlowPromptBoxSettings } from "../ui/common/selectors/FlowPromptBoxSettings.jsx";
import { PromptBarTopPanel } from "./parts/PromptBarTopPanel.jsx";
import { PromptBarSlotsRow } from "./parts/PromptBarSlotsRow.jsx";
import { PromptBarControlsRow } from "./parts/PromptBarControlsRow.jsx";

// Platform Architecture
import { PromptBarStoreProvider, PromptBarStoreContext } from "../store/PromptBarStoreContext.js";
import { usePromptBarStore } from "../store/usePromptBarStore.js";
import { usePromptBarModels } from "./hooks/usePromptBarModels.js";
import { usePromptBarSlots } from "./hooks/usePromptBarSlots.js";
import { usePromptBarReferences } from "./hooks/usePromptBarReferences.js";
import { usePromptBarGenerate } from "./hooks/usePromptBarGenerate.js";

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
  persist = true,
  persistKey = "studio-prompt-bar",
  templateId,
  instanceId,
  projectId,
  storage,
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
        />
      </PromptBarStoreContext.Provider>
    );
  }

  return (
    <PromptBarStoreProvider
      type={type}
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
      />
    </PromptBarStoreProvider>
  );
}

/** Inner renderer — lives inside the store provider, has access to usePromptBarStore */
function PromptBarPlatformInner({ type, featureConfig, models, onGenerate, className, hideBackground = false, isGenerating: propIsGenerating = false, renderRightActions }) {
  const store = useContext(PromptBarStoreContext);
  const [drawerOpen, setDrawerOpen] = useState(false); // Collapsed by default (FR-COMP-04)
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
  const setTemplate = usePromptBarStore((s) => s.setTemplate);

  const activeMode    = storeActiveMode || "image";
  const activeSubMode = storeActiveSubMode || "frames";
  const setActiveMode = storeSetActiveMode || (() => {});
  const setActiveSubMode = storeSetActiveSubMode || (() => {});

  const prompt         = usePromptBarStore((s) => s.prompt);
  const paramValues    = usePromptBarStore((s) => s.parameterValues);
  const validationErrs = usePromptBarStore((s) => s.validationErrors);

  // Store actions
  const setPrompt        = usePromptBarStore((s) => s.setPrompt);
  const setParameter     = usePromptBarStore((s) => s.setParameter);
  const focusRequest     = usePromptBarStore((s) => s.focusRequest);

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


  // Sync template/featureConfig into the store
  useEffect(() => {
    if (featureConfig && setTemplate) {
      setTemplate(featureConfig);
    }
  }, [featureConfig, setTemplate]);

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
    currentRatio,
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
    drawerOpen,
    setDrawerOpen,
    containerRef,
    tuneButtonRef,
    settingsOverlayRef,
  });

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
      innerClassName="w-full flex flex-col gap-1 p-2.5"
      popover={settingsOverlay}
    >

      {/* ── Reference & Media Slots Row (H5) ─── */}
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

      {/* ── Prompt Input (Lexical Rich Editor with @ Mentions) ─── */}
      {layout.showPromptInput && (
        <div className="w-full">
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
          />
        </div>
      )}

      {/* ── Controls Row (H5) ─────────────────────────────────── */}
      {/* Note: PromptBarControlsRow renders the circular generate button (size-8) with <ArrowRight /> */}
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
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[650px] px-6 flex flex-col items-center gap-2 pointer-events-none"
    >
      {topPanelZone}
      <div className="w-full pointer-events-auto">
        {shellContent}
      </div>
    </div>
  );
}
