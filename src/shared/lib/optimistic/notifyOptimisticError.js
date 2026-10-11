// [FSD Layer: shared/lib/optimistic] Unified error notification for optimistic mutations.
// Owns: displaying toast notification and recording structured log on optimistic rollback.
// Public: notifyOptimisticError(error, customMessage?, context?)

import { toast } from "sonner";
import { logger } from "@/shared/lib/logger";

const DEFAULT_ERROR_MESSAGE = "Action failed. Changes were reverted.";
const SENSITIVE_KEY_REGEX = /prompt|token|secret|password|apikey|api_key|bearer/i;

function sanitizeLogContext(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeLogContext);

  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEY_REGEX.test(k)) {
      out[k] = "[REDACTED]";
    } else if (v && typeof v === "object") {
      out[k] = sanitizeLogContext(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Notify user via toast and log structured error record when an optimistic mutation fails.
 *
 * @param {Error|any} error - The caught mutation error
 * @param {string|((err: any) => string)} [customMessage] - Optional custom message or message generator
 * @param {Record<string, any>} [context] - Additional metadata for logging (no secrets/prompts)
 * @returns {string} The displayed error message
 */
export function notifyOptimisticError(error, customMessage, context = {}) {
  let message;

  if (typeof customMessage === "function") {
    message = customMessage(error);
  } else if (typeof customMessage === "string" && customMessage.trim() !== "") {
    message = customMessage.trim();
  } else if (error?.message && typeof error.message === "string" && error.message.trim() !== "") {
    message = error.message.trim();
  } else {
    message = DEFAULT_ERROR_MESSAGE;
  }

  // 1. Toast UI feedback
  toast.error(message);

  // 2. Structured log (never log secrets, tokens, or prompts)
  logger.error("optimistic_mutation_failed", {
    message,
    error,
    ...sanitizeLogContext(context),
  });

  return message;
}
