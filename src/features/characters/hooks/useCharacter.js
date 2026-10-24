import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { useWorkflowDelete } from "@/features/workflows/model/useWorkflowDelete";
import { characterService } from "../services/characterService";
import { stripWorkflowPrefix, matchMediaId } from "@/features/workflows/lib/cacheHelpers";
import { useUpdateCharacter } from "./useUpdateCharacter";
import { useSetCharacterSheetMedia } from "./useSetCharacterSheetMedia";
import { useAddMediaToCharacter } from "./useAddMediaToCharacter";
import { useRemoveMediaFromCharacter } from "./useRemoveMediaFromCharacter";
import { useGenerateCharacterSheetMutation } from "./useGenerateCharacterSheetMutation";
import { resolveMainMedia } from "@/features/workflows/core/resolveMediaRef";
import {
  validateFilesAgainstPolicy,
  CHARACTER_SHEET_UPLOAD_POLICY,
  CHARACTER_DETAIL_UPLOAD_POLICY,
} from "@/features/media";

// ─── Shared constants (moved outside class hook to keep it usable) ───────────
const MAX_DETAIL_IMAGES = 5;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id) => id && UUID_REGEX.test(id);

const isDetailMedia = (m) =>
  m?.role === "detail" ||
  m?.role === "reference" ||
  m?.mediaRole === "detail" ||
  m?.mediaRole === "reference" ||
  m?.raw?.role === "detail" ||
  m?.raw?.role === "reference" ||
  (!m?.role && !m?.mediaRole && !m?.raw?.role && (
    m?.step_id === "character_detail" ||
    m?.raw?.step_id === "character_detail"
  ));

const isSheetMedia = (m) =>
  m?.role === "sheet" ||
  m?.role === "turnaround" ||
  m?.mediaRole === "sheet" ||
  m?.mediaRole === "turnaround" ||
  m?.raw?.role === "sheet" ||
  m?.raw?.role === "turnaround" ||
  (!m?.role && !m?.mediaRole && !m?.raw?.role && (
    m?.step_id === "character_sheet" ||
    m?.raw?.step_id === "character_sheet"
  ));

/**
 * useCharacter
 * Master domain hook providing complete reactive state, mutation handlers,
 * media management, and optimistic helpers for a specific character workflow.
 *
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.characterId - The character workflow ID
 *
 * NOTE: Individual character-level mutations and the project-wide useCharacterWorkflows
 * listing now live in sibling files under features/characters/hooks/ (1 hook / file).
 * This file contains ONLY the unified composition hook.
 */
export function useCharacter({ projectId, characterId } = {}) {
  const cleanId = useMemo(() => {
    return stripWorkflowPrefix(characterId);
  }, [characterId]);

  const { data: projectData, isLoading } = useProjectData(projectId);

  // Mutations — imported from the new split files per plan
  const updateCharacterMutation = useUpdateCharacter();
  const setSheetMediaMutation = useSetCharacterSheetMedia();
  const addMediaMutation = useAddMediaToCharacter();
  const removeMediaMutation = useRemoveMediaFromCharacter();
  const generateSheetMutation = useGenerateCharacterSheetMutation();
  const { promptDelete, confirmDelete, isDeleting, isDeleteDialogOpen, setIsDeleteDialogOpen } = useWorkflowDelete();

  // ── Sheet Local Optimistic State ──
  const [optimisticSheetUrl, setOptimisticSheetUrl] = useState(null);
  const [isUpdatingSheet, setIsUpdatingSheet] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // ── Detail Images Local Optimistic State ──
  const [addedDetailImages, setAddedDetailImages] = useState([]);
  const [pendingUrls, setPendingUrls] = useState([]);
  const [deletingMediaId, setDeletingMediaId] = useState(null);
  const [detailDims, setDetailDims] = useState({});

  // ── Resolve Workflow & Character Entities ──
  const workflow = useMemo(() => {
    if (!cleanId) return null;
    const rawWorkflows = projectData?.projectContents?.workflows ?? [];
    const rawMedia = projectData?.projectContents?.media ?? [];
    const rawCharacters = projectData?.projectContents?.characters ?? [];

    const found = rawWorkflows.find(
      (w) => w.id === cleanId || w.name === cleanId || (w.id || w.name) === cleanId
    );
    if (!found) return null;

    const targetId = found.id || found.name;
    const targetName = found.name || found.id;

    const char =
      rawCharacters.find((c) => c.workflow_id === targetId || c.workflow_id === targetName || c.id === targetId) ||
      found.character ||
      {};

    const items = rawMedia
      .filter((m) => m.workflowId === targetId || m.workflowId === targetName || m.workflow_id === targetId)
      .map((m) => ({ ...m, id: m.id || m.name }));

    return {
      ...found,
      id: targetId,
      character: char,
      character_info: char.character_info || char.description || found.character_info || "",
      items,
    };
  }, [projectData, cleanId]);

  const character = workflow?.character || null;
  const items = useMemo(() => workflow?.items || [], [workflow?.items]);

  const primaryMediaId =
    workflow?.primary_media_id ||
    workflow?.primaryMediaId ||
    workflow?.metadata?.primaryMediaId;

  // Sheet photos: strictly prioritize primary turnaround body sheet media with valid URLs
  const sheetPhotos = useMemo(() => {
    // 1. Filter to valid items with URLs, ignoring detail images and failed empty placeholders
    const validItems = items.filter(
      (m) => !isDetailMedia(m) && Boolean(m.url || m.file_url || m.asset?.file_url)
    );

    // 2. Identify explicit sheet items
    const explicitSheets = validItems.filter((m) => {
      if (primaryMediaId && matchMediaId(m, primaryMediaId)) return true;
      return isSheetMedia(m);
    });

    const targetList = explicitSheets.length > 0 ? explicitSheets : validItems;

    // 3. Ensure primaryMediaId comes first if present
    if (primaryMediaId) {
      targetList.sort((a, b) => {
        if (matchMediaId(a, primaryMediaId)) return -1;
        if (matchMediaId(b, primaryMediaId)) return 1;
        return 0;
      });
    }

    return targetList
      .map((item, idx) => {
        const url = item.url || item.file_url || item.asset?.file_url;
        if (!url) return null;
        return {
          src: url,
          key: item.id || String(idx),
          status: item.status,
          rawItem: item,
        };
      })
      .filter(Boolean);
  }, [items, primaryMediaId]);

  const mainMedia = useMemo(() => {
    const characterWf = {
      ...workflow,
      workflow_type: "CHARACTER",
      primary_media_id: primaryMediaId,
    };
    return resolveMainMedia(characterWf, items);
  }, [workflow, primaryMediaId, items]);

  const activeSheetSrc = useMemo(() => {
    if (optimisticSheetUrl) return optimisticSheetUrl;
    if (sheetPhotos[0]?.src) return sheetPhotos[0].src;
    const fallbackUrl = mainMedia?.url || mainMedia?.file_url;
    if (fallbackUrl && !isDetailMedia(mainMedia)) return fallbackUrl;
    return null;
  }, [optimisticSheetUrl, sheetPhotos, mainMedia]);

  // Reset imageLoadError when activeSheetSrc changes
  useEffect(() => {
    setImageLoadError(false);
  }, [activeSheetSrc]);

  // Clear optimistic sheet once confirmed in sheetPhotos
  useEffect(() => {
    if (optimisticSheetUrl && sheetPhotos.some((p) => p.src === optimisticSheetUrl)) {
      setOptimisticSheetUrl(null);
    }
  }, [optimisticSheetUrl, sheetPhotos]);

  // Server detail images
  const serverDetailImages = useMemo(() => {
    return items.filter((m) => isDetailMedia(m));
  }, [items]);

  // Combined & deduplicated display detail images
  const displayDetailImages = useMemo(() => {
    const set = new Set();
    const res = [];
    for (const item of [...addedDetailImages, ...serverDetailImages]) {
      const u = item.url || item.file_url;
      if (u && !set.has(u)) {
        set.add(u);
        res.push(item);
      }
    }
    return res;
  }, [addedDetailImages, serverDetailImages]);

  // Compute image natural dimensions for gallery layout
  useEffect(() => {
    displayDetailImages.forEach((item) => {
      const src = item.url || item.file_url;
      if (!src || detailDims[src]) return;
      const img = new window.Image();
      img.onload = () =>
        setDetailDims((prev) => ({
          ...prev,
          [src]: { width: img.naturalWidth || 4, height: img.naturalHeight || 3 },
        }));
      img.src = src;
    });
  }, [displayDetailImages, detailDims]);

  const detailPhotos = useMemo(() => {
    return displayDetailImages
      .map((item, idx) => {
        const src = item.url || item.file_url;
        const dims = detailDims[src];
        return {
          src,
          width: dims?.width || 4,
          height: dims?.height || 3,
          key: item.id || String(idx),
          ref: item,
        };
      })
      .filter((p) => p.src);
  }, [displayDetailImages, detailDims]);

  // Derived metadata
  const displayTitle = useMemo(() => {
    return (
      workflow?.metadata?.displayName ||
      workflow?.display_name ||
      character?.name ||
      character?.title ||
      workflow?.name ||
      "Untitled Character"
    );
  }, [workflow, character]);

  const description = useMemo(() => {
    return (
      workflow?.character_info ||
      character?.character_info ||
      character?.description ||
      workflow?.description ||
      workflow?.metadata?.description ||
      ""
    );
  }, [workflow, character]);

  const prompt = useMemo(() => {
    const primary = items[0];
    const config = primary?.generationConfig || {};
    return config.prompt || workflow?.metadata?.prompt || "";
  }, [items, workflow]);

  const features = useMemo(() => {
    const primary = items[0];
    const config = primary?.generationConfig || {};
    return config.features || workflow?.metadata?.features || [];
  }, [items, workflow]);

  // Status flags
  const isFailed =
    !activeSheetSrc &&
    (mainMedia?.status === "failed" || mainMedia?.status === "error" || workflow?.status === "failed");

  const hasPhotos = sheetPhotos.length > 0 || Boolean(activeSheetSrc);
  const isProcessing =
    !hasPhotos &&
    !isFailed &&
    (mainMedia?.status === "processing" ||
      mainMedia?.status === "pending" ||
      workflow?.status === "processing" ||
      workflow?.status === "pending");

  // ── Title & Description State Handlers ──
  const [draftTitle, setDraftTitle] = useState(displayTitle);
  const [draftDesc, setDraftDesc] = useState(description);
  const [promptCopied, setPromptCopied] = useState(false);
  const previousTitleRef = useRef(displayTitle);

  useEffect(() => {
    previousTitleRef.current = displayTitle;
    setDraftTitle(displayTitle);
  }, [displayTitle]);

  useEffect(() => {
    setDraftDesc(description);
  }, [description]);

  const saveTitle = useCallback(
    async (text) => {
      if (!cleanId) return;
      const cleanName = (text || "").replace(/^@+/, "").trim();
      const prevName = (previousTitleRef.current || "").replace(/^@+/, "").trim();

      if (!cleanName) {
        setDraftTitle(previousTitleRef.current);
        return;
      }
      if (cleanName === prevName) {
        setDraftTitle(previousTitleRef.current);
        return;
      }

      return updateCharacterMutation.mutateAsync({
        characterId: cleanId,
        characterData: {
          name: cleanName,
          display_name: cleanName,
        },
      });
    },
    [cleanId, updateCharacterMutation]
  );

  const saveDescription = useCallback(
    async (text) => {
      if (!cleanId) return;
      const cleanDesc = (text || "").trim();

      return updateCharacterMutation.mutateAsync({
        characterId: cleanId,
        characterData: {
          description: cleanDesc,
          character_info: cleanDesc,
        },
      });
    },
    [cleanId, updateCharacterMutation]
  );

  const copyPrompt = useCallback(() => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }, [prompt]);

  // ── Sheet Actions ──

  const uploadSheetFile = useCallback(
    async (file) => {
      if (!file || !cleanId) return;

      const validation = validateFilesAgainstPolicy([file], CHARACTER_SHEET_UPLOAD_POLICY);
      if (!validation.valid) {
        throw new Error(validation.message || "Invalid character sheet file.");
      }

      setIsUpdatingSheet(true);
      setImageLoadError(false);

      const previewUrl = typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(file) : null;
      if (previewUrl) {
        setOptimisticSheetUrl(previewUrl);
      }

      try {
        const res = await setSheetMediaMutation.mutateAsync({
          characterId: cleanId,
          file,
          projectId,
        });
        if (res?.media?.url) {
          setOptimisticSheetUrl(res.media.url);
        }
        return res;
      } catch (err) {
        console.error("❌ Failed to upload character sheet:", err);
        setOptimisticSheetUrl(null);
        throw err;
      } finally {
        setIsUpdatingSheet(false);
      }
    },
    [cleanId, projectId, setSheetMediaMutation]
  );

  const selectSheetAsset = useCallback(
    async (selectedItems) => {
      if (!selectedItems || !selectedItems.length || !cleanId) return;
      const item = selectedItems[0];
      const mediaId = item.mediaId || item.media_id || item.id || item.workflow_id || item.workflowId;
      const fallbackUrl = item.url || item.file_url || item.src || item.image?.url;

      setIsUpdatingSheet(true);
      setImageLoadError(false);
      if (fallbackUrl) setOptimisticSheetUrl(fallbackUrl);

      try {
        const payload = {
          characterId: cleanId,
          ...(mediaId && !String(mediaId).startsWith("http") && !String(mediaId).startsWith("blob:")
            ? { mediaId }
            : (fallbackUrl ? { imageUrl: fallbackUrl } : {})),
          projectId,
        };
        const res = await setSheetMediaMutation.mutateAsync(payload);
        if (res?.media?.url) {
          setOptimisticSheetUrl(res.media.url);
        }
        return res;
      } catch (err) {
        console.error("❌ Failed to set sheet asset:", err);
        setOptimisticSheetUrl(null);
        throw err;
      } finally {
        setIsUpdatingSheet(false);
      }
    },
    [cleanId, projectId, setSheetMediaMutation]
  );

  const downloadSheet = useCallback(
    async (customFilename) => {
      const src = activeSheetSrc || sheetPhotos[0]?.src;
      if (!src) return;
      const namePart = (displayTitle || "character").toLowerCase().replace(/\s+/g, "_");
      await characterService.downloadImage({
        url: src,
        filename: customFilename || `${namePart}_sheet.png`,
      });
    },
    [activeSheetSrc, sheetPhotos, displayTitle]
  );

  // ── Detail Images Actions ──

  const uploadDetailFiles = useCallback(
    async (files) => {
      if (!files || !files.length || !cleanId) return;
      const remaining = MAX_DETAIL_IMAGES - displayDetailImages.length;
      if (remaining <= 0) return;

      // Pre-flight UX validation against CHARACTER_DETAIL_UPLOAD_POLICY (ADR-0012, Ticket 08)
      const validation = validateFilesAgainstPolicy(files, CHARACTER_DETAIL_UPLOAD_POLICY, {
        maxFiles: remaining,
      });
      if (!validation.valid) {
        throw new Error(validation.message || "Invalid character detail file(s).");
      }

      const filesToProcess = files.slice(0, remaining);
      const itemsToUpload = filesToProcess.map((file, idx) => {
        const previewUrl = URL.createObjectURL(file);
        return {
          id: `temp_${Date.now()}_${idx}`,
          url: previewUrl,
          file_url: previewUrl,
          status: "processing",
          step_id: "upload",
          role: "detail",
          mediaRole: "detail",
          file,
        };
      });

      setAddedDetailImages((prev) => [...itemsToUpload, ...prev]);
      const previewUrls = itemsToUpload.map((i) => i.url);
      setPendingUrls((prev) => [...prev, ...previewUrls]);

      for (const item of itemsToUpload) {
        try {
          const res = await addMediaMutation.mutateAsync({
            characterId: cleanId,
            file: item.file,
            projectId,
          });
          const uploadedUrl = res?.media?.url;
          if (uploadedUrl) {
            setAddedDetailImages((prev) =>
              prev.map((r) =>
                r.url === item.url || r.file_url === item.url || r.id === item.id
                  ? { ...r, id: res.media.id, url: uploadedUrl, file_url: uploadedUrl, status: "success" }
                  : r
              )
            );
          } else {
            setAddedDetailImages((prev) => prev.filter((r) => r.id !== item.id));
          }
        } catch (err) {
          console.error("Failed to upload detail media file:", err);
          setAddedDetailImages((prev) => prev.filter((r) => r.id !== item.id));
        } finally {
          setPendingUrls((prev) => prev.filter((u) => u !== item.url));
        }
      }
    },
    [cleanId, projectId, displayDetailImages.length, addMediaMutation]
  );

  const addDetailFromAssets = useCallback(
    async (selectedItems) => {
      if (!selectedItems || !selectedItems.length || !cleanId) return;
      const remaining = MAX_DETAIL_IMAGES - displayDetailImages.length;
      if (remaining <= 0) return;

      const itemsToAdd = selectedItems.slice(0, remaining);
      for (const item of itemsToAdd) {
        const mediaId = item.mediaId || item.media_id || item.id || item.workflow_id || item.workflowId;
        const fallbackUrl = item.url || item.file_url || item.src || item.image?.url;
        if (!mediaId && !fallbackUrl) continue;

        const tempId = `temp_asset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const optimisticAsset = {
          id: tempId,
          url: fallbackUrl,
          file_url: fallbackUrl,
          status: "processing",
          step_id: "upload",
          role: "detail",
          mediaRole: "detail",
        };
        setAddedDetailImages((prev) => [optimisticAsset, ...prev]);

        try {
          const res = await addMediaMutation.mutateAsync({
            characterId: cleanId,
            ...(mediaId && !String(mediaId).startsWith("http") && !String(mediaId).startsWith("blob:")
              ? { mediaId }
              : (fallbackUrl ? { imageUrl: fallbackUrl } : {})),
            projectId,
          });
          if (res?.media) {
            setAddedDetailImages((prev) =>
              prev.map((r) =>
                r.id === tempId
                  ? { ...res.media, status: "success", role: "detail", mediaRole: "detail" }
                  : r
              )
            );
          } else {
            setAddedDetailImages((prev) => prev.filter((r) => r.id !== tempId));
          }
        } catch (err) {
          console.error("Failed to add detail asset:", err);
          setAddedDetailImages((prev) => prev.filter((r) => r.id !== tempId));
        }
      }
    },
    [cleanId, projectId, displayDetailImages.length, addMediaMutation]
  );

  const removeDetailImage = useCallback(
    async (item) => {
      const url = item?.url || item?.file_url;
      const mediaId = item?.id;
      setAddedDetailImages((prev) => prev.filter((r) => (r.url || r.file_url) !== url));

      if (cleanId && isValidUUID(mediaId)) {
        setDeletingMediaId(mediaId);
        try {
          await removeMediaMutation.mutateAsync({ characterId: cleanId, mediaId, projectId });
        } catch (err) {
          console.error("Failed to delete detail image:", err);
        } finally {
          setDeletingMediaId(null);
        }
      }
    },
    [cleanId, projectId, removeMediaMutation]
  );

  return {
    // Core Workflow & Character entities
    workflow,
    character,
    items,
    mainMedia,
    displayTitle,
    description,
    prompt,
    features,

    // Loading & Status
    isLoading,
    isProcessing,
    isFailed,

    // Title & Info
    draftTitle,
    setDraftTitle,
    saveTitle,
    draftDesc,
    setDraftDesc,
    saveDescription,
    promptCopied,
    copyPrompt,

    // Turnaround Sheet
    activeSheetSrc,
    isUpdatingSheet,
    imageLoadError,
    setImageLoadError,
    uploadSheetFile,
    selectSheetAsset,
    downloadSheet,

    // Detail Images Gallery
    displayDetailImages,
    detailPhotos,
    isAddingDetail: pendingUrls.length > 0,
    pendingUrls,
    deletingMediaId,
    maxDetailImages: MAX_DETAIL_IMAGES,
    canAddDetail: displayDetailImages.length < MAX_DETAIL_IMAGES,
    isAtDetailLimit: displayDetailImages.length >= MAX_DETAIL_IMAGES,
    isAddDisabled: displayDetailImages.length >= MAX_DETAIL_IMAGES,
    uploadDetailFiles,
    addDetailFromAssets,
    removeDetailImage,

    // Character Deletion
    deleteCharacter: () => characterService.deleteCharacter(cleanId),
    promptDelete,
    confirmDelete,
    isDeleting,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,

    // Raw Mutations
    mutations: {
      updateCharacter: updateCharacterMutation,
      setSheetMedia: setSheetMediaMutation,
      addMedia: addMediaMutation,
      removeMedia: removeMediaMutation,
      generateSheet: generateSheetMutation,
    },
  };
}

export default useCharacter;
