"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    useProjectData,
    useUpdateWorkflow,
    useAddMediaToCharacter,
    useRemoveMediaFromCharacter,
} from "@/features/workflows/api/workflowsApi";
import { useWorkflowDelete } from "@/features/workflows";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";
import { CharacterEditNavbar } from "@/widgets/CharacterEditNavbar/CharacterEditNavbar";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import {
    Loader2, Trash2, Edit2, Check, Copy, ChevronLeft,
    User, AlertCircle, Upload, X, FolderOpen, Volume2,
} from "lucide-react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function CharacterDetailPage() {
    const { projectId, workflowId } = useParams();
    const router = useRouter();

    const { data: projectData, isLoading } = useProjectData(projectId);
    const { isDeleteDialogOpen, setIsDeleteDialogOpen, promptDelete, confirmDelete, isDeleting } = useWorkflowDelete();
    const { mutateAsync: updateWorkflow } = useUpdateWorkflow();

    // ── Resolve workflow ──
    const workflow = React.useMemo(() => {
        const rawWorkflows = projectData?.projectContents?.workflows ?? [];
        const rawMedia     = projectData?.projectContents?.media ?? [];
        const found = rawWorkflows.find(
            (w) => w.id === workflowId || w.name === workflowId || (w.id || w.name) === workflowId
        );
        if (!found) return null;
        const targetId   = found.id || found.name;
        const targetName = found.name || found.id;
        const items = rawMedia
            .filter((m) => m.workflowId === targetId || m.workflowId === targetName || m.workflow_id === targetId)
            .map((m) => ({ ...m, id: m.id || m.name }));
        return { ...found, id: found.id || found.name, items };
    }, [projectData, workflowId]);

    // ── Display Title & Realtime Editing ──
    const displayTitle = React.useMemo(() => (
        workflow?.metadata?.displayName || workflow?.display_name || workflow?.name || "Untitled Character"
    ), [workflow]);

    const [draftTitle, setDraftTitle] = React.useState(displayTitle);
    const previousTitleRef = React.useRef(displayTitle);

    React.useEffect(() => {
        previousTitleRef.current = displayTitle;
        setDraftTitle(displayTitle);
    }, [displayTitle]);

    const handleSaveTitle = async (text) => {
        const wfId = workflow?.id || workflow?.name;
        console.log("🚀 [Character Rename] Triggered handleSaveTitle:", { rawInput: text, wfId, currentWorkflow: workflow });

        if (!wfId) {
            console.warn("⚠️ [Character Rename] Missing workflow ID!");
            return;
        }

        // Clean name (strip leading @ and trim whitespace)
        const cleanName = (text || "").replace(/^@+/, "").trim();
        const previousCleanName = (previousTitleRef.current || "").replace(/^@+/, "").trim();

        console.log("📝 [Character Rename] Cleaned name comparison:", { cleanName, previousCleanName });

        // 1. Revert if empty (never allow empty character name)
        if (!cleanName) {
            console.warn("⚠️ [Character Rename] Empty name rejected, reverting to:", previousTitleRef.current);
            setDraftTitle(previousTitleRef.current);
            return;
        }

        // 2. If name hasn't changed, restore formatted draft & exit
        if (cleanName === previousCleanName) {
            console.log("ℹ️ [Character Rename] Name unchanged, ignoring API call.");
            setDraftTitle(previousTitleRef.current);
            return;
        }

        const previousValue = previousTitleRef.current;

        try {
            console.log("📡 [Character Rename] Sending updateWorkflow payload to API:", {
                workflowId: wfId,
                workflowData: { display_name: cleanName },
            });

            const res = await updateWorkflow({
                workflowId: wfId,
                workflowData: {
                    display_name: cleanName,
                },
            });

            console.log("✅ [Character Rename] Server response received successfully:", res);
            previousTitleRef.current = cleanName;
        } catch (err) {
            console.error("❌ [Character Rename] Failed to save character title:", err);
            // Rollback to previous name if server API fails
            setDraftTitle(previousValue);
        }
    };

    const serverDescription = React.useMemo(() => (
        workflow?.character_info || workflow?.character?.character_info || workflow?.character?.description || workflow?.description || workflow?.metadata?.description || ""
    ), [workflow]);

    const [isEditingDesc, setIsEditingDesc] = React.useState(false);
    const [draftDesc, setDraftDesc]         = React.useState(serverDescription);

    React.useEffect(() => { setDraftDesc(serverDescription); }, [serverDescription]);

    const handleSaveDescription = async (text) => {
        setIsEditingDesc(false);
        const wfId = workflow?.id || workflow?.name;
        console.log("📝 [Character Info Save] Triggered handleSaveDescription:", { text, wfId });
        if (!wfId) return;

        try {
            console.log("📡 [Character Info Save] Sending updateWorkflow payload to API:", {
                workflowId: wfId,
                workflowData: { description: text.trim(), character_info: text.trim() },
            });
            const res = await updateWorkflow({
                workflowId: wfId,
                workflowData: {
                    description: text.trim(),
                    character_info: text.trim(),
                },
            });
            console.log("✅ [Character Info Save] Server response received:", res);
        } catch (err) {
            console.error("❌ [Character Info Save] Failed to save description/character_info:", err);
        }
    };

    // ── Features ──
    const features = React.useMemo(() => {
        const items = workflow?.items || [];
        const primary = items[0];
        const config  = primary?.generationConfig || {};
        return config.features || workflow?.metadata?.features || [];
    }, [workflow]);

    // ── Prompt ──
    const prompt = React.useMemo(() => {
        const items = workflow?.items || [];
        const primary = items[0];
        const config  = primary?.generationConfig || {};
        return config.prompt || workflow?.metadata?.prompt || "";
    }, [workflow]);

    const [promptCopied, setPromptCopied] = React.useState(false);
    const handleCopyPrompt = () => {
        if (!prompt) return;
        navigator.clipboard.writeText(prompt);
        setPromptCopied(true);
        setTimeout(() => setPromptCopied(false), 1800);
    };

    // ── Sheet images (RowsPhotoAlbum) ──
    const [imgDimensions, setImgDimensions] = React.useState({});

    const sheetPhotos = React.useMemo(() => {
        const items = (workflow?.items || []).filter(
            (m) => m.step_id !== "character_detail"
        );
        return items
            .map((item, idx) => {
                const url = item.url || item.file_url || item.asset?.file_url;
                if (!url) return null;
                const dims = imgDimensions[url];
                return {
                    src:    url,
                    width:  dims?.width  || 3,
                    height: dims?.height || 4,
                    key:    item.id || String(idx),
                    status: item.status,
                };
            })
            .filter(Boolean);
    }, [workflow, imgDimensions]);

    const [imageLoadError, setImageLoadError] = React.useState(false);
    React.useEffect(() => { setImageLoadError(false); }, [workflow]);

    const handleDownloadSheet = async () => {
        const src = sheetPhotos[0]?.src;
        if (!src) return;
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${(displayTitle || "character").toLowerCase().replace(/\s+/g, "_")}_sheet.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download image:", err);
            window.open(src, "_blank");
        }
    };

    React.useEffect(() => {
        (workflow?.items || []).forEach((item) => {
            const src = item.url || item.file_url || item.asset?.file_url;
            if (!src || imgDimensions[src]) return;
            const img = new window.Image();
            img.onload = () => setImgDimensions((prev) => ({
                ...prev,
                [src]: { width: img.naturalWidth || 1, height: img.naturalHeight || 1 },
            }));
            img.src = src;
        });
    }, [workflow]);

    const isProcessing = workflow?.status === "processing" || workflow?.status === "pending" || workflow?.status === "queued" || (sheetPhotos.length === 0 && !isLoading);
    const isFailed     = workflow?.status === "failed" || workflow?.status === "error";

    // ── Add Media to Character (Detail Images 1-5) ──
    const MAX_DETAIL_IMAGES = 5;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = (id) => id && UUID_REGEX.test(id);

    const addMediaMutation    = useAddMediaToCharacter();
    const removeMediaMutation = useRemoveMediaFromCharacter();
    const fileInputRef        = React.useRef(null);
    const assetsBtnRef        = React.useRef(null);

    const [addedDetailImages, setAddedDetailImages] = React.useState([]);
    const [pendingUrls, setPendingUrls]             = React.useState([]);
    const [deletingMediaId, setDeletingMediaId]     = React.useState(null);
    const [isAssetsOpen, setIsAssetsOpen]           = React.useState(false);
    const [activeTab, setActiveTab]                 = React.useState("sheet"); // "sheet" | "details"

    const handleSelectAssets = async (selectedItems) => {
        if (!selectedItems || !selectedItems.length) return;
        const remaining = MAX_DETAIL_IMAGES - displayDetailImages.length;
        if (remaining <= 0) return;

        const itemsToAdd = selectedItems.slice(0, remaining);
        const characterId = workflow?.id;

        for (const item of itemsToAdd) {
            const mediaId = item.id;
            const fallbackUrl = item.url || item.file_url || item.src;
            if (!mediaId && !fallbackUrl) continue;

            try {
                const payload = mediaId ? { characterId, mediaId, projectId } : { characterId, imageUrl: fallbackUrl, projectId };
                console.log("📡 [Detail Media Add] Sending mediaId payload to API:", payload);
                const res = await addMediaMutation.mutateAsync(payload);
                const createdMedia = res?.media;
                if (createdMedia) {
                    setAddedDetailImages((prev) => [createdMedia, ...prev]);
                }
            } catch (err) {
                console.error("❌ [Detail Media Add] Failed to add media asset by mediaId:", err);
            }
        }
    };

    const serverDetailImages = React.useMemo(() => {
        return (workflow?.items || []).filter(
            (m) => m.step_id === "character_detail"
        );
    }, [workflow]);

    const displayDetailImages = React.useMemo(() => {
        const set = new Set();
        const res = [];
        for (const item of [...addedDetailImages, ...serverDetailImages]) {
            const u = item.url || item.file_url;
            if (u && !set.has(u)) { set.add(u); res.push(item); }
        }
        return res;
    }, [addedDetailImages, serverDetailImages]);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const remaining = MAX_DETAIL_IMAGES - displayDetailImages.length;
        if (remaining <= 0) return;
        const filesToProcess = files.slice(0, remaining);
        const dataUrls = await Promise.all(
            filesToProcess.map((f) => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror  = () => resolve(null);
                reader.readAsDataURL(f);
            }))
        );
        const validUrls = dataUrls.filter(Boolean);
        if (!validUrls.length) return;
        if (fileInputRef.current) fileInputRef.current.value = "";

        // Optimistic: add images immediately so they appear in the gallery with a spinner
        const newRefs = validUrls.map((url, idx) => ({ id: String(Date.now() + idx), url, file_url: url }));
        setAddedDetailImages((prev) => [...newRefs, ...prev]);

        const characterId = workflow?.id;
        if (isValidUUID(characterId)) {
            setPendingUrls((prev) => [...prev, ...validUrls]);
            for (const url of validUrls) {
                try {
                    const res = await addMediaMutation.mutateAsync({ characterId, imageUrl: url, projectId });
                    // ✅ Swap the base64 URL to the real hosted URL so the image stays
                    // visible without any flicker. Deduplication handles removing the
                    // stale entry once serverDetailImages refreshes with the same URL.
                    const uploadedUrl = res?.media?.url;
                    if (uploadedUrl && uploadedUrl !== url) {
                        setAddedDetailImages((prev) =>
                            prev.map((r) =>
                                (r.url === url || r.file_url === url)
                                    ? { ...r, url: uploadedUrl, file_url: uploadedUrl }
                                    : r
                            )
                        );
                        // Also update pendingUrls key to the new URL so spinner stops
                        setPendingUrls((prev) => prev.filter((u) => u !== url));
                    } else {
                        // Fallback: remove optimistic entry and let server refresh take over
                        setAddedDetailImages((prev) => prev.filter((r) => (r.url || r.file_url) !== url));
                    }
                } catch (err) {
                    console.error("Failed to add character media:", err);
                    // Rollback optimistic entry on error
                    setAddedDetailImages((prev) => prev.filter((r) => (r.url || r.file_url) !== url));
                } finally {
                    setPendingUrls((prev) => prev.filter((u) => u !== url));
                }
            }
        }
    };

    const handleDeleteDetailImage = async (item) => {
        const url = item.url || item.file_url;
        const mediaId = item.id;
        setAddedDetailImages((prev) => prev.filter((r) => (r.url || r.file_url) !== url));
        const characterId = workflow?.id;
        if (isValidUUID(mediaId) && isValidUUID(characterId)) {
            setDeletingMediaId(mediaId);
            try {
                await removeMediaMutation.mutateAsync({ characterId, mediaId, projectId });
            } catch (err) {
                console.error("Failed to remove character media:", err);
            } finally {
                setDeletingMediaId(null);
            }
        }
    };

    // Detail image dimensions for RowsPhotoAlbum
    const [detailDims, setDetailDims] = React.useState({});
    React.useEffect(() => {
        displayDetailImages.forEach((item) => {
            const src = item.url || item.file_url;
            if (!src || detailDims[src]) return;
            const img = new window.Image();
            img.onload = () => setDetailDims((prev) => ({ ...prev, [src]: { width: img.naturalWidth || 1, height: img.naturalHeight || 1 } }));
            img.src = src;
        });
    }, [displayDetailImages]);

    const detailPhotos = React.useMemo(() => {
        return displayDetailImages.map((item, idx) => {
            const src = item.url || item.file_url;
            const dims = detailDims[src];
            return { src, width: dims?.width || 4, height: dims?.height || 3, key: item.id || String(idx), ref: item };
        }).filter((p) => p.src);
    }, [displayDetailImages, detailDims]);

    // Redirect if not found
    React.useEffect(() => {
        if (!isLoading && !workflow && projectData)
            router.replace(`/cinema-studio/${projectId}/characters`);
    }, [isLoading, workflow, projectData, router, projectId]);

    if (isLoading) return <LoadingScreen />;
    if (!workflow)  return null;

    return (
        <div className="flex flex-col h-full w-full bg-studio-dark text-white overflow-hidden">
            <CharacterEditNavbar
                workflow={workflow}
                onDeleteCharacter={() => promptDelete({
                    id: workflow.id || workflow.name,
                    projectId,
                    workflowType: "CHARACTER",
                })}
            />

            {/* ── SCROLLABLE BODY ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pt-[70px] pb-16 custom-scrollbar">
                <div className="px-6 lg:px-[45px] pt-4">

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full max-w-7xl mx-auto">
                        
                        {/* ══ LEFT SIDEBAR: TITLE, VOICE & CHARACTER INFO ══ */}
                        <div className="lg:col-span-5 flex flex-col gap-5">
                            
                            {/* Editable Character Name Input */}
                            <Input
                                prefix="@"
                                placeholder="Character Name"
                                value={draftTitle}
                                onChange={(e) => setDraftTitle(e.target.value)}
                                onBlur={() => handleSaveTitle(draftTitle)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.currentTarget.blur();
                                    }
                                }}
                                className="text-[2rem] leading-[2.5rem] font-normal text-white"
                                containerClassName="w-full"
                            />

                            {/* Character Info Box */}
                            <Textarea
                                label="Character Info"
                                labelExtra="(optional)"
                                placeholder="Describe how your character acts..."
                                value={draftDesc}
                                onChange={(e) => setDraftDesc(e.target.value)}
                                onBlur={() => handleSaveDescription(draftDesc)}
                                minHeight={160}
                                maxHeight={300}
                                hint="The Flow agent can use this information to help craft scenes with your character."
                                containerClassName="pt-1"
                            />

                            {/* Additional metadata tags (Features / Prompt) if available */}
                            {(features.length > 0 || prompt) && (
                                <div className="flex flex-col gap-3 pt-3 mt-1">
                                    {features.length > 0 && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-semibold text-white/70">Features</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {features.map((f, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs bg-white/5 text-white/80">
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {prompt && (
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-white/70">Prompt</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    onClick={handleCopyPrompt}
                                                    className="text-white/40 hover:text-white"
                                                >
                                                    {promptCopied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                                                </Button>
                                            </div>
                                            <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{prompt}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ══ RIGHT SIDE: MEDIA VIEWER WITH FLOATING TABS (SHEET / DETAILS) ══ */}
                        <div className="lg:col-span-7 flex flex-col gap-3 relative">
                            <div className="relative w-full rounded-2xl overflow-hidden bg-black/60 min-h-[460px] max-h-[580px] flex items-center justify-center p-4">

                                {/* View A: Character Sheet */}
                                {activeTab === "sheet" && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        {isProcessing && sheetPhotos.length === 0 ? (
                                            <div className="flex flex-col items-center gap-3 py-16">
                                                <Loader2 className="size-8 text-violet-400 animate-spin" />
                                                <p className="text-white/50 text-sm">Generating character sheet…</p>
                                                <p className="text-white/25 text-xs">3-view turnaround in progress</p>
                                            </div>
                                        ) : isFailed && sheetPhotos.length === 0 ? (
                                            <div className="flex items-center justify-center gap-3 py-16 text-red-400">
                                                <AlertCircle className="size-5 text-red-400/60" />
                                                <p className="text-white/40 text-sm">Generation failed</p>
                                            </div>
                                        ) : sheetPhotos.length > 0 && !imageLoadError ? (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="relative inline-flex max-w-full max-h-[520px] rounded-xl overflow-hidden group/sheet">
                                                    <img
                                                        src={sheetPhotos[0].src}
                                                        alt="Character Sheet 3-View Turnaround"
                                                        onError={() => setImageLoadError(true)}
                                                        className="w-auto h-auto max-h-[520px] max-w-full object-contain rounded-xl"
                                                    />

                                                    {/* Top-Right Floating Overlay Action Buttons anchored to image (visible on hover) */}
                                                    <div className="absolute top-3 right-3 flex items-center gap-2 z-30 opacity-0 group-hover/sheet:opacity-100 transition-opacity duration-200">
                                                        <Button
                                                            type="button"
                                                            variant="flow-overlay-action"
                                                            size="icon"
                                                            onClick={handleDownloadSheet}
                                                            title="Download character sheet"
                                                        >
                                                            <GoogleIcon iconName="download" className="text-[1.25rem]" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="flow-overlay-action"
                                                            size="icon"
                                                            onClick={() => promptDelete({
                                                                id: workflow.id || workflow.name,
                                                                projectId,
                                                                workflowType: "CHARACTER",
                                                            })}
                                                            title="Delete character"
                                                        >
                                                            <GoogleIcon iconName="delete" className="text-[1.25rem]" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-2 py-16 text-white/40">
                                                <AlertCircle className="size-8 text-white/30" />
                                                <p className="text-sm italic">No sheet image available</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* View B: Character Details Gallery */}
                                {activeTab === "details" && (
                                    <div className="w-full h-full flex flex-col gap-3 overflow-y-auto custom-scrollbar p-1 max-h-[540px]">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        
                                        {/* Sticky Header with Action Buttons & Count — Only visible when detail media exists */}
                                        {displayDetailImages.length > 0 && (
                                            <div className="sticky top-0 z-20 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/70 backdrop-blur-xl border border-white/10 shrink-0">
                                                <span className="text-xs font-medium text-white/70 pl-1">
                                                    Detail Images <span className="text-white/40 font-normal">({displayDetailImages.length}/{MAX_DETAIL_IMAGES})</span>
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        ref={assetsBtnRef}
                                                        onClick={() => displayDetailImages.length < MAX_DETAIL_IMAGES && setIsAssetsOpen((prev) => !prev)}
                                                        variant="user-menu-filled"
                                                        size="sm"
                                                        disabled={displayDetailImages.length >= MAX_DETAIL_IMAGES}
                                                        title={displayDetailImages.length >= MAX_DETAIL_IMAGES ? `Maximum ${MAX_DETAIL_IMAGES} detail images reached` : "Select from assets"}
                                                        className="h-8 text-xs px-3"
                                                    >
                                                        <FolderOpen className="size-3.5" /> Assets
                                                    </Button>
                                                    <Button
                                                        onClick={() => displayDetailImages.length < MAX_DETAIL_IMAGES && fileInputRef.current?.click()}
                                                        variant="user-menu-filled"
                                                        size="sm"
                                                        disabled={displayDetailImages.length >= MAX_DETAIL_IMAGES}
                                                        title={displayDetailImages.length >= MAX_DETAIL_IMAGES ? `Maximum ${MAX_DETAIL_IMAGES} detail images reached` : "Upload image"}
                                                        className="h-8 text-xs px-3"
                                                    >
                                                        <Upload className="size-3.5" /> Upload
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {detailPhotos.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full p-1 overflow-y-auto custom-scrollbar">
                                                {detailPhotos.map((photo) => {
                                                    const mediaId = photo.ref?.id;
                                                    const isDeletingThis = deletingMediaId === mediaId;
                                                    const isAddingThis   = pendingUrls.includes(photo.src);
                                                    const isLoadingThis  = isDeletingThis || isAddingThis;
                                                    return (
                                                        <div
                                                            key={photo.key}
                                                            className="group/card relative overflow-hidden rounded-xl bg-zinc-900 border border-white/10 w-full aspect-[4/3] flex items-center justify-center shrink-0"
                                                        >
                                                            <img
                                                                src={photo.src}
                                                                alt="Character detail"
                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105 rounded-xl"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/25 transition-colors duration-200" />

                                                            {!isLoadingThis && (
                                                                <Button
                                                                    type="button"
                                                                    variant="studio-overlay-icon"
                                                                    size="icon-xs"
                                                                    onClick={() => handleDeleteDetailImage(photo.ref)}
                                                                    className="absolute top-2 right-2 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity"
                                                                    title="Remove image"
                                                                >
                                                                    <X className="size-3.5 stroke-[2.5]" />
                                                                </Button>
                                                            )}
                                                            {isLoadingThis && (
                                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex items-center justify-center">
                                                                    <Loader2 className="size-6 text-white animate-spin" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="relative w-full h-[360px] overflow-hidden rounded-2xl bg-[oklch(26.9%_0_0)] px-6 flex items-center justify-center group">
                                                <div className="flex flex-col items-center gap-4 text-center">
                                                    <div className="relative h-20 w-16">
                                                        {[
                                                            "https://www.krea.ai/_app/2ef422f246a7f9e2/immutable/assets/face_3.BsghTrki.webp",
                                                            "https://www.krea.ai/_app/2ef422f246a7f9e2/immutable/assets/face_2.D1RW4rY-.webp",
                                                            "https://www.krea.ai/_app/2ef422f246a7f9e2/immutable/assets/face_1.Cndx8lVo.webp"
                                                        ].map((src, i) => {
                                                            const transforms = ["-translate-x-10 -translate-y-2 -rotate-12", "translate-x-10 -translate-y-1 rotate-12", ""];
                                                            return (
                                                                <div key={i} style={{ zIndex: i }} className={`absolute top-0 h-20 w-16 overflow-hidden rounded-xl border-2 border-white bg-black/25 shadow-lg backdrop-blur-md transition-transform duration-500 ease-out group-hover:scale-105 ${transforms[i]}`}>
                                                                    <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${src}")` }} />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="flex max-w-xs flex-col items-center gap-1">
                                                        <h3 className="text-base font-medium tracking-tight text-white">Add detail images to this character</h3>
                                                        <p className="text-white/45 text-xs leading-relaxed">Upload multiple images from different angles for better results.</p>
                                                    </div>

                                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                                        <Button
                                                            type="button"
                                                            variant="studio-white"
                                                            size="sm"
                                                            onClick={() => displayDetailImages.length < MAX_DETAIL_IMAGES && fileInputRef.current?.click()}
                                                            className="rounded-full text-xs font-semibold px-5"
                                                        >
                                                            <Upload className="w-3.5 h-3.5" />
                                                            Upload
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="user-menu-outline"
                                                            size="sm"
                                                            onClick={() => displayDetailImages.length < MAX_DETAIL_IMAGES && setIsAssetsOpen(true)}
                                                            className="rounded-full text-xs font-semibold px-5"
                                                        >
                                                            <FolderOpen className="w-3.5 h-3.5" />
                                                            Select from assets
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>

                            {/* ── FLOATING BUTTONS (Google Flow Style) ── */}
                            <div className="flex gap-2.5 justify-center items-center pt-3">
                                {/* Button 1: Body Sheet */}
                                <Button
                                    type="button"
                                    variant={activeTab === "sheet" ? "flow-pill-active" : "flow-pill"}
                                    size="flow"
                                    onClick={() => setActiveTab("sheet")}
                                    aria-label="Body Sheet"
                                >
                                    <div className={`size-8 rounded-md overflow-hidden shrink-0 flex items-center justify-center ${
                                        activeTab === "sheet" ? "bg-white" : "bg-[#38383c]"
                                    }`}>
                                        {sheetPhotos[0]?.src && !imageLoadError ? (
                                            <img
                                                src={sheetPhotos[0].src}
                                                alt="Body Sheet"
                                                onError={() => setImageLoadError(true)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <GoogleIcon iconName="portrait" className={`text-[1.2rem] ${activeTab === "sheet" ? "text-black" : "text-white"}`} />
                                        )}
                                    </div>
                                    <span className="font-medium pr-1">Body Sheet</span>
                                </Button>

                                {/* Button 2: More Details */}
                                <Button
                                    type="button"
                                    variant={activeTab === "details" ? "flow-pill-active" : "flow-pill"}
                                    size="flow"
                                    onClick={() => setActiveTab("details")}
                                    aria-label="More Details"
                                >
                                    <div className={`size-8 rounded-md overflow-hidden shrink-0 flex items-center justify-center ${
                                        activeTab === "details" ? "bg-white text-black" : "bg-[#38383c] text-white"
                                    }`}>
                                        {detailPhotos[0]?.src ? (
                                            <img src={detailPhotos[0].src} alt="More Details" className="w-full h-full object-cover" />
                                        ) : (
                                            <GoogleIcon iconName="accessibility_new" className="text-[1.2rem]" />
                                        )}
                                    </div>
                                    <span className="font-medium pr-1">More Details</span>
                                </Button>
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {/* Delete Dialog */}
            <ConfirmDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Character"
                description="This will permanently delete this character and all its generated images. Are you sure?"
                confirmLabel="Delete Character"
                cancelLabel="Cancel"
                loading={isDeleting}
                onConfirm={async () => {
                    await confirmDelete(projectId);
                    router.push(`/cinema-studio/${projectId}/characters`);
                }}
            />

            {/* Assets Import Popover (Same component used in Prompt Bar) */}
            <ImportMediaPopover
                open={isAssetsOpen}
                onOpenChange={setIsAssetsOpen}
                onSelect={handleSelectAssets}
                library={projectData?.projectContents?.media || []}
                variant="asset-select"
                mode="image"
                maxAllowed={Math.max(1, MAX_DETAIL_IMAGES - displayDetailImages.length)}
                anchorRef={assetsBtnRef}
            />
        </div>
    );
}
