"use client";

import {
  ReferenceMediaGalleryGrid,
  DEFAULT_REFERENCE_ROW_HEIGHT,
} from "../common/ReferenceMediaGalleryGrid";

/**
 * Backward compatibility shim for ElementMediaGalleryGrid.
 * Delegated to canonical ReferenceMediaGalleryGrid.
 */
export const DEFAULT_ELEMENT_ROW_HEIGHT = DEFAULT_REFERENCE_ROW_HEIGHT;

export function ElementMediaGalleryGrid(props) {
  return <ReferenceMediaGalleryGrid {...props} />;
}

export default ElementMediaGalleryGrid;
