import { ImagePlus } from 'lucide-react';
import { ReferenceButton } from './ReferenceButton';

const SwapIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M4.57216 3.5C4.25657 3.5 4.00073 3.72386 4.00073 4C4.00073 4.27614 4.25657 4.5 4.57216 4.5L10.0498 4.5L8.73953 5.64645C8.51637 5.84171 8.51637 6.15829 8.73953 6.35355C8.96268 6.54882 9.32449 6.54882 9.54765 6.35355L11.8334 4.35355C12.0565 4.15829 12.0565 3.84171 11.8334 3.64645L9.54765 1.64645C9.32449 1.45118 8.96268 1.45118 8.73953 1.64645C8.51637 1.84171 8.51637 2.15829 8.73953 2.35355L10.0498 3.5L4.57216 3.5ZM9.42775 10.4997C9.74334 10.4997 9.99918 10.2759 9.99918 9.99972C9.99918 9.72358 9.74334 9.49972 9.42775 9.49972L3.95015 9.49972L5.26038 8.35328C5.48354 8.15802 5.48354 7.84143 5.26038 7.64617C5.03722 7.45091 4.67541 7.45091 4.45226 7.64617L2.16654 9.64617C1.94339 9.84143 1.94339 10.158 2.16654 10.3533L4.45226 12.3533C4.67541 12.5485 5.03722 12.5485 5.26038 12.3533C5.48354 12.158 5.48354 11.8414 5.26038 11.6462L3.95015 10.4997L9.42775 10.4997Z" fill="currentColor" />
  </svg>
);

export function MotionModeButtons({ 
  startFrame, 
  endFrame, 
  supportsEndFrame = true, 
  supportsSwap = true,
  openDialog, 
  onSwap, 
  onRemove,
  onUploadFromPC,
  uploading
}) {
  const hasBoth = !!(startFrame && endFrame);

  return (
    <div className="flex items-center gap-2">
      {/* Start Slot */}
      <ReferenceButton
        onClick={() => openDialog('image', 'start')}
        onUploadFromPC={onUploadFromPC}
        uploading={uploading}
        label={startFrame ? "Start" : "Add Start Frame"}
        icon={ImagePlus}
        media={startFrame}
        onRemove={() => onRemove('start')}
      />

      {/* Swap Button */}
      {supportsSwap && (
        <button
          type="button"
          onClick={onSwap}
          disabled={!hasBoth}
          title="Swap frames"
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
        >
          <SwapIcon />
        </button>
      )}

      {/* End Slot */}
      {supportsEndFrame && (
        <ReferenceButton
          onClick={() => openDialog('image', 'end')}
          onUploadFromPC={onUploadFromPC}
          uploading={uploading}
          label={endFrame ? "End" : "Add End Frame"}
          icon={ImagePlus}
          media={endFrame}
          onRemove={() => onRemove('end')}
        />
      )}
    </div>
  );
}
