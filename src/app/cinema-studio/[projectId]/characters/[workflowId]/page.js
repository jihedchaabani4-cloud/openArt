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
import { EditableDisplayName } from "@/shared/ui/EditableDisplayName";
import { UserDropdown } from "@/widgets/StudioNavbar/ui/UserDropdown";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
    Loader2, Trash2, Edit2, Check, Copy, ChevronLeft,
    User, AlertCircle, Upload, X,
} from "lucide-react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";

// ─────────────────────────────────────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────────────────────────────────────
function CharacterDetailNavbar({ workflow, onDeleteCharacter }) {
    const { projectId } = useParams();
    const router = useRouter();
    const { mutateAsync: updateWorkflow } = useUpdateWorkflow();

    const displayTitle = React.useMemo(() => (
        workflow?.metadata?.displayName ||
        workflow?.display_name ||
        workflow?.name ||
        "Untitled Character"
    ), [workflow]);

    const handleEditWorkflowName = async (nextName) => {
        const workflowId = workflow?.id || workflow?.name;
        if (!workflowId) return;
        await updateWorkflow({ workflowId, workflowData: { display_name: nextName } });
    };

    return (
        <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 left-0 w-full z-50 flex items-center h-16 px-6 border-b border-white/5 bg-black/40 backdrop-blur-xl"
        >
            <div className="flex items-center gap-1">
                <button
                    onClick={() => router.push(`/cinema-studio/${projectId}/characters`)}
                    className="flex items-center gap-1 text-white/50 hover:text-white transition-colors duration-200 mr-3 group"
                >
                    <ChevronLeft className="size-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
                    <span className="text-sm font-normal">Characters</span>
                </button>
                <span className="text-white/20 mx-1">/</span>
                <div className="flex items-center gap-2">
                    <span className="size-6 rounded-md bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                        <User className="size-3.5 text-violet-400" />
                    </span>
                    <EditableDisplayName
                        value={displayTitle}
                        onSave={handleEditWorkflowName}
                        className="text-white text-sm font-medium max-w-[280px]"
                    />
                </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs" className="size-8 text-white/50 hover:text-white">
                            <GoogleIcon name="more_vert" className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[160px]">
                        <DropdownMenuItem
                            onClick={onDeleteCharacter}
                            className="text-red-400 hover:text-red-300 focus:text-red-300"
                        >
                            <Trash2 className="size-3.5 mr-2" />
                            Delete Character
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <UserDropdown />
            </div>
        </motion.nav>
    );
}

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

    // ── Description (editable) ──
    const serverDescription = React.useMemo(() => (
        workflow?.metadata?.description || workflow?.description || ""
    ), [workflow]);

    const [isEditingDesc, setIsEditingDesc] = React.useState(false);
    const [draftDesc, setDraftDesc]         = React.useState(serverDescription);

    React.useEffect(() => { setDraftDesc(serverDescription); }, [serverDescription]);

    const handleSaveDescription = async (text) => {
        setIsEditingDesc(false);
        const wfId = workflow?.id || workflow?.name;
        if (!wfId) return;
        try {
            await updateWorkflow({
                workflowId: wfId,
                workflowData: { metadata: { ...workflow?.metadata, description: text.trim() } },
            });
        } catch (err) {
            console.error("Failed to save description:", err);
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

    const [addedDetailImages, setAddedDetailImages] = React.useState([]);
    const [pendingUrls, setPendingUrls]             = React.useState([]);
    const [deletingMediaId, setDeletingMediaId]     = React.useState(null);

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

        const newRefs = validUrls.map((url, idx) => ({ id: String(Date.now() + idx), url, file_url: url }));
        setAddedDetailImages((prev) => [...newRefs, ...prev]);

        const characterId = workflow?.id;
        if (isValidUUID(characterId)) {
            setPendingUrls((prev) => [...prev, ...validUrls]);
            for (const url of validUrls) {
                try {
                    await addMediaMutation.mutateAsync({ characterId, imageUrl: url, projectId });
                } catch (err) {
                    console.error("Failed to add character media:", err);
                    setAddedDetailImages((prev) => prev.filter((r) => r.url !== url));
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
            <CharacterDetailNavbar
                workflow={workflow}
                onDeleteCharacter={() => promptDelete({
                    id: workflow.id || workflow.name,
                    projectId,
                    workflowType: "CHARACTER",
                })}
            />

            {/* ── SCROLLABLE BODY ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pt-[70px] pb-16 custom-scrollbar">
                <div className="px-[45px] flex flex-col gap-6 pt-4">

                    {/* ══ 1. THREE-COLUMN METADATA HEADER ══ */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pb-6 mb-2">

                        {/* Col 1: Description */}
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white">Description</span>
                            </div>
                            {isEditingDesc ? (
                                <div className="group relative w-full min-w-0 p-[0.5px]">
                                    <textarea
                                        autoFocus
                                        value={draftDesc}
                                        onChange={(e) => setDraftDesc(e.target.value)}
                                        onBlur={() => handleSaveDescription(draftDesc)}
                                        rows={2}
                                        placeholder="Describe your character's personality, backstory, and appearance…"
                                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex field-sizing-content rounded-md border bg-transparent py-1.5 shadow-xs outline-none disabled:opacity-50 text-xs font-normal text-white/60 placeholder:text-foreground/45 ring-ring/50! min-h-[2lh] max-h-[5lh] overflow-y-auto custom-scrollbar w-full resize-none border-none px-1.5 py-0.5! leading-relaxed ring-0 transition-all focus-visible:ring-[0.5px] disabled:cursor-wait"
                                    />
                                </div>
                            ) : serverDescription ? (
                                <p
                                    className="text-white/60 text-xs leading-relaxed font-normal cursor-text hover:text-white/70 transition-colors"
                                    onClick={() => { setDraftDesc(serverDescription); setIsEditingDesc(true); }}
                                >
                                    {serverDescription}
                                </p>
                            ) : (
                                <p
                                    className="text-white/35 text-xs leading-relaxed font-normal italic cursor-pointer hover:text-white/50 transition-colors"
                                    onClick={() => { setDraftDesc(""); setIsEditingDesc(true); }}
                                >
                                    Click to add a character description…
                                </p>
                            )}
                        </div>

                        {/* Col 2: Features */}
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white">Features</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {Array.isArray(features) && features.length > 0 ? (
                                    features.map((f, i) => (
                                        <span
                                            key={i}
                                            data-slot="badge"
                                            className="inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border border-white/10 px-2 py-0.5 text-xs font-book backdrop-blur-md bg-white/5 text-white/80 hover:text-white cursor-pointer hover:bg-white/10 transition-colors"
                                        >
                                            {f}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-white/35 text-xs leading-relaxed font-normal italic">
                                        No features specified.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Col 3: Prompt */}
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white">Prompt</span>
                                {prompt && (
                                    <button
                                        type="button"
                                        onClick={handleCopyPrompt}
                                        className="h-6 w-6 p-0 flex items-center justify-center text-white/40 hover:text-white transition-colors rounded"
                                        title="Copy prompt"
                                    >
                                        {promptCopied
                                            ? <Check className="size-3.5 text-emerald-400" />
                                            : <Copy className="size-3.5" />
                                        }
                                    </button>
                                )}
                            </div>
                            {prompt ? (
                                <p className="text-white/60 text-xs leading-relaxed font-normal">
                                    {prompt}
                                </p>
                            ) : (
                                <p className="text-white/35 text-xs leading-relaxed font-normal italic">
                                    No prompt available.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ══ 2. SHEET IMAGES GALLERY ══ */}
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-white">
                                    {sheetPhotos.length} Image{sheetPhotos.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>

                        {/* Processing */}
                        {isProcessing && sheetPhotos.length === 0 && (
                            <div className="relative flex items-center justify-center h-[260px] w-full border border-dashed border-white/10 rounded-xl bg-white/[0.02] overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-950/15 via-transparent to-indigo-950/15" />
                                <div className="relative z-10 flex flex-col items-center gap-3">
                                    <Loader2 className="size-6 text-violet-400 animate-spin" />
                                    <p className="text-white/50 text-sm">Generating character sheet…</p>
                                    <p className="text-white/25 text-xs">3-view turnaround in progress</p>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-transparent via-violet-500/70 to-transparent w-1/4"
                                        animate={{ x: ["-100%", "500%"] }}
                                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Failed */}
                        {isFailed && sheetPhotos.length === 0 && (
                            <div className="flex items-center justify-center gap-3 h-[160px] w-full border border-dashed border-red-500/20 rounded-xl bg-red-950/10">
                                <AlertCircle className="size-5 text-red-400/60" />
                                <p className="text-white/40 text-sm">Generation failed</p>
                            </div>
                        )}

                        {/* Images gallery — same RowsPhotoAlbum as Element page */}
                        {sheetPhotos.length > 0 && (
                            <div className="w-full">
                                <RowsPhotoAlbum
                                    photos={sheetPhotos}
                                    targetRowHeight={200}
                                    spacing={1}
                                    rowConstraints={{ singleRowMaxHeight: 420 }}
                                    render={{
                                        photo: (_, { photo, width, height }) => (
                                            <div
                                                key={photo.key}
                                                style={{ width, height }}
                                                className="group/card relative overflow-hidden cursor-zoom-in bg-zinc-900"
                                            >
                                                <img
                                                    src={photo.src}
                                                    alt="Character sheet view"
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/20 transition-colors duration-200" />
                                            </div>
                                        ),
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* ══ 3. ADD MEDIA DETAILS SECTION (Bottom Gallery 1-5) ══ */}
                    <div className="flex flex-col gap-4 pt-10 mt-2 border-t border-white/10">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs font-medium text-white uppercase tracking-wider">
                                Add your generated media
                            </p>
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
                                    onClick={() => displayDetailImages.length < MAX_DETAIL_IMAGES && fileInputRef.current?.click()}
                                    variant="user-menu-filled"
                                    size="sm"
                                    disabled={displayDetailImages.length >= MAX_DETAIL_IMAGES}
                                    title={displayDetailImages.length >= MAX_DETAIL_IMAGES ? `Maximum ${MAX_DETAIL_IMAGES} detail images reached` : "Upload image"}
                                >
                                    <Upload className="size-3.5" /> Upload
                                </Button>
                            </div>
                        </div>

                        {detailPhotos.length > 0 ? (
                            <div className="w-full">
                                <RowsPhotoAlbum
                                    photos={detailPhotos}
                                    targetRowHeight={200}
                                    spacing={1}
                                    rowConstraints={{ singleRowMaxHeight: 380 }}
                                    render={{
                                        photo: (_, { photo, width, height }) => {
                                            const mediaId = photo.ref?.id;
                                            const isDeletingThis = deletingMediaId === mediaId;
                                            const isAddingThis   = pendingUrls.includes(photo.src);
                                            const isLoadingThis  = isDeletingThis || isAddingThis;
                                            return (
                                                <div
                                                    key={photo.key}
                                                    style={{ width, height }}
                                                    className="group/card relative overflow-hidden bg-zinc-900"
                                                >
                                                    <img
                                                        src={photo.src}
                                                        alt="Character detail"
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/20 transition-colors duration-200" />

                                                    {/* Delete button */}
                                                    {!isLoadingThis && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteDetailImage(photo.ref)}
                                                            className="absolute top-2 right-2 z-20 size-6 rounded-full bg-white text-black hover:bg-white/90 shadow-md flex items-center justify-center cursor-pointer opacity-0 group-hover/card:opacity-100 transition-opacity duration-200"
                                                            title="Remove image"
                                                        >
                                                            <X className="size-3.5 stroke-[2.5]" />
                                                        </button>
                                                    )}
                                                    {/* Loading spinner */}
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
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center gap-2 h-[120px] w-full border border-dashed border-white/15 text-white/30 text-sm cursor-pointer hover:border-white/25 hover:text-white/50 transition-all duration-200 rounded-lg"
                            >
                                <Upload className="size-4" /> Upload detail images
                            </div>
                        )}
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
        </div>
    );
}
