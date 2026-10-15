/**
 * Shared Model Fixtures for Prompt Bar Tests (SAFE-1)
 *
 * Provides raw backend model manifests and dynamically normalized ModelContracts
 * using the real `adaptBackendModel` normalizer.
 *
 * Model Shapes:
 * 1. frames: video domain with prompt, input_image, last_frame, duration (5, 10), aspect_ratio, resolution (Seedance 2.5)
 * 2. imagesList: image domain with prompt, images (array max 14), input_image, resolution, aspect_ratio (NanoBanana Pro)
 * 3. promptOnly: image domain with prompt, resolution, aspect_ratio (Seedream V5)
 */

import { adaptBackendModel } from "../../core/modelManagement.js";

export const rawFramesModel = {
  id: "seedance_2_5",
  name: "ByteDance Seedance 2.5",
  domain: "video",
  parameters: {
    prompt: { type: "string" },
    input_image: { type: "string" },
    last_frame: { type: "string" },
    duration: {
      type: "select",
      values: [
        { value: 5, label: "5s" },
        { value: 10, label: "10s" },
      ],
      default: 5,
    },
    aspect_ratio: {
      type: "select",
      values: [
        { value: "16:9", label: "16:9" },
        { value: "9:16", label: "9:16" },
      ],
      default: "16:9",
    },
    resolution: {
      type: "select",
      values: [
        { value: "720p", label: "720p" },
        { value: "1080p", label: "1080p" },
      ],
      default: "720p",
    },
  },
};

export const rawImagesListModel = {
  id: "nanobana_pro",
  name: "NanoBanana Pro",
  domain: "image",
  parameters: {
    prompt: { type: "string" },
    images: { type: "array", max: 14 },
    input_image: { type: "string" },
    resolution: {
      type: "select",
      values: [
        { value: "1K", label: "1K" },
        { value: "2K", label: "2K" },
      ],
      default: "1K",
    },
    aspect_ratio: {
      type: "select",
      values: [
        { value: "1:1", label: "1:1" },
        { value: "16:9", label: "16:9" },
        { value: "9:16", label: "9:16" },
      ],
      default: "1:1",
    },
  },
};

export const rawPromptOnlyModel = {
  id: "seedream_v5",
  name: "ByteDance Seedream V5.0 Pro",
  domain: "image",
  parameters: {
    prompt: { type: "string" },
    resolution: {
      type: "select",
      values: [
        { value: "1K", label: "1K" },
        { value: "2K", label: "2K" },
      ],
      default: "1K",
    },
    aspect_ratio: {
      type: "select",
      values: [
        { value: "1:1", label: "1:1" },
        { value: "16:9", label: "16:9" },
        { value: "4:3", label: "4:3" },
      ],
      default: "1:1",
    },
  },
};

export const normalizedFramesModel = adaptBackendModel(rawFramesModel);
export const normalizedImagesListModel = adaptBackendModel(rawImagesListModel);
export const normalizedPromptOnlyModel = adaptBackendModel(rawPromptOnlyModel);

export const fixtureModels = [
  normalizedFramesModel,
  normalizedImagesListModel,
  normalizedPromptOnlyModel,
];

export const rawFixtureModels = [
  rawFramesModel,
  rawImagesListModel,
  rawPromptOnlyModel,
];
