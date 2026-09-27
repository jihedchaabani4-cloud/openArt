"use client";

import React from "react";
import { Upload, Search, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { useLibraryFilter, extractIdentifyingKeys } from "@/features/studio";
import { useProjectData } from "@/features/workflows/api/workflowsApi";
import { useUploadMedia, MediaViewCard } from "@/features/media";
import { resolveMediaUrl } from "@/shared/lib/displayUtils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { RowsPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/rows.css';
import { cn } from "@/shared/lib/utils";
import { ImportMediaListView } from "./ImportMediaListView";

const CATEGORIES = [
  { id: "all",       label: "All",        googleIcon: "dashboard" },
  { id: "image",     label: "Images",     googleIcon: "image" },
  { id: "video",     label: "Videos",     googleIcon: "videocam" },
  { id: "character", label: "Characters", googleIcon: "accessibility_new" },
  { id: "element",   label: "Elements",   googleIcon: "widgets" },
  { id: "upload",    label: "Uploads",    googleIcon: "drive_folder_upload" },
];

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

  const effectiveMode = allowsVideos && !allowsImages ? "video" : (allowsImages && !allowsVideos ? "image" : "all");

  const params = useParams();
  const projectId = params?.projectId;
  const { data: projectData } = useProjectData(projectId);
  const { uploadMedia, isUploading } = useUploadMedia(projectId);

  // Build session name lookup from project data
  const sessionNameMap = React.useMemo(() => {
    const raw = projectData?.projectContents?.sessions ?? [];
    const map = {};
    raw.forEach(s => {
      if (s.name) map[s.name] = s.metadata?.displayName || null;
    });
    return map;
  }, [projectData]);

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
        const primaryMediaId = w.metadata?.primaryMediaId;
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

          const isUploadItem =
            w.workflow_type === "UPLOAD" ||
            w.workflowType === "UPLOAD" ||
            w.type === "upload" ||
            Boolean(w.is_upload || mainMedia?.is_upload || mainMedia?.workflow_type === "UPLOAD");

          const semanticCategory = isUploadItem ? null : resolveCategory(w);

          let itemType;
          if (isUploadItem)          itemType = "upload";
          else if (semanticCategory) itemType = semanticCategory; // "character" | "element"
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
            id: dedupeKey,
            workflow_id: dedupeKey,
            workflowId: dedupeKey,
            url,
            type: itemType,
            is_video: isVid,
            is_character: semanticCategory === "character",
            is_element:   semanticCategory === "element",
            session_id: mainMedia?.session_id || mainMedia?.sessionId || w.session_id || w.metadata?.sessionId,
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

  // Calculate item counts per category in the effective library
  const categoryCounts = React.useMemo(() => {
    let images = 0;
    let videos = 0;
    let characters = 0;
    let elements = 0;
    let uploads = 0;

    unselectedLibrary.forEach((item) => {
      const isVid = item.is_video || item.type === "video" || !!item.video;
      const wType = String(item.workflow_type || item.workflowType || "").toUpperCase();
      const isChar = item.is_character || item.type === "character" || wType === "CHARACTER" || wType === "CHARACTER_SHEET";
      const isElem = item.is_element || item.type === "element" || wType === "ELEMENT" || wType === "ELEMENT_SHEET";
      const isImg = !isVid && !isChar && !isElem && item.type !== "voice";
      const isUp = item.workflow_type === "UPLOAD" || item.workflowType === "UPLOAD" || item.type === "upload" || Boolean(item.is_upload);

      if (isImg) images++;
      if (isVid) videos++;
      if (isChar) characters++;
      if (isElem) elements++;
      if (isUp) uploads++;
    });

    return {
      all: unselectedLibrary.length,
      image: images,
      video: videos,
      character: characters,
      element: elements,
      upload: uploads,
    };
  }, [unselectedLibrary]);

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
    selectedSession, setSelectedSession,
    selectedCategory, setSelectedCategory,
    visibleItems,
  } = useLibraryFilter(unselectedLibrary, effectiveMode, defaultCategory, { selectedItems: propSelectedItems });

  // Sync selectedCategory if current selection is not in availableCategories
  React.useEffect(() => {
    if (availableCategories.length > 0) {
      const isCurrentValid = availableCategories.some(c => c.id === selectedCategory);
      if (!isCurrentValid) {
        setSelectedCategory(defaultCategory);
      }
    }
  }, [availableCategories, selectedCategory, defaultCategory, setSelectedCategory]);

  // Extract unique sessions from the library using the session ID and create time
  const sessions = React.useMemo(() => {
    const flatItems = unselectedLibrary;
    const unique = new Map();

    flatItems.forEach(item => {
      const sId =
        item.session_id ||
        item.sessionId ||
        item.mediaMetadata?.sessionId ||
        item.mediaMetadata?.session_id ||
        item.metadata?.sessionId ||
        item.metadata?.session_id;

      if (!sId || unique.has(sId)) return;

      const displayName = sessionNameMap[sId];
      const time =
        item.mediaMetadata?.createTime ||
        item.created_at ||
        item.create_time ||
        item.metadata?.createTime;

      const formattedDate = time
        ? new Date(time).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Unknown Session";

      unique.set(sId, {
        id:   sId,
        name: displayName || formattedDate,
      });
    });

    return Array.from(unique.values()).sort((a, b) => b.id.localeCompare(a.id));
  }, [unselectedLibrary, sessionNameMap]);

  const activeSessionName = sessions.find(s => s.id === selectedSession)?.name || "All Sessions";

  const [selectedItems, setSelectedItems] = React.useState([]);
  const [layoutMode, setLayoutMode] = React.useState("grid"); // "grid" | "list"
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

  const toggleSelection = (item) => {
    const itemUrl = item.url ?? item.image?.url ?? item.video?.url ?? item.file_url;
    const isVideo = item.type === "video" || item.is_video || !!item.video;
    const canonicalWorkflowId = item.workflow_id || item.workflowId || item.workflow?.id || item.id || null;
    const count = item.image_count || 1;
    
    const asset = {
      ...item,
      url:           itemUrl,
      workflow_id:   canonicalWorkflowId,
      workflowId:    canonicalWorkflowId,
      asset_id:      canonicalWorkflowId || item.id,
      id:            canonicalWorkflowId || item.id,
      is_video:      isVideo,
      type:          item.type || (item.is_character ? "character" : (item.is_element ? "element" : "media")),
      workflow_type: item.workflow_type || (item.is_character ? "CHARACTER_SHEET" : (item.is_element ? "ELEMENT_SHEET" : "GENERATED")),
      displayName:   item.display_name || item.name || "Ref",
      name:          item.display_name || item.name || "Ref",
      image_count:   count,
    };

    setSelectedItems((prev) => {
      const assetKey = asset.workflow_id || asset.asset_id || asset.url;
      const exists = prev.find(p => (p.workflow_id || p.asset_id) === assetKey || p.url === asset.url);
      if (exists) {
        return prev.filter(p => (p.workflow_id || p.asset_id) !== assetKey && p.url !== asset.url);
      }
      if (maxAllowed === 1) {
        return [asset];
      }
      if (typeof remainingImages === "number") {
        const currentSelectedImages = prev.reduce((acc, cur) => acc + (cur.image_count || 1), 0);
        if (currentSelectedImages + count > remainingImages) return prev;
      } else if (prev.length >= maxAllowed) {
        return prev;
      }
      return [...prev, asset];
    });
  };

  const selectedImageCount = React.useMemo(() => {
    return selectedItems.reduce((acc, cur) => acc + (cur.image_count || 1), 0);
  }, [selectedItems]);

  const availableSlots = React.useMemo(() => {
    if (typeof remainingImages === "number") {
      return Math.max(0, remainingImages - selectedImageCount);
    }
    return Math.max(0, maxAllowed - selectedItems.length);
  }, [remainingImages, maxAllowed, selectedImageCount, selectedItems.length]);

  const handleImport = () => {
    if (selectedItems.length === 0) return;
    onSelect(selectedItems);
    setSelectedItems([]);
    onOpenChange(false);
  };

  React.useEffect(() => {
    if (!open) setSelectedItems([]);
  }, [open]);

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

  const photos = React.useMemo(() => {
    const BASE = 1200;
    return visibleItems.map((item, i) => {
      const itemUrl = resolveMediaUrl(item) ?? item.url ?? item.image?.url ?? item.video?.url ?? item.file_url ?? null;
      if (!itemUrl) return null;

      const isVideo  = item.type === "video" || item.is_video || !!item.video;
      const w = item.width  ?? item.image?.dimensions?.width  ?? item.video?.dimensions?.width  ?? null;
      const h = item.height ?? item.image?.dimensions?.height ?? item.video?.dimensions?.height ?? null;
      const wNum = w ? parseFloat(w) : (isVideo ? 16 : 3);
      const hNum = h ? parseFloat(h) : (isVideo ?  9 : 4);
      const maxDim = Math.max(wNum, hNum);

      return {
        src:     itemUrl,
        width:   Math.round(BASE * (wNum / maxDim)),
        height:  Math.round(BASE * (hNum / maxDim)),
        key:     item.id ?? itemUrl ?? String(i),
        item,
        itemUrl,
        isVideo,
      };
    }).filter(Boolean);
  }, [visibleItems]);

  const isPanel = variant === "panel";

  const popoverElement = (
    <motion.div
      ref={popoverRef}
      initial={isPanel ? undefined : { opacity: 0, y: 10, scale: 0.95 }}
      animate={isPanel ? undefined : { opacity: 1, y: 0, scale: 1 }}
      exit={isPanel ? undefined : { opacity: 0, y: 10, scale: 0.95 }}
      transition={isPanel ? undefined : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          style={isPanel ? {
            // Panel (inline): keep its own natural width (48.75rem = 780px), height capped
            width: "min(48.75rem, 92vw)",
            height: "min(34rem, 75vh)",
            padding: "0.75rem",
          } : {
            // Default (floating fixed): original fixed behaviour with prompt bar glassmorphism
            width: "min(48.75rem, 90vw)",
            height: "min(36.25rem, 90vh)",
            padding: "0.75rem",
            borderRadius: "28px",
            backgroundColor: "var(--background-base-pri, rgba(22, 23, 24, 0.9))",
            backdropFilter: "blur(80px)",
            WebkitBackdropFilter: "blur(80px)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.58)",
          }}
          className={cn(
            isPanel
              ? ""
              : "fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] border border-white/5",
            "flex flex-row overflow-hidden text-white font-['Google_Sans_Text',sans-serif]"
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

          {/* ── Left Category Sidebar (Shown in standard mode only) ── */}
          {!isAssetSelect && (availableCategories.length > 0 || allowsImages || allowsVideos) && (
            <div className="w-[140px] flex flex-col gap-1.5 shrink-0 select-none bg-transparent pr-1">
              {availableCategories.length > 0 && (
                <>
                  <div className="px-2 pt-0.5 pb-1 text-[11px] font-semibold text-white/30 uppercase tracking-wider font-['Google_Sans_Text',sans-serif]">
                    Categories
                  </div>
                  
                  <nav role="tablist" className="flex flex-col gap-1 flex-1">
                    {availableCategories.map((cat) => {
                      const isActive = (selectedCategory || defaultCategory) === cat.id;
                      return (
                        <Button
                          key={cat.id}
                          role="tab"
                          aria-selected={isActive}
                          variant={isActive ? "nav-tab-active" : "nav-tab"}
                          onClick={() => setSelectedCategory(cat.id)}
                          className="w-full justify-start h-8 text-xs cursor-pointer group px-2.5 flex items-center gap-2.5"
                        >
                          <span className="w-4 h-4 flex items-center justify-center shrink-0">
                            <GoogleIcon iconName={cat.googleIcon} name={cat.googleIcon} weight={300} className={cn("text-[16px] transition-colors leading-none", isActive ? "text-white" : "text-white/60 group-hover:text-white")} />
                          </span>
                          <span className="truncate leading-none select-none flex items-center">{cat.label}</span>
                        </Button>
                      );
                    })}
                  </nav>
                </>
              )}

              {/* Upload Button at bottom of sidebar (shown if image or video uploads allowed) */}
              {(allowsImages || allowsVideos) && (
                <div className="mt-auto pt-1">
                  <Button
                    variant="nav-tab"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full justify-start h-8 text-xs gap-2.5 cursor-pointer px-2.5 flex items-center"
                  >
                    <span className="w-4 h-4 flex items-center justify-center shrink-0">
                      {isUploading ? (
                        <GoogleIcon iconName="progress_activity" weight={300} className="text-[14px] animate-spin text-white/40 leading-none" />
                      ) : (
                        <Upload size={14} strokeWidth={1.75} className="shrink-0" />
                      )}
                    </span>
                    <span className="truncate leading-none select-none flex items-center">{isUploading ? "Uploading..." : "Upload Media"}</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Right Content Area ── */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 pl-1">
            {/* Search & Session Header Bar */}
            <div className="pb-2.5 flex items-center gap-2 shrink-0">
              {/* Search Bar Input */}
              <div className="flex-1">
                <Input
                  variant="blurinput"
                  icon={Search}
                  iconStrokeWidth={1.75}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search assets"
                  aria-label="Search assets"
                  className="w-full text-sm"
                />
              </div>

              {/* Layout Mode Switcher (Grid vs List) */}
              <div className="flex items-center p-0.5 rounded-[12px] bg-white/5 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setLayoutMode("grid")}
                  className={cn(
                    "w-8 h-8 rounded-[10px] transition-all cursor-pointer border-none outline-none p-0",
                    layoutMode === "grid"
                      ? "bg-white/20 text-white shadow-sm hover:bg-white/20"
                      : "text-white/40 hover:text-white/80 hover:bg-white/5"
                  )}
                  title="Grid view"
                  aria-label="Grid view"
                >
                  <GoogleIcon iconName="grid_view" weight={300} className="text-[17px]" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setLayoutMode("list")}
                  className={cn(
                    "w-8 h-8 rounded-[10px] transition-all cursor-pointer border-none outline-none p-0",
                    layoutMode === "list"
                      ? "bg-white/20 text-white shadow-sm hover:bg-white/20"
                      : "text-white/40 hover:text-white/80 hover:bg-white/5"
                  )}
                  title="List view"
                  aria-label="List view"
                >
                  <GoogleIcon iconName="view_list" weight={300} className="text-[17px]" />
                </Button>
              </div>

              {/* Session Selector Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost"
                    className="flex items-center gap-2 px-3.5 h-9 rounded-[12px] text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 active:bg-[rgba(218,220,224,0.25)] active:blur-[1.5px] transition-all min-w-[140px] justify-between border-none cursor-pointer font-['Google_Sans_Text',sans-serif] outline-none select-none"
                    style={{
                      backgroundColor: "rgba(218, 220, 224, 0.1)",
                      backdropFilter: "blur(80px)",
                      WebkitBackdropFilter: "blur(80px)",
                    }}
                  >
                    <span className="truncate leading-none flex items-center">{activeSessionName}</span>
                    <ChevronDown className="size-3.5 opacity-60 shrink-0" strokeWidth={1.75} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] border-none rounded-[16px] z-[10000] text-white p-3 font-['Google_Sans_Text',sans-serif]"
                  style={{
                    backgroundColor: "rgba(22, 23, 24, 0.95)",
                    backdropFilter: "blur(40px)",
                    WebkitBackdropFilter: "blur(40px)",
                    boxShadow: "rgba(0, 0, 0, 0.2) 0px 4px 32px -8px",
                  }}
                >
                  <DropdownMenuItem 
                    onClick={() => setSelectedSession("all_sessions")} 
                    className={cn("text-xs font-medium rounded-[10px] p-2.5 cursor-pointer transition-colors", selectedSession === "all_sessions" ? "bg-white/15 text-white font-semibold" : "text-white/80 hover:text-white hover:bg-white/10")}
                  >
                    All Sessions
                  </DropdownMenuItem>
                  <div className="max-h-[200px] overflow-y-auto custom-scrollbar flex flex-col gap-0.5 mt-0.5">
                    {sessions.map(s => (
                      <DropdownMenuItem 
                        key={s.id} 
                        onClick={() => setSelectedSession(s.id)}
                        className={cn("text-xs font-medium rounded-[10px] p-2.5 cursor-pointer transition-colors", selectedSession === s.id ? "bg-white/15 text-white font-semibold" : "text-white/80 hover:text-white hover:bg-white/10")}
                      >
                        {s.name}
                      </DropdownMenuItem>
                    ))}
                    {sessions.length === 0 && (
                      <DropdownMenuItem className="text-xs text-white/40 pointer-events-none italic">No sessions found</DropdownMenuItem>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {layoutMode === "list" ? (
              <ImportMediaListView
                items={visibleItems}
                remainingImages={remainingImages}
                availableSlots={availableSlots}
                maxAllowed={maxAllowed}
                onSelectDirect={(item) => {
                  if (!item) return;
                  const candidateCount = item.image_count || 1;
                  if (typeof remainingImages === "number" && candidateCount > availableSlots) return;
                  if (typeof remainingImages !== "number" && availableSlots < 1) return;
                  const itemUrl = resolveMediaUrl(item) ?? item.url ?? item.image?.url ?? item.video?.url ?? item.file_url ?? "";
                  const isVideo = item.type === "video" || item.is_video || !!item.video;
                  const canonicalWorkflowId = item.workflow_id || item.workflowId || item.workflow?.id || item.id || null;
                  const asset = {
                    ...item,
                    url:           itemUrl,
                    workflow_id:   canonicalWorkflowId,
                    workflowId:    canonicalWorkflowId,
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
                  onOpenChange(false);
                }}
                loading={loading}
                hasMore={hasMore}
                onLoadMore={onLoadMore}
              />
            ) : (
              <>
                {/* Grid Area - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-hide min-h-0">
                  {loading && visibleItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-20">
                      <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white animate-spin" />
                      <span className="text-xs font-medium uppercase tracking-widest">Loading...</span>
                    </div>
                  ) : visibleItems.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-white/20 text-xs uppercase tracking-widest">
                      No assets found
                    </div>
                  ) : (
                    <RowsPhotoAlbum
                      photos={photos}
                      targetRowHeight={160}
                      spacing={6}
                      rowConstraints={{ singleRowMaxHeight: 260 }}
                      render={{
                        photo: (_, { photo, width, height }) => {
                          const { item, itemUrl, isVideo } = photo;
                          const isSelected = selectedItems.some(
                            (p) =>
                              (p.workflow_id && (p.workflow_id === item.workflow_id || p.workflow_id === item.id)) ||
                              p.asset_id === item.id ||
                              p.url === itemUrl
                          );
                          const candidateCount = item.image_count || 1;
                          const isOverQuota = typeof remainingImages === "number"
                            ? candidateCount > availableSlots
                            : selectedItems.length >= maxAllowed;
                          const isDisabled = isOverQuota && !isSelected;

                          return (
                            <MediaViewCard
                              key={photo.key}
                              item={item}
                              itemUrl={itemUrl}
                              isVideo={isVideo}
                              width={width}
                              height={height}
                              isSelected={isSelected}
                              isDisabled={isDisabled}
                              onSelect={toggleSelection}
                            />
                          );
                        },
                      }}
                    />
                  )}

                  {(hasMore || loading) && visibleItems.length > 0 && (
                    <div 
                      className="h-10 w-full flex items-center justify-center"
                      ref={(el) => {
                        if (!el) return;
                        const observer = new IntersectionObserver(
                          ([entry]) => {
                            if (entry.isIntersecting && !loading && hasMore) {
                              onLoadMore();
                            }
                          },
                          { rootMargin: "100px" }
                        );
                        observer.observe(el);
                        return () => observer.disconnect();
                      }}
                    >
                      {loading && (
                        <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
                      )}
                    </div>
                  )}
                </div>

                {/* Footer - Import Button */}
                <div className="p-3 shrink-0 flex justify-end bg-transparent">
                  <Button 
                    onClick={handleImport}
                    disabled={selectedItems.length === 0}
                    className={cn(
                      selectedItems.length > 0 
                        ? "bg-white text-black hover:bg-white/90 active:scale-[0.95]" 
                        : "bg-white/5 text-white/20 cursor-not-allowed"
                    )}
                  >
                    {selectedItems.length > 0 
                      ? `Import (${selectedItems.length})`
                      : "Select Media"
                    }
                  </Button>
                </div>
              </>
            )}
          </div>

          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
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
