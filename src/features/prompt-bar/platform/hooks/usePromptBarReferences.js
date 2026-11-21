import { useState, useRef, useCallback, useMemo } from "react";
import { usePromptBarState, usePromptBarService } from "../../store/PromptBarStoreContext.js";
import { getActiveReferences } from "../../core/tagsService.js";
import {
  getSlotMaxRefs as resolveSlotMaxRefs,
  remainingQuota,
  allowedTypeForSlot,
} from "../../core/media.js";
import { calculateUsedImages, normalizeEntity } from "../../core/entityService.js";

/**
 * usePromptBarReferences
 * Single source of truth: reads ONLY parameterValues via usePromptBarState and mutates
 * exclusively through usePromptBarService() (attachMedia, removeMedia, clearSlot).
 * Both slot picks and @mentions route through service.attachMedia.
 */
export function usePromptBarReferences({
  activeSlots = [],
  featureConfig,
  currentModel,
  activeMode = "image",
} = {}) {
  const service     = usePromptBarService();
  const paramValues = usePromptBarState((s) => s.parameterValues);

  // Dialog & mention states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeDialogSlot, setActiveDialogSlot] = useState(null);
  const [activeDialogMode, setActiveDialogMode] = useState("image");
  const [mentionCallback, setMentionCallback] = useState(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const dialogAnchorRef = useRef(null);

  // Active references derived purely from activeSlots + parameterValues
  const activeReferences = useMemo(() => {
    return getActiveReferences(activeSlots, paramValues, featureConfig, currentModel);
  }, [activeSlots, paramValues, featureConfig, currentModel]);

  // All selected media currently attached in active slots
  const allSelectedMedia = useMemo(() => {
    return activeReferences;
  }, [activeReferences]);

  const handleOpenDialog = useCallback((slot) => {
    setActiveDialogSlot(slot);
    setMentionCallback(null);
    const isVideoSlot = slot.accepts?.includes("video");
    setActiveDialogMode(slot.role === "reference" ? "all" : (isVideoSlot ? "all" : "image"));
    setDialogOpen(true);
  }, []);

  const getSlotMaxRefs = useCallback(
    (slot) => {
      return resolveSlotMaxRefs({
        slot,
        model: currentModel,
        featureConfig,
      });
    },
    [currentModel, featureConfig]
  );

  // Reads attached reference items directly from parameterValues[backendKey]
  const getReferenceItems = useCallback(
    (backendKey) => {
      const key = backendKey || "images";
      const rawVal = paramValues?.[key];
      if (!rawVal) return [];
      return Array.isArray(rawVal) ? rawVal : [rawVal];
    },
    [paramValues]
  );

  // Typing '@' -> opens ImportMediaPopover directly
  const handleTriggerMentionDialog = useCallback((cb) => {
    setMentionCallback(() => cb);
    setActiveDialogSlot(null);
    setActiveDialogMode("all");
    setDialogOpen(true);
  }, []);

  const handleMentionQueryChange = useCallback(
    (q) => {
      if (q === null) {
        if (mentionCallback) {
          setDialogOpen(false);
          setMentionCallback(null);
          setMentionQuery("");
        }
        return;
      }
      setMentionQuery(q);
    },
    [mentionCallback]
  );

  const handleOpenChangeDialog = useCallback((val) => {
    setDialogOpen(val);
    if (!val) {
      setMentionCallback(null);
      setMentionQuery("");
    }
  }, []);

  const handleSelectMedia = useCallback(
    (assets, options = {}) => {
      const items = Array.isArray(assets) ? assets : [assets];
      if (items.length === 0) {
        setDialogOpen(false);
        return;
      }

      const normalizedItems = items
        .map((item) => normalizeEntity(item, null))
        .filter(Boolean);

      const attachedItems = [];

      // Case 1: Triggered from a slot click
      if (activeDialogSlot) {
        normalizedItems.forEach((norm) => {
          const res = service.attachMedia({ role: activeDialogSlot.role, value: norm });
          if (res?.ok === true) {
            attachedItems.push(norm);
          }
        });
      }
      // Case 2: Triggered from @ mention — always routes through service.attachMedia using live state
      else if (mentionCallback && activeSlots.length > 0) {
        const refSlot = activeSlots.find((s) => s.role === "reference");
        normalizedItems.forEach((norm) => {
          let targetRole = refSlot?.role || null;
          if (!targetRole) {
            const liveParams = service.getSnapshot().parameterValues || {};
            const emptySlot = activeSlots.find((slot) => {
              const key = featureConfig?.resolveParameterMapping
                ? featureConfig.resolveParameterMapping(currentModel, slot.role)
                : slot.role;
              const val = key ? liveParams[key] : undefined;
              return val === undefined || val === null || val === "";
            });
            targetRole = (emptySlot || activeSlots[0])?.role || null;
          }
          if (!targetRole) return;
          const res = service.attachMedia({ role: targetRole, value: norm });
          if (res?.ok === true) {
            attachedItems.push(norm);
          }
        });
      }

      if (mentionCallback) {
        if (attachedItems.length > 0) {
          mentionCallback(attachedItems);
        }
        setMentionCallback(null);
        setMentionQuery("");
        setDialogOpen(false);
        setActiveDialogSlot(null);
        return;
      }

      if (options?.keepOpen !== true && options?.closeDialog !== false) {
        setDialogOpen(false);
        setActiveDialogSlot(null);
      }
    },
    [activeDialogSlot, mentionCallback, service, activeSlots, featureConfig, currentModel]
  );

  const handleRemoveReferenceItem = useCallback(
    (itemToRemove) => {
      service.removeMedia({ role: "reference", value: itemToRemove });
    },
    [service]
  );

  const handleRemoveSlot = useCallback(
    (slot) => {
      service.clearSlot(slot.role);
    },
    [service]
  );

  const handleClearReferences = useCallback(() => {
    service.clearSlot("reference");
  }, [service]);

  // Calculate real images quota for references
  const currentRefBackendKey = useMemo(() => {
    if (!featureConfig?.resolveParameterMapping) return "images";
    return featureConfig.resolveParameterMapping(currentModel, "reference") || "images";
  }, [featureConfig, currentModel]);

  const currentRefList = useMemo(() => {
    return getReferenceItems(currentRefBackendKey);
  }, [getReferenceItems, currentRefBackendKey]);

  const usedImagesCount = useMemo(() => {
    return calculateUsedImages(currentRefList);
  }, [currentRefList]);

  const remainingImagesQuota = useMemo(() => {
    if (activeSlots.length === 0) return 0;
    const refSlot = activeSlots.find((s) => s.role === "reference");
    if (!refSlot) return undefined;
    return remainingQuota({
      model: currentModel,
      used: usedImagesCount,
      slot: refSlot,
      featureConfig,
    });
  }, [activeSlots, currentModel, featureConfig, usedImagesCount]);

  const activeSlotAllowedType = useMemo(() => {
    return allowedTypeForSlot({
      mode: activeMode,
      slot: activeDialogSlot,
      fallback: activeDialogMode || "all",
    });
  }, [activeDialogSlot, activeMode, activeDialogMode]);

  const activeSlotMaxAllowed = useMemo(() => {
    if (activeDialogSlot && activeDialogSlot.role !== "reference") return 1;
    return typeof remainingImagesQuota === "number" ? Math.max(1, remainingImagesQuota) : 1;
  }, [activeDialogSlot, remainingImagesQuota]);

  // Only filter out items for the multi-reference slot in image and video modes
  const dialogSelectedItems = useMemo(() => {
    if (activeDialogSlot?.role === "reference") {
      return currentRefList;
    }
    return [];
  }, [activeDialogSlot, currentRefList]);

  return {
    activeReferences,
    allSelectedMedia,
    dialogOpen,
    setDialogOpen,
    activeDialogSlot,
    setActiveDialogSlot,
    activeDialogMode,
    setActiveDialogMode,
    dialogAnchorRef,
    mentionQuery,
    setMentionQuery: handleMentionQueryChange,
    handleOpenChangeDialog,
    handleOpenDialog,
    getSlotMaxRefs,
    handleTriggerMentionDialog,
    handleSelectMedia,
    handleRemoveReferenceItem,
    handleRemoveSlot,
    handleClearReferences,
    getReferenceItems,
    calculateUsedImages,
    currentRefBackendKey,
    currentRefList,
    usedImagesCount,
    remainingImagesQuota,
    activeSlotAllowedType,
    activeSlotMaxAllowed,
    dialogSelectedItems,
  };
}
