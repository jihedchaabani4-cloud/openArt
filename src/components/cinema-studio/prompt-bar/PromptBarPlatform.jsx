"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";

// Production UI Components integrated directly
import { PromptBarShell } from "@/components/cinema-studio/prompt-bar/PromptBarShell.jsx";
import { PromptEditor } from "@/components/cinema-studio/prompt-bar/editor/PromptEditor.jsx";
import { FlowPromptBoxSettings } from "@/components/cinema-studio/prompt-bar/selectors/FlowPromptBoxSettings.jsx";
import { PromptBarTopPanel } from "@/components/cinema-studio/prompt-bar/parts/PromptBarTopPanel.jsx";
import { PromptBarSlotsRow } from "@/components/cinema-studio/prompt-bar/parts/PromptBarSlotsRow.jsx";
import { PromptBarControlsRow } from "@/components/cinema-studio/prompt-bar/parts/PromptBarControlsRow.jsx";
import { IconButton } from "@/components/base/icon-button";
import { HugeIcon } from "@/components/primitives/HugeIcon";

// Platform Architecture — Public Service & Read-Only Selectors
import {
  PromptBarStoreProvider,
  usePromptBarService,
  usePromptBarState,
} from "@/features/prompt-bar";
import { usePromptBarModels } from "@/features/prompt-bar/platform/hooks/usePromptBarModels.js";
import { usePromptBarSlots } from "@/features/prompt-bar/platform/hooks/usePromptBarSlots.js";
import { usePromptBarReferences } from "@/features/prompt-bar/platform/hooks/usePromptBarReferences.js";
import { usePromptBarGenerate } from "@/features/prompt-bar/platform/hooks/usePromptBarGenerate.js";

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
const EMPTY_MODELS = [];

export function PromptBarPlatform({
  type,
  featureConfig,
  models = EMPTY_MODELS,
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
  return (
    <PromptBarStoreProvider
      store={store}
      reuseParent={!store}
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

/** Inner renderer — lives inside the store provider, consumes ONLY sealed Public Service & read-only selectors */
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
  const [activeOverlay, setActiveOverlay] = useState(null); // null | "settings" | "media"
  const drawerOpen = activeOverlay === "settings";
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const containerRef = useRef(null);
  const tuneButtonRef = useRef(null);
  const settingsOverlayRef = useRef(null);

  // Feature Mode State (Image vs Video, Frames vs Reference)
  const { layout = {} } = type || {};
  const hasModes = layout.showModeSelector !== false;

  // Sealed Public Service & read-only state selectors
  const service         = usePromptBarService();
  const activeMode      = usePromptBarState((s) => s.activeMode) || "image";
  const activeSubMode   = usePromptBarState((s) => s.activeSubMode) || "frames";
  const prompt          = usePromptBarState((s) => s.prompt);
  const paramValues     = usePromptBarState((s) => s.parameterValues);
  const validationErrs  = usePromptBarState((s) => s.validationErrors);
  const focusRequest    = usePromptBarState((s) => s.focusRequest);
  const promptFillNonce = usePromptBarState((s) => s.promptFillNonce);

  // Model state and synchronization (H1)
  const {
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

  const handleModeChange = useCallback(
    (newMode) => {
      service.switchMode(newMode, activeSubMode);
    },
    [service, activeSubMode]
  );

  const handleSubModeChange = useCallback(
    (newSubMode) => {
      service.switchMode(activeMode, newSubMode);
    },
    [service, activeMode]
  );

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
    activeDialogSlot,
    activeDialogMode,
    dialogAnchorRef,
    mentionQuery,
    setMentionQuery,
    handleOpenChangeDialog,
    handleOpenDialog,
    getSlotMaxRefs,
    handleTriggerMentionDialog,
    handleSelectMedia,
    handleRemoveReferenceItem,
    handleRemoveSlot,
    handleClearReferences,
    getReferenceItems,
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

  const isMediaOpen = activeOverlay === "media" && dialogOpen;

  const handleOpenMediaDialog = useCallback(
    (slot) => {
      setActiveOverlay("media");
      handleOpenDialog(slot);
    },
    [handleOpenDialog]
  );

  const handleTriggerMention = useCallback(
    (cb) => {
      setActiveOverlay("media");
      handleTriggerMentionDialog(cb);
    },
    [handleTriggerMentionDialog]
  );

  const handleMediaDialogOpenChange = useCallback(
    (open) => {
      handleOpenChangeDialog(open);
      setActiveOverlay((curr) => (open ? "media" : curr === "media" ? null : curr));
    },
    [handleOpenChangeDialog]
  );

  const handleToggleSettings = useCallback(() => {
    setActiveOverlay((curr) => {
      const next = curr === "settings" ? null : "settings";
      if (next === "settings") {
        handleOpenChangeDialog(false);
      }
      return next;
    });
  }, [handleOpenChangeDialog]);

  const handleAttachSlotMedia = useCallback(
    (role, value) => {
      if (value) {
        service.attachMedia({ role, value });
      } else {
        service.clearSlot(role);
      }
    },
    [service]
  );

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

  const [isReferenceUnstacked, setIsReferenceUnstacked] = useState(false);
  const hasFilledReferenceSlot = Boolean(
    activeSlots &&
      activeSlots.some((slot) => {
        if (slot.role !== "reference") return false;
        const backendKey = featureConfig?.resolveParameterMapping
          ? featureConfig.resolveParameterMapping(currentModel, slot.role) || slot.role
          : slot.role;
        const items = getReferenceItems ? getReferenceItems(backendKey) : [];
        return items.length > 0;
      })
  );
  const showUnstackedReferenceTray = isReferenceUnstacked && hasFilledReferenceSlot;

  useEffect(() => {
    if (!hasFilledReferenceSlot && isReferenceUnstacked) {
      setIsReferenceUnstacked(false);
    }
  }, [hasFilledReferenceSlot, isReferenceUnstacked]);

  // Expand button only appears when input reaches a full line / wraps (or exceeds character threshold), or is already expanded
  const EXPAND_THRESHOLD_CHARS = 45;
  const [isInputLineFull, setIsInputLineFull] = useState(false);
  const editorContainerRef = useRef(null);

  useEffect(() => {
    if (!prompt || !prompt.trim()) {
      setIsInputLineFull(false);
      return;
    }
    const container = editorContainerRef.current;
    const editable = container?.querySelector('[contenteditable="true"]');
    const p = editable?.querySelector("p") || editable;
    if (p && p.clientWidth > 0 && typeof document.createRange === "function") {
      try {
        const range = document.createRange();
        range.selectNodeContents(p);
        const rects = range.getClientRects();
        const boxRect = range.getBoundingClientRect();
        const reachedFullLine =
          rects.length > 1 ||
          boxRect.height > 30 ||
          boxRect.width >= p.clientWidth - 20 ||
          prompt.includes("\n");
        setIsInputLineFull(reachedFullLine);
        return;
      } catch {
        // fallback below
      }
    }
    setIsInputLineFull(
      prompt.trim().length >= EXPAND_THRESHOLD_CHARS || prompt.includes("\n")
    );
  }, [prompt, activeSlots?.length]);

  const canShowExpandButton =
    isInputLineFull ||
    Boolean(prompt && (prompt.trim().length >= EXPAND_THRESHOLD_CHARS || prompt.includes("\n"))) ||
    isPromptExpanded;

  const handleClearAll = useCallback(() => {
    service.clearDraft();
    setIsPromptExpanded(false);
  }, [service]);

  // Close parameter drawer on click outside or Escape key
  useEffect(() => {
    if (!drawerOpen) return;

    const handleClickOutside = (event) => {
      // Keep open if clicking the tune button (its onClick handles toggle)
      if (tuneButtonRef?.current && tuneButtonRef.current.contains(event.target)) {
        return;
      }
      // Keep open if clicking inside the settings overlay card
      if (settingsOverlayRef?.current && settingsOverlayRef.current.contains(event.target)) {
        return;
      }
      // Keep open if selecting from dropdowns / popovers (e.g. Model, Resolution selectors)
      const isPortalClick = event.target.closest?.(
        "[data-radix-popper-content-wrapper], [data-slot='popover-content'], [role='dialog'], [role='listbox'], .radix-portal, [data-portal]"
      );
      if (isPortalClick) {
        return;
      }

      setActiveOverlay((curr) => (curr === "settings" ? null : curr));
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveOverlay((curr) => (curr === "settings" ? null : curr));
      }
    };

    document.addEventListener("pointerdown", handleClickOutside, true);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  // ── Top Panel Zone (H5) ─────────────────────────────────────────────────────
  const topPanelZone = (
    <PromptBarTopPanel
      mentionQuery={mentionQuery}
      dialogOpen={isMediaOpen}
      onOpenChangeDialog={handleMediaDialogOpenChange}
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
            onParamChange={service.setSetting}
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

      {/* ── Main Row: Reference Slots + Vertical Gradient Divider + Prompt Input (on the same line) ─── */}
      <div className="flex gap-2 w-full">
        <fieldset
          data-source="reference"
          className={cn(
            "relative grid grid-cols-1 grid-rows-1 min-w-0 flex-1 overflow-visible rounded-xl bg-white-5 transition-[height] duration-200 ease-out",
            showUnstackedReferenceTray
              ? "min-h-17 h-auto"
              : isPromptExpanded
                ? "h-44"
                : "h-17"
          )}
        >
          <legend className="sr-only">(Optional) Add a reference</legend>
          <div className="col-start-1 row-start-1 relative flex min-w-0 min-h-0 items-center gap-1.5 p-1.5 h-full">
            <PromptBarSlotsRow
              activeSlots={activeSlots}
              featureConfig={featureConfig}
              currentModel={currentModel}
              paramValues={paramValues}
              dialogAnchorRef={dialogAnchorRef}
              getReferenceItems={getReferenceItems}
              getSlotMaxRefs={getSlotMaxRefs}
              handleRemoveReferenceItem={handleRemoveReferenceItem}
              handleOpenDialog={handleOpenMediaDialog}
              onAttachMedia={handleAttachSlotMedia}
              onClearSlot={service.clearSlot}
              onClearReferences={handleClearReferences}
              handleRemoveSlot={handleRemoveSlot}
              showSwap={showSwap}
              swapEnabled={swapEnabled}
              handleSwapFrames={handleSwapFrames}
              isReferenceUnstacked={showUnstackedReferenceTray}
              onToggleReferenceUnstacked={setIsReferenceUnstacked}
            />

            <motion.div
              aria-hidden={showUnstackedReferenceTray || undefined}
              animate={{
                opacity: showUnstackedReferenceTray ? 0 : 1,
                x: showUnstackedReferenceTray ? 16 : 0,
                filter: showUnstackedReferenceTray ? "blur(3px)" : "blur(0px)",
              }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "flex min-w-0 items-center gap-1.5",
                showUnstackedReferenceTray
                  ? "pointer-events-none absolute inset-y-1.5 right-1.5 left-20"
                  : "flex-1 h-full min-h-0"
              )}
            >
              {activeSlots && activeSlots.length > 0 && layout.showPromptInput && (
                <div
                  aria-hidden="true"
                  className="self-stretch my-1 w-px shrink-0 bg-gradient-to-b from-transparent via-[color:var(--border-subtle)] to-transparent"
                />
              )}

              {layout.showPromptInput && (
                <div className="min-w-0 min-h-0 flex-1 h-full flex flex-col px-1.5 py-0.5 overflow-hidden font-sans antialiased ds-text-caption-m">
                  <div ref={editorContainerRef} className="flex-1 h-full min-h-0 overflow-y-auto custom-scrollbar">
                    <PromptEditor
                      value={prompt}
                      onChange={service.setPrompt}
                      onSubmit={handleGenerate}
                      referenceImages={activeReferences}
                      onTriggerMentionDialog={handleTriggerMention}
                      onMentionQueryChange={setMentionQuery}
                      mentionOpen={isMediaOpen}
                      placeholder="Describe what you want to create..."
                      focusRequest={focusRequest}
                      fillNonce={promptFillNonce}
                      plugins={editorPlugins}
                      isExpanded={isPromptExpanded}
                    />
                  </div>
                </div>
              )}

              <div className="ml-auto shrink-0 self-start flex items-center gap-0.5">
                <AnimatePresence>
                  {hasAnyContent && (
                    <motion.div
                      key="clear-all-btn"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.15 }}
                    >
                      <IconButton
                        variant="ghost"
                        size="sm"
                        aria-label="Effacer tout"
                        title="Effacer tout (texte et références)"
                        onClick={handleClearAll}
                        className="shrink-0 text-text-body-muted hover:text-text-primary transition-colors"
                      >
                        <HugeIcon
                          name="cancel-01"
                          className="leading-none"
                        />
                      </IconButton>
                    </motion.div>
                  )}

                  {layout.showPromptInput && canShowExpandButton && (
                    <motion.div
                      key="expand-btn"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.15 }}
                    >
                      <IconButton
                        variant="ghost"
                        size="sm"
                        data-state={isPromptExpanded ? "open" : "closed"}
                        aria-label={isPromptExpanded ? "Réduire le champ de saisie" : "Agrandir le champ de saisie"}
                        title={isPromptExpanded ? "Collapse prompt input" : "Expand prompt input"}
                        onClick={() => setIsPromptExpanded((v) => !v)}
                        className={cn(
                          "shrink-0 text-text-body-muted hover:text-text-primary transition-colors",
                          isPromptExpanded && "text-text-primary"
                        )}
                      >
                        <HugeIcon
                          name={isPromptExpanded ? "arrow-shrink-02" : "arrow-expand-02"}
                          className="leading-none"
                        />
                      </IconButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </fieldset>
      </div>

      {/* ── Bottom Controls Row (Settings Dropdown Trigger + Send Button) ─── */}
      <div className="flex items-center justify-end gap-2 w-full">
        <PromptBarControlsRow
          renderRightActions={renderRightActions}
          isGenerating={isGenerating}
          showSettingsButton={((layout.showParameterDrawer && (hasModes || drawerParams.length > 0)) || layout.showModelSelector)}
          tuneButtonRef={tuneButtonRef}
          drawerOpen={drawerOpen}
          onToggleDrawer={handleToggleSettings}
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
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-150 px-6 flex flex-col items-center gap-2 pointer-events-none"
    >
      {topPanelZone}
      <div className="w-full pointer-events-auto">
        {shellContent}
      </div>
    </div>
  );
}
