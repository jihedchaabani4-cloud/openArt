/**
 * Frontend Upload Policies & Client-Side Pre-flight Validation (ADR-0012, Ticket 07)
 *
 * NOTE: maxFilesPerRequest is a per-request HTTP/upload batch limit only.
 * It is strictly distinct from domain entity quotas (ELEMENT_MAX_MEDIA = 6
 * and CHARACTER_MAX_DETAIL_MEDIA = 5), even where numbers match.
 *
 * This module mirrors the backend platform UploadPolicy presets to provide
 * instantaneous client-side UX validation and file-picker constraints before network calls.
 * The backend remains the authoritative source of trust.
 */

const MB = 1024 * 1024;

export const MAX_BATCH_UPLOAD_FILES = 15;

function freezePolicy(policy) {
  if (Array.isArray(policy.allowedTypes)) {
    Object.freeze(policy.allowedTypes);
  }
  if (Array.isArray(policy.allowedMimeTypes)) {
    Object.freeze(policy.allowedMimeTypes);
  }
  return Object.freeze(policy);
}

export const DEFAULT_UPLOAD_POLICY = freezePolicy({
  allowedTypes: ["image", "video"],
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ],
  maxImageSize: 20 * MB,
  maxVideoSize: 100 * MB,
  maxFilesPerRequest: 1,
});

export const ELEMENT_REFERENCE_UPLOAD_POLICY = freezePolicy({
  allowedTypes: ["image"],
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  maxImageSize: 20 * MB,
  maxVideoSize: 0,
  maxFilesPerRequest: 6,
});

export const ELEMENT_SHEET_UPLOAD_POLICY = freezePolicy({
  ...ELEMENT_REFERENCE_UPLOAD_POLICY,
  maxFilesPerRequest: 1,
});

export const CHARACTER_SHEET_UPLOAD_POLICY = freezePolicy({
  ...ELEMENT_REFERENCE_UPLOAD_POLICY,
  maxFilesPerRequest: 1,
});

export const CHARACTER_DETAIL_UPLOAD_POLICY = freezePolicy({
  ...ELEMENT_REFERENCE_UPLOAD_POLICY,
  maxFilesPerRequest: 5,
});

export const UPLOAD_POLICIES = Object.freeze({
  DEFAULT_UPLOAD_POLICY,
  ELEMENT_REFERENCE_UPLOAD_POLICY,
  ELEMENT_SHEET_UPLOAD_POLICY,
  CHARACTER_SHEET_UPLOAD_POLICY,
  CHARACTER_DETAIL_UPLOAD_POLICY,
});

/**
 * Returns a comma-separated string of allowed MIME types suitable for HTML `<input accept="...">`.
 *
 * @param {typeof DEFAULT_UPLOAD_POLICY} policy
 * @returns {string}
 */
export function getAcceptedMimeTypes(policy = DEFAULT_UPLOAD_POLICY) {
  return policy?.allowedMimeTypes?.join(",") || "image/*";
}

/**
 * Pure client-side UX pre-flight validation helper.
 * Validates file list against a policy preset before dispatching network requests.
 *
 * @param {File | File[] | FileList} filesOrFile - Files to validate
 * @param {typeof DEFAULT_UPLOAD_POLICY} policy  - UploadPolicy preset
 * @param {Object} [options]
 * @param {number} [options.maxFiles]            - Optional dynamic remaining quota capacity
 * @returns {{
 *   valid: boolean,
 *   errors: Array<{ file?: File, code: string, message: string }>,
 *   message: string | null
 * }}
 */
export function validateFilesAgainstPolicy(filesOrFile, policy = DEFAULT_UPLOAD_POLICY, { maxFiles } = {}) {
  const errors = [];
  if (!filesOrFile) {
    return { valid: true, errors: [], message: null };
  }

  const files = Array.isArray(filesOrFile)
    ? filesOrFile
    : (typeof filesOrFile[Symbol.iterator] === "function" || typeof filesOrFile.length === "number")
    ? Array.from(filesOrFile)
    : [filesOrFile];

  if (files.length === 0) {
    return { valid: true, errors: [], message: null };
  }

  const effectiveMaxFiles = typeof maxFiles === "number"
    ? Math.min(policy.maxFilesPerRequest, maxFiles)
    : policy.maxFilesPerRequest;

  if (files.length > effectiveMaxFiles) {
    errors.push({
      code: "MAX_FILES_EXCEEDED",
      message: `Too many files selected (${files.length}). Maximum allowed is ${effectiveMaxFiles}.`,
    });
  }

  for (const file of files) {
    const rawType = (file?.type || "").toLowerCase().trim();
    const isVideo = rawType.startsWith("video/") || policy.allowedTypes?.includes("video") && /\.(mp4|webm|mov)$/i.test(file?.name || "");

    // 1. MIME / type verification
    const isMimeAllowed = policy.allowedMimeTypes?.some((allowed) => {
      if (allowed === rawType) return true;
      if (allowed.endsWith("/*")) {
        const prefix = allowed.slice(0, -1);
        return rawType.startsWith(prefix);
      }
      return false;
    });

    if (!isMimeAllowed) {
      errors.push({
        file,
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: `"${file?.name || "File"}" has an unsupported file type (${rawType || "unknown"}). Allowed types: ${policy.allowedMimeTypes.join(", ")}.`,
      });
      continue;
    }

    // 2. Size verification
    if (isVideo) {
      if (!policy.allowedTypes.includes("video") || policy.maxVideoSize === 0) {
        errors.push({
          file,
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: `Videos are not permitted for this upload. Allowed types: ${policy.allowedMimeTypes.join(", ")}.`,
        });
      } else if (file?.size > policy.maxVideoSize) {
        const maxMb = Math.round(policy.maxVideoSize / MB);
        errors.push({
          file,
          code: "FILE_TOO_LARGE",
          message: `"${file?.name || "Video"}" exceeds the maximum video size of ${maxMb} MB.`,
        });
      }
    } else {
      if (file?.size > policy.maxImageSize) {
        const maxMb = Math.round(policy.maxImageSize / MB);
        errors.push({
          file,
          code: "FILE_TOO_LARGE",
          message: `"${file?.name || "Image"}" exceeds the maximum image size of ${maxMb} MB.`,
        });
      }
    }
  }

  const valid = errors.length === 0;
  return {
    valid,
    errors,
    message: valid ? null : errors[0]?.message || "Validation failed",
  };
}

export default UPLOAD_POLICIES;
