import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePromptBarStore } from "../../store/usePromptBarStore.js";
import { getActiveReferences, autoAssignReference } from "../../core/tagsService.js";
import {
  getSlotMaxRefs as resolveSlotMaxRefs,
  remainingQuota,
  allowedTypeForSlot,
} from "../../core/media.js";
import { calculateUsedImages } from "../../core/entityService.js";

/**
 * usePromptBarReferences
 * Encapsulates active references extraction, reference dialog state,
 * quick mention dropdown management, image quotas, and outside-click listeners.
 */
export function usePromptBarReferences({
  activeSlots = [],
  featureConfig,
  currentModel,
  activeMode = "image",
  drawerOpen = false,
  setDrawerOpen = () => {},
  containerRef,
  tuneButtonRef,
  settingsOverlayRef,
} = {}) {
  // Store subscriptions
  const paramValues   = usePromptBarStore((s) => s.parameterValues);
  const elements      = usePromptBarStore((s) => s.elements);
  const characters    = usePromptBarStore((s) => s.characters);
  const setParameter  = usePromptBarStore((s) => s.setParameter);
  const addElement    = usePromptBarStore((s) => s.addElement);
  const addCharacter  = usePromptBarStore((s) => s.addCharacter);
  const attachMedia   = usePromptBarStore((s) => s.attachMedia);
  const removeMedia   = usePromptBarStore((s) => s.removeMedia);

  // Dialog & quick mention states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeDialogSlot, setActiveDialogSlot] = useState(null);
  const [activeDialogMode, setActiveDialogMode] = useState("image");
  const [mentionCallback, setMentionCallback] = useState(null);
  const [quickMentionOpen, setQuickMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const dialogAnchorRef = useRef(null);
  const quickMentionAnchorRef = useRef(null);

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

  const handleOpenDialog = useCallback((slot) => {
    setActiveDialogSlot(slot);
    setMentionCallback(null);
    const isVideoSlot = slot.accepts?.includes("video");
    setActiveDialogMode(slot.role === "reference" ? "all" : (isVideoSlot ? "all" : "image"));
    setDialogOpen(true);
  }, []);

  const getSlotMaxRefs = useCallback((slot) => {
    return resolveSlotMaxRefs({
      slot,
      model: currentModel,
      featureConfig,
    });
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

  // Typing '@' -> opens AtMentionMenu
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

  const handleCloseQuickMention = useCallback(() => {
    setQuickMentionOpen(false);
    setMentionCallback(null);
    setMentionQuery("");
  }, []);

  const handleOpenChangeDialog = useCallback((val) => {
    setDialogOpen(val);
    if (!val) {
      setMentionQuery("");
    }
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
  }, [drawerOpen, containerRef, tuneButtonRef, settingsOverlayRef, setDrawerOpen]);

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
      normalizedItems.forEach((norm) => {
        if (typeof attachMedia === "function") {
          attachMedia({ role: activeDialogSlot.role, value: norm });
        }
      });
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
  }, [activeDialogSlot, mentionCallback, attachMedia, addElement, addCharacter, activeSlots, paramValues, featureConfig, currentModel, setParameter]);

  const handleRemoveReferenceItem = useCallback((itemToRemove) => {
    if (typeof removeMedia === "function") {
      removeMedia({ role: "reference", value: itemToRemove });
    }
  }, [removeMedia]);

  const handleRemoveSlot = useCallback((slot) => {
    if (typeof removeMedia === "function") {
      removeMedia({ role: slot.role });
    }
  }, [removeMedia]);

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
    const refSlot = activeSlots.find((s) => s.role === "reference");
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
    return typeof remainingImagesQuota === "number" ? Math.max(1, remainingImagesQuota) : 4;
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
    quickMentionAnchorRef,
    quickMentionOpen,
    setQuickMentionOpen,
    mentionQuery,
    setMentionQuery,
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
    currentRefBackendKey,
    currentRefList,
    usedImagesCount,
    remainingImagesQuota,
    activeSlotAllowedType,
    activeSlotMaxAllowed,
    dialogSelectedItems,
  };
}
