/**
 * Prompt Bar Platform — Tags Resolver
 *
 * Handles parsing, serialization, and resolution of prompt tags.
 * Pure JS, zero DOM, zero React.
 */


/**
 * Formats an asset ID and optional type into canonical tag syntax.
 * Matches the backend promptBuilderNode expectations:
 * - character -> <character:id>
 * - element   -> <element:id>
 * - media/all -> <MediaAsset:id>
 *
 * @param {string} assetId - Canonical UUID/workflow ID
 * @param {string} [assetType="media"] - "character" | "element" | "media"
 * @returns {string} Serialized tag token
 */
export function serializeTag(assetId, assetType = "media") {
  if (!assetId) return "";
  const normalizedType = String(assetType || "media").toLowerCase();
  if (normalizedType.includes("character")) {
    return `<character:${assetId}>`;
  }
  if (normalizedType.includes("element")) {
    return `<element:${assetId}>`;
  }
  return `<MediaAsset:${assetId}>`;
}

/**
 * Parses all media and entity tags from a prompt string.
 *
 * @param {string} prompt - Raw prompt string
 * @returns {Array<{ raw: string, type: string, assetId: string, index: number }>}
 */
export function parsePromptTags(prompt = "") {
  if (!prompt || typeof prompt !== "string") return [];

  const PARSE_REGEX = /<(character|element|MediaAsset|media|ref|reference):\s*([^>]+)>/gi;
  const tags = [];
  let match;

  while ((match = PARSE_REGEX.exec(prompt)) !== null) {
    tags.push({
      raw: match[0],
      type: match[1].toLowerCase(),
      assetId: match[2].trim(),
      index: match.index,
    });
  }

  return tags;
}

/**
 * Resolves prompt tags against active references.
 * Separates valid linked tags from orphan tags.
 *
 * @param {string} prompt
 * @param {Array<object>} activeReferences - Output from tagsService.getActiveReferences()
 * @returns {{ validTags: Array<object>, orphanTags: Array<object> }}
 */
export function resolveTagsWithReferences(prompt = "", activeReferences = []) {
  const parsed = parsePromptTags(prompt);
  const refMap = new Map();
  for (const ref of activeReferences) {
    if (ref.assetId) refMap.set(ref.assetId, ref);
  }

  const validTags = [];
  const orphanTags = [];

  for (const tag of parsed) {
    const matchedRef = refMap.get(tag.assetId);
    if (matchedRef) {
      validTags.push({
        ...tag,
        reference: matchedRef,
      });
    } else {
      orphanTags.push(tag);
    }
  }

  return { validTags, orphanTags };
}
