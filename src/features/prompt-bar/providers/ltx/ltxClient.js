/**
 * LTX (Lightricks) Provider — Generation Client
 *
 * Handles routing generation requests to the LTX API v2.
 * Called by the Next.js API proxy route (/api/ltx/generate).
 *
 * LTX API: https://api.ltx.io/v2
 * Docs:    https://docs.ltx.io/quickstart
 */

const LTX_API_BASE = "https://api.ltx.io/v2";
const LTX_API_KEY = process.env.LTX_API_KEY;

/** Models that natively support first+last frame (image-to-video with last_frame_uri) */
const FRAME_MODELS = new Set([
  "ltx-2-3-pro",
  "ltx_2_3_pro",
  "ltx-2-3-fast",
  "ltx_2_3_fast",
]);

/**
 * Resolves a workflow asset reference to a publicly accessible URL.
 * Accepts: raw URL strings, workflow ID objects, or {url} objects.
 *
 * @param {any} val
 * @returns {string|null}
 */
function resolveImageUrl(val) {
  if (!val) return null;
  if (typeof val === "string") {
    // Direct URL
    if (val.startsWith("http://") || val.startsWith("https://")) return val;
    // Workflow ID — caller must resolve it upstream before calling here
    return null;
  }
  if (typeof val === "object") {
    return val.url || val.image_url || null;
  }
  return null;
}

const RESOLUTION_TIERS = {
  "720p":  { "16:9": "1280x720",  "9:16": "720x1280" },
  "1080p": { "16:9": "1920x1080", "9:16": "1080x1920" },
  "1440p": { "16:9": "2560x1440", "9:16": "1440x2560" },
  "4k":    { "16:9": "3840x2160", "9:16": "2160x3840" },
};

/**
 * Resolves resolution tier or WxH string.
 * @param {string} [rawRes]
 * @param {string} [aspectRatio="16:9"]
 * @returns {string}
 */
export function resolveLtxResolution(rawRes, aspectRatio = "16:9") {
  if (!rawRes) return aspectRatio === "9:16" ? "720x1280" : "1280x720";
  const str = String(rawRes).toLowerCase();
  if (/^\d+x\d+$/.test(str)) return str;
  const ratioKey = aspectRatio === "9:16" ? "9:16" : "16:9";
  return RESOLUTION_TIERS[str]?.[ratioKey] || (aspectRatio === "9:16" ? "720x1280" : "1280x720");
}

/**
 * Resolves duration to a safe, valid integer (defaults to 8 if omitted or invalid).
 * @param {any} rawDuration
 * @returns {number}
 */
export function resolveLtxDuration(rawDuration) {
  if (rawDuration === undefined || rawDuration === null || rawDuration === "") {
    return 8;
  }
  const parsed = typeof rawDuration === "number"
    ? rawDuration
    : parseInt(String(rawDuration).replace(/\D+/g, ""), 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : 8;
}

/**
 * Submits a video generation job to the LTX API.
 * Automatically routes to text-to-video or image-to-video based on payload.
 *
 * @param {object} payload — Serialized PromptBar payload
 * @param {string} payload.model       — LTX model ID (e.g. "ltx-2-5-pro")
 * @param {string} payload.prompt      — Text prompt
 * @param {object} payload.parameters  — { duration, resolution, fps, generate_audio, camera_motion, input_image, last_frame }
 * @returns {Promise<{ id: string, created_at: string }>}
 */
export async function submitLtxGeneration(payload) {
  if (!LTX_API_KEY) {
    throw new Error("[LTX] LTX_API_KEY environment variable is not set.");
  }

  const { model, prompt, parameters = {} } = payload;
  const {
    duration,
    resolution,
    aspect_ratio,
    fps,
    generate_audio,
    camera_motion,
    input_image,
    last_frame,
  } = parameters;

  const imageUrl = resolveImageUrl(input_image);
  const lastFrameUrl = resolveImageUrl(last_frame);

  // Route to image-to-video if a start frame is provided, otherwise text-to-video
  const endpoint = imageUrl ? "image-to-video" : "text-to-video";

  // Normalize model identifier: ltx_2_3_pro -> ltx-2-3-pro
  const providerModel = typeof model === "string" ? model.replace(/_/g, "-") : model;

  // Resolve duration as a required positive integer (defaults to 8s)
  const resolvedDuration = resolveLtxDuration(duration);

  // Resolve resolution tier or string
  const resolvedResolution = resolveLtxResolution(resolution, aspect_ratio || payload.aspect_ratio);

  /** @type {Record<string, any>} */
  const ltxPayload = {
    prompt,
    model: providerModel,
    duration: resolvedDuration,
    resolution: resolvedResolution,
  };

  // Optional common params
  if (fps !== undefined && fps !== null) ltxPayload.fps = Number(fps);
  if (generate_audio !== undefined && generate_audio !== null) ltxPayload.generate_audio = Boolean(generate_audio);
  if (camera_motion) ltxPayload.camera_motion = camera_motion;

  // Image-to-video specific
  if (imageUrl) {
    ltxPayload.image_uri = imageUrl;
    // First+Last frame (supported by ltx-2-3-*)
    if (lastFrameUrl && (FRAME_MODELS.has(model) || FRAME_MODELS.has(providerModel))) {
      ltxPayload.last_frame_uri = lastFrameUrl;
    }
  }

  const response = await fetch(`${LTX_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LTX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ltxPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData?.error?.message || `LTX API error: ${response.status} ${response.statusText}`;
    throw new Error(msg);
  }

  // LTX returns 202 with { id, created_at }
  return response.json();
}

/**
 * Polls the LTX job status until completion.
 *
 * @param {string} jobId
 * @param {"text-to-video"|"image-to-video"} endpoint
 * @param {{ pollIntervalMs?: number, maxAttempts?: number }} options
 * @returns {Promise<{ video_url: string }>}
 */
export async function pollLtxJob(jobId, endpoint, { pollIntervalMs = 5000, maxAttempts = 120 } = {}) {
  if (!LTX_API_KEY) {
    throw new Error("[LTX] LTX_API_KEY environment variable is not set.");
  }

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));

    const response = await fetch(`${LTX_API_BASE}/${endpoint}/${jobId}`, {
      headers: { "Authorization": `Bearer ${LTX_API_KEY}` },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `LTX poll error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "completed") {
      return data.result; // { video_url }
    }
    if (data.status === "failed") {
      throw new Error(data.error?.message || "LTX job failed");
    }
    // status: "pending" | "processing" → continue polling
  }

  throw new Error(`[LTX] Job ${jobId} did not complete within ${maxAttempts} poll attempts.`);
}

/**
 * Checks if a model ID belongs to the LTX provider.
 * @param {string} modelId
 * @returns {boolean}
 */
export function isLtxModel(modelId) {
  return typeof modelId === "string" && (modelId.startsWith("ltx-") || modelId.startsWith("ltx_"));
}
