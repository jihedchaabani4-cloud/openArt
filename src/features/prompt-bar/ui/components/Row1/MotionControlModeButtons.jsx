import React from 'react';
import { ReferenceButton } from './ReferenceButton';

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

export function MotionControlModeButtons({ imageRef, videoRef, openDialog, onRemove }) {
  return (
    <div className="flex gap-2">
      <ReferenceButton
        onClick={() => openDialog('video', 'mc_video')}
        label={videoRef ? "Vid Ref" : "Video Reference"}
        icon={VideoCustomIcon}
        media={videoRef}
        onRemove={() => onRemove('mc_video')}
      />

      <ReferenceButton
        onClick={() => openDialog('image', 'mc_image')}
        label={imageRef ? "Img Ref" : "Image Reference"}
        icon={ImageUpIcon}
        media={imageRef}
        onRemove={() => onRemove('mc_image')}
      />
    </div>
  );
}
