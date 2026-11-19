"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { useLibraryFilter, extractIdentifyingKeys } from "@/features/studio";
import { useProjectData } from "@/features/workflows/api/workflowsApi";
import { useUploadMedia } from "@/features/media/model/useUploadMedia";
import { resolveMediaUrl } from "@/shared/lib/displayUtils";
import { GoogleIcon } from "@/components/primitives/GoogleIcon";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";
import { Input } from "@/components/base/input";
import { cn } from "@/shared/lib/utils";
import { ImportMediaListView } from "./ImportMediaListView";
import { useImportMediaKeyboard } from "./keyboard/useImportMediaKeyboard";

/**
 * ImportMediaPopover
 * A floating popover for importing/uploading media with a left sidebar category layout.
 */
export function ImportMediaPopover({
  open,
  onOpenChange,
  onSelect,
  library    = [],
  selectedItems: propSelectedItems = [],
  selectedReferences = [],
  selectedIds = [],
  excludedIds = [],
  excludedItems = [],
  loading    = false,
  hasMore    = false,
  onLoadMore,
  mode       = "all",
  allowedType,
  variant    = "default", // "default" (floating fixed) | "panel" (inline, no fixed positioning)
  maxAllowed = 1,
  remainingImages,
  onUploadFromPC,
  anchorRef,
  initialSearch = "",   // seed the search bar when the dialog first opens
  closeOnSelect = false,
}) {
  const isAssetSelect = variant === "asset-select" || mode === "asset-select";

  const selectedKeySet = React.useMemo(() => {
    const rawList = [
      ...(Array.isArray(propSelectedItems) ? propSelectedItems : [propSelectedItems]),
      ...(Array.isArray(selectedReferences) ? selectedReferences : [selectedReferences]),
      ...(Array.isArray(selectedIds) ? selectedIds : [selectedIds]),
      ...(Array.isArray(excludedIds) ? excludedIds : [excludedIds]),
      ...(Array.isArray(excludedItems) ? excludedItems : [excludedItems]),
    ].filter(Boolean);

    const set = new Set();
    rawList.forEach((it) => {
      extractIdentifyingKeys(it).forEach((k) => set.add(k));
    });
    return set;
  }, [propSelectedItems, selectedReferences, selectedIds, excludedIds, excludedItems]);

  const resolvedAllowedTypes = React.useMemo(() => {
    if (Array.isArray(allowedType)) return allowedType.map((t) => String(t).toLowerCase());
    if (typeof allowedType === "string" && allowedType !== "all") return [allowedType.toLowerCase()];
    if (isAssetSelect) return ["image"];
    if (typeof mode === "string" && mode !== "all") return [mode.toLowerCase()];
    return ["image", "video", "character", "element"]; // all allowed
  }, [allowedType, mode, isAssetSelect]);

  const allowsImages     = resolvedAllowedTypes.includes("image");
  const allowsVideos     = resolvedAllowedTypes.includes("video");
  const allowsCharacters = resolvedAllowedTypes.includes("character");
  const allowsElements   = resolvedAllowedTypes.includes("element");

  const allowedSpecificCount = [allowsImages, allowsVideos, allowsCharacters, allowsElements].filter(Boolean).length;
  const effectiveMode = allowedSpecificCount > 1
    ? "all"
    : allowsVideos
      ? "video"
      : allowsImages
        ? "image"
        : allowsCharacters
          ? "character"
          : allowsElements
            ? "element"
            : "all";

  const params = useParams();
  const projectId = params?.projectId;
  const { data: projectData } = useProjectData(projectId);
  const { uploadMedia, isUploading } = useUploadMedia(projectId);

  const effectiveLibrary = React.useMemo(() => {
    const rawWorkflows = projectData?.projectContents?.workflows ?? [];
    const libraryItems = Array.isArray(library) ? library : (library?.items || []);
    
    // Combine library items and projectData media
    const combinedMediaMap = new Map();
    libraryItems.concat(projectData?.projectContents?.media || []).forEach(m => {
      const id = m.id || m.name;
      if (id && !combinedMediaMap.has(id)) {
        combinedMediaMap.set(id, m);
      }
    });
    const rawMedia = Array.from(combinedMediaMap.values());

    const cleanWorkflowId = (id) => String(id || "").replace(/^workflows\//, "").replace(/^media\//, "").trim();

    /**
     * Derive the semantic category for a workflow purely from workflow_type.
     */
    const resolveCategory = (w) => {
      const wType = String(w.workflow_type || w.workflowType || "").toUpperCase();
      if (wType === "CHARACTER" || wType === "CHARACTER_SHEET") return "character";
      if (wType === "ELEMENT_SHEET" || wType === "ELEMENT") return "element";
      return null;
    };

    const finalItems = [];
    const seenItemKeys = new Set();
    const seenWorkflowKeys = new Set();
    const seenConstituentMediaKeys = new Set();
    const seenConstituentUrls = new Set();

    // 1. Pre-register all workflow identifiers from rawWorkflows
    rawWorkflows.forEach((w) => {
      const wName = w.name ? String(w.name).trim() : null;
      const wId = w.id ? String(w.id).trim() : null;
      if (wName) {
        seenWorkflowKeys.add(wName);
        seenWorkflowKeys.add(cleanWorkflowId(wName));
      }
      if (wId) {
        seenWorkflowKeys.add(wId);
        seenWorkflowKeys.add(cleanWorkflowId(wId));
      }
    });

    // 2. Process each workflow: exactly ONE card per workflow with its main/primary media
    if (rawWorkflows.length > 0) {
      rawWorkflows.forEach((w) => {
        const canonicalWfId = w.id || w.name;
        if (!canonicalWfId) return;

        const cleanWfId = cleanWorkflowId(canonicalWfId);
        const dedupeKey = cleanWfId || canonicalWfId;
        if (seenItemKeys.has(dedupeKey)) return;

        // Find all constituent media belonging to this workflow in rawMedia
        const wfMedia = rawMedia.filter((m) => {
          const mWfId = m.workflowId || m.workflow_id;
          const mStepId = m.workflowStepId;
          const mCleanWfId = cleanWorkflowId(mWfId);
          const mCleanStepId = cleanWorkflowId(mStepId);

          return (
            (mWfId && (
              mWfId === w.id ||
              mWfId === w.name ||
              (cleanWfId && mCleanWfId === cleanWfId)
            )) ||
            (mStepId && (
              mStepId === w.id ||
              mStepId === w.name ||
              (cleanWfId && mCleanStepId === cleanWfId)
            ))
          );
        });

        // Register all constituent media IDs and URLs so they are never rendered separately
        wfMedia.forEach((m) => {
          if (m.id) {
            seenConstituentMediaKeys.add(String(m.id));
            seenConstituentMediaKeys.add(cleanWorkflowId(m.id));
          }
          if (m.name) {
            seenConstituentMediaKeys.add(String(m.name));
            seenConstituentMediaKeys.add(cleanWorkflowId(m.name));
          }
          const mUrl = resolveMediaUrl(m) || m.url || m.image?.url || m.video?.url || m.file_url;
          if (mUrl) seenConstituentUrls.add(mUrl);
        });

        // Register constituent items from w.items, w.images, w.media
        const nestedItems = Array.isArray(w.items) ? w.items : Array.isArray(w.images) ? w.images : Array.isArray(w.media) ? w.media : [];
        nestedItems.forEach((sub) => {
          if (!sub) return;
          if (typeof sub === "string") {
            seenConstituentMediaKeys.add(sub);
            seenConstituentMediaKeys.add(cleanWorkflowId(sub));
            seenConstituentUrls.add(sub);
          } else if (typeof sub === "object") {
            if (sub.id) seenConstituentMediaKeys.add(String(sub.id));
            if (sub.name) seenConstituentMediaKeys.add(String(sub.name));
            const sUrl = resolveMediaUrl(sub) || sub.url || sub.image?.url || sub.video?.url || sub.file_url;
            if (sUrl) seenConstituentUrls.add(sUrl);
          }
        });

        // Resolve primary/main media
        const primaryMediaId = w.primary_media_id || w.primaryMediaId || w.metadata?.primaryMediaId;
        const primaryMediaById = primaryMediaId
          ? rawMedia.find((m) => m.id === primaryMediaId || m.name === primaryMediaId)
          : null;

        const firstNested = nestedItems[0];
        const firstNestedObj = firstNested && typeof firstNested === "object" ? firstNested : null;

        const mainMedia =
          primaryMediaById ||
          w.main_media ||
          w.mainMedia ||
          w.output_media ||
          w.result_media ||
          (firstNestedObj?.url ? firstNestedObj : null) ||
          wfMedia[0] ||
          null;

        const url =
          resolveMediaUrl(mainMedia) ||
          mainMedia?.url ||
          mainMedia?.image?.url ||
          mainMedia?.video?.url ||
          mainMedia?.file_url ||
          resolveMediaUrl(w) ||
          w.url ||
          w.image?.url ||
          (typeof firstNested === "string" ? firstNested : null) ||
          null;

        if (url) {
          seenItemKeys.add(dedupeKey);
          if (w.name) seenItemKeys.add(w.name);
          if (w.id) seenItemKeys.add(w.id);
          seenConstituentUrls.add(url);

          const isVid =
            mainMedia?.type === "video" ||
            mainMedia?.is_video ||
            !!mainMedia?.video ||
            (url && /\.(mp4|webm|mov)$/i.test(url));

          const semanticCategory = resolveCategory(w);

          const isUploadItem =
            !semanticCategory && (
              w.workflow_type === "UPLOAD" ||
              w.workflowType === "UPLOAD" ||
              w.type === "upload" ||
              Boolean(w.is_upload || mainMedia?.is_upload || mainMedia?.workflow_type === "UPLOAD")
            );

          let itemType;
          if (semanticCategory)      itemType = semanticCategory; // "character" | "element"
          else if (isUploadItem)     itemType = "upload";
          else if (isVid)            itemType = "video";
          else                       itemType = "image";

          const constituentCount =
            typeof w.image_count === "number" && w.image_count > 0
              ? w.image_count
              : typeof w.images_count === "number" && w.images_count > 0
              ? w.images_count
              : nestedItems.length > 0
              ? nestedItems.length
              : wfMedia.length > 0
              ? wfMedia.length
              : 1;

          finalItems.push({
            ...(mainMedia || {}),
            media_id: mainMedia?.id || mainMedia?.media_id || null,
            mediaId: mainMedia?.id || mainMedia?.mediaId || null,
            id: dedupeKey,
            workflow_id: dedupeKey,
            workflowId: dedupeKey,
            url,
            type: itemType,
            is_video: isVid,
            is_character: semanticCategory === "character",
            is_element:   semanticCategory === "element",
            workflow_type: isUploadItem ? "UPLOAD" : (w.workflow_type || w.workflowType || mainMedia?.workflow_type || "GENERATED"),
            is_upload: isUploadItem,
            display_name: w.metadata?.displayName || w.display_name || w.name || mainMedia?.display_name || "Sans titre",
            image_count: constituentCount,
            items: undefined, // Explicitly clear nested items array so no flatMap explodes it
          });
        }
      });
    }

    // 3. Process rawMedia: only append truly standalone loose uploads/media NOT belonging to any workflow
    rawMedia.forEach((m) => {
      const url = resolveMediaUrl(m) || m.url || m.image?.url || m.video?.url || m.file_url || null;
      if (!url) return;

      const mWfId = m.workflowId || m.workflow_id;
      const mStepId = m.workflowStepId;
      const mCleanWfId = cleanWorkflowId(mWfId);
      const mCleanStepId = cleanWorkflowId(mStepId);
      const mId = m.id ? String(m.id).trim() : null;
      const mName = m.name ? String(m.name).trim() : null;

      // STRICT CHECK: Does this media belong to ANY workflow in rawWorkflows or an already processed workflow?
      const isWorkflowConstituent =
        (mWfId && (seenWorkflowKeys.has(mWfId) || seenWorkflowKeys.has(mCleanWfId))) ||
        (mStepId && (seenWorkflowKeys.has(mStepId) || seenWorkflowKeys.has(mCleanStepId))) ||
        (mId && seenConstituentMediaKeys.has(mId)) ||
        (mName && seenConstituentMediaKeys.has(mName)) ||
        seenConstituentUrls.has(url);

      if (isWorkflowConstituent) {
        // Skip! Workflows must only be displayed once with their main media
        return;
      }

      const itemKey = mId || mName || url;
      if (seenItemKeys.has(itemKey)) {
        return;
      }
      seenItemKeys.add(itemKey);
      seenConstituentUrls.add(url);

      const isVid = m.type === "video" || m.is_video || !!m.video || (url && /\.(mp4|webm|mov)$/i.test(url));
      const isUploadItem = m.workflow_type === "UPLOAD" || m.is_upload || m.workflowStepId === "UPLOAD" || !mWfId;

      finalItems.push({
        ...m,
        id: itemKey,
        workflow_id: mWfId || null,
        workflowId: mWfId || null,
        url,
        type: isUploadItem ? "upload" : (isVid ? "video" : "image"),
        is_character: false,
        is_element:   false,
        workflow_type: isUploadItem ? "UPLOAD" : (m.workflow_type || "GENERATED"),
        is_video: isVid,
        is_upload: isUploadItem,
        display_name: m.mediaMetadata?.displayName || m.name || "Uploaded Media",
        image_count: m.image_count || 1,
        items: undefined,
      });
    });

    const resultItems = finalItems.filter((item) => {
      const isVid = item.type === "video" || item.is_video || !!item.video;
      const isChar = item.type === "character" || item.is_character;
      const isElem = item.type === "element" || item.is_element;
      const isImg = !isVid && !isChar && !isElem;

      if (isVid && !allowsVideos) return false;
      if (isImg && !allowsImages) return false;
      if (isChar && !allowsCharacters) return false;
      if (isElem && !allowsElements) return false;
      return true;
    });

    return resultItems;
  }, [library, projectData, allowsVideos, allowsImages, allowsCharacters, allowsElements]);

  // Filter out already selected items/references so they are hidden from the popover
  const unselectedLibrary = React.useMemo(() => {
    if (selectedKeySet.size === 0) return effectiveLibrary;
    return effectiveLibrary.filter((item) => {
      const itemKeys = extractIdentifyingKeys(item);
      return !itemKeys.some((k) => selectedKeySet.has(k));
    });
  }, [effectiveLibrary, selectedKeySet]);

  // Always show all allowed categories in the sidebar menu (do not hide empty ones)
  const availableCategories = React.useMemo(() => {
    const cats = [];

    const allowedSpecificCount = [allowsImages, allowsVideos, allowsCharacters, allowsElements].filter(Boolean).length;

    // Show "All" if multiple categories are allowed
    if (allowedSpecificCount > 1) {
      cats.push({ id: "all", label: "All", googleIcon: "dashboard" });
    }

    if (allowsImages) {
      cats.push({ id: "image", label: "Images", googleIcon: "image" });
    }
    if (allowsVideos) {
      cats.push({ id: "video", label: "Videos", googleIcon: "videocam" });
    }
    if (allowsCharacters) {
      cats.push({ id: "character", label: "Characters", googleIcon: "accessibility_new" });
    }
    if (allowsElements) {
      cats.push({ id: "element", label: "Elements", googleIcon: "widgets" });
    }
    if (allowsImages || allowsVideos) {
      cats.push({ id: "upload", label: "Uploads", googleIcon: "drive_folder_upload" });
    }

    // Fallback if no specific category was added
    if (cats.length === 0) {
      cats.push({ id: "all", label: "All", googleIcon: "dashboard" });
    }

    return cats;
  }, [allowsImages, allowsVideos, allowsCharacters, allowsElements]);

  const defaultCategory = React.useMemo(() => {
    if (availableCategories.length === 0) return "all";
    if (availableCategories.some(c => c.id === "all")) return "all";
    return availableCategories[0].id;
  }, [availableCategories]);

  const {
    search,          setSearch,
    selectedCategory, setSelectedCategory,
    visibleItems,
  } = useLibraryFilter(unselectedLibrary, effectiveMode, defaultCategory, { selectedItems: propSelectedItems });

  // Sync search whenever dialog opens or when user types query in prompt bar
  React.useEffect(() => {
    if (open) {
      setSearch(initialSearch || "");
    }
  }, [open, initialSearch, setSearch]);

  // Sync selectedCategory if current selection is not in availableCategories
  React.useEffect(() => {
    if (availableCategories.length > 0) {
      const isCurrentValid = availableCategories.some(c => c.id === selectedCategory);
      if (!isCurrentValid) {
        setSelectedCategory(defaultCategory);
      }
    }
  }, [availableCategories, selectedCategory, defaultCategory, setSelectedCategory]);

  const fileInputRef = React.useRef(null);
  const popoverRef = React.useRef(null);

  // Click Outside Logic
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (anchorRef?.current && anchorRef.current.contains(event.target)) return;
      
      const isPortalClick = 
        event.target.closest('[data-radix-popper-content-wrapper]') ||
        event.target.closest('[role="menu"]') ||
        event.target.closest('[data-radix-menu-content]') ||
        event.target.closest('.radix-themes');

      if (isPortalClick) return;

      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange, anchorRef]);

  const availableSlots = React.useMemo(() => {
    if (typeof remainingImages === "number") {
      return Math.max(0, remainingImages);
    }
    return Math.max(0, maxAllowed);
  }, [remainingImages, maxAllowed]);

  // ── Desktop-Class Keyboard Navigation Engine ───────────────────────────
  const categoryRefs = React.useRef([]);
  const cardRefs = React.useRef([]);
  const searchInputRef = React.useRef(null);

  // Direct selection helper used by click and Enter key
  const handleSelectDirect = React.useCallback((item) => {
    if (!item) return;
    const candidateCount = item.image_count || 1;
    if (typeof remainingImages === "number" && candidateCount > availableSlots) return;
    if (typeof remainingImages !== "number" && availableSlots < 1) return;
    const itemUrl = resolveMediaUrl(item) ?? item.url ?? item.image?.url ?? item.video?.url ?? item.file_url ?? "";
    const isVideo = item.type === "video" || item.is_video || !!item.video;
    const canonicalWorkflowId = item.workflow_id || item.workflowId || item.workflow?.id || item.id || null;
    const mediaId = item.media_id || item.mediaId || (item.workflow_id ? item.id : null);
    const asset = {
      ...item,
      url:           itemUrl,
      workflow_id:   canonicalWorkflowId,
      workflowId:    canonicalWorkflowId,
      media_id:      mediaId || item.media_id || item.id,
      mediaId:       mediaId || item.mediaId || item.id,
      asset_id:      canonicalWorkflowId || item.id,
      id:            canonicalWorkflowId || item.id,
      is_video:      isVideo,
      type:          item.type || (item.is_character ? "character" : (item.is_element ? "element" : "media")),
      workflow_type: item.workflow_type || (item.is_character ? "CHARACTER_SHEET" : (item.is_element ? "ELEMENT_SHEET" : "GENERATED")),
      displayName:   item.display_name || item.name || "Ref",
      name:          item.display_name || item.name || "Ref",
      image_count:   candidateCount,
    };
    onSelect([asset]);
    if (closeOnSelect) {
      onOpenChange(false);
    }
  }, [availableSlots, remainingImages, onSelect, onOpenChange, closeOnSelect]);

  const {
    zone: navZone,
    setZone: setNavZone,
    highlightedCategoryIdx,
    setHighlightedCategoryIdx,
    highlightedAssetIdx,
    setHighlightedAssetIdx,
  } = useImportMediaKeyboard({
    open,
    availableCategories,
    selectedCategory: selectedCategory || defaultCategory,
    setSelectedCategory,
    visibleItems,
    layoutMode: "list",
    categoryRefs,
    cardRefs,
    searchInputRef,
    onSelectAsset: handleSelectDirect,
    onToggleAsset: handleSelectDirect,
    onConfirmSelection: handleSelectDirect,
    onClose: () => onOpenChange(false),
  });

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files ?? []).slice(0, maxAllowed);
    if (files.length === 0) return;

    if (onUploadFromPC) {
      onUploadFromPC(files);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      await uploadMedia(files);
      // Ensure the uploaded item is visible in the popover's gallery
      if (selectedCategory !== "all" && selectedCategory !== "upload") {
        if (availableCategories.some(c => c.id === "all")) {
          setSelectedCategory("all");
        } else if (availableCategories.some(c => c.id === "upload")) {
          setSelectedCategory("upload");
        } else if (availableCategories.some(c => c.id === "image")) {
          setSelectedCategory("image");
        }
      }
    } catch (err) {
      console.error("❌ Upload failed in Popover:", err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const uploadAccept = React.useMemo(() => {
    if (allowsVideos && !allowsImages) return "video/mp4,video/webm";
    if (allowsImages && !allowsVideos) return "image/jpeg,image/png,image/webp,image/gif";
    return "image/*,video/mp4,video/webm";
  }, [allowsImages, allowsVideos]);

  const isPanel = variant === "panel";

  const popoverElement = (
    <motion.div
      ref={popoverRef}
      initial={isPanel ? undefined : { opacity: 0, y: 10, scale: 0.95 }}
      animate={isPanel ? undefined : { opacity: 1, y: 0, scale: 1 }}
      exit={isPanel ? undefined : { opacity: 0, y: 10, scale: 0.95 }}
      transition={isPanel ? undefined : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      style={{
        width: "min(780px, 92vw)",
        height: "min(580px, 90vh)",
      }}
      className={cn(
        !isPanel && "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
        "flex flex-row gap-2 overflow-hidden rounded-[var(--radius-3xl)] border border-border-weak bg-ui-menu-background p-2 [--blur:40px] text-text-primary font-sans antialiased"
      )}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept={uploadAccept}
        onChange={handleFileChange}
      />

      {/* ── Left Category Sidebar (flow-add-menu-side-nav) ── */}
      {!isAssetSelect && (availableCategories.length > 0 || allowsImages || allowsVideos) && (
        <div className="w-[120px] flex flex-col gap-1 shrink-0 select-none">
          {availableCategories.length > 0 && (
            <nav role="tablist" aria-label="Category navigation" className="flex flex-col gap-0.5 flex-1">
              {availableCategories.map((cat, catIdx) => {
                const isActive = (selectedCategory || defaultCategory) === cat.id;
                const isHighlighted = navZone === "sidebar" && highlightedCategoryIdx === catIdx;
                return (
                  <Button
                    ref={(el) => { categoryRefs.current[catIdx] = el; }}
                    key={cat.id}
                    role="tab"
                    aria-selected={isActive}
                    variant="ghost"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setHighlightedCategoryIdx(catIdx);
                      setNavZone("sidebar");
                    }}
                    className={cn(
                      "w-full !justify-start !h-8.5 text-[13px] cursor-pointer group px-2.5 rounded-lg flex items-center gap-2.5 transition-colors",
                      isActive ? "!bg-white/[0.16] hover:!bg-white/20 text-white font-medium" : "text-white/65 hover:!bg-white/10 hover:text-white font-normal",
                      isHighlighted && "ring-1 ring-inset ring-white/70 !bg-white/[0.16]"
                    )}
                  >
                    <GoogleIcon
                      iconName={cat.googleIcon}
                      name={cat.googleIcon}
                      weight={300}
                      className={cn("text-base shrink-0 transition-colors leading-none", isActive ? "text-white" : "text-white/65 group-hover:text-white")}
                    />
                    <span className="truncate leading-none">{cat.label}</span>
                  </Button>
                );
              })}
            </nav>
          )}

          {/* Upload Button at bottom of sidebar */}
          {(allowsImages || allowsVideos) && (
            <Button
              variant="ghost"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="mt-auto w-full !justify-start !h-8.5 text-[13px] font-normal gap-2.5 cursor-pointer px-2.5 rounded-lg flex items-center text-white/75 hover:!bg-white/5 hover:text-white"
            >
              <GoogleIcon
                iconName={isUploading ? "progress_activity" : "upload"}
                weight={300}
                className={cn("text-base shrink-0 leading-none", isUploading && "animate-spin text-white/40")}
              />
              <span className="truncate leading-none">{isUploading ? "Uploading..." : "Upload media"}</span>
            </Button>
          )}
        </div>
      )}

      {/* ── Right Content Area (.right-panel) ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 gap-2">
        {/* Search Header Bar (.search-header) */}
        <header className="flex items-center gap-2 shrink-0">
          <Input
            ref={searchInputRef}
            variant="ghost"
            googleIcon="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setNavZone("search")}
            placeholder="Search assets"
            aria-label="Search assets"
            containerClassName="flex-1 min-w-0"
            className="!h-8 px-2.5 rounded-lg bg-white/[0.07] text-[13px]"
          />

          {/* Close Button */}
          <IconButton
            variant="ghost"
            onClick={() => onOpenChange?.(false)}
            title="Close"
            aria-label="Close"
            className="!size-8 rounded-lg shrink-0"
          >
            <GoogleIcon iconName="close" weight={300} className="text-base" />
          </IconButton>
        </header>

        <ImportMediaListView
          items={visibleItems}
          remainingImages={remainingImages}
          availableSlots={availableSlots}
          maxAllowed={maxAllowed}
          focusedId={visibleItems[highlightedAssetIdx]?.id || visibleItems[highlightedAssetIdx]?.workflow_id}
          onFocusChange={(item, idx) => {
            if (typeof idx === "number" && idx >= 0) {
              setHighlightedAssetIdx(idx);
            }
            setNavZone("gallery");
          }}
          onSelectDirect={handleSelectDirect}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
        />
      </div>
    </motion.div>
  );

  if (isPanel) {
    return open ? popoverElement : null;
  }

  return (
    <AnimatePresence>
      {open && popoverElement}
    </AnimatePresence>
  );
}
