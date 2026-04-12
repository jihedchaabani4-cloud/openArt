import React from 'react';
import { ReferenceButton, ViewReference } from '../common/ReferenceButton';
import { ArrowLeftRight } from 'lucide-react';




/**
 * Row1
 * Displays reference image slots (ingredients, keyframes, motion control).
 * openDialog and onRemoveReference are the only side-effect triggers needed.
 */
export function Row1({
    referenceImages = [],
    generationMode  = 'image',
    selectedModel   = null,
    onRemoveReference,
    onSwapFrames,
    maxRefs = 4,
    openDialog,
    showAddButton = true,
}) {
    const supportsRefs       = !!selectedModel?.support?.references;
    const supportsStartFrame = selectedModel?.support?.keyframe
        ? !!selectedModel.support.keyframe.start
        : !!selectedModel?.support?.frames?.startFrame;
    const supportsEndFrame = selectedModel?.support?.keyframe
        ? !!selectedModel.support.keyframe.end
        : !!selectedModel?.support?.frames?.endFrame;
    const supportsSwap = supportsStartFrame && supportsEndFrame;

    const isKeyframeMode = generationMode === 'keyframe';
    const isMcMode       = generationMode === 'motion-control';

    const startFrame  = referenceImages.find(r => r.role === 'start');
    const endFrame    = referenceImages.find(r => r.role === 'end');
    const mcImageRef  = referenceImages.find(r => r.role === 'mc_image');
    const mcVideoRef  = referenceImages.find(r => r.role === 'mc_video');
    const regularRefs = referenceImages.filter(
        r => !['start', 'end', 'mc_image', 'mc_video'].includes(r.role)
    );

    const normalCount = regularRefs.length;

    if (!supportsRefs && !isKeyframeMode && !isMcMode) return null;

    return (
        <div className="flex items-center gap-2">
            {/* 1. Add Button (Standard Mode) */}
            {!isKeyframeMode && !isMcMode && supportsRefs && maxRefs > 0 && showAddButton && (
                <ReferenceButton
                    disabled={normalCount >= maxRefs}
                    onClick={() => openDialog('image', 'normal')}
                    variant="add"
                />
            )}

            {/* 2. Regular References */}
            {!isKeyframeMode && !isMcMode && regularRefs.map((img, idx) => {
                const originalIdx = referenceImages.indexOf(img);
                return (
                    <ViewReference
                        key={`${img.asset_id}-${idx}`}
                        media={img}
                        onRemove={() => onRemoveReference(img.asset_id)}
                    />
                );
            })}

            {/* 3. Keyframe Mode Slots */}
            {isKeyframeMode && (
                <div className="flex items-center gap-2">
                    {/* Start Slot */}
                    {startFrame ? (
                        <ViewReference
                            media={startFrame}
                            onRemove={() => onRemoveReference(startFrame.asset_id)}
                            label="Start"
                        />
                    ) : (
                        <ReferenceButton variant="start" onClick={() => openDialog('image', 'start')} />
                    )}

                    {/* Swap */}
                    {supportsSwap && (
                        <button
                            type="button"
                            onClick={onSwapFrames}
                            disabled={!(startFrame && endFrame)}
                            className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full  text-white hover:text-white/80 hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ArrowLeftRight size={14} strokeWidth={2} />
                        </button>
                    )}

                    {/* End Slot */}
                    {supportsEndFrame && (
                        endFrame ? (
                            <ViewReference
                                media={endFrame}
                                onRemove={() => onRemoveReference(endFrame.asset_id)}
                                label="End"
                            />
                        ) : (
                            <ReferenceButton variant="end" onClick={() => openDialog('image', 'end')} />
                        )
                    )}
                </div>
            )}

            {/* 4. Motion Control Mode Slots */}
            {isMcMode && (
                <div className="flex items-center gap-2">
                    {mcVideoRef ? (
                        <ViewReference
                            media={mcVideoRef}
                            onRemove={() => onRemoveReference(mcVideoRef.asset_id)}
                            label="Vid"
                        />
                    ) : (
                        <ReferenceButton variant="motion" onClick={() => openDialog('video', 'mc_video')} />
                    )}

                    {mcImageRef ? (
                        <ViewReference
                            media={mcImageRef}
                            onRemove={() => onRemoveReference(mcImageRef.asset_id)}
                            label="Ref"
                        />
                    ) : (
                        <ReferenceButton variant="ref" onClick={() => openDialog('image', 'mc_image')} />
                    )}
                </div>
            )}
        </div>
    );
}