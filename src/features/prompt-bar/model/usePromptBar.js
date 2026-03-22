import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGenerationsStore } from "@/features/generations/model/useGenerationsStore";
import { useAllGenerations, useStudioModels, useGenerateMutation } from "@/features/generations/api/generationsApi";
import { useAssets } from "@/features/media/api/mediaApi";
import { queryKeys } from "@/shared/api/queryKeys";

export function usePromptBar({ isNewProject = false } = {}) {
    const {
        selectedProjectId: projectId,
        activeSessionId,
        setActiveSessionId,
        editTrigger,
        setEditTrigger,
    } = useGenerationsStore();

    const queryClient = useQueryClient();

    // ── Server state (React Query) ─────────────────────────────────────────────
    const { data: assets = [] } = useAssets(projectId, activeSessionId);
    const { data: generationsData, isLoading: allGenerationsLoading } = useAllGenerations(1);
    const { data: studioModels = [], isLoading: studioModelsLoading } = useStudioModels();

    const allGenerations    = generationsData?.data    ?? [];
    const allGenerationsHasMore = generationsData?.hasMore ?? false;

    // ── Generation mutation ────────────────────────────────────────────────────
    const [generationError, setGenerationError] = useState(null);

    const { mutateAsync: runGenerate, isPending: generating } = useGenerateMutation({
        onError: (err) => setGenerationError(err.message),
    });

    // ── Core state ────────────────────────────────────────────────────────────
    const [prompt,          setPrompt]          = useState("");
    const [model,           setModel]           = useState(null);
    const [resolution,      setResolution]      = useState("2K");
    const [ratio,           setRatio]           = useState("1:1");
    const [count,           setCount]           = useState(1);
    const [generationMode,  setGenerationMode]  = useState("image");
    const [duration,        setDuration]        = useState("5s");
    const [videoResolution, setVideoResolution] = useState("1080p");
    const [uploading,       setUploading]       = useState(false);
    const textareaRef = useRef(null);

    // ── Selected model object (full data) ─────────────────────────────────────
    const selectedModel = useMemo(
        () => studioModels.find(m => m.key === model?.id) || null,
        [studioModels, model?.id]
    );

    const maxRefs = selectedModel?.support?.references?.max ?? 4;

    // ── Auto-update ratio/resolution when model changes ───────────────────────
    useEffect(() => {
        if (!selectedModel) return;
        setRatio(selectedModel.support?.ratio?.default       || "1:1");
        setResolution(selectedModel.support?.quality?.default || "2K");
    }, [selectedModel?.key]);

    // ── References ────────────────────────────────────────────────────────────
    const [referenceImages, setReferenceImages] = useState([]);

    const handleAddReference = useCallback((asset, role = "normal") => {
        if (role === "normal") {
            const normalCount = referenceImages.filter(
                r => r.role === "normal" || !r.role
            ).length;
            if (normalCount >= maxRefs) return;
        }
        setReferenceImages(prev => {
            const cleaned = (["start", "end", "mc_image", "mc_video"].includes(role))
                ? prev.filter(r => r.role !== role)
                : prev;
            const type    = asset.is_video ? "video" : "image";
            return [...cleaned, { ...asset, role, type }];
        });
    }, [referenceImages, maxRefs]);

    const handleRemoveReference  = useCallback((index) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleClearReferences  = useCallback(() => {
        setReferenceImages([]);
    }, []);

    const handleSwapFrames = useCallback(() => {
        setReferenceImages(prev => {
            const hasStart = prev.some(r => r.role === "start");
            const hasEnd   = prev.some(r => r.role === "end");
            if (!hasStart && !hasEnd) return prev;
            return prev.map(r => {
                if (r.role === "start") return { ...r, role: "end"   };
                if (r.role === "end")   return { ...r, role: "start" };
                return r;
            });
        });
    }, []);

    // ── Upload from PC → Supabase → add as reference ──────────────────────────
    const handleUploadFromPC = useCallback(async (file, role = "normal") => {
        try {
            setUploading(true);

            const formData = new FormData();
            formData.append("file",       file);
            formData.append("project_id", projectId    || "");
            formData.append("session_id", activeSessionId || "");

            const res  = await fetch("/api/assets/upload", {
                method: "POST",
                body:   formData,
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);

            handleAddReference({
                url:      data.url,
                asset_id: data.asset_id,
                type:     data.type,
                is_video: data.type === "video",
            }, role);

        } catch (err) {
            console.error("❌ Upload failed:", err);
        } finally {
            setUploading(false);
        }
    }, [projectId, activeSessionId, handleAddReference]);

    // ── Set default model once loaded ─────────────────────────────────────────
    useEffect(() => {
        if (!model && studioModels.length > 0) {
            setModel({ id: studioModels[0].key });
        }
    }, [studioModels, model]);

    // ── Edit trigger ──────────────────────────────────────────────────────────
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

        setReferenceImages(
            params.references?.length > 0
                ? params.references.map(r => ({
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

    // ── Library ───────────────────────────────────────────────────────────────
    const combinedLibrary = useMemo(() => {
        return [...(assets || []), ...(allGenerations || [])];
    }, [allGenerations, assets]);

    // ── Reset ─────────────────────────────────────────────────────────────────
    const handleReset = useCallback(() => {
        setPrompt("");
        const defaultModel = studioModels[0];
        if (defaultModel) {
            setModel({ id: defaultModel.key });
            setResolution(defaultModel.support?.quality?.default || "2K");
            setRatio(defaultModel.support?.ratio?.default        || "1:1");
        }
        setCount(1);
        setDuration("5s");
        setVideoResolution("1080p");
        setReferenceImages([]);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
    }, [studioModels]);

    const hasChanges = prompt.trim().length > 0 || referenceImages.length > 0;

    // ── Generate ──────────────────────────────────────────────────────────────
    const handleGenerate = useCallback(async (e) => {
        if (e) e.preventDefault();
        if (!prompt.trim() || generating) return;

        setGenerationError(null);

        const isVideo = generationMode !== "image";

        const payload = {
            prompt,
            model:            model?.id || "nanobana_pro",
            model_name:       model?.id || "nanobana_pro",
            quality:          resolution,
            ratio,
            num_images:       count,
            duration,
            video_resolution: videoResolution,
            section:          isVideo ? "video_studio" : "image_generator",
            project_id:       isNewProject ? null : projectId,
            session_id:       isNewProject ? null : activeSessionId,
            references:       referenceImages.map(r => ({
                url:      r.url,
                asset_id: r.asset_id,
                role:     r.role  || "normal",
                type:     r.type  || "image",
            })),
        };

        console.log(`🚀 [Frontend] ${isVideo ? 'VIDEO' : 'IMAGE'} Payload:`, JSON.stringify(payload, null, 2));

        try {
            const res = await runGenerate({ payload, isVideo });

            // Sync project/session state if auto-created on the backend
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

            // Fine-grained invalidation for the specific project/session
            const finalProj = res.project_id || projectId;
            const finalSess = res.session_id  || activeSessionId;
            if (finalProj) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.assets.byProject(finalProj, finalSess),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.generations.byProject(finalProj, finalSess),
                });
            }

            setPrompt("");
            if (textareaRef.current) textareaRef.current.style.height = "auto";
            setEditTrigger(null);
        } catch {
            // Error is already handled by useGenerateMutation's onError
        }
    }, [
        prompt, generating, generationMode, model, resolution, ratio, count,
        duration, videoResolution, isNewProject, projectId, activeSessionId,
        referenceImages, runGenerate, setActiveSessionId, setEditTrigger, queryClient,
    ]);

    // ── Return ────────────────────────────────────────────────────────────────
    return {
        prompt,         setPrompt,
        model,          setModel,          selectedModel,
        studioModels,   studioModelsLoading,
        resolution,     setResolution,
        ratio,          setRatio,
        count,          setCount,
        duration,       setDuration,
        videoResolution, setVideoResolution,
        generationMode, setGenerationMode,
        textareaRef,
        referenceImages,
        handleAddReference,
        handleRemoveReference,
        handleClearReferences,
        handleSwapFrames,
        handleUploadFromPC,
        uploading,
        maxRefs,
        library:         combinedLibrary,
        libraryLoading:  allGenerationsLoading,
        libraryHasMore:  allGenerationsHasMore,
        generating,
        generationError,
        clearGenerationError: () => setGenerationError(null),
        handleGenerate,
        projectId,
        activeSessionId,
        handleReset,
        hasChanges,
    };
}