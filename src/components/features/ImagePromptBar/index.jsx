// src/components/features/ImagePromptBar/index.jsx
import React from "react";
import { cn } from "@/lib/utils";
import { Row1 } from "./components/Row1";
import { Row2 } from "./components/Row2";
import { useImagePromptBar } from "./hooks/useImagePromptBar";

export default function ImagePromptBar({ hideBackground = false, isNewProject = false }) {
  const s = useImagePromptBar({ isNewProject });

  const submitForm = (e) => s.handleGenerate(e);

  return (
    <div className={hideBackground ? "w-full" : "min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6"}>
      <div className={cn("flex flex-col gap-3 w-full", !hideBackground && "max-w-[850px]")}>
        <form onSubmit={submitForm} className="w-full flex-col relative transition-all duration-200">
          <div className={cn(
            "w-full flex flex-col rounded-[16px] relative transition-all duration-200 backdrop-blur-2xl",
            "shadow-[0_16px_40px_rgba(0,0,0,0.45)] bg-[#0d0e0f]/65 border-[0.5px] border-white/10"
          )}>
            {/* Row 1 — References */}
            <Row1
              referenceImages={s.referenceImages}
              generationMode={s.generationMode}
              maxRefs={s.maxRefs}
              onAddReference={s.handleAddReference}
              onRemoveReference={s.handleRemoveReference}
              onSwapFrames={s.handleSwapFrames}
              library={s.library}
              libraryLoading={s.libraryLoading}
              libraryHasMore={s.libraryHasMore}
              onLoadMore={s.fetchAllGenerations}
            />

            {/* Row 2 — Prompt + Params + Generate */}
            <Row2
              promptProps={{
                value: s.prompt,
                onChange: s.setPrompt,
                onSubmit: submitForm,
                modeProps: {
                  value: s.generationMode,
                  onChange: s.setGenerationMode
                },
                textareaRef: s.textareaRef,
              }}
              paramsProps={{
                values: {
                  model: s.model,
                  studioModels: s.studioModels,
                  studioModelsLoading: s.studioModelsLoading,
                  resolution: s.resolution,
                  ratio: s.ratio,
                  count: s.count,
                  duration: s.duration,
                  videoResolution: s.videoResolution,
                },
                onChange: {
                  setModel: s.setModel,
                  setResolution: s.setResolution,
                  setRatio: s.setRatio,
                  setCount: s.setCount,
                  setDuration: s.setDuration,
                  setVideoResolution: s.setVideoResolution,
                }
              }}
              actionProps={{
                generating: s.generating,
                prompt: s.prompt,
              }}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
