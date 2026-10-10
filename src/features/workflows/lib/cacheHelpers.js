// Shared cache-patching helpers for React Query optimistic updates.
// Bodies copied VERBATIM from inline sites (Phase A rules: zero behavior change).
// Use these only across ≥2 future split-hook files; single-file logic stays inline.

/**
 * Strip the legacy "workflows/" prefix from IDs.
 * Inline body source — identical across 16 migrated call sites:
 *   workflowsApi L419/L426/L435/L453-L454/L469-L470,
 *   useCharacter L165/L175-L176/L191/L337,
 *   useElement L388.
 */
export function stripWorkflowPrefix(id) {
  return String(id ?? "").replace(/^workflows\//, "");
}

/**
 * Strict two-field identity match for a media item.
 * Inline body — identical across 9 migrated call sites:
 *   workflowsApi L312 (useToggleLike map),
 *   mediaApi L386 find / L390 filter,
 *   useCharacter L35/L39/L411/L420/L421/L443.
 */
export function matchMediaId(media, targetId) {
  if (!media || targetId == null) return false;
  return media.id === targetId || media.name === targetId;
}
