import React from 'react';
import { ReferenceButton } from './ReferenceButton';
import { StandardModeButtons } from './StandardModeButtons';
import { MotionModeButtons } from './MotionModeButtons';
import { MotionControlModeButtons } from './MotionControlModeButtons';
import { ImportMediaDialog } from "@/widgets/ImportMediaDialog/ImportMediaDialog";

export function Row1({
    referenceImages = [],
    generationMode  = 'image',
    selectedModel   = null,        // ← زيد
    onAddReference,
    onRemoveReference,
    onSwapFrames,
    onUploadFromPC,                // ← زيد
    uploading = false,             // ← زيد
    library = [],
    libraryLoading = false,
    libraryHasMore = false,
    onLoadMore,
    maxRefs = 4,
}) {
    const [dialogOpen,    setDialogOpen]    = React.useState(false);
    const [internalMode,  setInternalMode]  = React.useState('image');
    const [targetRole,    setTargetRole]    = React.useState('normal');

    // ── من selectedModel مباشرة ────────────────────────────────────────────
    const supportsRefs       = !!selectedModel?.support?.references;
    const supportsStartFrame = !!selectedModel?.support?.frames?.startFrame;
    const supportsEndFrame   = !!selectedModel?.support?.frames?.endFrame;
    const supportsSwap       = supportsStartFrame && supportsEndFrame;

    // ── Modes ──────────────────────────────────────────────────────────────
    const isMotionMode      = generationMode === 'motion';
    const isVideoMode       = generationMode === 'video';
    const isMotionOrVideo   = isMotionMode || isVideoMode;
    const isMcMode          = generationMode === 'motion-control';

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
        setInternalMode(mode);
        setTargetRole(role);
        setDialogOpen(true);
    };

    // ── لو الموديل ما يدعمش references خالص → ما تعرضش Row1 ──────────────
    if (!supportsRefs && !isMotionOrVideo && !isMcMode) return null;

    return (
        <>
            <div className="flex items-center gap-2 px-3 pt-3 pb-0">

                {/* Filled reference buttons */}
                {referenceImages.filter(r =>
                    !(isMotionOrVideo && ['start', 'end'].includes(r.role)) &&
                    !(isMcMode && ['mc_image', 'mc_video'].includes(r.role))
                ).map((img, idx) => {
                    const originalIdx = referenceImages.indexOf(img);
                    return (
                        <ReferenceButton
                            key={`${img.asset_id}-${idx}`}
                            media={img}
                            onRemove={() => onRemoveReference(originalIdx)}
                            label={null}
                        />
                    );
                })}

                {/* 1. Image Mode */}
                {!isMotionOrVideo && !isMcMode && supportsRefs && maxRefs > 0 && (
                    <StandardModeButtons
                        normalCount={normalCount}
                        maxRefs={maxRefs}
                        generationMode={generationMode}
                        openDialog={openDialog}
                        onUploadFromPC={onUploadFromPC}   // ← زيد
                        uploading={uploading}              // ← زيد
                        hasRefs={hasRefs}
                    />
                )}

                {/* 2. Motion & Video Mode */}
                {isMotionOrVideo && (
                    <MotionModeButtons
                        startFrame={startFrame}
                        endFrame={endFrame}
                        supportsEndFrame={supportsEndFrame}   // ← زيد
                        supportsSwap={supportsSwap}           // ← زيد
                        openDialog={openDialog}
                        onSwap={supportsSwap ? onSwapFrames : undefined}
                        onRemove={(role) => {
                            const idx = referenceImages.findIndex(r => r.role === role);
                            if (idx !== -1) onRemoveReference(idx);
                        }}
                    />
                )}

                {/* 3. Motion Control Mode */}
                {isMcMode && (
                    <MotionControlModeButtons
                        imageRef={mcImageRef}
                        videoRef={mcVideoRef}
                        openDialog={openDialog}
                        onRemove={(role) => {
                            const idx = referenceImages.findIndex(r => r.role === role);
                            if (idx !== -1) onRemoveReference(idx);
                        }}
                    />
                )}

                {/* Max badge */}
                {!isMotionOrVideo && !isMcMode && normalCount === maxRefs && maxRefs > 0 && (
                    <span className="text-[11px] text-white/25 font-medium pl-1">
                        max {maxRefs}
                    </span>
                )}
            </div>

            {hasRefs && (
                <div className="mx-3 mt-3 border-t border-white/[0.06]" />
            )}

            <ImportMediaDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSelect={(asset) => {
                    onAddReference(asset, targetRole);
                    if (['start', 'end', 'mc_image', 'mc_video'].includes(targetRole)) {
                        setDialogOpen(false);
                    }
                }}
                onUploadFromPC={(file) => {        // ← زيد
                    onUploadFromPC?.(file, targetRole);
                    if (['start', 'end', 'mc_image', 'mc_video'].includes(targetRole)) {
                        setDialogOpen(false);
                    }
                }}
                library={library}
                loading={libraryLoading}
                hasMore={libraryHasMore}
                onLoadMore={onLoadMore}
                mode={internalMode}
            />
        </>
    );
}