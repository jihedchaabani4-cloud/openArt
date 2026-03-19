import { ImagePlus } from 'lucide-react';
import { ReferenceButton } from './ReferenceButton';

export function StandardModeButtons({ normalCount, maxRefs = 4, generationMode, openDialog, hasRefs }) {
  if (normalCount >= maxRefs) return null;

  return (
    <ReferenceButton
      onClick={() => openDialog(generationMode === 'video' ? 'all' : 'image', 'normal')}
      label={`Add ${generationMode === 'video' ? 'Image/Video' : 'Image'}`}
      isCompact={hasRefs}
      icon={ImagePlus}
    />
  );
}
