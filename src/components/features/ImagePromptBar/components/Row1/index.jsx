import React from 'react';
import { cn } from '@/lib/utils';
import { ImportMediaDialog } from '../../../ImportMediaDialog/ImportMediaDialog';

import { StandardModeButtons } from './StandardModeButtons';
import { MotionModeButtons } from './MotionModeButtons';
import { MotionControlModeButtons } from './MotionControlModeButtons';
import { ReferenceButton } from './ReferenceButton';

export function Row1({
  referenceImages = [],
  generationMode = 'image',
  onAddReference,
  onRemoveReference,
  onSwapFrames,
  library = [],
  libraryLoading = false,
  libraryHasMore = false,
  onLoadMore,
  maxRefs = 4,
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [internalMode, setInternalMode] = React.useState('image'); // controls dialog mode: image, video, all
  const [targetRole, setTargetRole] = React.useState('normal'); // 'normal', 'start', 'end'
  const hasRefs = referenceImages.length > 0;

  const openDialog = (mode = 'image', role = 'normal') => {
    setInternalMode(mode);
    setTargetRole(role);
    setDialogOpen(true);
  };

  const isMotionMode = generationMode === 'motion';
  const isVideoMode = generationMode === 'video';
  const isMotionOrVideoMode = isMotionMode || isVideoMode;
  const isMcMode = generationMode === 'motion-control';
  
  // Motion & Video mode specific
  const startFrame = referenceImages.find(r => r.role === 'start');
  const endFrame = referenceImages.find(r => r.role === 'end');
  
  // Motion control mode specific
  const mcImageRef = referenceImages.find(r => r.role === 'mc_image');
  const mcVideoRef = referenceImages.find(r => r.role === 'mc_video');
  
  const regularRefs = referenceImages.filter(r => r.role !== 'start' && r.role !== 'end' && r.role !== 'mc_image' && r.role !== 'mc_video');

  // Used for max counts
  const normalCount = regularRefs.length;

  return (
    <>
      <div className="flex items-center gap-2 px-3 pt-3 pb-0">

        {/* Unified Reference Buttons (Filled and Empty) */}
        {referenceImages.filter(r => 
          !((isMotionMode || isVideoMode) && (r.role === 'start' || r.role === 'end')) &&
          !(isMcMode && (r.role === 'mc_image' || r.role === 'mc_video'))
        ).map((img, idx) => {
          const originalIdx = referenceImages.indexOf(img);
          
          return (
            <ReferenceButton
              key={`${img.asset_id}-${idx}`}
              media={img}
              onRemove={() => onRemoveReference(originalIdx)}
              label={null} // Regular refs don't need role labels
            />
          );
        })}

        {/* --- DYNAMIC ADD BUTTONS BASED ON MODE --- */}

        {/* 1. Image Mode */}
        {!isMotionOrVideoMode && !isMcMode && maxRefs > 0 && (
          <StandardModeButtons 
            normalCount={normalCount} 
            maxRefs={maxRefs}
            generationMode={generationMode} 
            openDialog={openDialog} 
            hasRefs={hasRefs} 
          />
        )}

        {/* 2. Motion & Video Mode (Start & End frames) */}
        {isMotionOrVideoMode && (
          <MotionModeButtons 
            startFrame={startFrame} 
            endFrame={endFrame} 
            openDialog={openDialog} 
            onSwap={onSwapFrames}
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

        {/* Count badge when max reached for normal images */}
        {!isMotionOrVideoMode && !isMcMode && maxRefs > 0 && normalCount === maxRefs && (
          <span className="text-[11px] text-white/25 font-medium pl-1">max {maxRefs}</span>
        )}
      </div>

      {/* Divider — only visible when refs are present */}
      {hasRefs && (
        <div className="mx-3 mt-3 border-t border-white/[0.06]" />
      )}

      <ImportMediaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelect={(asset) => {
          onAddReference(asset, targetRole);
          if (['start', 'end', 'mc_image', 'mc_video'].includes(targetRole)) {
            setDialogOpen(false); // Close automatically for single roles
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
