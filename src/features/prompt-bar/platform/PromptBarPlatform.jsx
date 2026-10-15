"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { ArrowRight } from "lucide-react";

// Production UI Components integrated directly
import { PromptBarShell } from "../ui/common/PromptBarShell.jsx";
import { MediaInput } from "../ui/common/MediaInput.jsx";
import { SwapIcon, ReferenceButton, ViewReference } from "../ui/common/ReferenceButton.jsx";
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";
import { PromptEditor } from "../ui/common/editor/PromptEditor.jsx";
import { AtMentionMenu } from "../ui/common/editor/AtMentionMenu.jsx";
import { FlowPromptBoxSettings, getRatioIcon } from "../ui/common/selectors/FlowPromptBoxSettings.jsx";
import { Button } from "@/shared/ui/button";

// Platform Architecture
import { PromptBarStoreProvider, PromptBarStoreContext } from "../store/PromptBarStoreContext.js";
import { usePromptBarStore } from "../store/usePromptBarStore.js";
import { calculateModelCredits } from "../core/creditCalculationService.js";
import { usePromptBarModels } from "./hooks/usePromptBarModels.js";
import { usePromptBarSlots } from "./hooks/usePromptBarSlots.js";
import { usePromptBarReferences } from "./hooks/usePromptBarReferences.js";

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
  const textareaRef = useRef(null);
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
  const storeIsGenerating = usePromptBarStore((s) => s.isGenerating);
  const isGenerating = Boolean(propIsGenerating || storeIsGenerating);

  // Store actions
  const setPrompt        = usePromptBarStore((s) => s.setPrompt);
  const setParameter     = usePromptBarStore((s) => s.setParameter);
  const serializeAndEmit = usePromptBarStore((s) => s.serialize);
  const setIsGenerating  = usePromptBarStore((s) => s.setIsGenerating);
  const beginSubmit      = usePromptBarStore((s) => s.beginSubmit);
  const endSubmit        = usePromptBarStore((s) => s.endSubmit);
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

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

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

  const currentRatio = paramValues.aspect_ratio || paramValues.ratio || "1:1";
  const currentRatioIcon = getRatioIcon(currentRatio);
  const currentCount = Number(paramValues.count || paramValues.variations) || 1;

  const estimatedCredits = useMemo(() => {
    return calculateModelCredits(currentModel, paramValues, currentCount);
  }, [currentModel, paramValues, currentCount]);

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

  // FR-SLOT-05: Generate is disabled in Frames mode if the Start Frame slot is empty, or if no eligible model is active.
  const isFramesMode = activeMode === "video" && activeSubMode === "frames";
  const isGenerateDisabled = isGenerating || !selectedId || !isCurrentEligible || (isFramesMode && !startVal);

  const handleGenerate = useCallback(async () => {
    if (isGenerateDisabled || isGenerating) return;
    const token = typeof beginSubmit === "function" ? beginSubmit() : null;
    try {
      const result = serializeAndEmit();
      await onGenerate?.(result);
    } finally {
      if (typeof endSubmit === "function") {
        endSubmit(token);
      } else {
        setIsGenerating(false);
      }
    }
  }, [isGenerateDisabled, isGenerating, beginSubmit, endSubmit, serializeAndEmit, onGenerate, setIsGenerating]);


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

  // ── Top Panel Zone ──────────────────────────────────────────────────────────
  // Renders above the prompt bar shell: AtMentionMenu (quick mention) or
  // ImportMediaPopover (panel variant), with unified AnimatePresence transitions.
  const topPanelZone = (
    <AnimatePresence mode="wait" initial={false}>
      {quickMentionOpen && (
        <div ref={quickMentionAnchorRef} className="w-full flex justify-center">
          <AtMentionMenu
            open={quickMentionOpen}
            onClose={() => {
              setQuickMentionOpen(false);
              setMentionCallback(null);
              setMentionQuery("");
            }}
            references={activeReferences}
            onSelectReference={handleSelectExistingReference}
            onOpenMediaLibrary={handleOpenMediaLibraryFromMention}
            anchorRef={quickMentionAnchorRef}
            query={mentionQuery}
          />
        </div>
      )}

      {!quickMentionOpen && dialogOpen && (
        <motion.div
          key="import-media-panel"
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-[28px] bg-(--background-base-pri) backdrop-blur-[80px] border border-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.58)] pointer-events-auto w-fit max-w-[95vw]"
        >
          <ImportMediaPopover
            variant="panel"
            open={dialogOpen}
            onOpenChange={(val) => {
              setDialogOpen(val);
              if (!val) setMentionQuery("");
            }}
            anchorRef={dialogAnchorRef}
            allowedType={activeSlotAllowedType}
            maxAllowed={activeSlotMaxAllowed}
            remainingImages={activeDialogSlot && activeDialogSlot.role !== "reference" ? undefined : remainingImagesQuota}
            mode={activeDialogMode}
            selectedItems={dialogSelectedItems}
            excludedItems={allSelectedMedia}
            onSelect={handleSelectMedia}
            initialSearch={mentionQuery}
          />
        </motion.div>
      )}
    </AnimatePresence>
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

      {/* ── Reference Slots (Rendered directly with dumb MediaInput primitive) ─── */}
      {activeSlots.length > 0 && (
        <div className="overflow-visible">
          <div ref={dialogAnchorRef} className="flex items-center gap-2 flex-wrap">
            {activeSlots.map((slot) => {
              const backendKey = featureConfig?.resolveParameterMapping(currentModel, slot.role) ?? slot.role;
              const media = paramValues[backendKey];
              const isStart = slot.role === "start";
              const isEnd = slot.role === "end";
              const isReferenceRole = slot.role === "reference";
              const slotLabel = isStart ? "Start" : isEnd ? "End" : slot.label;

              if (isReferenceRole) {
                const refList = getReferenceItems(backendKey);
                const maxRefs = getSlotMaxRefs(slot);
                const usedImages = calculateUsedImages(refList);
                const remainingImages = Math.max(0, maxRefs - usedImages);
                const canAddMore = remainingImages > 0;

                return (
                  <React.Fragment key={slot.role}>
                    {/* Existing reference thumbnails (images, characters, elements) */}
                    {refList.map((refItem) => {
                      const itemId = refItem.workflow_id || refItem.id;
                      return (
                        <div key={itemId} className="flex items-center gap-2">
                          <ViewReference
                            media={refItem}
                            label={refItem.displayName || "Ref"}
                            onRemove={() => handleRemoveReferenceItem(refItem, backendKey)}
                          />
                        </div>
                      );
                    })}

                    {/* Add button (shown beside thumbnails; hidden only when reaching max real images) */}
                    {canAddMore && (
                      <div key={`${slot.role}-add-btn`} className="flex items-center gap-2">
                        <ReferenceButton
                          variant="add"
                          word={refList.length === 0 ? "Ref" : "Add"}
                          onClick={() => handleOpenDialog(slot)}
                          title={refList.length === 0 ? "Add Reference / Element / Character" : "Add another Reference"}
                        />
                      </div>
                    )}

                  </React.Fragment>
                );
              }

              // Fixed Keyframe Slot (Start Frame / End Frame in video mode)
              return (
                <div key={slot.role} className="flex items-center gap-2">
                  <MediaInput
                    label={slotLabel}
                    role={slot.role}
                    variant={slot.role}
                    value={media}
                    accept={slot.accepts || "image/*"}
                    onClick={() => handleOpenDialog(slot)}
                    onChange={(val) => setParameter(backendKey, val)}
                    onRemove={() => handleRemoveSlot(slot)}
                  />
                  {isStart && showSwap && (
                    <button
                      type="button"
                      onClick={handleSwapFrames}
                      disabled={!swapEnabled}
                      className={cn(
                        "p-1.5 rounded-md transition-colors",
                        swapEnabled
                          ? "text-white/50 hover:text-white cursor-pointer hover:bg-white/5"
                          : "text-white/15 cursor-not-allowed"
                      )}
                      title={swapEnabled ? "Swap start and end frames" : "Fill both frames to swap"}
                    >
                      <SwapIcon />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* ── Bottom Row ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 w-full">
        {/* Left side spacer */}
        <div className="flex items-center gap-1.5 min-w-[32px]" />

        {/* Center: Spacer (model selection is housed exclusively inside settings drawer) */}
        <div className="flex-1" />

        {/* Right side: Parameter button + generate */}
        <div className="flex items-center gap-2 shrink-0">
          {renderRightActions && renderRightActions({ isGenerating })}
          {((layout.showParameterDrawer && (hasModes || drawerParams.length > 0)) || layout.showModelSelector) && (
            <Button
              ref={tuneButtonRef}
              type="button"
              variant="blur"
              aria-label="Déclencheur des paramètres"
              title="Paramètres de génération et modèles"
              onClick={() => {
                setDrawerOpen((v) => {
                  const next = !v;
                  if (next) {
                    setQuickMentionOpen(false);
                    setDialogOpen(false);
                  }
                  return next;
                });
              }}
              className={cn(
                "settings-trigger-button h-8 px-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer select-none text-[12px] font-medium text-white",
                drawerOpen
                  ? "bg-white/15 border border-white/20 shadow-sm text-white"
                  : "border-transparent text-white hover:text-white"
              )}
            >
              {currentModel && (
                <div className="flex items-center gap-1.5 max-w-[150px] truncate">
                  {currentModelIcon && (
                    <img
                      src={currentModelIcon}
                      alt=""
                      className="size-3.5 rounded-sm object-contain brightness-0 invert shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  <span className="font-medium text-[12px] truncate text-white">
                    {currentModel.name || currentModel.displayName || currentModel.id}
                  </span>
                </div>
              )}
              <GoogleIcon
                iconName={currentRatioIcon}
                className="text-[15px] leading-none shrink-0 text-white"
              />
              <span className="leading-none shrink-0 font-medium text-[12px] text-white">
                x{currentCount}
              </span>
            </Button>
          )}

          <Button
            type="button"
            variant="flow-generate"
            aria-label="Generate"
            title={estimatedCredits > 0 ? `Generate (${estimatedCredits} cr)` : "Generate"}
            onClick={handleGenerate}
            disabled={isGenerateDisabled}
            className={cn(
              "size-8 min-w-8 p-0 rounded-full flex items-center justify-center transition-all shrink-0",
              isGenerateDisabled
                ? "bg-white/10 text-white/30 cursor-not-allowed"
                : "bg-white text-black hover:bg-white/90 active:scale-95 shadow-sm"
            )}
          >
            {isGenerating ? (
              <span className="size-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            ) : (
              <ArrowRight className="size-4 shrink-0" strokeWidth={2.5} />
            )}
          </Button>
        </div>
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
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[650px] px-6 flex flex-col items-center gap-2 pointer-events-none"
    >
      {topPanelZone}
      <div className="w-full pointer-events-auto">
        {shellContent}
      </div>
    </div>
  );
}
