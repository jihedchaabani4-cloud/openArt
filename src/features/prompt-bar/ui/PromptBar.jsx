import React from "react";
import { usePromptBar } from "../model/usePromptBar";
import { PromptBarBase } from "./PromptBarBase";
import { Row1 } from "./shared/Row1";
import { Row2 } from "./shared/Row2";
import { PromptTextarea } from "./shared/PromptTextarea";
import { PromptControlsPopover } from "./shared/PromptControlsPopover";
import { Sparkles } from "lucide-react";
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";

/**
 * PromptBar
 * The main container for the prompt bar.
 * In the project view, it shows the standard generation bar.
 */
export default function PromptBar({ hideBackground = false, isNewProject = false, initialMode = null }) {
    const s = usePromptBar({ isNewProject });
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [internalMode, setInternalMode] = React.useState('image');
    const [targetRole, setTargetRole] = React.useState('normal');

    // Optional override for the prompt bar's generation mode ONCE on mount
    const isFirstRun = React.useRef(true);
    React.useEffect(() => {
        if (isFirstRun.current && initialMode) {
            isFirstRun.current = false;
            if (s.generationMode !== initialMode) {
                s.setGenerationMode(initialMode);
            }
        }
    }, [initialMode, s.generationMode, s.setGenerationMode]);

    return (
        <div className="relative w-full flex flex-col items-center justify-center">
            <PromptBarBase s={s} hideBackground={hideBackground}>
                <div className="flex flex-col w-full p-1 gap-1.5">
                    <Row1 
                        referenceImages={s.referenceImages}
                        generationMode={s.generationMode}
                        selectedModel={s.selectedModel}
                        onAddReference={s.handleAddReference}
                        onRemoveReference={s.handleRemoveReference}
                        onSwapFrames={s.handleSwapFrames}
                        onUploadFromPC={s.handleUploadFromPC}
                        uploading={s.uploading}
                        library={s.library}
                        libraryLoading={s.libraryLoading}
                        libraryHasMore={s.libraryHasMore}
                        onLoadMore={s.handleLoadMoreAssets}
                        onOpenLibrary={s.handleOpenLibrary}
                        assetSource={s.assetSource}
                        setAssetSource={s.setAssetSource}
                        assetMode={s.assetMode}
                        setAssetMode={s.setAssetMode}
                        maxRefs={s.maxRefs}
                        dialogOpen={dialogOpen}
                        setDialogOpen={setDialogOpen}
                        internalMode={internalMode}
                        setInternalMode={setInternalMode}
                        targetRole={targetRole}
                        setTargetRole={setTargetRole}
                    />

                    <PromptTextarea 
                        value={s.prompt}
                        onChange={s.setPrompt}
                        onSubmit={s.handleGenerate}
                        textareaRef={s.textareaRef}
                        referenceImages={s.referenceImages}
                    />

                    <Row2 
                        paramsProps={{
                            values: {
                                model: s.model,
                                selectedModel: s.selectedModel,
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
                            onSubmit: s.handleGenerate,
                            prompt: s.prompt,
                        }}
                        generationMode={s.generationMode}
                        setGenerationMode={s.setGenerationMode}
                    />
                </div>
            </PromptBarBase>

            <ImportMediaPopover
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                maxAllowed={Math.max(0, s.maxRefs - s.referenceImages.length)}
                onSelect={(assets) => {
                    const items = Array.isArray(assets) ? assets : [assets];
                    items.forEach(asset => s.handleAddReference(asset, targetRole));
                    setDialogOpen(false);
                }}
                onUploadFromPC={(files) => {
                    const items = Array.isArray(files) ? files : [files];
                    items.forEach(file => s.handleUploadFromPC?.(file, targetRole));
                    setDialogOpen(false);
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
