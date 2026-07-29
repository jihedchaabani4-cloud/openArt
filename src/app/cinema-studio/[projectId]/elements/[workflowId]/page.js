"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkflowsStore } from "@/features/workflows";
import { useProjectData, useSetPrimaryMedia, useAnalyzeElementVision, useAddImageToElement, useDeleteMediaItem, useUpdateElementMetadata } from "@/features/workflows/api/workflowsApi";
import { useWorkflowDelete } from "@/features/workflows";
import { ElementEditNavbar } from "@/widgets/ElementEditNavbar/ElementEditNavbar";
import { useEditStore } from "@/features/prompt-bar/model/useEditStore";
import { useElementStore } from "@/features/prompt-bar/model/useElementStore";
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";
import { buildElementSheetDraft, ELEMENT_TYPES } from "@/features/workflows/model/elementSheetConfig";
import { getPrimaryMedia, getItemMetadata } from "@/shared/lib/generationUtils";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
import { ImportMediaDialog } from "@/widgets/ImportMediaDialog/ImportMediaDialog";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Plus, Sparkles, Loader2, X, Upload, Tag, BookOpen, Trash2, Edit2, Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";

export default function ElementWorkflowEditPage() {
    const { projectId, workflowId } = useParams();
    const router = useRouter();

    const { activeSessionId } = useWorkflowsStore();
    const setEditTarget      = useEditStore((s) => s.setEditTarget);
    const resetEditStore     = useEditStore((s) => s.resetEditStore);
    const hydrateElementDraft = useElementStore((s) => s.hydrateElementDraft);
    const addReference        = useElementStore((s) => s.addReference);
    const resetElementStore   = useElementStore((s) => s.resetElementStore);
    const resetPromptStore    = usePromptStore((s)  => s.resetPromptStore);
    const setGenerationMode   = usePromptStore((s)  => s.setGenerationMode);
    const setModelId          = usePromptStore((s)  => s.setModelId);
    const setRatio            = usePromptStore((s)  => s.setRatio);
    const setQuality          = usePromptStore((s)  => s.setQuality);
    const setVideoResolution  = usePromptStore((s)  => s.setVideoResolution);
    const setPrimaryMediaMutation = useSetPrimaryMedia();
    const [isAssetsOpen, setIsAssetsOpen] = React.useState(false);
    const [addedReferences, setAddedReferences] = React.useState([]);
    const [deletingMediaId, setDeletingMediaId] = React.useState(null);
    const [pendingAddingUrls, setPendingAddingUrls] = React.useState([]);
    const fileInputRef = React.useRef(null);
    const addImageMutation = useAddImageToElement();
    const deleteMediaItemMutation = useDeleteMediaItem();
    const updateMetadataMutation = useUpdateElementMetadata();

    const { isDeleteDialogOpen, setIsDeleteDialogOpen, promptDelete, confirmDelete, isDeleting } = useWorkflowDelete();

    const { data: projectData, isLoading } = useProjectData(projectId);

    // Current element workflow
    const workflow = React.useMemo(() => {
        const rawWorkflows = projectData?.projectContents?.workflows ?? [];
        const rawMedia     = projectData?.projectContents?.media ?? [];
        const found = rawWorkflows.find((w) => (w.id || w.name) === workflowId || w.id === workflowId || w.name === workflowId);
        if (!found) return null;
        const targetWfId = found.id || found.name;
        const targetWfName = found.name || found.id;
        const items = rawMedia
            .filter((m) => m.workflowId === targetWfId || m.workflowId === targetWfName || m.workflow_id === targetWfId || m.workflow_id === targetWfName)
            .map((m) => ({ ...m, asset_id: m.name || m.id, workflowStepId: m.workflowStepId || m.asset_type || "generation" }));
        return { ...found, id: found.id || found.name, items };
    }, [projectData, workflowId]);

    const serverType = workflow?.element_type || workflow?.element?.element_type || workflow?.metadata?.elementType || (workflow?.tags || []).find(t => ["object", "style", "font", "logo"].includes(t)) || "object";
    const currentTypeConfig = ELEMENT_TYPES.find((t) => t.id === serverType) || ELEMENT_TYPES[0];

    const serverKeywords = React.useMemo(() => {
        const kw = workflow?.keywords || workflow?.element?.keywords || workflow?.metadata?.keywords || [];
        return Array.isArray(kw) ? kw : [];
    }, [workflow]);

    const serverGuidelines = React.useMemo(() => {
        const raw = workflow?.guidelines ?? workflow?.element?.guidelines ?? workflow?.metadata?.guidelines ?? "";
        let str = "";
        if (Array.isArray(raw)) {
            str = raw.map(g => String(g).trim()).filter(g => Boolean(g) && g !== "[]").join("\n");
        } else {
            str = String(raw || "").trim();
        }
        if (str === "[]" || str === '[""]') return "";
        return str;
    }, [workflow]);

    const [keywords, setKeywords] = React.useState([]);
    const [guidelines, setGuidelines] = React.useState("");

    const [isEditingGuidelines, setIsEditingGuidelines] = React.useState(false);
    const [guidelineDraftText, setGuidelineDraftText] = React.useState("");

    React.useEffect(() => {
        setKeywords(serverKeywords);
    }, [serverKeywords]);

    React.useEffect(() => {
        setGuidelines(serverGuidelines);
    }, [serverGuidelines]);

    const handleSaveGuidelinesText = async (textToSave) => {
        const cleanText = textToSave.trim();
        setGuidelines(cleanText);
        setIsEditingGuidelines(false);

        const targetWorkflowId = workflow?.id || workflow?.name;
        if (targetWorkflowId) {
            try {
                await updateMetadataMutation.mutateAsync({
                    workflowId: targetWorkflowId,
                    projectId,
                    guidelines: cleanText,
                });
            } catch (err) {
                console.error("Failed to save guidelines", err);
                setGuidelines(serverGuidelines);
            }
        }
    };

    // Photos formatted with actual aspect ratio for RowsPhotoAlbum
    const photos = React.useMemo(() => {
        const rawWorkflows = projectData?.projectContents?.workflows || [];
        const rawMedia = projectData?.projectContents?.media || [];

        const workflowPhotos = rawWorkflows
            .filter((wf) => wf.workflow_type !== "ELEMENT_SHEET")
            .reduce((acc, wf, i) => {
                const items = rawMedia
                    .filter((m) => m.workflowId === wf.name || m.workflowId === wf.id)
                    .map((m) => ({ ...m, id: m.id || m.name }));
                const withItems = { ...wf, items };
                const primary = getPrimaryMedia(withItems);
                if (!primary) return acc;

                const meta = getItemMetadata(primary, withItems);
                const aspect = meta?.aspect || "3/4";
                const [wStr, hStr] = aspect.split("/");
                const wNum = parseFloat(wStr) || 3;
                const hNum = parseFloat(hStr) || 4;
                const BASE = 1200;
                const width = Math.round(BASE * (wNum / Math.max(wNum, hNum)));
                const height = Math.round(BASE * (hNum / Math.max(wNum, hNum)));

                const url = meta?.url || primary.url || primary.file_url || primary.asset?.file_url;
                if (!url) return acc;

                const label = wf.metadata?.displayName || wf.display_name || wf.name || "Untitled";

                acc.push({
                    src: url,
                    width,
                    height,
                    key: wf.id || wf.name || String(i),
                    workflow: withItems,
                    thumbUrl: url,
                    label,
                });
                return acc;
            }, []);

        const mediaPhotos = rawMedia
            .filter((m) => (m.url || m.file_url || m.src) && m.workflow_type !== "ELEMENT_SHEET")
            .map((m, i) => {
                const url = m.url || m.file_url || m.src;
                return {
                    src: url,
                    width: 1200,
                    height: 900,
                    key: m.id || m.name || `media-${i}`,
                    workflow: { id: m.workflowId || m.id, items: [m] },
                    thumbUrl: url,
                    label: m.name || "Media Item",
                };
            });

        const combined = [...workflowPhotos];
        const seen = new Set(combined.map((p) => p.src));
        for (const p of mediaPhotos) {
            if (!seen.has(p.src)) {
                seen.add(p.src);
                combined.push(p);
            }
        }
        return combined;
    }, [projectData]);

    // Draft data (references + taste profile)
    const draft = React.useMemo(() => {
        if (!workflow) return null;
        const primary = getPrimaryMedia(workflow);
        return primary ? buildElementSheetDraft(workflow, primary) : null;
    }, [workflow]);

    // Extract references: try multiple paths where they can be stored
    const references = React.useMemo(() => {
        if (!workflow) return [];

        // 1. From buildElementSheetDraft (reads primaryConfig.references)
        if (draft?.references?.length > 0) return draft.references;

        // 2. From any item's generationConfig.references
        for (const item of (workflow.items || [])) {
            const refs = item?.generationConfig?.references || item?.params?.references || [];
            if (refs.length > 0) return refs;
        }

        // 3. Fallback: use workflow.items directly (each item is a reference image)
        return (workflow.items || []).map((item) => {
            const meta = getItemMetadata(item);
            return { ...item, url: meta.url, is_video: meta.isVideo };
        }).filter((item) => item.url);
    }, [workflow, draft]);

    const displayReferences = React.useMemo(() => {
        const set = new Set();
        const res = [];
        for (const item of [...addedReferences, ...references]) {
            const u = item.url || item.file_url || item.src;
            if (u && !set.has(u)) {
                set.add(u);
                res.push(item);
            }
        }
        return res;
    }, [references, addedReferences]);

    // Load real natural dimensions for each reference image so RowsPhotoAlbum renders correct aspect ratios
    const [refDimensions, setRefDimensions] = React.useState({});

    React.useEffect(() => {
        displayReferences.forEach((ref) => {
            const src = ref.url || ref.file_url || ref.image_url || ref.src || ref.asset?.file_url || ref.mediaUrl || "";
            if (!src || refDimensions[src]) return;
            const img = new window.Image();
            img.onload = () => {
                setRefDimensions((prev) => ({
                    ...prev,
                    [src]: { width: img.naturalWidth || 1, height: img.naturalHeight || 1 },
                }));
            };
            img.src = src;
        });
    }, [displayReferences]);

    const referencePhotos = React.useMemo(() => {
        return displayReferences.map((ref, idx) => {
            const src = ref.url || ref.file_url || ref.image_url || ref.src || ref.asset?.file_url || ref.mediaUrl || "";
            const isVid = ref.is_video || ref.type === "video" || src?.toLowerCase().endsWith(".mp4") || src?.toLowerCase().endsWith(".webm");
            const dims = refDimensions[src];
            return {
                key: ref.asset_id || ref.id || String(idx),
                src,
                width:  dims?.width  || 4,
                height: dims?.height || 3,
                isVid,
                ref,
            };
        }).filter((p) => p.src);
    }, [displayReferences, refDimensions]);


    const MAX_REFS = 6;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = (id) => id && UUID_REGEX.test(id);

    const handleAddMediaToElement = async (photo) => {
        if (!photo?.src) return;
        if (displayReferences.length >= MAX_REFS) return;
        const src = photo.src;
        const newRef = {
            asset_id: photo.key || String(Date.now()),
            url: src,
            file_url: src,
            type: "image",
        };
        setAddedReferences((prev) => {
            if (prev.some((r) => r.url === src)) return prev;
            return [newRef, ...prev];
        });
        addReference(newRef);

        // Persist to backend — only if elementId is a real UUID
        const elementId = workflow?.id;
        if (isValidUUID(elementId)) {
            setPendingAddingUrls((prev) => [...prev, src]);
            try {
                const res = await addImageMutation.mutateAsync({ elementId, imageUrl: src, projectId });
                if (res?.media?.url) {
                    const uploadedUrl = res.media.url;
                    setAddedReferences((prev) =>
                        prev.map((r) => ((r.url === src || r.file_url === src) ? { ...r, url: uploadedUrl, file_url: uploadedUrl } : r))
                    );
                }
            } catch (err) {
                console.error("[ElementEditPage] Failed to add image to element:", err);
                // Rollback optimistic addition if backend save fails
                setAddedReferences((prev) => prev.filter((r) => (r.url || r.file_url || r.src) !== src));
            } finally {
                setPendingAddingUrls((prev) => prev.filter((u) => u !== src));
            }
        }
    };

    const handleSelectAssets = async (selectedItems) => {
        if (!selectedItems || !selectedItems.length) return;
        const remaining = MAX_REFS - displayReferences.length;
        if (remaining <= 0) return;
        const newRefs = selectedItems
            .slice(0, remaining)
            .map((item) => ({
                asset_id: item.id || item.name || String(Date.now()),
                url: item.url || item.file_url || item.src,
                file_url: item.url || item.file_url || item.src,
                type: "image",
            })).filter((r) => r.url);

        setAddedReferences((prev) => [...newRefs, ...prev]);
        const elementId = workflow?.id;

        const urlsToAdd = newRefs.map((r) => r.url);
        if (isValidUUID(elementId) && urlsToAdd.length > 0) {
            setPendingAddingUrls((prev) => [...prev, ...urlsToAdd]);
        }

        for (const r of newRefs) {
            addReference(r);
            if (isValidUUID(elementId)) {
                try {
                    const res = await addImageMutation.mutateAsync({ elementId, imageUrl: r.url, projectId });
                    if (res?.media?.url) {
                        const uploadedUrl = res.media.url;
                        setAddedReferences((prev) =>
                            prev.map((item) => ((item.url === r.url || item.file_url === r.url) ? { ...item, url: uploadedUrl, file_url: uploadedUrl } : item))
                        );
                    }
                } catch (err) {
                    console.error("[ElementEditPage] Failed to add selected asset:", err);
                    // Rollback optimistic addition if backend save fails
                    setAddedReferences((prev) => prev.filter((item) => (item.url || item.file_url || item.src) !== r.url));
                } finally {
                    setPendingAddingUrls((prev) => prev.filter((u) => u !== r.url));
                }
            }
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remaining = MAX_REFS - displayReferences.length;
        if (remaining <= 0) return;

        const filesToProcess = files.slice(0, remaining);

        // Read files to base64 Data URLs
        const dataUrls = await Promise.all(
            filesToProcess.map((f) => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(f);
            }))
        );

        const validUrls = dataUrls.filter(Boolean);
        if (!validUrls.length) return;

        // Reset file input value so same files can be re-uploaded if needed
        if (fileInputRef.current) fileInputRef.current.value = "";

        // Optimistically add to displayReferences
        const newRefs = validUrls.map((url, idx) => ({
            asset_id: String(Date.now() + idx),
            url,
            file_url: url,
            type: "image",
        }));

        setAddedReferences((prev) => [...newRefs, ...prev]);

        const elementId = workflow?.id;
        if (isValidUUID(elementId)) {
            setPendingAddingUrls((prev) => [...prev, ...validUrls]);
        }

        for (const url of validUrls) {
            addReference({ url, file_url: url, type: "image" });
            if (isValidUUID(elementId)) {
                try {
                    const res = await addImageMutation.mutateAsync({ elementId, imageUrl: url, projectId });
                    if (res?.media?.url) {
                        const uploadedUrl = res.media.url;
                        setAddedReferences((prev) =>
                            prev.map((item) => ((item.url === url || item.file_url === url) ? { ...item, url: uploadedUrl, file_url: uploadedUrl } : item))
                        );
                    }
                } catch (err) {
                    console.error("[ElementEditPage] Failed to upload local image:", err);
                    // Rollback optimistic addition if backend upload fails
                    setAddedReferences((prev) => prev.filter((item) => (item.url || item.file_url || item.src) !== url));
                } finally {
                    setPendingAddingUrls((prev) => prev.filter((u) => u !== url));
                }
            }
        }
    };

    const handleDeleteReferenceMedia = async (e, photo) => {
        e.stopPropagation();

        // 1. If this is the LAST reference image, prompt user to confirm full element deletion
        if (referencePhotos.length <= 1) {
            if (workflow?.id || workflow?.name) {
                promptDelete({
                    id: workflow.id || workflow.name,
                    projectId,
                    workflowType: "ELEMENT_SHEET",
                });
            }
            return;
        }

        // 2. Otherwise, delete the single media record
        const src = photo.src;
        const mediaId = photo.ref?.id || photo.ref?.name || photo.key;

        // Optimistic local state update
        setAddedReferences((prev) => prev.filter((r) => (r.url || r.file_url || r.src) !== src));

        if (mediaId && isValidUUID(mediaId)) {
            setDeletingMediaId(mediaId);
            try {
                await deleteMediaItemMutation.mutateAsync({ mediaId, projectId });
            } catch (err) {
                console.error("[ElementEditPage] Failed to delete media item:", err);
            } finally {
                setDeletingMediaId(null);
            }
        }
    };

    const [analyzedTasteProfile, setAnalyzedTasteProfile] = React.useState(null);
    const analyzeVisionMutation = useAnalyzeElementVision();

    const serverDescription = React.useMemo(() => {
        return workflow?.description || workflow?.element?.description || workflow?.metadata?.description || draft?.dna?.description || "";
    }, [workflow, draft]);

    const activeTasteProfile = analyzedTasteProfile || serverDescription || null;

    const handleAnalyzeVision = async () => {
        const rawUrls = displayReferences.map((r) => r.url || r.file_url || r.src).filter(Boolean);
        
        // Convert to Base64 in the browser to avoid server-side fetch CORS or blob:// issues
        const base64Urls = await Promise.all(
            rawUrls.map(async (url) => {
                if (url.startsWith("data:")) return url;
                try {
                    const res = await fetch(url);
                    const blob = await res.blob();
                    return await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } catch (err) {
                    console.warn("[ElementEditPage] Client failed to convert image to base64, falling back to raw url:", err);
                    return url;
                }
            })
        );

        try {
            const res = await analyzeVisionMutation.mutateAsync({
                projectId,
                workflowId: workflow.id || workflow.name,
                imageUrls: base64Urls.filter(Boolean),
            });
            if (res?.description) {
                setAnalyzedTasteProfile(res.description);
            }
            if (res?.keywords && Array.isArray(res.keywords)) {
                setKeywords(res.keywords);
            }
        } catch (err) {
            console.error("Failed to analyze element vision:", err);
        }
    };

    // Redirect if not found
    React.useEffect(() => {
        if (!isLoading && !workflow && projectData)
            router.replace(`/cinema-studio/${projectId}/elements`);
    }, [isLoading, workflow, projectData, router, projectId]);

    // Hydrate stores
    React.useEffect(() => {
        if (!workflow || !draft) return;
        const primary = getPrimaryMedia(workflow);
        if (!primary) return;
        const meta = getItemMetadata(primary);
        const sessionId = workflow.metadata?.sessionId ?? activeSessionId ?? null;

        setEditTarget({
            project_id: projectId, session_id: sessionId,
            workflow_id: workflow.id || workflow.name, workflow_type: workflow.workflow_type,
            media_id: primary?.id || primary?.name, media_status: meta.status,
            primaryMediaId: draft.primaryMediaId ?? workflow.metadata?.primaryMediaId,
            primaryMediaUrl: draft.primaryMediaUrl ?? null,
            primaryGenerationConfig: draft.promptConfig ?? null,
            dna: draft.dna ?? null, elementMode: draft.mode ?? "character",
            isElementSheet: true, url: meta.url,
            ratio: draft.promptConfig?.ratio || meta.ratioStr || "1:1",
            quality: draft.promptConfig?.quality || "standard",
            videoResolution: draft.promptConfig?.videoResolution || "1080p",
            prompt: "", isVideo: meta.isVideo ?? false,
        });
        hydrateElementDraft({ mode: draft.mode, prompt: "", references: draft.references, features: draft.features });
        setGenerationMode(draft.isVideo ? "video" : "image");
        if (draft.promptConfig?.model)           setModelId(draft.promptConfig.model);
        if (draft.promptConfig?.ratio)           setRatio(draft.promptConfig.ratio);
        if (draft.promptConfig?.quality)         setQuality(draft.promptConfig.quality);
        if (draft.promptConfig?.videoResolution) setVideoResolution(draft.promptConfig.videoResolution);

        return () => { resetEditStore(); resetElementStore(); resetPromptStore(); };
    }, [
        workflow, draft, activeSessionId, hydrateElementDraft, projectId,
        resetEditStore, resetElementStore, resetPromptStore,
        setEditTarget, setGenerationMode, setModelId, setQuality, setRatio, setVideoResolution,
    ]);

    if (isLoading) return <LoadingScreen />;
    if (!workflow)  return null;

    return (
        <div className="flex flex-col h-full w-full bg-studio-dark text-white overflow-hidden">
            <ElementEditNavbar
                workflow={workflow}
                elementTypeConfig={currentTypeConfig}
                serverType={serverType}
                activeTasteProfile={activeTasteProfile}
                analyzeVisionMutation={analyzeVisionMutation}
                handleAnalyzeVision={handleAnalyzeVision}
                onDeleteElement={() => promptDelete({ id: workflow.id || workflow.name, projectId, workflowType: "ELEMENT_SHEET" })}
            />

            {/* ── SCROLLABLE BODY ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pt-[70px] pb-16 custom-scrollbar">
                <div className="px-[45px] flex flex-col gap-6 pt-4">

                    {/* ── 1. THREE-COLUMN METADATA HEADER (Taste Profile | Keywords | Guidelines) — Shown only when data exists or analysis is running ── */}
                    {(analyzeVisionMutation.isPending || !!activeTasteProfile || (Array.isArray(keywords) && keywords.length > 0) || !!guidelines) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pb-6 mb-2">
                        {/* Column 1: Taste Profile */}
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white">Taste Profile</span>
                            </div>
                            {analyzeVisionMutation.isPending ? (
                                <div className="space-y-2 py-1 animate-pulse">
                                    <div className="h-2.5 bg-white/10 rounded-full w-full" />
                                    <div className="h-2.5 bg-white/10 rounded-full w-[96%]" />
                                    <div className="h-2.5 bg-white/10 rounded-full w-[88%]" />
                                    <div className="h-2.5 bg-white/10 rounded-full w-[94%]" />
                                    <div className="h-2.5 bg-white/10 rounded-full w-[85%]" />
                                    <div className="h-2.5 bg-white/10 rounded-full w-[90%]" />
                                </div>
                            ) : activeTasteProfile ? (
                                <p className="text-white/60 text-xs leading-relaxed font-normal">
                                    {activeTasteProfile}
                                </p>
                            ) : (
                                <p className="text-white/35 text-xs leading-relaxed font-normal italic">
                                    No vision profile generated yet.
                                </p>
                            )}
                        </div>

                        {/* Column 2: Keywords (Read-only from LLM Vision Analysis) */}
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-white">Keywords</span>
                                    {keywords.length > 0 && !analyzeVisionMutation.isPending && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => {
                                                navigator.clipboard.writeText(keywords.join(", "));
                                            }}
                                            className="h-6 w-6 p-0 text-white/40 hover:text-white"
                                            title="Copy keywords"
                                        >
                                            <Copy className="size-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {analyzeVisionMutation.isPending ? (
                                    <div className="flex flex-wrap items-center gap-1.5 w-full animate-pulse">
                                        <div className="h-6 w-20 bg-white/10 rounded-md" />
                                        <div className="h-6 w-28 bg-white/10 rounded-md" />
                                        <div className="h-6 w-24 bg-white/10 rounded-md" />
                                        <div className="h-6 w-16 bg-white/10 rounded-md" />
                                        <div className="h-6 w-24 bg-white/10 rounded-md" />
                                        <div className="h-6 w-18 bg-white/10 rounded-md" />
                                        <div className="h-6 w-28 bg-white/10 rounded-md" />
                                    </div>
                                ) : keywords.length > 0 ? (
                                    keywords.map((kw) => (
                                        <span
                                            key={kw}
                                            data-slot="badge"
                                            className="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border border-white/10 px-2 py-0.5 text-xs font-book transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3 [a&]:hover:bg-accent [a&]:hover:text-accent-foreground backdrop-blur-md bg-white/5 text-white/80 hover:text-white cursor-pointer hover:bg-white/10"
                                        >
                                            {kw}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-white/35 text-xs leading-relaxed font-normal italic">
                                        No keywords extracted yet.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Column 3: Guidelines (User-Managed Plain Text Instructions) */}
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white">Guidelines</span>
                                {!isEditingGuidelines && guidelines && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() => {
                                            setGuidelineDraftText(guidelines);
                                            setIsEditingGuidelines(true);
                                        }}
                                        className="h-6 w-6 p-0 text-white/40 hover:text-white"
                                        title="Edit guidelines"
                                    >
                                        <Edit2 className="size-3.5" />
                                    </Button>
                                )}
                            </div>

                            {isEditingGuidelines ? (
                                <div className="group relative w-full min-w-0 p-[0.5px]">
                                    <textarea
                                        autoFocus
                                        data-slot="textarea"
                                        value={guidelineDraftText}
                                        onChange={(e) => setGuidelineDraftText(e.target.value)}
                                        onBlur={() => handleSaveGuidelinesText(guidelineDraftText)}
                                        maxLength={10049}
                                        rows={2}
                                        placeholder="Add instructions and keywords that guide the generation process when using this element. For example: 'Use a warm color palette, add film grain'."
                                        aria-label="Element guidelines"
                                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content rounded-md border bg-transparent py-1.5 shadow-xs outline-none disabled:opacity-50 text-xs md:text-xs font-normal text-white/60 placeholder:text-foreground/45 ring-ring/50! min-h-[2lh] max-h-[5lh] overflow-y-auto custom-scrollbar w-full resize-none border-none px-1.5 py-0.5! text-xs leading-relaxed ring-0 transition-all focus-visible:ring-[0.5px] disabled:cursor-wait"
                                    />
                                </div>
                            ) : guidelines ? (
                                <p className="text-white/60 text-xs leading-relaxed font-normal whitespace-pre-wrap">
                                    {guidelines}
                                </p>
                            ) : (
                                <div
                                    onClick={() => {
                                        setGuidelineDraftText("");
                                        setIsEditingGuidelines(true);
                                    }}
                                    className="cursor-pointer group"
                                >
                                    <p className="text-white/40 text-xs leading-relaxed font-normal group-hover:text-white/60 transition-colors">
                                        Add instructions and keywords that guide the generation process when using this element.<br />
                                        For example: <span className="italic text-white/30 group-hover:text-white/40">'Use a warm color palette, add film grain'.</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {/* ── 2. IMAGES GALLERY ── */}
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-white">
                                    {displayReferences.length} Image{displayReferences.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <Button
                                    onClick={() => displayReferences.length < MAX_REFS && fileInputRef.current?.click()}
                                    variant="user-menu-filled"
                                    size="sm"
                                    disabled={displayReferences.length >= MAX_REFS}
                                    title={displayReferences.length >= MAX_REFS ? "Maximum 6 reference images reached" : "Upload local image"}
                                >
                                    <Upload className="size-3.5" /> Upload
                                </Button>
                            </div>
                        </div>

                        {referencePhotos.length > 0 ? (
                            <div className="w-full">
                                <RowsPhotoAlbum
                                    photos={referencePhotos}
                                    targetRowHeight={200}
                                    spacing={1}
                                    rowConstraints={{ singleRowMaxHeight: 320 }}
                                    render={{
                                        photo: (_, { photo, width, height }) => {
                                            const mediaId = photo.ref?.id || photo.ref?.name || photo.key;
                                            const isDeletingThis = deletingMediaId === mediaId;
                                            const isAddingThis = pendingAddingUrls.includes(photo.src);
                                            const isLoadingThis = isDeletingThis || isAddingThis;

                                            const isAnalyzing = analyzeVisionMutation.isPending;

                                            return (
                                                <div
                                                    key={photo.key}
                                                    style={{ width, height }}
                                                    className="group/card relative overflow-hidden cursor-zoom-in bg-zinc-900"
                                                >
                                                    {photo.isVid ? (
                                                        <video
                                                            src={photo.src}
                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                                                            muted playsInline
                                                        />
                                                    ) : (
                                                        <img
                                                            src={photo.src}
                                                            alt={`ref-${photo.key}`}
                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                                                        />
                                                    )}

                                                    {/* Scanning Shimmer Overlay during Vision AI Analysis */}
                                                    {isAnalyzing && (
                                                        <div className="animate-shimmer pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent z-10" />
                                                    )}

                                                    <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/20 transition-colors duration-200" />

                                                    {/* Delete button (White circle with dark X) - hidden while loading or analyzing */}
                                                    {!isLoadingThis && !isAnalyzing && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleDeleteReferenceMedia(e, photo)}
                                                            className="absolute top-2 right-2 z-20 size-6 rounded-full bg-white text-black hover:bg-white/90 shadow-md flex items-center justify-center cursor-pointer opacity-0 group-hover/card:opacity-100 transition-opacity duration-200"
                                                            title={referencePhotos.length <= 1 ? "Delete element" : "Remove image"}
                                                        >
                                                            <X className="size-3.5 stroke-[2.5]" />
                                                        </button>
                                                    )}

                                                    {/* Loading spinner overlay when adding or deleting */}
                                                    {isLoadingThis && (
                                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex items-center justify-center">
                                                            <Loader2 className="size-6 text-white animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        },
                                    }}
                                />
                            </div>
                        ) : (
                            <div onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 h-[120px] w-full border border-dashed border-white/15 text-white/30 text-sm cursor-pointer hover:border-white/25 hover:text-white/50 transition-all duration-200 rounded-lg">
                                <Upload className="size-4" /> Upload reference image
                            </div>
                        )}
                    </div>



                    {/* ── 3. PROJECT GENERATIONS GALLERY ── */}
                    {photos.length > 0 && (
                        <div className="flex flex-col gap-4 pt-10 mt-6 border-t border-white/10">
                            <p className="text-xs font-medium text-white uppercase tracking-wider">Add your generated media</p>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="w-full"
                            >
                                <RowsPhotoAlbum
                                    photos={photos}
                                    targetRowHeight={340}
                                    spacing={1}
                                    rowConstraints={{ singleRowMaxHeight: 500 }}
                                    render={{
                                        photo: (_, { photo, width, height }) => {
                                            const wf = photo.workflow;
                                            const isAdded = displayReferences.some(
                                                (r) => (r.url || r.file_url || r.src) === photo.src
                                            );
                                            const isFull = displayReferences.length >= MAX_REFS;
                                            const isDisabled = isAdded || isFull;
                                            return (
                                                <div
                                                    key={photo.key}
                                                    style={{ width, height }}
                                                    className={`relative group overflow-hidden bg-zinc-900 ${
                                                        isDisabled ? "cursor-default" : "cursor-pointer"
                                                    }`}
                                                    onClick={() => !isDisabled && handleAddMediaToElement(photo)}
                                                >
                                                    <img
                                                        src={photo.src}
                                                        alt={photo.label}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />

                                                    {isAdded ? (
                                                        /* White pill: Added in center on hover */
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-black shadow-lg">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                Added
                                                            </div>
                                                        </div>
                                                    ) : isFull ? (
                                                        /* White pill: Max reached in center on hover */
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-black shadow-lg">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                Max reached
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* Hover "+" button */
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                                                                <Plus className="w-5 h-5 text-black" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-200 ${isAdded ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}>
                                                        <p className="text-xs text-white font-medium truncate">{photo.label}</p>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    }}
                                />
                            </motion.div>
                        </div>
                    )}

                </div>
            </div>

            {/* Delete Dialog */}
            <ConfirmDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Element"
                description="Deleting the last image will permanently delete this element and its workflow. Are you sure?"
                confirmLabel="Delete Element"
                cancelLabel="Cancel"
                loading={isDeleting}
                onConfirm={async () => {
                    await confirmDelete(projectId);
                    router.push(`/cinema-studio/${projectId}/elements`);
                }}
            />

            <ImportMediaDialog
                open={isAssetsOpen}
                onOpenChange={setIsAssetsOpen}
                onSelect={handleSelectAssets}
                library={projectData?.projectContents?.media || []}
                mode="image"
                maxAllowed={10}
            />
        </div>
    );
}
