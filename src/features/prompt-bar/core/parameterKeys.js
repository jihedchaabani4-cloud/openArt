/**
 * Canonical parameter keys and media type definitions for PromptBar.
 */

export const PARAM = Object.freeze({
  INPUT_IMAGE: "input_image",
  LAST_FRAME: "last_frame",
  IMAGES: "images",
  START_FRAME: "start_frame",
  END_FRAME: "end_frame",
  REFERENCE_IMAGES: "reference_images",
  INPUT_VIDEO: "input_video",
  REFERENCE_VIDEOS: "reference_videos",
  ASPECT_RATIO: "aspect_ratio",
  DURATION: "duration",
  IMAGE_URL: "image_url",
  MASK: "mask",
  RATIO: "ratio",
});

export const MEDIA_TYPES = Object.freeze({
  IMAGE: "image",
  IMAGE_ARRAY: "image[]",
  VIDEO: "video",
  VIDEO_ARRAY: "video[]",
});

const VALID_MEDIA_TYPES = new Set(Object.values(MEDIA_TYPES));

/** Checks whether a parameter type represents a media input. */
export function isMediaType(type) {
  if (typeof type !== "string") return false;
  return VALID_MEDIA_TYPES.has(type);
}
