import React from "react";
import { cn } from "@/shared/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePromptBar } from "../../model/usePromptBar";
import { usePromptStore } from "../../model/usePromptStore";
import { PromptBarBase } from "./PromptBarBase";
import { Row1 } from "./Row1";
import { Row2 } from "./Row2";
import { DragDropOverlay } from "./DragDropOverlay";
import { PromptTextarea } from "../common/PromptTextarea";
import { ModeSelector } from "../common/selectors/ModeSelector";
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";
import { QualitySelector } from "../common/selectors/QualitySelector";
import { RatioSelector } from "../common/selectors/RatioSelector";
import { VariationSelector } from "../common/selectors/VariationSelector";
import { DurationSelector } from "../common/selectors/DurationSelector";
import { VideoResolutionSelector } from "../common/selectors/VideoResolutionSelector";

export default function PromptBar({ hideBackground = false, isNewProject = false, initialMode = null }) {
    const s = usePromptBar({ isNewProject });
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [internalMode, setInternalMode] = React.useState('image');
    const [targetRole, setTargetRole] = React.useState('normal');
    const [variationsOpen, setVariationsOpen] = React.useState(false);
    const [mentionCallback, setMentionCallback] = React.useState(null);
    const isDraggingGalleryItem = usePromptStore(s => s.isDraggingGalleryItem);
    const draggedItem = usePromptStore(s => s.draggedItem);

    // ─── Drag Error Calculation ──────────────────────────────────────────────
    const dragError = React.useMemo(() => {
        if (!isDraggingGalleryItem || !draggedItem) return null;

        const isVideo = draggedItem.is_video || (draggedItem.url?.toLowerCase().endsWith('.mp4') || draggedItem.url?.toLowerCase().endsWith('.webm'));
        
        // 1. Video check
        if (isVideo && s.generationMode === 'image') {
            return "We cannot handle dropping videos at this time";
        }

        // 2. Limit check (for simple modes)
        if (s.generationMode !== 'keyframe' && s.referenceImages.length >= s.maxRefs) {
            return `Reference limit reached (max ${s.maxRefs})`;
        }

        return null;
    }, [isDraggingGalleryItem, draggedItem, s.generationMode, s.referenceImages.length, s.maxRefs]);

    // ─── Drop Handlers ───────────────────────────────────────────────────────
    const handleGalleryDrop = (role) => {
        if (!draggedItem || dragError) return;
        
        // Add to project references
        s.handleAddReference(draggedItem, role);

        // Cleanup global drag state
        usePromptStore.getState().setIsDraggingGalleryItem(false);
        usePromptStore.getState().setDraggedItem(null);
    };

    const isFirstRun = React.useRef(true);
    const containerRef = React.useRef(null);
    const paperclipRef = React.useRef(null);

    // Sync initialMode on first mount only
    React.useEffect(() => {
        if (isFirstRun.current && initialMode) {
            isFirstRun.current = false;
            if (s.generationMode !== initialMode) {
                s.setGenerationMode(initialMode);
            }
        }
    }, [initialMode, s.generationMode, s.setGenerationMode]);

    // Settings panel close listener
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setVariationsOpen(false);
            }
        };
        if (variationsOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [variationsOpen]);

    const openDialog = (mode = 'image', role = 'normal', callback = null) => {
        if (dialogOpen && targetRole === role && internalMode === mode && !callback) {
            setDialogOpen(false);
            setMentionCallback(null);
            return;
        }
        setInternalMode(mode);
        setTargetRole(role);
        setMentionCallback(() => callback);
        setDialogOpen(true);
        s.handleOpenLibrary?.(mode);
    };

    return (
        // ── Outer wrapper: handles positioning (fixed vs inline) ──────────────
        <div
            ref={containerRef}
            className={cn(
                hideBackground
                    ? "relative w-full flex flex-col"
                    : "fixed bottom-8 left-1/2 -translate-x-1/2 w-full z-50 flex items-center justify-center px-6"
            )}
        >
            {/* ── Width constraint ─────────────────────────────────────────── */}
            <div
                className="w-full flex flex-col items-end justify-end "
                style={{ maxWidth: hideBackground ? undefined : "550px" }}
            >
                {isDraggingGalleryItem ? (
                    /* ── Raw overlay — no card wrapper ────────────── */
                    <DragDropOverlay 
                        mode={s.generationMode} 
                        onDrop={handleGalleryDrop}
                        error={dragError}
                    />
                ) : (
                    /* ── Visual card normal ────────────────────────── */
                    <div className="relative w-full flex flex-col border border-white/5 shadow-[0px_16px_32px_-8px_rgba(0,0,0,0.4)] backdrop-blur-[80px] bg-[#161718e6] rounded-2xl overflow-hidden min-h-[60px]">
                        <div className="w-full flex flex-col">
                            {/* ── Settings Panel ───────────────────────────────────── */}
                            <AnimatePresence>
                                {variationsOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="w-full flex flex-col overflow-hidden"
                                    >
                                        <div className="px-4 py-4 flex flex-col gap-2">
                                            <ModeSelector value={s.generationMode} onChange={s.setGenerationMode} />
                                            <RatioSelector
                                                value={s.ratio}
                                                onChange={s.setRatio}
                                                options={s.selectedModel?.support?.ratio?.options || s.selectedModel?.support?.ratio}
                                            />
                                            <VariationSelector value={s.count} onChange={s.setCount} />
                                            {s.generationMode === 'image' ? (
                                                <QualitySelector
                                                    value={s.resolution}
                                                    onChange={s.setResolution}
                                                    options={s.selectedModel?.support?.quality?.options || s.selectedModel?.support?.quality}
                                                    className="!w-full !bg-white/5 !rounded-2xl"
                                                />
                                            ) : (s.selectedModel?.support?.resolution && (
                                                <VideoResolutionSelector
                                                    value={s.videoResolution}
                                                    onChange={s.setVideoResolution}
                                                    options={s.selectedModel?.support?.resolution?.options || s.selectedModel?.support?.resolution}
                                                    className="!w-full !bg-white/5 !rounded-2xl"
                                                />
                                            ))}
                                            {(s.generationMode === 'keyframe' || s.generationMode === 'multiref') && (
                                                <DurationSelector
                                                    value={s.duration}
                                                    onChange={s.setDuration}
                                                    options={s.selectedModel?.support?.duration}
                                                    className="!w-full !bg-white/5 !rounded-2xl"
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* ── Reference Images Row ──────────────────────────────── */}
                            <AnimatePresence>
                                {(s.referenceImages.length > 0 || s.generationMode === 'keyframe' || s.generationMode === 'motion-control') && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="w-full overflow-hidden"
                                    >
                                        <div className="p-2" onPointerDown={() => setVariationsOpen(false)}>
                                            <Row1
                                                referenceImages={s.referenceImages}
                                                generationMode={s.generationMode}
                                                selectedModel={s.selectedModel}
                                                onRemoveReference={s.handleRemoveReference}
                                                onSwapFrames={s.handleSwapFrames}
                                                handleUploadFromPC={s.handleUploadFromPC}
                                                maxRefs={s.maxRefs}
                                                openDialog={openDialog}
                                                showAddButton={false}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* ── Prompt input area (form wrapper) ─────────────────── */}
                            <PromptBarBase 
                                s={s} 
                                className="p-3 gap-1.5"
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (e.dataTransfer?.files?.length > 0) {
                                        const role = ['keyframe', 'motion-control'].includes(s.generationMode) ? 'mc_image' : 'normal';
                                        Array.from(e.dataTransfer.files).forEach(file => {
                                            s.handleUploadFromPC?.(file, role);
                                        });
                                    }
                                }}
                            >
                                <div className="flex flex-col w-full gap-1.5">
                                    <div onPointerDown={() => setVariationsOpen(false)}>
                                        <PromptTextarea
                                            value={s.prompt}
                                            onChange={s.setPrompt}
                                            onSubmit={s.handleGenerate}
                                            textareaRef={s.textareaRef}
                                            referenceImages={s.referenceImages}
                                            onTriggerMentionDialog={
                                                ['image', 'multiref'].includes(s.generationMode)
                                                    ? (cb) => openDialog('image', 'normal', cb)
                                                    : undefined
                                            }
                                        />
                                    </div>

                                    <Row2
                                        paramsProps={{
                                            model: s.model,
                                            selectedModel: s.selectedModel,
                                            studioModels: s.studioModels,
                                            studioModelsLoading: s.studioModelsLoading,
                                            setModel: s.setModel,
                                            generationMode: s.generationMode,
                                            setGenerationMode: s.setGenerationMode,
                                        }}
                                        actionProps={{
                                            generating: s.generating,
                                            onSubmit: s.handleGenerate,
                                            prompt: s.prompt,
                                        }}
                                        onToggleVariations={() => setVariationsOpen(prev => !prev)}
                                        variationsOpen={variationsOpen}
                                        mediaOpen={dialogOpen}
                                        paperclipRef={paperclipRef}
                                        onAddClick={() => dialogOpen ? setDialogOpen(false) : openDialog('image', 'normal')}
                                    />
                                </div>
                            </PromptBarBase>
                        </div>
                    </div>
                )}
            </div>
            {/* ── Import Media Popover ──────────────────────────────────────── */}
            <ImportMediaPopover
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                anchorRef={paperclipRef}
                maxAllowed={
                    targetRole === 'normal' 
                        ? Math.max(0, s.maxRefs - s.referenceImages.length) 
                        : 1
                }
                onSelect={(assets) => {
                    const items = Array.isArray(assets) ? assets : [assets];
                    items.forEach(asset => s.handleAddReference(asset, targetRole));
                    
                    if (mentionCallback) {
                        mentionCallback(items);
                    }
                    setDialogOpen(false);
                    setMentionCallback(null);
                }}
                onUploadFromPC={(files) => {
                    const items = Array.isArray(files) ? files : [files];
                    items.forEach(file => s.handleUploadFromPC?.(file, targetRole));
                    
                    if (mentionCallback && files.length > 0) {
                        // Normally upload returns local blob/URL structures, we can pass them
                        mentionCallback(items);
                    }
                    setDialogOpen(false);
                    setMentionCallback(null);
                }}
                library={s.library}
                loading={s.libraryLoading}
                hasMore={s.libraryHasMore}
                onLoadMore={s.handleLoadMoreAssets}
                mode={internalMode}
                assetSource={s.assetSource}
                setAssetSource={s.setAssetSource}
            />
        </div>
    );
}