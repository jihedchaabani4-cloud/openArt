import React from 'react';
import { ReferenceButton, ViewReference } from '../common/ReferenceButton';
import { GoogleIcon } from '@/shared/ui/GoogleIcon';




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
    handleUploadFromPC,
    maxRefs = 4,
    openDialog,
    showAddButton = true,
}) {
    console.log("🟧 [Row1] Render:", { model: selectedModel?.key, maxRefs, generationMode });
    const supportsRefs = !!selectedModel?.support?.references || generationMode === 'motion' || generationMode === 'motion-control';
    
    const isKeyframeMode = generationMode === 'keyframe';
    const isMcMode       = generationMode === 'motion-control';
    const isMotionMode   = generationMode === 'motion';
    const isAnyMotion    = isMotionMode || isMcMode;

    const supportsStartFrame = maxRefs >= 1;
    const supportsEndFrame   = maxRefs >= 2;
    const supportsSwap = supportsStartFrame && supportsEndFrame;

    const startFrame  = referenceImages.find(r => r.role === 'start');
    const endFrame    = referenceImages.find(r => r.role === 'end');
    const mcImageRef  = referenceImages.find(r => r.role === 'mc_image');
    const mcVideoRef  = referenceImages.find(r => r.role === 'mc_video');
    
    // Regular refs are those that aren't specific slots
    const regularRefs = referenceImages.filter(
        r => !['start', 'end', 'mc_image', 'mc_video'].includes(r.role)
    );

    const normalCount = regularRefs.length;

    // Guard: only render if we have something to show or the mode requires slots
    const shouldRender = supportsRefs || isKeyframeMode || isAnyMotion || referenceImages.length > 0;
    if (!shouldRender) return null;

    return (
        <div className="flex items-center gap-2">
            {/* 1. Add Button (Standard Mode only - hidden in keyframe/mc) */}
            {!isKeyframeMode && !isMcMode && !isMotionMode && supportsRefs && maxRefs > 0 && showAddButton && (
                <ReferenceButton
                    disabled={normalCount >= maxRefs}
                    onClick={() => openDialog('image', 'normal')}
                    variant="add"
                />
            )}

            {/* 2. Regular References (Standard Modes) */}
            {!isKeyframeMode && !isMcMode && !isMotionMode && regularRefs.map((img, idx) => (
                <ViewReference
                    key={img.asset_id || img.url || idx}
                    media={img}
                    onRemove={() => onRemoveReference(img.asset_id)}
                />
            ))}

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
                        <ReferenceButton 
                            variant="start" 
                            onClick={() => openDialog('image', 'start')} 
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.dataTransfer?.files?.length > 0 && handleUploadFromPC) {
                                    handleUploadFromPC(e.dataTransfer.files[0], 'start');
                                }
                            }}
                        />
                    )}

                    {/* Swap */}
                    {supportsSwap && (
                        <button
                            type="button"
                            onClick={onSwapFrames}
                            disabled={!(startFrame && endFrame)}
                            className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full  text-white hover:text-white/80 hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <GoogleIcon iconName="swap_horiz" className="text-[12px]" />
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
                            <ReferenceButton 
                                variant="end" 
                                onClick={() => openDialog('image', 'end')} 
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (e.dataTransfer?.files?.length > 0 && handleUploadFromPC) {
                                        handleUploadFromPC(e.dataTransfer.files[0], 'end');
                                    }
                                }}
                            />
                        )
                    )}
                </div>
            )}

            {/* 4. Motion/Motion-Control Mode Slots */}
            {isAnyMotion && (
                <div className="flex items-center gap-2">
                    {/* Motion Video Slot */}
                    {mcVideoRef ? (
                        <ViewReference
                            media={mcVideoRef}
                            onRemove={() => onRemoveReference(mcVideoRef.asset_id)}
                            label="Vid"
                        />
                    ) : (
                        <ReferenceButton 
                            variant="motion" 
                            onClick={() => openDialog('video', 'mc_video')} 
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.dataTransfer?.files?.length > 0 && handleUploadFromPC) {
                                    handleUploadFromPC(e.dataTransfer.files[0], 'mc_video');
                                }
                            }}
                        />
                    )}

                    {/* Source Image Slot */}
                    {mcImageRef ? (
                        <ViewReference
                            media={mcImageRef}
                            onRemove={() => onRemoveReference(mcImageRef.asset_id)}
                            label="Ref"
                        />
                    ) : (
                        <ReferenceButton 
                            variant="ref" 
                            onClick={() => openDialog('image', 'mc_image')} 
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.dataTransfer?.files?.length > 0 && handleUploadFromPC) {
                                    handleUploadFromPC(e.dataTransfer.files[0], 'mc_image');
                                }
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}