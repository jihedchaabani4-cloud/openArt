/**
 * creditCalculationService.js
 *
 * Single source of truth in the frontend for estimating generation credit cost.
 * Exactly mirrors the backend Models Management System pricing engine:
 * `apiOpenArt/src/models/pricing/pricingEngine.js` -> calculateRetailCredits.
 *
 * ── 100% Dynamic & Model-Agnostic ──────────────────────────────────────────
 * - ZERO hardcoded model names or fixed parameter keys.
 * - Reads model.parameters defaults defined by the provider manifest.
 * - Dynamically scans ALL active parameter values against model.pricing.table.
 * - Supports compound keys (e.g. "1k:high", "2k:medium").
 * - Multiplies cleanly by output count (variations).
 * ────────────────────────────────────────────────────────────────────────────
 */

/**
 * Calculates retail credit cost for any model dynamically based on its provider definition.
 *
 * @param {object} model - Model object (from /api/models or store)
 * @param {object} [params={}] - User-selected parameter values (duration, resolution, etc.)
 * @param {number} [count=1] - Number of outputs / variations (default: 1)
 * @returns {number} Estimated credit cost (integer >= 0)
 */
export function calculateModelCredits(model, params = {}, count = 1) {
  if (!model) return 0;

  const qty = Math.max(1, Number(count) || 1);
  const pricing = model.pricing || model.retailPricing;

  // 1. Fixed price models (e.g. LLM or fixed-price tools)
  if (typeof pricing?.fixedPrice === "number") {
    return pricing.fixedPrice * qty;
  }

  const table = pricing?.table;
  if (!table || typeof table !== "object") {
    // Domain fallback if no pricing table is declared
    const domain = (model.domain || model.category || model.type || "").toLowerCase();
    const fallbackBase = domain === "video" ? 20 : domain === "llm" ? 1 : 10;
    return fallbackBase * qty;
  }

  // 2. Resolve default parameter values from model.parameters definition
  const resolvedParams = {};
  if (model.parameters && typeof model.parameters === "object") {
    for (const [key, def] of Object.entries(model.parameters)) {
      if (def?.default !== undefined) {
        resolvedParams[key] = def.default;
      }
    }
  }
  // User selections override defaults
  Object.assign(resolvedParams, params);

  // 3. Check compound keys (e.g. "resolution:quality" -> "1k:high", "2k:medium")
  const resolution = resolvedParams.resolution || resolvedParams.videoResolution;
  const quality = resolvedParams.quality;
  if (resolution && quality) {
    const compoundKey = `${resolution}:${quality}`.toLowerCase().trim();
    if (Object.prototype.hasOwnProperty.call(table, compoundKey)) {
      return Number(table[compoundKey]) * qty;
    }
  }

  // 4. Dynamically scan ALL parameter values against table keys
  for (const [key, val] of Object.entries(resolvedParams)) {
    if (val === undefined || val === null || val === "") continue;

    const strVal = String(val).trim();
    const cleanNum = strVal.replace(/\s*s$/i, "").trim(); // strip 's' suffix (e.g. "8s" -> "8")
    const lower = strVal.toLowerCase();

    // Exact string match
    if (Object.prototype.hasOwnProperty.call(table, strVal)) {
      return Number(table[strVal]) * qty;
    }
    // Clean numeric string match (e.g. duration "8" for "8s")
    if (cleanNum !== strVal && Object.prototype.hasOwnProperty.call(table, cleanNum)) {
      return Number(table[cleanNum]) * qty;
    }
    // Lowercase match
    if (lower !== strVal && Object.prototype.hasOwnProperty.call(table, lower)) {
      return Number(table[lower]) * qty;
    }
  }

  // 5. Fallback to table.default if declared in the provider's pricing table
  if (table.default !== undefined) {
    return Number(table.default) * qty;
  }

  // 6. First numeric entry in table as last resort
  const firstNumeric = Object.values(table).find((v) => typeof v === "number");
  if (firstNumeric !== undefined) {
    return Number(firstNumeric) * qty;
  }

  return 10 * qty;
}

/**
 * Formats credit cost string for UI display.
 * @param {number} credits
 * @returns {string}
 */
export function formatCredits(credits) {
  const c = Number(credits) || 0;
  return `${c} ${c === 1 ? "crédit" : "crédits"}`;
}
