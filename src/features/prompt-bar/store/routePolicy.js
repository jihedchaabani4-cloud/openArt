/**
 * Prompt Bar Platform — Route Policy
 *
 * Pure pattern matching for route-based persistence (PB-D-14).
 * Determines whether the prompt bar state should persist or reset based on pathname navigation.
 * No React, no store state, no side effects.
 */

/**
 * Normalizes a route path or pattern into an array of path segments.
 * Removes query strings, hashes, leading/trailing whitespace, and empty segments.
 *
 * @param {string} rawPath - Pathname or route pattern
 * @returns {string[]} Array of normalized segments
 */
export function normalizePathSegments(rawPath) {
  if (!rawPath || typeof rawPath !== "string") {
    return [];
  }

  // Strip query string and fragment/hash
  const clean = rawPath.split("?")[0].split("#")[0].trim();

  // Strip leading and trailing slashes
  const trimmedSlashes = clean.replace(/^\/+|\/+$/g, "");
  if (!trimmedSlashes) {
    return [];
  }

  return trimmedSlashes.split("/").filter(Boolean);
}

/**
 * Matches a route pattern against an actual pathname.
 *
 * Syntax:
 * - `:segmentName` matches exactly one segment
 * - `/*` at the end matches the prefix and any sub-path below it
 * - Trailing slashes and query parameters are ignored
 *
 * @param {string} pattern - Pattern string (e.g. "/cinema-studio/:projectId/assets")
 * @param {string} pathname - Real browser pathname (e.g. "/cinema-studio/p1/assets")
 * @returns {boolean} True if pathname matches pattern
 */
export function matchRoute(pattern, pathname) {
  if (!pattern || typeof pattern !== "string") return false;
  if (!pathname || typeof pathname !== "string") return false;

  const trimmedPattern = pattern.trim();
  const isPrefixWildcard = trimmedPattern === "/*" || trimmedPattern.endsWith("/*");

  const basePatternStr = isPrefixWildcard
    ? trimmedPattern.replace(/\/\*$/, "")
    : trimmedPattern;

  const patternSegments = normalizePathSegments(basePatternStr);
  const pathSegments = normalizePathSegments(pathname);

  if (isPrefixWildcard) {
    if (pathSegments.length < patternSegments.length) {
      return false;
    }
    for (let i = 0; i < patternSegments.length; i++) {
      const pSeg = patternSegments[i];
      const actualSeg = pathSegments[i];
      if (pSeg.startsWith(":")) {
        if (!actualSeg) return false;
      } else if (pSeg !== actualSeg) {
        return false;
      }
    }
    return true;
  }

  if (patternSegments.length !== pathSegments.length) {
    return false;
  }

  for (let i = 0; i < patternSegments.length; i++) {
    const pSeg = patternSegments[i];
    const actualSeg = pathSegments[i];
    if (pSeg.startsWith(":")) {
      if (!actualSeg) return false;
    } else if (pSeg !== actualSeg) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluates whether a pathname is allowed according to a list of route patterns.
 * If patterns is omitted, null, or empty array, returns true ("always allowed").
 *
 * @param {string} pathname - Actual browser pathname
 * @param {string[]} [patterns] - Array of allowed route patterns
 * @returns {boolean} True if navigation/persistence is allowed
 */
export function isPathAllowed(pathname, patterns) {
  if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
    return true;
  }

  return patterns.some((pattern) => matchRoute(pattern, pathname));
}
