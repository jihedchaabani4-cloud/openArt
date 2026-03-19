// src/components/features/ImagePromptBar/hooks/useImagePromptBar.js
import { useState, useMemo, useRef, useEffect } from 'react';
import { useGenerationsStudioStore } from "@/store/useGenerationsStudioStore";
import { ALL_MODELS as STUDIO_MODELS } from "../../PromptBarComponents/ModelSelector";
import { postGenerate } from '../api/generations.api';

export function useImagePromptBar({ isNewProject = false } = {}) {
  const {
    projectId, activeSessionId,
    allGenerations, allGenerationsLoading, allGenerationsHasMore,
    init, setActiveSessionId, fetchAssets, fetchGenerations, fetchAllGenerations,
    studioModels, studioModelsLoading, fetchStudioModels
  } = useGenerationsStudioStore();

  // Core state
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(null);
  const [resolution, setResolution] = useState("2K");
  const [ratio, setRatio] = useState("3:4");
  const [count, setCount] = useState(1);
  const [generationMode, setGenerationMode] = useState("image"); // 'image', 'video', 'motion'
  const [duration, setDuration] = useState("5s");
  const [videoResolution, setVideoResolution] = useState("1080p");

  const textareaRef = useRef(null);

  // References
  const [referenceImages, setReferenceImages] = useState([]);
  const maxRefs = model?.maxReferences ?? 4;

  const handleAddReference = (asset, role = 'normal') => {
    // Limit based on the currently selected model
    if (role === 'normal') {
      const normalCount = referenceImages.filter(r => r.role === 'normal' || !r.role).length;
      if (normalCount >= maxRefs) return;
    }
    setReferenceImages(prev => {
      // Remove any existing frame with same role before adding new to ensure uniquely 1 start/end/mc_image/mc_video
      const cleaned = (['start', 'end', 'mc_image', 'mc_video'].includes(role)) 
        ? prev.filter(r => r.role !== role) 
        : prev;

      const type = asset.is_video ? 'video' : 'image';
      const newRefs = [...cleaned, { ...asset, role, type }];
      console.log("Current References:", newRefs);
      return newRefs;
    });
  };

  const handleRemoveReference = (index) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearReferences = () => {
    setReferenceImages([]);
  };

  // Clear references when mode changes
  useEffect(() => {
    handleClearReferences();
  }, [generationMode]);

  // Ensure models are fetched
  useEffect(() => {
    if (studioModels.length === 0) {
      fetchStudioModels();
    }
  }, [studioModels.length, fetchStudioModels]);

  // Set default model once loaded
  useEffect(() => {
    if (!model && studioModels.length > 0) {
      // API currently returns t2i models; we just grab the first one
      setModel({ id: studioModels[0].key });
    }
  }, [studioModels, model]);

  const handleSwapFrames = () => {
    setReferenceImages(prev => {
      const startRef = prev.find(r => r.role === 'start');
      const endRef = prev.find(r => r.role === 'end');
      if (!startRef && !endRef) return prev;

      return prev.map(r => {
        if (r.role === 'start') return { ...r, role: 'end' };
        if (r.role === 'end') return { ...r, role: 'start' };
        return r;
      });
    });
  };

  // Library (all generations used as media source for the dialog)
  const library = useMemo(() => allGenerations, [allGenerations]);

  // Generation state
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || generating) return;

    try {
      setGenerating(true);

      const payload = {
        prompt,
        model_name: model?.id || "nanobana_pro", // Ensure fallback and correct key for backend
        quality: resolution,
        ratio,
        count,
        duration,
        video_resolution: videoResolution,
        project_id: isNewProject ? null : projectId,
        session_id: isNewProject ? null : activeSessionId,
        references: referenceImages.map(r => ({ url: r.url, asset_id: r.asset_id, role: r.role || 'normal', type: r.type || 'image' })),
      };

      console.log("🚀 [Frontend Req] Sending Generation Payload:", JSON.stringify(payload, null, 2));

      const res = await postGenerate(payload);

      if (res.ok) {
        if (res.project_id && res.session_id) {
          const isNewProj = !projectId || projectId !== res.project_id;
          if (isNewProj) init(res.project_id);
          if (!activeSessionId || activeSessionId !== res.session_id) setActiveSessionId(res.session_id);
          if (isNewProj && typeof window !== 'undefined' && window.location.pathname.includes('/project/new')) {
            window.location.href = `/projects/${res.project_id}`;
          }
        }
        const finalProj = res.project_id || projectId;
        const finalSess = res.session_id || activeSessionId;
        if (finalProj) {
          fetchAssets(finalProj, finalSess);
          fetchGenerations(finalProj, finalSess);
        }
        setPrompt("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
      console.error("❌ Generation failed:", error);
    } finally {
      setGenerating(false);
    }
  };

  return {
    // Prompt
    prompt, setPrompt,
    // Model & params
    model, setModel,
    studioModels, studioModelsLoading,
    resolution, setResolution,
    ratio, setRatio,
    count, setCount,
    duration, setDuration,
    videoResolution, setVideoResolution,
    generationMode, setGenerationMode,
    textareaRef,
    // References
    referenceImages,
    handleAddReference,
    handleRemoveReference,
    handleClearReferences,
    handleSwapFrames,
    maxRefs,
    // Library
    library,
    libraryLoading: allGenerationsLoading,
    libraryHasMore: allGenerationsHasMore,
    fetchAllGenerations,
    // Generation
    generating,
    handleGenerate,
    // Store
    projectId,
    activeSessionId,
  };
}
