import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useProjectData } from "@/features/workflows/api/workflowsApi";
import { useWorkflowsStore, useWorkflowDelete } from "@/features/workflows";
import { characterService } from "../services/characterService";

// ─── Individual Character Mutations & Queries ────────────────────────────────

/**
 * useCharacterWorkflows
 * Retrieves all character workflows for a given project, decorated with their
 * media items, primary turnaround sheet media, and visual generation status.
 */
export function useCharacterWorkflows(projectId) {
  const { data, isLoading, isError } = useProjectData(projectId);
  const workflows = data?.projectContents?.workflows ?? [];
  const media = data?.projectContents?.media ?? [];

  const characterWorkflows = useMemo(() => {
    return workflows
      .filter((w) => {
        const type = String(w.workflow_type || "").toUpperCase();
        return type === "CHARACTER" || type === "CHARACTER_SHEET";
      })
      .map((w) => {
        const wId = w.name || w.id;
        const items = media.filter((m) => m.workflowId === wId || m.workflow_id === wId);

        // Locate main turnaround sheet media
        const primaryId = w.primary_media_id || w.primaryMediaId || w.metadata?.primaryMediaId;
        const validItems = items.filter(m => m.step_id !== "character_detail" && Boolean(m.url || m.file_url));
        const mainMedia =
          (primaryId && validItems.find((m) => (m.id === primaryId || m.name === primaryId))) ||
          validItems.find((m) => m.step_id === "character_sheet" || m.stepId === "character_sheet") ||
          validItems.find((m) => m.step_id === "CAE") ||
          validItems[0] ||
          (primaryId && items.find((m) => (m.id === primaryId || m.name === primaryId) && m.step_id !== "character_detail")) ||
          items.find((m) => m.step_id === "character_sheet" || m.stepId === "character_sheet") ||
          items.find((m) => m.step_id === "CAE") ||
          items.find((m) => m.step_id !== "character_detail") ||
          items[0] ||
          w.main_media ||
          null;

        let status = "processing";
        if (mainMedia) {
          if (mainMedia.status === "failed" || mainMedia.status === "error") {
            status = "failed";
          } else if (mainMedia.status === "success" || mainMedia.status === "completed" || Boolean(mainMedia.url)) {
            status = "completed";
          } else if (mainMedia.status === "processing" || mainMedia.status === "pending") {
            status = "processing";
          }
        }

        const primaryUrl = mainMedia?.url || mainMedia?.file_url || w.url || null;

        return {
          ...w,
          items,
          mainMedia,
          primary_media_url: primaryUrl,
          status,
          isMultiMedia: items.length > 1,
        };
      });
  }, [workflows, media]);

  return { workflows: characterWorkflows, isLoading, isError };
}

/**
 * useCreateCharacterMutation
 * Creates a new character workflow container and initiates sheet generation.
 */
export function useCreateCharacterMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputData) => {
      const payload = inputData?.payload || inputData || {};
      return await characterService.createCharacter(payload);
    },
    onMutate: async (inputData) => {
      useWorkflowsStore.getState().fireScrollToTop();
      const payload = inputData?.payload || inputData || {};
      const projectId = payload.projectId || payload.project_id;
      if (!projectId) return {};

      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        const optimisticId = `optimistic-char-${Date.now()}`;
        const optimisticWorkflow = characterService.buildOptimisticWorkflow({
          id: optimisticId,
          name: payload.name,
          prompt: payload.prompt,
          projectId,
          sessionId: payload.session_id,
        });

        const optimisticMedia = characterService.buildOptimisticMedia({
          id: optimisticId,
          workflowId: optimisticId,
          projectId,
          prompt: payload.prompt,
        });

        const optimisticChar = characterService.buildOptimisticCharacter({
          id: optimisticId,
          workflowId: optimisticId,
          projectId,
          name: payload.name,
          prompt: payload.prompt,
        });

        queryClient.setQueryData(projectKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: [optimisticWorkflow, ...(old.projectContents?.workflows || [])],
              media: [optimisticMedia, ...(old.projectContents?.media || [])],
              characters: [optimisticChar, ...(old.projectContents?.characters || [])],
            },
          };
        });
      }

      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      console.error("❌ Character creation failed:", err);
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
      if (typeof onError === "function") onError(err);
    },
    onSuccess: (res, payload) => {
      const projectId = payload?.projectId || payload?.project_id || res?.project_id || res?.character?.project_id;
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        queryClient.refetchQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
      }
    },
  });
}

/**
 * useUpdateCharacter
 * Updates character properties (name, title, description, character_info, etc.)
 * with instant bidirectional cache update across both `workflows` and `characters`.
 */
export function useUpdateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ characterId, characterData }) => {
      return await characterService.updateCharacter(characterId, characterData);
    },
    onSuccess: (data, variables) => {
      const { characterId, characterData } = variables || {};
      const cleanId = String(characterId || "").replace(/^workflows\//, "");

      if (cleanId && characterData) {
        const newName = characterData.name || characterData.title || characterData.display_name;
        const newDesc = characterData.description || characterData.character_info;

        queryClient.setQueriesData({ queryKey: ["projectData"] }, (oldData) => {
          if (!oldData?.projectContents) return oldData;

          const updatedCharacters = (oldData.projectContents.characters || []).map((c) => {
            const cId = String(c.id || "").replace(/^workflows\//, "");
            const cWfId = String(c.workflow_id || "").replace(/^workflows\//, "");
            if (cId === cleanId || cWfId === cleanId) {
              return {
                ...c,
                ...characterData,
                description: newDesc !== undefined ? newDesc : c.description,
                character_info: newDesc !== undefined ? newDesc : c.character_info,
                name: newName || c.name,
                title: newName || c.title,
              };
            }
            return c;
          });

          const updatedWorkflows = (oldData.projectContents.workflows || []).map((w) => {
            const wCleanId = String(w.id || w.name || "").replace(/^workflows\//, "");
            if (wCleanId === cleanId) {
              return {
                ...w,
                display_name: newName || w.display_name,
                name: newName || w.name,
                description: newDesc !== undefined ? newDesc : w.description,
                character_info: newDesc !== undefined ? newDesc : w.character_info,
                metadata: {
                  ...w.metadata,
                  displayName: newName || w.metadata?.displayName,
                },
              };
            }
            return w;
          });

          return {
            ...oldData,
            projectContents: {
              ...oldData.projectContents,
              workflows: updatedWorkflows,
              characters: updatedCharacters,
            },
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: ["projectData"] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

/**
 * useGenerateCharacterSheetMutation
 * Regenerates the 3-view turnaround sheet for an existing character.
 */
export function useGenerateCharacterSheetMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ characterId, prompt, references, projectId }) => {
      return await characterService.generateSheet({ characterId, prompt, references, projectId });
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: ["projectData"] });
    },
    onError: (err) => {
      console.error("❌ Sheet generation failed:", err);
      if (typeof onError === "function") onError(err);
    },
  });
}

/**
 * useGenerateCharacterDescriptionMutation
 * Generates an evocative character prompt using the AI Art Director.
 */
export function useGenerateCharacterDescriptionMutation() {
  return useMutation({
    mutationFn: async ({ concept, archetype, style }) => {
      return await characterService.generateDescription({ concept, archetype, style });
    },
  });
}

/**
 * useAddMediaToCharacter
 * Attaches a detail reference media item to the character.
 */
export function useAddMediaToCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params) => {
      return await characterService.addDetailMedia(params);
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: ["projectData"] });
    },
  });
}

/**
 * useRemoveMediaFromCharacter
 * Removes a detail reference media item from the character.
 */
export function useRemoveMediaFromCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ characterId, mediaId, projectId }) => {
      const res = await characterService.removeDetailMedia({ characterId, mediaId });
      return res;
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      } else {
        queryClient.invalidateQueries({ queryKey: ["projectData"] });
      }
    },
  });
}

/**
 * useSetCharacterSheetMedia
 * Replaces or uploads the primary turnaround sheet media for the character.
 */
export function useSetCharacterSheetMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params) => {
      return await characterService.setSheetMedia(params);
    },
    onSuccess: (data, variables) => {
      if (variables?.projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(variables.projectId) });
      }
      queryClient.invalidateQueries({ queryKey: ["projectData"] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

// ─── Unified Hook: useCharacter ──────────────────────────────────────────────

const MAX_DETAIL_IMAGES = 5;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id) => id && UUID_REGEX.test(id);

/**
 * useCharacter
 * Master domain hook providing complete reactive state, mutation handlers,
 * media management, and optimistic helpers for a specific character workflow.
 *
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.characterId - The character workflow ID
 */
export function useCharacter({ projectId, characterId } = {}) {
  const cleanId = useMemo(() => {
    return String(characterId || "").replace(/^workflows\//, "");
  }, [characterId]);

  const { data: projectData, isLoading } = useProjectData(projectId);

  // Mutations
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
  const items = workflow?.items || [];

  const primaryMediaId =
    workflow?.primary_media_id ||
    workflow?.primaryMediaId ||
    workflow?.metadata?.primaryMediaId;

  // Sheet photos: strictly prioritize primary turnaround body sheet media with valid URLs
  const sheetPhotos = useMemo(() => {
    // 1. Filter to valid items with URLs, ignoring detail images and failed empty placeholders
    const validItems = items.filter(
      (m) => m.step_id !== "character_detail" && Boolean(m.url || m.file_url || m.asset?.file_url)
    );

    // 2. Identify explicit sheet items
    const explicitSheets = validItems.filter((m) => {
      if (primaryMediaId && (m.id === primaryMediaId || m.name === primaryMediaId)) return true;
      return m.step_id === "character_sheet" || m.step_id === "CAE" || m.step_id === "upload";
    });

    const targetList = explicitSheets.length > 0 ? explicitSheets : validItems;

    // 3. Ensure primaryMediaId comes first if present
    if (primaryMediaId) {
      targetList.sort((a, b) => {
        if (a.id === primaryMediaId || a.name === primaryMediaId) return -1;
        if (b.id === primaryMediaId || b.name === primaryMediaId) return 1;
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
    if (primaryMediaId) {
      const match = items.find(
        (m) => (m.id === primaryMediaId || m.name === primaryMediaId) && m.step_id !== "character_detail" && Boolean(m.url || m.file_url)
      );
      if (match) return match;
    }
    return (
      items.find((m) => (m.step_id === "character_sheet" || m.step_id === "CAE") && Boolean(m.url || m.file_url)) ||
      items.find((m) => m.step_id !== "character_detail" && Boolean(m.url || m.file_url)) ||
      items.find((m) => m.step_id === "character_sheet" || m.step_id === "CAE") ||
      items.find((m) => m.step_id !== "character_detail") ||
      items[0] ||
      null
    );
  }, [items, primaryMediaId]);

  const activeSheetSrc = useMemo(() => {
    if (optimisticSheetUrl) return optimisticSheetUrl;
    if (sheetPhotos[0]?.src) return sheetPhotos[0].src;
    const fallbackUrl = mainMedia?.url || mainMedia?.file_url;
    if (fallbackUrl && mainMedia?.step_id !== "character_detail") return fallbackUrl;
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
    return items.filter((m) => m.step_id === "character_detail");
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
    (mainMedia?.status === "processing" || mainMedia?.status === "pending" || !mainMedia?.url);

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
      const mediaId = item.id || item.workflow_id || item.workflowId;
      const fallbackUrl = item.url || item.file_url || item.src || item.image?.url;

      setIsUpdatingSheet(true);
      setImageLoadError(false);
      if (fallbackUrl) setOptimisticSheetUrl(fallbackUrl);

      try {
        const payload = {
          characterId: cleanId,
          ...(mediaId ? { mediaId } : {}),
          ...(fallbackUrl ? { imageUrl: fallbackUrl } : {}),
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

      const filesToProcess = files.slice(0, remaining);
      const itemsToUpload = filesToProcess.map((file, idx) => {
        const previewUrl = URL.createObjectURL(file);
        return {
          id: `temp_${Date.now()}_${idx}`,
          url: previewUrl,
          file_url: previewUrl,
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
                  ? { ...r, id: res.media.id, url: uploadedUrl, file_url: uploadedUrl }
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
        const mediaId = item.id || item.workflow_id || item.workflowId;
        const fallbackUrl = item.url || item.file_url || item.src || item.image?.url;
        if (!mediaId && !fallbackUrl) continue;

        try {
          const res = await addMediaMutation.mutateAsync({
            characterId: cleanId,
            ...(mediaId ? { mediaId } : {}),
            ...(fallbackUrl ? { imageUrl: fallbackUrl } : {}),
            projectId,
          });
          if (res?.media) {
            setAddedDetailImages((prev) => [res.media, ...prev]);
          }
        } catch (err) {
          console.error("Failed to add detail asset:", err);
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
