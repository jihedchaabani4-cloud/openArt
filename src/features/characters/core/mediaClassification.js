/**
 * Character media classification
 *
 * Single source of truth for deciding whether a workflow media item is a
 * character sheet/turnaround or a detail/reference image.
 *
 * Explicit roles always win. The legacy `step_id` fallbacks only apply when the
 * item carries no role at all, so `{ role: "detail", step_id: "image_generation" }`
 * is a detail image and never a sheet.
 */

export const isSheetMedia = (m) =>
  m?.role === "sheet" ||
  m?.role === "turnaround" ||
  m?.mediaRole === "sheet" ||
  m?.mediaRole === "turnaround" ||
  m?.raw?.role === "sheet" ||
  m?.raw?.role === "turnaround" ||
  (!m?.role && !m?.mediaRole && !m?.raw?.role && (
    m?.step_id === "character_sheet" ||
    m?.raw?.step_id === "character_sheet" ||
    m?.step_id === "image_generation" ||
    m?.raw?.step_id === "image_generation" ||
    m?.step_id === "CAE" ||
    m?.raw?.step_id === "CAE"
  ));

export const isDetailMedia = (m) =>
  !isSheetMedia(m) && (
    m?.role === "detail" ||
    m?.role === "reference" ||
    m?.mediaRole === "detail" ||
    m?.mediaRole === "reference" ||
    m?.raw?.role === "detail" ||
    m?.raw?.role === "reference" ||
    (!m?.role && !m?.mediaRole && !m?.raw?.role && (
      m?.step_id === "character_detail" ||
      m?.raw?.step_id === "character_detail" ||
      m?.step_id === "upload" ||
      m?.raw?.step_id === "upload"
    ))
  );
