import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePromptBar } from "../../model/usePromptBar";
import { usePromptStore } from "../../model/usePromptStore";
import { PromptBarBase } from "./PromptBarBase";
import { Row1 } from "./Row1";
import { Row2 } from "./Row2";
import { DragDropOverlay } from "./DragDropOverlay";
import { PromptBarShell } from "../common/PromptBarShell";
import { PromptTextarea } from "../common/PromptTextarea";
import { ModeSelector } from "../common/selectors/ModeSelector";
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";
import { QualitySelector } from "../common/selectors/QualitySelector";
import { RatioSelector } from "../common/selectors/RatioSelector";
import { VariationSelector } from "../common/selectors/VariationSelector";
import { DurationSelector } from "../common/selectors/DurationSelector";
import { VideoResolutionSelector } from "../common/selectors/VideoResolutionSelector";
import { VscSettings, VscChromeClose } from "react-icons/vsc";


export default function PromptBar({ hideBackground = false, isNewProject = false, initialMode = null }) {
    const s = usePromptBar({ isNewProject });
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [internalMode, setInternalMode] = React.useState("image");
    const [targetRole, setTargetRole] = React.useState("normal");
    const [variationsOpen, setVariationsOpen] = React.useState(false);
    const [mentionCallback, setMentionCallback] = React.useState(null);
    const isDraggingGalleryItem = usePromptStore((state) => state.isDraggingGalleryItem);
    const draggedItem = usePromptStore((state) => state.draggedItem);

    const dragError = React.useMemo(() => {
        if (!isDraggingGalleryItem || !draggedItem) return null;

        const isVideo =
            draggedItem.is_video ||
            draggedItem.url?.toLowerCase().endsWith(".mp4") ||
            draggedItem.url?.toLowerCase().endsWith(".webm");

        const isMotionMode = s.generationMode === "motion" || s.generationMode === "motion-control";
        const isKeyframeMode = s.generationMode === "keyframe";
        const isSlottedMode = isMotionMode || isKeyframeMode;

        if (isVideo && !isMotionMode) {
            return "Videos are only allowed in Motion Control mode";
        }

        // Only block if NOT a slotted mode and limit reached
        if (!isSlottedMode && s.referenceImages.length >= s.maxRefs) {
            return `Reference limit reached (max ${s.maxRefs})`;
        }

        return null;
    }, [isDraggingGalleryItem, draggedItem, s.generationMode, s.referenceImages.length, s.maxRefs]);

    const handleGalleryDrop = (role) => {
        if (!draggedItem || dragError) return;
        s.handleAddReference(draggedItem, role);
        usePromptStore.getState().setIsDraggingGalleryItem(false);
        usePromptStore.getState().setDraggedItem(null);
    };

    const isFirstRun = React.useRef(true);
    const containerRef = React.useRef(null);
    const paperclipRef = React.useRef(null);
    const generationMode = s.generationMode;
    const setGenerationMode = s.setGenerationMode;

    React.useEffect(() => {
        if (isFirstRun.current && initialMode) {
            isFirstRun.current = false;
            if (generationMode !== initialMode) {
                setGenerationMode(initialMode);
            }
        }
    }, [initialMode, generationMode, setGenerationMode]);

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

    const openDialog = (mode = "image", role = "normal", callback = null) => {
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

    const isVideoModel = s.selectedModel?.category === 'video' || s.selectedModel?.type === 'video';
    const isVideoMode = s.generationMode !== 'image';

    return (
        <PromptBarShell
            variant="generation"
            hideBackground={hideBackground}
            containerRef={containerRef}
            isDragging={isDraggingGalleryItem}
            dragOverlay={
                <DragDropOverlay 
                    mode={s.generationMode} 
                    onDrop={handleGalleryDrop} 
                    error={dragError} 
                    referenceImages={s.referenceImages}
                    draggedItem={draggedItem}
                    maxRefs={s.maxRefs}
                />
            }
            popover={
                <ImportMediaPopover
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    anchorRef={paperclipRef}
                    maxAllowed={targetRole === "normal" ? Math.max(0, s.maxRefs - s.referenceImages.length) : 1}
                    onSelect={(assets) => {
                        const items = Array.isArray(assets) ? assets : [assets];
                        items.forEach((asset) => s.handleAddReference(asset, targetRole));

                        if (mentionCallback) {
                            mentionCallback(items);
                        }

                        setDialogOpen(false);
                        setMentionCallback(null);
                    }}
                    onUploadFromPC={(files) => {
                        const items = Array.isArray(files) ? files : [files];
                        if (items.length > 1) {
                            s.handleBatchUpload?.(items, targetRole);
                        } else {
                            s.handleUploadFromPC?.(items[0], targetRole);
                        }

                        if (mentionCallback && files.length > 0) {
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
            }
        >
            {s.hasChanges && (
                <button
                    type="button"
                    onClick={s.handleReset}
                    className="absolute right-4 top-4 p-1 text-white/20 hover:text-white bg-transparent transition-colors z-[60] outline-none"
                    title="Clear everything"
                >
                    <VscChromeClose size={18} />
                </button>
            )}

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
                            {s.generationMode === "image" ? (
                                <QualitySelector
                                    value={s.resolution}
                                    onChange={s.setResolution}
                                    options={s.selectedModel?.support?.quality?.options || s.selectedModel?.support?.quality}
                                    className="!w-full !bg-white/5 !rounded-2xl"
                                />
                            ) : (
                                s.selectedModel?.support?.resolution && (
                                    <VideoResolutionSelector
                                        value={s.videoResolution}
                                        onChange={s.setVideoResolution}
                                        options={s.selectedModel?.support?.resolution?.options || s.selectedModel?.support?.resolution}
                                        className="!w-full !bg-white/5 !rounded-2xl"
                                    />
                                )
                            )}
                            {(s.generationMode === "keyframe" || s.generationMode === "multiref") && (
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

            <AnimatePresence>
                {(() => {
                    const showReferenceBar = isVideoModel ? isVideoMode : true;

                    if (!showReferenceBar) return false;

                    const hasVisibleRefs = s.referenceImages.some(r => {
                        if (s.generationMode === 'keyframe') return r.role === 'start' || r.role === 'end';
                        if (s.generationMode === 'motion' || s.generationMode === 'motion-control') return r.role === 'mc_video' || r.role === 'mc_image';
                        return !['start', 'end', 'mc_video', 'mc_image'].includes(r.role);
                    });

                    return (
                        hasVisibleRefs ||
                        s.generationMode === "keyframe" ||
                        s.generationMode === "motion-control" ||
                        s.generationMode === "motion"
                    );
                })() && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="w-full overflow-hidden"
                    >
                        <div className="p-2" onPointerDown={() => setVariationsOpen(false)}>
                            <Row1
                                key={`${s.selectedModel?.key}-${generationMode}`}
                                referenceImages={s.referenceImages}
                                generationMode={generationMode}
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

            <PromptBarBase
                s={s}
                className="p-3 gap-1.5"
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer?.files?.length > 0) {
                        const files = Array.from(e.dataTransfer.files);
                        
                        if (files.length > 1) {
                            // Collect roles for each file (since different files might have different roles)
                            // But usually on a single drop area, they share the same base role logic.
                            // For simplicity, we use the same role determination for the batch if they are all images/videos.
                            
                            let role = "normal";
                            const firstIsVideo = files[0].type.startsWith("video/");
                            if (["motion-control", "motion"].includes(s.generationMode)) {
                                role = firstIsVideo ? "mc_video" : "mc_image";
                            } else if (s.generationMode === "keyframe") {
                                const hasStart = s.referenceImages.some(r => r.role === 'start');
                                role = hasStart ? "end" : "start";
                            }

                            s.handleBatchUpload?.(files, role);
                        } else {
                            const file = files[0];
                            let role = "normal";
                            const isVideo = file.type.startsWith("video/");
                            
                            if (["motion-control", "motion"].includes(s.generationMode)) {
                                role = isVideo ? "mc_video" : "mc_image";
                            } else if (s.generationMode === "keyframe") {
                                const hasStart = s.referenceImages.some(r => r.role === 'start');
                                role = hasStart ? "end" : "start";
                            }
                            
                            s.handleUploadFromPC?.(file, role);
                        }
                    }
                }}
            >
                <div className="flex flex-col w-full gap-0.5">
                    <div className="flex items-start gap-2" onPointerDown={() => setVariationsOpen(false)}>
                        <PromptTextarea
                            value={s.prompt}
                            onChange={s.setPrompt}
                            onSubmit={s.handleGenerate}
                            textareaRef={s.textareaRef}
                            referenceImages={s.referenceImages}
                            onTriggerMentionDialog={
                                ["image", "multiref", "keyframe"].includes(s.generationMode)
                                    ? (cb) => {
                                        let role = "normal";
                                        if (s.generationMode === "keyframe") {
                                          const hasStart = s.referenceImages.some(r => r.role === 'start');
                                          role = hasStart ? "end" : "start";
                                        }
                                        openDialog("image", role, cb);
                                      }
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
                        showPaperclip={isVideoModel ? (s.generationMode === 'multiref') : true}
                        onToggleVariations={() => setVariationsOpen((prev) => !prev)}
                        variationsOpen={variationsOpen}
                        mediaOpen={dialogOpen}
                        paperclipRef={paperclipRef}
                        onAddClick={() => {
                            if (dialogOpen) {
                                setDialogOpen(false);
                            } else {
                                // Smart role determination
                                let role = "normal";
                                if (s.generationMode === "keyframe") {
                                    const hasStart = s.referenceImages.some(r => r.role === 'start');
                                    role = hasStart ? "end" : "start";
                                } else if (["motion", "motion-control"].includes(s.generationMode)) {
                                    const hasMcVideo = s.referenceImages.some(r => r.role === 'mc_video');
                                    role = hasMcVideo ? "mc_image" : "mc_video";
                                }
                                
                                const type = role === "mc_video" ? "video" : "image";
                                openDialog(type, role);
                            }
                        }}
                        onReset={s.handleReset}
                        hasChanges={s.hasChanges}
                    />
                </div>
            </PromptBarBase>
        </PromptBarShell>
    );
}
