"use client";

import React from "react";
import { CoreMediaItemView } from "./CoreMediaItemView";

/**
 * MediaItemView
 * 
 * Simple, clean, lightweight media item display component powered directly by CoreMediaItemView.
 * Supports direct `mediaId` lookup from workflow or project contents.
 * 
 * Design & Behavior:
 * - Simple & clean: No default like button, no default video badge, no default menu ("ma8ir 7atta chay").
 * - Authentic aspect ratio: Preserves the natural/intrinsic ratio of the media without forcing a 1:1 fallback.
 * - Customizable slots: Designated slots (topLeft, topRight, etc.) available for context-specific actions.
 */
export function MediaItemView({
  // Media source props
  mediaId = null,
  item = null,
  workflow = null,
  src = null,
  isVideo = null,
  status = null,
  aspect = null,
  fit = "contain",

  // Clean defaults: NO like button, NO video badge, NO menu, NO hover overlay by default
  showLikedBadge = false,
  showVideoBadge = false,
  showMenu = false,
  showHoverOverlay = false,

  // Customization & slots
  className,
  mediaClassName,
  style,
  topLeft = null,
  topRight = null,
  bottomLeft = null,
  bottomRight = null,
  center = null,
  bottom = null,
  overlay = null,
  contextMenuItems = null,
  contextMenuContent = null,
  children,
  onClick,
  ...props
}) {
  return (
    <CoreMediaItemView
      mediaId={mediaId}
      item={item}
      workflow={workflow}
      src={src}
      isVideo={isVideo}
      status={status}
      aspect={aspect}
      fit={fit}
      showLikedBadge={showLikedBadge}
      showVideoBadge={showVideoBadge}
      showMenu={showMenu}
      showHoverOverlay={showHoverOverlay}
      className={className}
      mediaClassName={mediaClassName}
      style={style}
      topLeft={topLeft}
      topRight={topRight}
      bottomLeft={bottomLeft}
      bottomRight={bottomRight}
      center={center}
      bottom={bottom}
      overlay={overlay}
      contextMenuItems={contextMenuItems}
      contextMenuContent={contextMenuContent}
      onClick={onClick}
      {...props}
    >
      {children}
    </CoreMediaItemView>
  );
}

export default MediaItemView;
