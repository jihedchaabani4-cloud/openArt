import React from 'react';
import { ReferenceButton, ViewReference } from './ReferenceButton';
import { ImagePlus, Film } from 'lucide-react';
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";

const SwapIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M4.57216 3.5C4.25657 3.5 4.00073 3.72386 4.00073 4C4.00073 4.27614 4.25657 4.5 4.57216 4.5L10.0498 4.5L8.73953 5.64645C8.51637 5.84171 8.51637 6.15829 8.73953 6.35355C8.96268 6.54882 9.32449 6.54882 9.54765 6.35355L11.8334 4.35355C12.0565 4.15829 12.0565 3.84171 11.8334 3.64645L9.54765 1.64645C9.32449 1.45118 8.96268 1.45118 8.73953 1.64645C8.51637 1.84171 8.51637 2.15829 8.73953 2.35355L10.0498 3.5L4.57216 3.5ZM9.42775 10.4997C9.74334 10.4997 9.99918 10.2759 9.99918 9.99972C9.99918 9.72358 9.74334 9.49972 9.42775 9.49972L3.95015 9.49972L5.26038 8.35328C5.48354 8.15802 5.48354 7.84143 5.26038 7.64617C5.03722 7.45091 4.67541 7.45091 4.45226 7.64617L2.16654 9.64617C1.94339 9.84143 1.94339 10.158 2.16654 10.3533L4.45226 12.3533C4.67541 12.5485 5.03722 12.5485 5.26038 12.3533C5.48354 12.158 5.48354 11.8414 5.26038 11.6462L3.95015 10.4997L9.42775 10.4997Z" fill="currentColor" />
    </svg>
);

const VideoCustomIcon = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" />
        <rect x="3" y="6" width="12" height="12" rx="2" ry="2" />
        <path d="M6 15v-4M4 13h4" />
    </svg>
);

const ImageUpIcon = ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
        <path d="M16 10v-5M13.5 7.5L16 5l2.5 2.5" className="text-white bg-black stroke-[3px]" />
        <path d="M16 10v-5M13.5 7.5L16 5l2.5 2.5" />
    </svg>
);

export function Row1({
    referenceImages = [],
    generationMode  = 'image',
    selectedModel   = null,
    onAddReference,
    onRemoveReference,
    onSwapFrames,
    onUploadFromPC,
    uploading = false,
    library = [],
    libraryLoading = false,
    libraryHasMore = false,
    onLoadMore,
    onOpenLibrary,
    assetSource,
    setAssetSource,
    assetMode,
    setAssetMode,
    maxRefs = 4,
    // Lifted state props
    dialogOpen = false,
    setDialogOpen,
    internalMode = 'image',
    setInternalMode,
    targetRole = 'normal',
    setTargetRole,
}) {
    const supportsRefs       = !!selectedModel?.support?.references;
    const supportsStartFrame = selectedModel?.support?.keyframe 
        ? !!selectedModel.support.keyframe.start 
        : !!selectedModel?.support?.frames?.startFrame;
    const supportsEndFrame = selectedModel?.support?.keyframe 
        ? !!selectedModel.support.keyframe.end 
        : !!selectedModel?.support?.frames?.endFrame;
    const supportsSwap       = supportsStartFrame && supportsEndFrame;

    const isKeyframeMode    = generationMode === 'keyframe';
    const isMcMode          = generationMode === 'motion-control';

    // ✅ Log model support for debugging
    React.useEffect(() => {
        if (selectedModel) {
            const sStart = selectedModel.support?.keyframe?.start || selectedModel.support?.frames?.startFrame;
            const sEnd = selectedModel.support?.keyframe?.end || selectedModel.support?.frames?.endFrame;
            console.log(`[Row1] Model: ${selectedModel.name} | Support Keyframes: Start=${!!sStart}, End=${!!sEnd}`);
        }
    }, [selectedModel?.key]);

    const hasRefs     = referenceImages.length > 0;
    const startFrame  = referenceImages.find(r => r.role === 'start');
    const endFrame    = referenceImages.find(r => r.role === 'end');
    const mcImageRef  = referenceImages.find(r => r.role === 'mc_image');
    const mcVideoRef  = referenceImages.find(r => r.role === 'mc_video');
    const regularRefs = referenceImages.filter(
        r => !['start', 'end', 'mc_image', 'mc_video'].includes(r.role)
    );

    const normalCount = regularRefs.length;

    const openDialog = (mode = 'image', role = 'normal') => {
        if (dialogOpen && targetRole === role && internalMode === mode) {
            setDialogOpen(false);
            return;
        }
        setInternalMode(mode);
        setTargetRole(role);
        setDialogOpen(true);
        onOpenLibrary?.(mode);
    };

    if (!supportsRefs && !isKeyframeMode && !isMcMode) return null;

    const remainingNormal = Math.max(0, maxRefs - normalCount);
    const maxAllowed = ['start', 'end', 'mc_image', 'mc_video'].includes(targetRole) 
        ? 1 
        : remainingNormal;

    return (
        <div className="flex items-center gap-2">
            {/* 1. Add Button (Standard Mode) */}
            {!isKeyframeMode && !isMcMode && supportsRefs && maxRefs > 0 && (
                <ReferenceButton
                    disabled={normalCount >= maxRefs}
                    onClick={() => openDialog('image', 'normal')}
                    label="Add Image"
                    icon={ImagePlus}
                />
            )}

            {/* 2. Regular References Map */}
            {!isKeyframeMode && !isMcMode && regularRefs.map((img, idx) => {
                const originalIdx = referenceImages.indexOf(img);
                return (
                    <ViewReference
                        key={`${img.asset_id}-${idx}`}
                        media={img}
                        onRemove={() => onRemoveReference(originalIdx)}
                    />
                );
            })}

            {/* 3. Keyframe Mode Slots */}
            {isKeyframeMode && (
                <div className="flex items-center gap-2">
                    {/* Start Slot */}
                    {startFrame ? (
                        <ViewReference media={startFrame} onRemove={() => { const idx = referenceImages.indexOf(startFrame); if (idx !== -1) onRemoveReference(idx); }} label="Start" />
                    ) : (
                        <ReferenceButton onClick={() => openDialog('image', 'start')} label="Add Start Frame" icon={ImagePlus} />
                    )}

                    {/* Swap */}
                    {supportsSwap && (
                        <button
                            type="button"
                            onClick={onSwapFrames}
                            disabled={!(startFrame && endFrame)}
                            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <SwapIcon />
                        </button>
                    )}

                    {/* End Slot */}
                    {supportsEndFrame && (
                        endFrame ? (
                            <ViewReference media={endFrame} onRemove={() => { const idx = referenceImages.indexOf(endFrame); if (idx !== -1) onRemoveReference(idx); }} label="End" />
                        ) : (
                            <ReferenceButton onClick={() => openDialog('image', 'end')} label="Add End Frame" icon={ImagePlus} />
                        )
                    )}
                </div>
            )}

            {/* 4. Motion Control Mode Slots */}
            {isMcMode && (
                <div className="flex items-center gap-2">
                    {mcVideoRef ? (
                        <ViewReference media={mcVideoRef} onRemove={() => { const idx = referenceImages.indexOf(mcVideoRef); if (idx !== -1) onRemoveReference(idx); }} label="Vid Ref" />
                    ) : (
                        <ReferenceButton onClick={() => openDialog('video', 'mc_video')} label="Video Reference" icon={VideoCustomIcon} />
                    )}

                    {mcImageRef ? (
                        <ViewReference media={mcImageRef} onRemove={() => { const idx = referenceImages.indexOf(mcImageRef); if (idx !== -1) onRemoveReference(idx); }} label="Img Ref" />
                    ) : (
                        <ReferenceButton onClick={() => openDialog('image', 'mc_image')} label="Image Reference" icon={ImageUpIcon} />
                    )}
                </div>
            )}
        </div>
    );
}