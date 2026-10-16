"use client";

import {
  ReferenceMediaGalleryGrid,
  DEFAULT_REFERENCE_ROW_HEIGHT,
} from "../common/ReferenceMediaGalleryGrid";

/**
 * Backward compatibility shim for CharacterMediaGalleryGrid.
 * Delegated to canonical ReferenceMediaGalleryGrid.
 */
export const DEFAULT_CHARACTER_ROW_HEIGHT = DEFAULT_REFERENCE_ROW_HEIGHT;

export function CharacterMediaGalleryGrid(props) {
  return <ReferenceMediaGalleryGrid {...props} />;
}

export default CharacterMediaGalleryGrid;
