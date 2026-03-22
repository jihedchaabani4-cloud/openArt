// src/components/features/ImagePromptBar/index.jsx
import React from "react";
import { cn } from "@/shared/lib/utils";
import { X } from "lucide-react";
import { Row1 } from "./components/Row1";
import { Row2 } from "./components/Row2";
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
        <div className={hideBackground ? "w-full" : "min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6"}>
            <div className={cn("flex flex-col gap-3 w-full", !hideBackground && "max-w-[850px]")}>
                <form onSubmit={submitForm} className="w-full flex-col relative transition-all duration-200">
                    <div className={cn(
                        "w-full flex flex-col rounded-[16px] relative transition-all duration-200 backdrop-blur-2xl",
                        "shadow-[0_16px_40px_rgba(0,0,0,0.45)] bg-[#0d0e0f]/65 border-[0.5px] border-white/10 overflow-hidden"
                    )}>

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
                            onLoadMore={s.fetchAllGenerations}
                        />

                        {/* Row 2 — Prompt + Params + Generate */}
                        <Row2
                            selectedModel={s.selectedModel}        // ← زيد
                            promptProps={{
                                value:    s.prompt,
                                onChange: s.setPrompt,
                                onSubmit: submitForm,
                                textareaRef: s.textareaRef,
                                referenceImages: s.referenceImages,
                                modeProps: {
                                    value:    s.generationMode,
                                    onChange: s.setGenerationMode,
                                },
                                onReset:     s.handleReset,
                                hasChanges:  s.hasChanges,
                            }}
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