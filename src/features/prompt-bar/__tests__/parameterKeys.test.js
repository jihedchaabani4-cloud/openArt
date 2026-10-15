/**
 * Contract tests for parameterKeys constants and isMediaType helper (Task C1).
 */

import { describe, it, expect } from "vitest";
import { PARAM, MEDIA_TYPES, isMediaType } from "../core/parameterKeys.js";

describe("C1: parameterKeys Contract", () => {
  it("exports frozen PARAM object containing all canonical parameter keys", () => {
    expect(Object.isFrozen(PARAM)).toBe(true);
    expect(PARAM.INPUT_IMAGE).toBe("input_image");
    expect(PARAM.LAST_FRAME).toBe("last_frame");
    expect(PARAM.IMAGES).toBe("images");
    expect(PARAM.START_FRAME).toBe("start_frame");
    expect(PARAM.END_FRAME).toBe("end_frame");
    expect(PARAM.REFERENCE_IMAGES).toBe("reference_images");
    expect(PARAM.INPUT_VIDEO).toBe("input_video");
    expect(PARAM.REFERENCE_VIDEOS).toBe("reference_videos");
    expect(PARAM.ASPECT_RATIO).toBe("aspect_ratio");
    expect(PARAM.DURATION).toBe("duration");
    expect(PARAM.IMAGE_URL).toBe("image_url");
    expect(PARAM.MASK).toBe("mask");
    expect(PARAM.RATIO).toBe("ratio");
  });

  it("exports frozen MEDIA_TYPES object with image, image[], video, video[]", () => {
    expect(Object.isFrozen(MEDIA_TYPES)).toBe(true);
    expect(MEDIA_TYPES.IMAGE).toBe("image");
    expect(MEDIA_TYPES.IMAGE_ARRAY).toBe("image[]");
    expect(MEDIA_TYPES.VIDEO).toBe("video");
    expect(MEDIA_TYPES.VIDEO_ARRAY).toBe("video[]");
  });

  it("isMediaType accurately identifies declared media types and rejects non-media types", () => {
    expect(isMediaType("image")).toBe(true);
    expect(isMediaType("image[]")).toBe(true);
    expect(isMediaType("video")).toBe(true);
    expect(isMediaType("video[]")).toBe(true);

    expect(isMediaType("string")).toBe(false);
    expect(isMediaType("number")).toBe(false);
    expect(isMediaType("boolean")).toBe(false);
    expect(isMediaType("enum")).toBe(false);
    expect(isMediaType("array")).toBe(false);
    expect(isMediaType("")).toBe(false);
    expect(isMediaType(null)).toBe(false);
    expect(isMediaType(undefined)).toBe(false);
    expect(isMediaType(123)).toBe(false);
  });
});
