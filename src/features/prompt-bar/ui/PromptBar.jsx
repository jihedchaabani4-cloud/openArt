// src/components/features/ImagePromptBar/index.jsx
import React from "react";
import { cn } from "@/shared/lib/utils";
import { X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Row1 } from "./components/Row1";
import { Row2 } from "./components/Row2";
import { PromptTextarea } from "./components/Row2/PromptTextarea";
import { usePromptBar } from "../model/usePromptBar";

export default function PromptBar({ hideBackground = false, isNewProject = false, initialMode = null }) {
    const s = usePromptBar({ isNewProject });

    // Optional override for the prompt bar's generation mode
    React.useEffect(() => {
        if (initialMode && s.generationMode !== initialMode) {
            s.setGenerationMode(initialMode);
        }
    }, [initialMode, s.generationMode, s.setGenerationMode]);

    const submitForm = (e) => s.handleGenerate(e);

    return (
        <div className={hideBackground ? "w-full" : "min-h-screen  flex items-center justify-center p-6"}>
            <div className={cn("flex flex-col gap-3 w-full", !hideBackground && "max-w-[550px]")}>
                <form onSubmit={submitForm} className="w-full flex-col relative transition-all duration-200">
                    <div 
                        onDragEnter={s.handleDragEnter}
                        onDragOver={s.handleDragOver}
                        className={cn(
                        "w-full flex flex-col rounded-xl p-2 gap-[8px] relative transition-all duration-200 backdrop-blur-2xl",
                        "border border-[rgba(218,220,224,0.05)] backdrop-blur-[80px] bg-[rgb(22,23,24)] overflow-hidden"
                    )}>
                        <AnimatePresence>
                            {s.isDragging && (
                                <DragOverlay 
                                    mode={s.generationMode} 
                                    selectedModel={s.selectedModel}
                                    onDrop={s.handleDrop} 
                                    onDragLeave={s.handleDragLeave} 
                                />
                            )}
                        </AnimatePresence>

                        {s.hasChanges && (
                            <button
                                type="button"
                                onClick={s.handleReset}
                                className="absolute right-3 top-3 p-1.5 text-white/30 hover:text-white bg-transparent transition-colors z-50 outline-none"
                                title="Clear everything"
                            >
                                <X size={16} />
                            </button>
                        )}

                        {/* Row 1 — References */}
                        <Row1
                            referenceImages={s.referenceImages}
                            generationMode={s.generationMode}
                            selectedModel={s.selectedModel}        // ← زيد
                            maxRefs={s.maxRefs}
                            onAddReference={s.handleAddReference}
                            onRemoveReference={s.handleRemoveReference}
                            onSwapFrames={s.handleSwapFrames}
                            onUploadFromPC={s.handleUploadFromPC}  // ← زيد
                            uploading={s.uploading}                 // ← زيد
                            library={s.library}
                            libraryLoading={s.libraryLoading}
                            libraryHasMore={s.libraryHasMore}
                            onLoadMore={s.handleLoadMoreAssets}
                            onOpenLibrary={s.handleOpenLibrary}
                            assetSource={s.assetSource}
                            setAssetSource={s.setAssetSource}
                            assetMode={s.assetMode}
                            setAssetMode={s.setAssetMode}
                        />

                        {/* Input text prompt bar — Explicitly Row 2 now */}
                        <div className="px-1.5">
                            <PromptTextarea
                                value={s.prompt}
                                onChange={s.setPrompt}
                                onSubmit={submitForm}
                                textareaRef={s.textareaRef}
                                referenceImages={s.referenceImages}
                            />
                        </div>

                        {/* Row 2 — Params + Generate (Now Row 3 visually) */}
                        <Row2
                            generationMode={s.generationMode}
                            setGenerationMode={s.setGenerationMode}
                            paramsProps={{
                                values: {
                                    model:              s.model,
                                    selectedModel:      s.selectedModel,   // ← زيد
                                    studioModels:       s.studioModels,
                                    studioModelsLoading: s.studioModelsLoading,
                                    resolution:         s.resolution,
                                    ratio:              s.ratio,
                                    count:              s.count,
                                    duration:           s.duration,
                                    videoResolution:    s.videoResolution,
                                },
                                onChange: {
                                    setModel:           s.setModel,
                                    setResolution:      s.setResolution,
                                    setRatio:           s.setRatio,
                                    setCount:           s.setCount,
                                    setDuration:        s.setDuration,
                                    setVideoResolution: s.setVideoResolution,
                                },
                            }}
                            actionProps={{
                                generating: s.generating,
                                prompt:     s.prompt,
                            }}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}

function DragOverlay({ mode, selectedModel, onDrop, onDragLeave }) {
    const isKeyframeOrMotion = mode === 'keyframe' || mode === 'motion-control' || mode === 'motion';
    
    // Check support for start/end frames from keyframe metadata if available
    const supportsStart = selectedModel?.support?.keyframe 
        ? !!selectedModel.support.keyframe.start 
        : true; // Default to true if not specified for video

    const supportsEnd = selectedModel?.support?.keyframe 
        ? !!selectedModel.support.keyframe.end 
        : (isKeyframeOrMotion && mode !== 'motion-control' && mode !== 'motion'); // fallback logic

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-100 bg-[#0d0e0f]/90 backdrop-blur-sm flex items-center justify-center p-3 gap-3"
            onDragLeave={onDragLeave}
        >
            {!isKeyframeOrMotion ? (
                <DropZone 
                    label="Add Ingredient" 
                    onDrop={(e) => onDrop(e, 'normal')} 
                />
            ) : (
                <>
                    {supportsStart && (
                        <DropZone 
                            label="Add start frame" 
                            onDrop={(e) => onDrop(e, 'start')} 
                        />
                    )}
                    {supportsEnd && (
                        <DropZone 
                            label="Add end frame" 
                            onDrop={(e) => onDrop(e, 'end')} 
                        />
                    )}
                </>
            )}
        </motion.div>
    );
}

function DropZone({ label, onDrop }) {
    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('bg-white/10', 'border-white/20');
            }}
            onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-white/10', 'border-white/20');
            }}
            onDrop={(e) => {
                e.currentTarget.classList.remove('bg-white/10', 'border-white/20');
                onDrop(e);
            }}
            className={cn(
                "flex-1 h-full min-h-[100px] border border-dashed border-white/10 rounded-3xl",
                "flex flex-col items-center justify-center gap-2 transition-all cursor-copy group"
            )}
        >
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                <Plus size={20} className="text-white/60 group-hover:text-white" />
            </div>
            <span className="text-[13px] font-medium text-white/50 group-hover:text-white">
                {label}
            </span>
        </div>
    );
}