"use client";

import React from "react";
import { MediaGridItem } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem";

/**
 * TrashMediaGridItem
 * Canonical decorator delegating directly to the unified MediaGridItem with trash lifecycle support.
 */
export function TrashMediaGridItem(props) {
  return <MediaGridItem isTrash={true} {...props} />;
}

export default TrashMediaGridItem;
