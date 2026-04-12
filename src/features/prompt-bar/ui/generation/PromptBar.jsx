import React from "react";
import { cn } from "@/shared/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePromptBar } from "../../model/usePromptBar";
import { PromptBarBase } from "./PromptBarBase";
import { Row1 } from "./Row1";
import { Row2 } from "./Row2";
import { PromptTextarea } from "../common/PromptTextarea";
import { ModeSelector } from "../common/selectors/ModeSelector";
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";
import { QualitySelector } from "../common/selectors/QualitySelector";
import { RatioSelector } from "../common/selectors/RatioSelector";
import { VariationSelector } from "../common/selectors/VariationSelector";
import { DurationSelector } from "../common/selectors/DurationSelector";
import { VideoResolutionSelector } from "../common/selectors/VideoResolutionSelector";
import { DragDropOverlay } from "./DragDropOverlay";
export default function PromptBar({ hideBackground = false, isNewProject = false, initialMode = null }) {
    const s = usePromptBar({ isNewProject });
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [internalMode, setInternalMode] = React.useState('image');
    const [targetRole, setTargetRole] = React.useState('normal');
    const [variationsOpen, setVariationsOpen] = React.useState(true);
    const [mentionCallback, setMentionCallback] = React.useState(null);
    const [isDragging, setIsDragging] = React.useState(false);

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

    // Close settings panel on outside click
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

    // Global drag listener to trigger the overlay instantly when a user drags a file into the window
    React.useEffect(() => {
        let dragCounter = 0;
        
        const handleDragEnter = (e) => {
            e.preventDefault();
            dragCounter++;
            if (e.dataTransfer?.types.includes('Files')) {
                setIsDragging(true);
            }
        };
        
        const handleDragLeave = (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter === 0) {
                setIsDragging(false);
            }
        };
        
        const handleDrop = (e) => {
            e.preventDefault();
            dragCounter = 0;
            setIsDragging(false);
        };
        
        const handleDragOver = (e) => {
            e.preventDefault();
        };

        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);
        
        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, []);

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
                className="w-full flex flex-col"
                style={{ maxWidth: hideBackground ? undefined : "550px" }}
            >
                {/* ── Visual card (one and only background/blur/border) ──────── */}
                <div className="relative w-full flex flex-col border border-white/5 shadow-[0px_16px_32px_-8px_rgba(0,0,0,0.4)] backdrop-blur-[80px] bg-[#161718e6] rounded-2xl overflow-hidden">
                    <DragDropOverlay
                        isDragging={isDragging} 
                        generationMode={s.generationMode}
                        onDragLeaveBase={() => setIsDragging(false)}
                        onDropStart={(e) => {
                            // Extract files and open dialog passing them as callbacks, or we just open dialog 
                            // as 'start' and pass the files
                            if (e.dataTransfer?.files?.length > 0) {
                                openDialog('image', 'start');
                                // Assuming openDialog doesn't handle direct file drops natively yet without the component itself handling it,
                                // but for now we'll just set it to 'start' mode to match the visual. 
                                // Alternatively, we trigger the upload function directly:
                                const files = Array.from(e.dataTransfer.files);
                                s.handleUploadFromPC?.(files[0], 'start');
                            }
                        }}
                        onDropEnd={(e) => {
                            if (e.dataTransfer?.files?.length > 0) {
                                const files = Array.from(e.dataTransfer.files);
                                s.handleUploadFromPC?.(files[0], 'end');
                            }
                        }}
                        onDropIngredient={(e) => {
                            if (e.dataTransfer?.files?.length > 0) {
                                const role = ['keyframe', 'motion-control'].includes(s.generationMode) ? 'mc_image' : 'normal';
                                const files = Array.from(e.dataTransfer.files);
                                files.forEach(file => s.handleUploadFromPC?.(file, role));
                            }
                        }}
                    />

                    <div className={cn("w-full flex-col", isDragging ? 'hidden' : 'flex')}>
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
                                        {/* Mode Selector */}
                                        <ModeSelector
                                            value={s.generationMode}
                                            onChange={s.setGenerationMode}
                                        />

                                        {/* Aspect Ratio */}
                                        <RatioSelector
                                            value={s.ratio}
                                            onChange={s.setRatio}
                                            options={s.selectedModel?.support?.ratio?.options || s.selectedModel?.support?.ratio}
                                        />

                                        {/* Variations Count */}
                                        <VariationSelector
                                            value={s.count}
                                            onChange={s.setCount}
                                        />

                                        {/* Quality / Resolution */}
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

                                        {/* Duration (Video only) */}
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
                                            maxRefs={s.maxRefs}
                                            openDialog={openDialog}
                                            showAddButton={false}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Prompt input area (form wrapper) ─────────────────── */}
                        <PromptBarBase s={s} className="p-3 gap-1.5">
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