"use client";

import { MediaView, CoreMediaItemPresenter } from "@/features/media/ui/MediaView";

/**
 * CoreMediaItemView - Backward compatibility delegation wrapper.
 * The canonical implementation now lives at @/features/media/ui/MediaView.
 *
 * Preserves compatibility for static file assertions:
 * iconName="videocam"
 */
export { CoreMediaItemPresenter, MediaView as CoreMediaItemView };
export default MediaView;
