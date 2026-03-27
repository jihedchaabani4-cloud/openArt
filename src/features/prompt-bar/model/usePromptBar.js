// src/features/prompt-bar/model/usePromptBar.js
// ✅ Slim orchestrator: composes small hooks, owns generate logic only.

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGenerationsStore } from "@/features/generations/model/useGenerationsStore";
import { useStudioModels, useGenerateMutation } from "@/features/generations/api/generationsApi";
import { useAssets } from "@/features/media/api/mediaApi";
import { queryKeys } from "@/shared/api/queryKeys";
import { buildReferencesPayload } from "@/shared/lib/referenceUtils";
import { useModelSync } from "./useModelSync";
import { useMediaUpload } from "./useMediaUpload";
import { useMediaLibrary } from "@/features/media/model/useMediaLibrary";

export function usePromptBar({ isNewProject = false } = {}) {
  // ─── Global store ─────────────────────────────────────────────────────────
  const {
    selectedProjectId: projectId,
    activeSessionId,
    setActiveSessionId,
    setEditTrigger,
    editTrigger,
    referenceImages,
    addReference,
    removeReference,
    clearReferences,
    setReferenceImages,
    swapFrames,
    generationMode,
    setGenerationMode,
  } = useGenerationsStore();

  const queryClient = useQueryClient();

  // ─── Remote data ──────────────────────────────────────────────────────────
  const lib = useMediaLibrary(projectId);

  const { data: modelsData, isLoading: studioModelsLoading } = useStudioModels();

  const studioModels   = modelsData?.models   ?? [];
  const studioFamilies = modelsData?.families ?? [];

  // ─── Model sync (extracted hook) ──────────────────────────────────────────
  const { model, setModel, selectedModel, maxRefs } = useModelSync(
    studioModels,
    studioModelsLoading,
    generationMode
  );

  // ─── Upload + drag-drop (extracted hook) ──────────────────────────────────
  const upload = useMediaUpload({
    projectId,
    activeSessionId,
    addReference,
    referenceImages,
    maxRefs,
  });

  // ─── Local UI state ───────────────────────────────────────────────────────
  const [prompt,          setPrompt]          = useState("");
  const [resolution,      setResolution]      = useState("2K");
  const [ratio,           setRatio]           = useState("1:1");
  const [count,           setCount]           = useState(1);
  const [duration,        setDuration]        = useState("5s");
  const [videoResolution, setVideoResolution] = useState("1080p");
  const [generationError, setGenerationError] = useState(null);
  const textareaRef = useRef(null);

  const { mutateAsync: runGenerate, isPending: generating } = useGenerateMutation({
    onError: (err) => setGenerationError(err.message),
  });

  // ─── Sync ratio/resolution & Prune References when model changes ─────────
  useEffect(() => {
    if (!selectedModel) return;
    const support = selectedModel.support || {};
    
    // 1. Prune references if they exceed the new model's maximum
    // Using getState() to avoid adding referenceImages to the dependency array,
    // which would cause this effect to fire on every reference addition.
    const currentRefs = useGenerationsStore.getState().referenceImages;
    const currentMaxRefs = support.references?.max ?? 4;
    
    if (currentRefs.length > currentMaxRefs) {
      setReferenceImages(currentRefs.slice(0, currentMaxRefs));
    }

    // 2. Sync ratio and resolution
    // support.ratio may be: [{value, label}] array (new format) or { default, options } object
    const extractVal = (raw) => {
      if (Array.isArray(raw)) {
        const first = raw[0];  // might be string or {value, label}
        return (first && typeof first === 'object') ? first.value : first;
      }
      return raw?.default ?? null;
    };

    const defRatio = extractVal(support.ratio) ?? "1:1";
    const defQual  = extractVal(support.quality) ?? "2K";
    const defVid   = extractVal(support.resolution) ?? "1080p";

    setRatio(defRatio);
    setResolution(defQual);
    setVideoResolution(defVid);
  }, [selectedModel?.key]);

  // ─── Restore state from editTrigger ──────────────────────────────────────
  // ✅ NOTE: adaptReferences is no longer needed here as a useEffect.
  //    setGenerationMode in the store already adapts refs automatically.
  useEffect(() => {
    if (!editTrigger?.params || studioModels.length === 0) return;
    const { params } = editTrigger;

    if (params.prompt      !== undefined) setPrompt(params.prompt);
    if (params.model_name)                setModel({ id: params.model_name });
    if (params.quality)                   setResolution(params.quality);
    if (params.ratio)                     setRatio(params.ratio);
    if (params.count)                     setCount(params.count);
    if (params.duration)                  setDuration(params.duration);
    if (params.video_resolution)          setVideoResolution(params.video_resolution);
    if (params.generation_mode)           setGenerationMode(params.generation_mode);

    setReferenceImages(
      params.references?.length > 0
        ? params.references.map((r) => ({
            url:      r.url,
            asset_id: r.asset_id,
            role:     r.role,
            type:     r.type,
          }))
        : []
    );

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
      textareaRef.current.focus();
    }
  }, [editTrigger, studioModels]);

  // ─── Library ──────────────────────────────────────────────────────────────
  const library = lib.items;

  // ─── Reset ────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setPrompt("");
    const defaultModel = studioModels[0];
    if (defaultModel) {
      setModel({ id: defaultModel.key });
      setResolution(defaultModel.support?.quality?.default ?? "2K");
      setRatio(defaultModel.support?.ratio?.default        ?? "1:1");
    }
    setCount(1);
    setDuration("5s");
    setVideoResolution("1080p");
    setReferenceImages([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [studioModels, setReferenceImages]);

  // ─── Generate ─────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      if (!prompt.trim() || generating) return;

      setGenerationError(null);
      const isVideo = generationMode !== "image";

      const payload = {
        prompt,
        model:            model?.id ?? "nanobana_pro",
        model_name:       model?.id ?? "nanobana_pro",
        quality:          resolution,
        ratio,
        num_images:       count,
        duration,
        video_resolution: videoResolution,
        section:          (generationMode === "motion" || generationMode === "motion-control") ? "motion" : (isVideo ? "video_studio" : "image_generator"),
        project_id:       isNewProject ? null : projectId,
        session_id:       isNewProject ? null : activeSessionId,
        references:       buildReferencesPayload(referenceImages),
      };

      try {
        const res = await runGenerate({ payload, isVideo });

        if (res.project_id && res.session_id) {
          if (!projectId || projectId !== res.project_id) {
            useGenerationsStore.getState().setSelectedProjectId(res.project_id);
          }
          if (!activeSessionId || activeSessionId !== res.session_id) {
            setActiveSessionId(res.session_id);
          }
          if (isNewProject && window.location.pathname.includes("/project/new")) {
            window.location.href = `/projects/${res.project_id}`;
          }
        }

        const finalProj = res.project_id ?? projectId;
        const finalSess = res.session_id  ?? activeSessionId;
        if (finalProj) {
          queryClient.invalidateQueries({ queryKey: queryKeys.assets.byProject(finalProj, finalSess) });
          queryClient.invalidateQueries({ queryKey: queryKeys.generations.byProject(finalProj, finalSess) });
        }

        setPrompt("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setEditTrigger(null);
      } catch {
        // Error is set via onError callback in useGenerateMutation
      }
    },
    [
      prompt, generating, generationMode, model, resolution, ratio, count,
      duration, videoResolution, isNewProject, projectId, activeSessionId,
      referenceImages, runGenerate, setActiveSessionId, setEditTrigger, queryClient,
    ]
  );

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    // Prompt
    prompt,       setPrompt,
    textareaRef,
    hasChanges:   prompt.trim().length > 0 || referenceImages.length > 0,

    // Model
    model,        setModel,
    selectedModel,
    studioModels, studioModelsLoading,
    studioFamilies,

    // Generation params
    resolution,     setResolution,
    ratio,          setRatio,
    count,          setCount,
    duration,       setDuration,
    videoResolution, setVideoResolution,
    generationMode, setGenerationMode,

    // References
    referenceImages,
    handleAddReference:   (asset, role = "normal") => addReference(asset, role, maxRefs),
    handleRemoveReference: removeReference,
    handleClearReferences: clearReferences,
    handleSwapFrames:      swapFrames,
    maxRefs,

    // Upload / drag-drop (delegated)
    ...upload,

    // Library (project-level assets only)
    library,
    libraryLoading: lib.loading,
    libraryHasMore: lib.hasMore,
    assetSource: lib.source,    
    setAssetSource: lib.setSource,
    assetMode: lib.mediaType,      
    setAssetMode: lib.setMediaType,
    handleOpenLibrary: lib.handleOpen,
    handleLoadMoreAssets: lib.handleLoadMore,

    // Generation
    generating,
    generationError,
    clearGenerationError: () => setGenerationError(null),
    handleGenerate,

    // Session
    projectId,
    activeSessionId,
    handleReset,
  };
}