/**
 * Canonical command result envelope and failure reasons for PromptBar service actions.
 */

export const REASONS = Object.freeze({
  NOT_MOUNTED: "NOT_MOUNTED",
  PROJECT_MISMATCH: "PROJECT_MISMATCH",
  NO_ELIGIBLE_MODEL: "NO_ELIGIBLE_MODEL",
  NO_SLOT_FOR_ROLE: "NO_SLOT_FOR_ROLE",
  MAX_MEDIA_REACHED: "MAX_MEDIA_REACHED",
  DUPLICATE_MEDIA: "DUPLICATE_MEDIA",
  TYPE_NOT_ALLOWED: "TYPE_NOT_ALLOWED",
  UNKNOWN_MODEL: "UNKNOWN_MODEL",
  INVALID_ARGUMENT: "INVALID_ARGUMENT",
});

const VALID_REASONS = new Set(Object.values(REASONS));

/** Returns a successful command result with an optional state patch and additional metadata. */
export function ok(patch = {}, extra = {}) {
  return { ok: true, patch, ...extra };
}

/** Returns a failed command result with a canonical reason code and optional diagnostic details. */
export function fail(reason, details = {}) {
  if (process.env.NODE_ENV !== "production" && !VALID_REASONS.has(reason)) {
    throw new Error(`Unknown command failure reason: "${reason}". Must be one of REASONS.`);
  }
  return { ok: false, reason, details };
}
