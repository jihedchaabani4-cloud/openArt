"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

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
import {
  cleanTagsForAsset,
  getActiveReferences,
  autoAssignReference,
  getAssetId,
} from "../core/tagsService.js";
import { calculateModelCredits } from "../core/creditCalculationService.js";
import { getModelReferenceCapability, resolveModelIcon } from "../core/modelManagement.js";
import {
  calculateUsedImages,
  getEntityImageCount,
  canAddReference,
} from "../core/entityService.js";
import {
  consumePendingPromptAction,
  addMediaToPrompt,
  animateMedia,
} from "@/features/studio";

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
export function PromptBarPlatform({ type, featureConfig, models = [], onGenerate, className, store, hideBackground = false, isGenerating = false, renderRightActions }) {
  if (store) {
    return (
      <PromptBarStoreContext.Provider value={store}>
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
    <PromptBarStoreProvider type={type} initialModels={models}>
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
  const { layout = {}, referenceSlots = [], supportedDomains = [] } = type || {};
  const hasModes = layout.showModeSelector !== false;

  // Store subscriptions
  const storeActiveMode    = usePromptBarStore((s) => s.activeMode);
  const storeActiveSubMode = usePromptBarStore((s) => s.activeSubMode);
  const storeSetActiveMode = usePromptBarStore((s) => s.setActiveMode);
  const storeSetActiveSubMode = usePromptBarStore((s) => s.setActiveSubMode);

  const activeMode    = storeActiveMode || "image";
  const activeSubMode = storeActiveSubMode || "frames";
  const setActiveMode = storeSetActiveMode || (() => {});
  const setActiveSubMode = storeSetActiveSubMode || (() => {});

  const prompt         = usePromptBarStore((s) => s.prompt);
  const modelsMap      = usePromptBarStore((s) => s.modelsMap);
  const selectedId     = usePromptBarStore((s) => s.selectedModelId);
  const paramValues    = usePromptBarStore((s) => s.parameterValues);
  const validationErrs = usePromptBarStore((s) => s.validationErrors);
  const storeIsGenerating = usePromptBarStore((s) => s.isGenerating);
  const isGenerating = Boolean(propIsGenerating || storeIsGenerating);

  // Store actions
  const setPrompt        = usePromptBarStore((s) => s.setPrompt);
  const setParameter     = usePromptBarStore((s) => s.setParameter);
  const selectModel      = usePromptBarStore((s) => s.selectModel);
  const serializeAndEmit = usePromptBarStore((s) => s.serialize);
  const setModels        = usePromptBarStore((s) => s.setModels);
  const setIsGenerating  = usePromptBarStore((s) => s.setIsGenerating);
  const elements         = usePromptBarStore((s) => s.elements);
  const characters       = usePromptBarStore((s) => s.characters);
  const addElement       = usePromptBarStore((s) => s.addElement);
  const removeElement    = usePromptBarStore((s) => s.removeElement);
  const addCharacter     = usePromptBarStore((s) => s.addCharacter);
  const removeCharacter  = usePromptBarStore((s) => s.removeCharacter);


  // Sync incoming models into the store
  useEffect(() => {
    if (models && models.length > 0) {
      setModels(models);
    }
  }, [models, setModels]);

  // Consume any cross-page pending prompt action (e.g. from Characters / Elements / Library)
  const executedPendingRef = useRef(false);
  useEffect(() => {
    if (!store || executedPendingRef.current) return;
    if (models && models.length > 0 && Object.keys(modelsMap).length === 0) return;

    const pending = consumePendingPromptAction();
    if (!pending) return;

    executedPendingRef.current = true;
    if (pending.type === "animate") {
      animateMedia({ store, media: pending.media, featureConfig });
    } else {
      addMediaToPrompt({ store, media: pending.media, featureConfig });
    }
  }, [store, featureConfig, models, modelsMap]);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const allModelsList = useMemo(() => Object.values(modelsMap), [modelsMap]);

  // 1. Capability Filter: featureConfig decides which models are eligible for this mode+subMode.
  //    Models list is master: adding references NEVER reduces or filters available models.
  const eligibleModels = useMemo(() => {
    if (!featureConfig) {
      // Fallback: no featureConfig provided — show all models
      if (!hasModes) {
        if (!supportedDomains.length) return allModelsList;
        return allModelsList.filter((m) => supportedDomains.includes(m.domain));
      }
      return allModelsList;
    }
    if (!hasModes) {
      if (!supportedDomains.length) return allModelsList;
      return allModelsList.filter((m) => supportedDomains.includes(m.domain));
    }
    return featureConfig.filterEligibleModels(allModelsList, activeMode, activeSubMode, {});
  }, [featureConfig, hasModes, supportedDomains, allModelsList, activeMode, activeSubMode]);

  // Ensure currentModel is strictly an active eligible model.
  // When 0 models are eligible, currentModel is null and parameters are empty.
  const isCurrentEligible = useMemo(
    () => eligibleModels.some((m) => m.id === selectedId),
    [eligibleModels, selectedId]
  );
  const currentModel = isCurrentEligible ? modelsMap[selectedId] : null;
  const parameters = useMemo(() => currentModel?.parameters || {}, [currentModel]);
  const currentModelIcon = useMemo(() => {
    if (!currentModel) return null;
    return currentModel.icon || resolveModelIcon(currentModel);
  }, [currentModel]);

  // 2. Auto-select first eligible model when current model does not satisfy mode/subMode parameter requirements
  useEffect(() => {
    if (eligibleModels.length > 0) {
      const isEligible = eligibleModels.some((m) => m.id === selectedId);
      if (!isEligible) {
        selectModel(eligibleModels[0].id);
      }
    } else {
      if (selectedId !== null) {
        selectModel(null);
      }
    }
  }, [eligibleModels, selectedId, selectModel]);

  const availableModes = useMemo(() => {
    return ["image", "video"].filter((mode) => {
      if (!featureConfig?.filterEligibleModels) return true;
      return featureConfig.filterEligibleModels(allModelsList, mode, null, {}).length > 0;
    });
  }, [featureConfig, allModelsList]);

  const availableSubModes = useMemo(() => {
    return ["frames", "reference"].filter((subMode) => {
      if (!featureConfig?.filterEligibleModels) return true;
      return featureConfig.filterEligibleModels(allModelsList, activeMode, subMode, {}).length > 0;
    });
  }, [featureConfig, allModelsList, activeMode]);

  const handleModeChange = useCallback((newMode) => {
    setActiveMode(newMode);
    if (featureConfig?.filterEligibleModels) {
      const eligible = featureConfig.filterEligibleModels(allModelsList, newMode, activeSubMode, {});
      if (eligible.length > 0 && !eligible.some((m) => m.id === selectedId)) {
        selectModel(eligible[0].id);
      }
    }
  }, [featureConfig, allModelsList, activeSubMode, selectedId, selectModel]);

  const handleSubModeChange = useCallback((newSubMode) => {
    setActiveSubMode(newSubMode);
    if (featureConfig?.filterEligibleModels) {
      const eligible = featureConfig.filterEligibleModels(allModelsList, activeMode, newSubMode, {});
      if (eligible.length > 0 && !eligible.some((m) => m.id === selectedId)) {
        selectModel(eligible[0].id);
      }
    }
  }, [featureConfig, allModelsList, activeMode, selectedId, selectModel]);

  const currentRatio = paramValues.aspect_ratio || paramValues.ratio || "1:1";
  const currentRatioIcon = getRatioIcon(currentRatio);
  const currentCount = Number(paramValues.count || paramValues.variations) || 1;

  const estimatedCredits = useMemo(() => {
    return calculateModelCredits(currentModel, paramValues, currentCount);
  }, [currentModel, paramValues, currentCount]);

  // 3. Active slot definitions — driven by featureConfig.COMPOSITION_REQUIREMENTS and currentModel.
  //    If the selected model does not support image inputs (text only), the Reference button is NOT shown!
  const activeSlots = useMemo(() => {
    if (!featureConfig) return referenceSlots; // fallback for no-config usage
    if (!hasModes) return referenceSlots;
    const req = featureConfig.COMPOSITION_REQUIREMENTS;
    const modeSlots = req?.[activeMode];
    if (!modeSlots) return [];
    // If modeSlots is an array, it's a flat mode (e.g. image)
    const slots = Array.isArray(modeSlots) ? modeSlots : (modeSlots[activeSubMode] ?? []);

    // Filter out slots that currentModel does not support:
    if (currentModel) {
      return slots.filter((slot) => {
        if (slot.role === "reference") {
          const cap = getModelReferenceCapability(currentModel);
          return cap.supports;
        }
        if (featureConfig.resolveParameterMapping) {
          const key = featureConfig.resolveParameterMapping(currentModel, slot.role);
          return Boolean(key);
        }
        return true;
      });
    }
    return slots;
  }, [featureConfig, hasModes, referenceSlots, activeMode, activeSubMode, currentModel]);

  const hasStart = activeSlots.some((s) => s.role === "start");
  const hasEnd   = activeSlots.some((s) => s.role === "end");
  const showSwap = activeMode === "video" && activeSubMode === "frames" && hasStart && hasEnd;

  // Separate generation params from media params for drawer display
  const drawerParams = useMemo(() => {
    return Object.entries(parameters).filter(
      ([, def]) => def.group !== "media" && !def.isPrompt
    );
  }, [parameters]);


  // T011 / FR-SLOT-04: Mode-switch cleanup — when composition changes, clear any slot
  // values keyed by backend keys that are no longer part of the active composition.
  // Dynamically collects all possible slot keys from featureConfig without hardcoding any.
  useEffect(() => {
    if (!featureConfig?.COMPOSITION_REQUIREMENTS) return;

    // Collect all possible backend keys across all modes in this featureConfig
    const allConfiguredKeys = new Set();
    const collectKeys = (node) => {
      if (!node) return;
      if (Array.isArray(node)) {
        node.forEach((slot) => {
          const key = featureConfig.resolveParameterMapping(currentModel, slot.role);
          if (key) allConfiguredKeys.add(key);
        });
      } else if (typeof node === "object") {
        Object.values(node).forEach(collectKeys);
      }
    };
    collectKeys(featureConfig.COMPOSITION_REQUIREMENTS);

    // Build the set of backend keys for the CURRENT active composition
    const activeKeys = new Set(
      activeSlots
        .map((slot) => featureConfig.resolveParameterMapping(currentModel, slot.role))
        .filter(Boolean)
    );

    // Clear any slot values in paramValues that belong to featureConfig slots but are not active
    allConfiguredKeys.forEach((key) => {
      if (!activeKeys.has(key) && paramValues[key] !== undefined) {
        const assetId = getAssetId(paramValues[key]);
        setParameter(key, undefined);
        if (assetId) {
          const cleaned = cleanTagsForAsset(prompt, assetId);
          if (cleaned !== prompt) {
            setPrompt(cleaned);
          }
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, activeSubMode, featureConfig, activeSlots]);

  // T010 / FR-SLOT-06: Keyframe swap handler — reads/writes backend keys (not role names).
  // Swap is only enabled when BOTH start and end frames are filled (FR-SLOT-06).
  const startKey = featureConfig?.resolveParameterMapping(currentModel, "start");
  const endKey   = featureConfig?.resolveParameterMapping(currentModel, "end");
  const startVal = startKey ? paramValues[startKey] : undefined;
  const endVal   = endKey ? paramValues[endKey] : undefined;
  const swapEnabled = Boolean(startVal && endVal); // FR-SLOT-06: both must be filled

  const handleSwapFrames = useCallback(() => {
    if (!startKey || !endKey) return;
    setParameter(startKey, endVal);
    setParameter(endKey, startVal);
  }, [startKey, endKey, startVal, endVal, setParameter]);

  // FR-SLOT-05: Generate is disabled in Frames mode if the Start Frame slot is empty, or if no eligible model is active.
  const isFramesMode = activeMode === "video" && activeSubMode === "frames";
  const isGenerateDisabled = isGenerating || !selectedId || !isCurrentEligible || (isFramesMode && !startVal);

  const handleGenerate = useCallback(async () => {
    if (isGenerateDisabled || isGenerating) return;
    setIsGenerating(true);
    try {
      const result = serializeAndEmit();
      await onGenerate?.(result);
    } catch (err) {
      console.error("[PromptBar] Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerateDisabled, isGenerating, serializeAndEmit, onGenerate, setIsGenerating]);


  // Active references list for tags & mentions
  const activeReferences = useMemo(() => {
    const fromSlots = getActiveReferences(activeSlots, paramValues, featureConfig, currentModel);
    const map = new Map();

    (fromSlots || []).forEach((ref) => {
      const id = ref.assetId || ref.id;
      if (id) map.set(id, ref);
    });

    (elements || []).forEach((el) => {
      const id = el?.workflow_id || el?.id;
      if (id && !map.has(id)) {
        map.set(id, {
          ...el,
          id,
          assetId: id,
          displayName: el.displayName || el.name || "Element",
          url: el.url || el.preview || "",
          type: "element",
          role: "element",
          element_type: el.element_type || el.type || el.category || "object",
        });
      }
    });

    (characters || []).forEach((ch) => {
      const id = ch?.workflow_id || ch?.id;
      if (id && !map.has(id)) {
        map.set(id, {
          ...ch,
          id,
          assetId: id,
          displayName: ch.displayName || ch.name || "Character",
          url: ch.url || ch.preview || "",
          type: "character",
          role: "character",
        });
      }
    });

    return Array.from(map.values());
  }, [activeSlots, paramValues, featureConfig, currentModel, elements, characters]);

  // All selected media/references currently in slots/parameters/elements/characters
  const allSelectedMedia = useMemo(() => {
    const list = [...(activeReferences || [])];
    (elements || []).forEach((el) => list.push(el));
    (characters || []).forEach((ch) => list.push(ch));
    activeSlots.forEach((slot) => {
      const backendKey = featureConfig?.resolveParameterMapping
        ? featureConfig.resolveParameterMapping(currentModel, slot.role) || slot.role
        : slot.role;
      const val = paramValues[backendKey];
      if (val) {
        if (Array.isArray(val)) val.forEach((v) => list.push(v));
        else list.push(val);
      }
    });
    return list;
  }, [activeReferences, elements, characters, activeSlots, featureConfig, currentModel, paramValues]);

  // Upload / Media Library Dialog & Quick Mention integration
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeDialogSlot, setActiveDialogSlot] = useState(null);
  const [activeDialogMode, setActiveDialogMode] = useState("image");
  const [mentionCallback, setMentionCallback] = useState(null);
  const [quickMentionOpen, setQuickMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const dialogAnchorRef = useRef(null);
  const quickMentionAnchorRef = useRef(null);

  const handleOpenDialog = useCallback((slot) => {
    setActiveDialogSlot(slot);
    setMentionCallback(null);
    const isVideoSlot = slot.accepts?.includes("video");
    setActiveDialogMode(slot.role === "reference" ? "all" : (isVideoSlot ? "all" : "image"));
    setDialogOpen(true);
  }, []);

  // Model switch reference trimming: when switching models, trim references to new model's maxRefs (reduce images, never models)
  const prevModelIdRef = useRef(selectedId);
  useEffect(() => {
    if (prevModelIdRef.current === selectedId) return;
    prevModelIdRef.current = selectedId;

    if (!currentModel) return;

    const cap = getModelReferenceCapability(currentModel);
    const targetKey = cap.backendKey || "images";

    if (!cap.supports || cap.maxRefs === 0) {
      // Model does not support references: remove reference parameters only
      // NOTE: NEVER touch paramValues.input_image or paramValues.last_frame (they belong to video keyframes)
      if (paramValues.images) setParameter("images", undefined);
      if (paramValues.reference_images) setParameter("reference_images", undefined);
    } else {
      // Model supports references up to cap.maxRefs real images.
      // STRICT ISOLATION: only read reference parameters (targetKey / images / reference_images).
      // NEVER fall back to input_image or last_frame!
      const rawVal = paramValues[targetKey] || (targetKey === "images" ? paramValues.reference_images : paramValues.images);
      const currentArr = Array.isArray(rawVal) ? rawVal : (rawVal ? [rawVal] : []);

      let runningUsed = 0;
      const kept = [];
      const removed = [];

      for (const item of currentArr) {
        const count = getEntityImageCount(item);
        if (runningUsed + count <= cap.maxRefs) {
          kept.push(item);
          runningUsed += count;
        } else {
          removed.push(item);
        }
      }

      if (removed.length > 0) {
        setParameter(targetKey, cap.maxRefs === 1 ? kept[0] : (kept.length > 0 ? kept : undefined));

        removed.forEach((item) => {
          const id = item?.workflow_id || item?.id;
          if (id) {
            removeElement(id);
            removeCharacter(id);
            const cleaned = cleanTagsForAsset(prompt, id);
            if (cleaned !== prompt) setPrompt(cleaned);
          }
        });
      }
    }
  }, [selectedId, currentModel, paramValues, prompt, setParameter, setPrompt, removeElement, removeCharacter]);

  const getSlotMaxRefs = useCallback((slot) => {
    if (!slot || !currentModel) return 0;

    const backendKey = featureConfig?.resolveParameterMapping
      ? featureConfig.resolveParameterMapping(currentModel, slot.role) || slot.role
      : slot.role;

    const paramDef = currentModel.parameters?.[backendKey];
    if (paramDef) {
      if (typeof paramDef.max === "number" && paramDef.max > 0) return paramDef.max;
      if (typeof paramDef.max_count === "number" && paramDef.max_count > 0) return paramDef.max_count;
      if (typeof paramDef.maxCount === "number" && paramDef.maxCount > 0) return paramDef.maxCount;
      if (paramDef.type === "image[]" || paramDef.type === "array") return 4;
    }

    if (slot.role === "reference") {
      const cap = getModelReferenceCapability(currentModel);
      return cap.maxRefs || 4;
    }

    if (paramDef && paramDef.type === "image") return 1;

    return 1;
  }, [currentModel, featureConfig]);

  // Merges reference parameter items with elements and characters into a unified, deduplicated list
  const getReferenceItems = useCallback((backendKey) => {
    const key = backendKey || "images";
    const rawVal = paramValues[key];
    const list = Array.isArray(rawVal) ? rawVal : (rawVal ? [rawVal] : []);

    const map = new Map();
    // 1. Existing items in paramValues
    list.forEach((item) => {
      const id = item?.workflow_id || item?.id;
      if (id) map.set(id, item);
    });

    // 2. Guarantee all store elements are included
    (elements || []).forEach((el) => {
      const id = el?.workflow_id || el?.id;
      if (id && !map.has(id)) {
        map.set(id, { ...el, type: "element" });
      }
    });

    // 3. Guarantee all store characters are included
    (characters || []).forEach((ch) => {
      const id = ch?.workflow_id || ch?.id;
      if (id && !map.has(id)) {
        map.set(id, { ...ch, type: "character" });
      }
    });

    return Array.from(map.values());
  }, [paramValues, elements, characters]);

  // Typing '@' → opens AtMentionMenu. The query typed after '@' is tracked via
  // mentionQuery and passed to ImportMedia when the user picks Asset Library.
  const handleTriggerMentionDialog = useCallback((cb) => {
    setMentionCallback(() => cb);
    if (!dialogOpen) {
      setQuickMentionOpen(true);
    }
  }, [dialogOpen]);

  const handleSelectExistingReference = useCallback((ref) => {
    if (mentionCallback) {
      mentionCallback([ref]);
    }
    setQuickMentionOpen(false);
    setMentionCallback(null);
  }, [mentionCallback]);

  const handleOpenMediaLibraryFromMention = useCallback(() => {
    setQuickMentionOpen(false);
    setActiveDialogSlot(null);
    setActiveDialogMode("all");
    setDialogOpen(true);
  }, []);

  // Close quick mention dropdown on outside click
  useEffect(() => {
    if (!quickMentionOpen) return;
    const handleClickOutside = (event) => {
      if (quickMentionAnchorRef.current && !quickMentionAnchorRef.current.contains(event.target)) {
        setQuickMentionOpen(false);
        setMentionCallback(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [quickMentionOpen]);

  // Close parameter drawer on click outside or Escape key (Version 1 parity)
  useEffect(() => {
    if (!drawerOpen) return;

    const handleClickOutside = (event) => {
      // Ignore clicks inside the prompt bar container itself
      if (containerRef.current && containerRef.current.contains(event.target)) {
        return;
      }
      // Ignore clicks inside portal-rendered elements (Radix popovers, select dropdowns, modals)
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

  const handleSelectMedia = useCallback((assets) => {
    const items = Array.isArray(assets) ? assets : [assets];
    if (items.length === 0) {
      setDialogOpen(false);
      return;
    }

    const normalizedItems = items.map((item) => {
      const workflowId = item.workflow_id || item.workflowId || item.id || item.asset_id;
      const isElement = item.type === "element" || item.is_element || String(item.workflow_type || "").toUpperCase().includes("ELEMENT");
      const isCharacter = item.type === "character" || item.is_character || String(item.workflow_type || "").toUpperCase().includes("CHARACTER");
      const resolvedType = isCharacter ? "character" : isElement ? "element" : (item.type || (item.is_video ? "video" : "image"));

      return {
        workflow_id: workflowId,
        id: workflowId,
        url: item.url || item.preview || item.file_url,
        preview: item.url || item.preview || item.file_url,
        displayName: item.displayName || item.display_name || item.name || activeDialogSlot?.label || "Reference",
        type: resolvedType,
        workflow_type: item.workflow_type || (isCharacter ? "CHARACTER_SHEET" : isElement ? "ELEMENT_SHEET" : undefined),
        image_count: item.image_count || 1,
      };
    });

    // Case 1: Triggered from a slot click
    if (activeDialogSlot) {
      const cap = getModelReferenceCapability(currentModel);
      const resolvedKey = featureConfig?.resolveParameterMapping
        ? featureConfig.resolveParameterMapping(currentModel, activeDialogSlot.role) || (activeDialogSlot.role === "reference" ? (cap.backendKey || "images") : activeDialogSlot.role)
        : (activeDialogSlot.role === "reference" ? (cap.backendKey || "images") : activeDialogSlot.role);

      if (resolvedKey) {
        if (activeDialogSlot.role === "reference") {
          const maxImages = getSlotMaxRefs(activeDialogSlot) || cap.maxRefs || 4;
          let currentList = Array.isArray(paramValues[resolvedKey])
            ? [...paramValues[resolvedKey]]
            : (paramValues[resolvedKey] ? [paramValues[resolvedKey]] : []);

          normalizedItems.forEach((norm) => {
            const check = canAddReference(currentList, norm, maxImages);
            if (check.canAdd) {
              const alreadyHas = currentList.some((c) => (c.workflow_id || c.id) === (norm.workflow_id || norm.id));
              if (!alreadyHas) {
                currentList.push(norm);
                if (norm.type === "element") {
                  addElement(norm);
                } else if (norm.type === "character") {
                  addCharacter(norm);
                }
              }
            }
          });

          setParameter(resolvedKey, maxImages === 1 ? currentList[0] : currentList);
        } else {
          // Keyframe slots (start, end)
          setParameter(resolvedKey, normalizedItems[0]);
          if (normalizedItems[0]?.type === "element") {
            addElement(normalizedItems[0]);
          } else if (normalizedItems[0]?.type === "character") {
            addCharacter(normalizedItems[0]);
          }
        }
      }
    } 
    // Case 2: Triggered from @ mention
    else if (mentionCallback) {
      normalizedItems.forEach((norm) => {
        if (norm.type === "element") {
          addElement(norm);
        } else if (norm.type === "character") {
          addCharacter(norm);
        }
        autoAssignReference({
          asset: norm,
          activeSlots,
          paramValues,
          featureConfig,
          currentModel,
          setParameter,
        });
      });
    }

    if (mentionCallback) {
      mentionCallback(normalizedItems);
      setMentionCallback(null);
      setMentionQuery("");
    }

    setDialogOpen(false);
    setActiveDialogSlot(null);
  }, [activeDialogSlot, mentionCallback, featureConfig, currentModel, setParameter, activeSlots, paramValues, addElement, addCharacter]);

  const handleRemoveReferenceItem = useCallback((itemToRemove, backendKey) => {
    const idToRemove = itemToRemove.workflow_id || itemToRemove.id;
    if (!idToRemove) return;

    // 1. Remove from paramValues across possible keys
    const targetKey = backendKey || "images";
    ["images", "input_image", "reference_images", targetKey].forEach((key) => {
      const currentVal = paramValues[key];
      if (Array.isArray(currentVal)) {
        const nextArr = currentVal.filter((r) => (r.workflow_id || r.id) !== idToRemove);
        setParameter(key, nextArr.length > 0 ? nextArr : undefined);
      } else if (currentVal && (currentVal.workflow_id || currentVal.id) === idToRemove) {
        setParameter(key, undefined);
      }
    });

    // 2. Cascade remove from elements/characters in store
    removeElement(idToRemove);
    removeCharacter(idToRemove);

    // 3. Cascade prompt tags cleanup ONLY IF not used in any other slot
    const stillUsedInSlot = activeSlots.some((s) => {
      const key = featureConfig?.resolveParameterMapping
        ? featureConfig.resolveParameterMapping(currentModel, s.role) || s.role
        : s.role;
      const val = paramValues[key];
      if (!val) return false;
      if (Array.isArray(val)) {
        return val.some((v) => (v.workflow_id || v.id) === idToRemove);
      }
      return (val.workflow_id || val.id) === idToRemove;
    });

    if (!stillUsedInSlot) {
      const cleaned = cleanTagsForAsset(prompt, idToRemove);
      if (cleaned !== prompt) {
        setPrompt(cleaned);
      }
    }
  }, [paramValues, prompt, setParameter, setPrompt, removeElement, removeCharacter, activeSlots, featureConfig, currentModel]);

  const handleRemoveSlot = useCallback((slot) => {
    const backendKey = featureConfig?.resolveParameterMapping
      ? featureConfig.resolveParameterMapping(currentModel, slot.role) || slot.role
      : slot.role;
    const currentVal = paramValues[backendKey];
    const assetId = getAssetId(currentVal);

    // 1. Remove from store
    setParameter(backendKey, undefined);

    // 2. Cascade: remove all tags referring to this asset from prompt ONLY IF not present in another slot
    if (assetId) {
      const stillUsedElsewhere = activeSlots.some((s) => {
        if (s.role === slot.role) return false;
        const key = featureConfig?.resolveParameterMapping
          ? featureConfig.resolveParameterMapping(currentModel, s.role) || s.role
          : s.role;
        const val = paramValues[key];
        if (!val) return false;
        if (Array.isArray(val)) {
          return val.some((v) => getAssetId(v) === assetId);
        }
        return getAssetId(val) === assetId;
      });

      if (!stillUsedElsewhere) {
        const cleaned = cleanTagsForAsset(prompt, assetId);
        if (cleaned !== prompt) {
          setPrompt(cleaned);
        }
      }
    }
  }, [featureConfig, currentModel, paramValues, prompt, setParameter, setPrompt, activeSlots]);

  // Calculate real images quota for references
  const currentRefBackendKey = useMemo(() => {
    if (!featureConfig?.resolveParameterMapping) return "images";
    return featureConfig.resolveParameterMapping(currentModel, "reference") || "images";
  }, [featureConfig, currentModel]);

  const currentRefList = useMemo(() => {
    return getReferenceItems(currentRefBackendKey);
  }, [getReferenceItems, currentRefBackendKey]);

  const modelRefCap = useMemo(() => {
    return getModelReferenceCapability(currentModel);
  }, [currentModel]);

  const usedImagesCount = useMemo(() => {
    return calculateUsedImages(currentRefList);
  }, [currentRefList]);

  const remainingImagesQuota = useMemo(() => {
    const refSlot = activeSlots.find((s) => s.role === "reference");
    const maxRefs = refSlot ? getSlotMaxRefs(refSlot) : (modelRefCap.maxRefs || 4);
    return Math.max(0, maxRefs - usedImagesCount);
  }, [activeSlots, getSlotMaxRefs, modelRefCap.maxRefs, usedImagesCount]);

  const activeSlotAllowedType = useMemo(() => {
    if (!activeDialogSlot) return "all";
    if (activeDialogSlot.role === "start" || activeDialogSlot.role === "end") return "image";
    if (activeDialogSlot.role === "reference") {
      if (activeMode === "video") return "image";
      return ["image", "character", "element"];
    }
    const accepts = activeDialogSlot.accepts;
    if (typeof accepts === "string") {
      if (accepts.includes("video") && !accepts.includes("image")) return "video";
      if (accepts.includes("image") && !accepts.includes("video")) return "image";
    }
    if (activeDialogSlot.role === "character") return "character";
    if (activeDialogSlot.role === "element") return "element";
    return activeDialogMode || "all";
  }, [activeDialogSlot, activeMode, activeDialogMode]);

  const activeSlotMaxAllowed = useMemo(() => {
    if (activeDialogSlot && activeDialogSlot.role !== "reference") return 1;
    return typeof remainingImagesQuota === "number" ? Math.max(1, remainingImagesQuota) : 4;
  }, [activeDialogSlot, remainingImagesQuota]);

  // Only filter out items for the multi-reference slot in image and video modes.
  // Other input slots (start, end, etc.) are independent and can freely reuse the same media.
  const dialogSelectedItems = useMemo(() => {
    if (activeDialogSlot?.role === "reference") {
      return currentRefList;
    }
    return [];
  }, [activeDialogSlot, currentRefList]);

  // Close parameter popover on click outside or Escape key
  useEffect(() => {
    if (!drawerOpen) return;

    const handleClickOutside = (event) => {
      if (tuneButtonRef.current && tuneButtonRef.current.contains(event.target)) {
        return;
      }
      if (settingsOverlayRef.current && settingsOverlayRef.current.contains(event.target)) {
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
      innerClassName="w-full flex flex-col gap-1 p-2"
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
            onClick={handleGenerate}
            disabled={isGenerateDisabled}
            className={cn(
              "h-8 px-3.5 rounded-full text-[13px] font-semibold transition-all flex items-center gap-1.5",
              isGenerateDisabled
                ? "bg-white/10 text-white/30 cursor-not-allowed"
                : "bg-white text-black hover:bg-white/90 active:scale-95"
            )}
          >
            {isGenerating ? (
              <>
                <span className="size-3 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <GoogleIcon iconName="auto_awesome" className="text-[14px]" />
                <span>Generate</span>
                {estimatedCredits > 0 && (
                  <span className="text-[11px] font-medium opacity-60 ml-0.5">
                    ({estimatedCredits}&nbsp;cr)
                  </span>
                )}
              </>
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
