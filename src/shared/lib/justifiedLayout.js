// Pure justified-row gallery layout engine (Google Photos / Google Flow style).
// Zero React/DOM dependencies — deterministic pixel math.

const DEFAULT_MIN_RATIO = 0.45;
const DEFAULT_MAX_RATIO = 2.5;
const DEFAULT_FALLBACK_RATIO = 1;

/**
 * Clamps an aspect ratio (width / height) to [min, max] with safe fallback for invalid values.
 * Covers 9:16 (0.5625) through 21:9 (2.333) safely without degenerate slivers.
 */
export function clampAspectRatio(
  ar,
  min = DEFAULT_MIN_RATIO,
  max = DEFAULT_MAX_RATIO
) {
  const num = Number(ar);
  if (!Number.isFinite(num) || num <= 0) {
    return Math.min(max, Math.max(min, DEFAULT_FALLBACK_RATIO));
  }
  return Math.min(max, Math.max(min, num));
}

function resolveItemAspectRatio(item, minRatio, maxRatio) {
  if (typeof item?.aspectRatio === "number" && Number.isFinite(item.aspectRatio) && item.aspectRatio > 0) {
    return clampAspectRatio(item.aspectRatio, minRatio, maxRatio);
  }
  const w = Number(item?.width);
  const h = Number(item?.height);
  if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
    return clampAspectRatio(w / h, minRatio, maxRatio);
  }
  return clampAspectRatio(DEFAULT_FALLBACK_RATIO, minRatio, maxRatio);
}

function buildJustifiedRow(rowEntries, sumAspect, containerWidth, gap) {
  const n = rowEntries.length;
  const totalGap = (n - 1) * gap;
  const availableWidth = Math.max(n, containerWidth - totalGap);
  const exactHeight = availableWidth / sumAspect;
  const height = Math.max(1, Math.round(exactHeight));

  let usedWidth = 0;
  const items = rowEntries.map((entry, idx) => {
    const isLast = idx === n - 1;
    const width = isLast
      ? Math.max(1, availableWidth - usedWidth)
      : Math.max(1, Math.round(exactHeight * entry.aspectRatio));
    usedWidth += width;
    return {
      item: entry.item,
      index: entry.index,
      width,
      height,
      aspectRatio: entry.aspectRatio,
    };
  });

  return { height, isJustified: true, items };
}

function buildUnjustifiedRow(rowEntries, sumAspect, containerWidth, targetRowHeight, gap) {
  const n = rowEntries.length;
  const totalGap = (n - 1) * gap;
  const availableWidth = Math.max(1, containerWidth - totalGap);
  const exactHeight = Math.min(targetRowHeight, availableWidth / sumAspect);
  const height = Math.max(1, Math.round(exactHeight));

  const items = rowEntries.map((entry) => ({
    item: entry.item,
    index: entry.index,
    width: Math.max(1, Math.round(exactHeight * entry.aspectRatio)),
    height,
    aspectRatio: entry.aspectRatio,
  }));

  return { height, isJustified: false, items };
}

/**
 * Computes edge-to-edge justified rows using greedy nearest-break packing.
 * Full rows fill 100.0% of containerWidth with exact pixel remainder absorption.
 * Incomplete last rows (or 1-2 item single rows) remain left-aligned at targetRowHeight
 * unless they naturally fill at least justifyLastRowThreshold without exceeding maxRowHeightMultiplier.
 */
export function computeJustifiedRows(items, containerWidth, options = {}) {
  const safeContainerWidth = Math.floor(Number(containerWidth));
  if (!Array.isArray(items) || items.length === 0 || !Number.isFinite(safeContainerWidth) || safeContainerWidth <= 0) {
    return { rows: [] };
  }

  const {
    targetRowHeight = 280,
    gap = 8,
    maxRowHeightMultiplier = 1.25,
    justifyLastRowThreshold = 0.72,
    minRatio = DEFAULT_MIN_RATIO,
    maxRatio = DEFAULT_MAX_RATIO,
  } = options;

  if (!Number.isFinite(targetRowHeight) || targetRowHeight <= 0) {
    return { rows: [] };
  }

  const safeGap = Math.max(0, Number.isFinite(gap) ? gap : 0);
  const maxRowHeight = targetRowHeight * maxRowHeightMultiplier;
  const rows = [];

  let currentRow = [];
  let currentSumAr = 0;

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const aspectRatio = resolveItemAspectRatio(item, minRatio, maxRatio);
    const entry = { item, index, aspectRatio };

    if (currentRow.length === 0) {
      currentRow.push(entry);
      currentSumAr = aspectRatio;
      continue;
    }

    const nextCount = currentRow.length + 1;
    const nextSumAr = currentSumAr + aspectRatio;
    const nextNaturalWidth = nextSumAr * targetRowHeight + (nextCount - 1) * safeGap;

    if (nextNaturalWidth < safeContainerWidth) {
      currentRow.push(entry);
      currentSumAr = nextSumAr;
      continue;
    }

    const hWithout = (safeContainerWidth - (currentRow.length - 1) * safeGap) / currentSumAr;
    const hWith = (safeContainerWidth - (nextCount - 1) * safeGap) / nextSumAr;

    if (hWithout <= maxRowHeight && Math.abs(hWithout - targetRowHeight) <= Math.abs(hWith - targetRowHeight)) {
      rows.push(buildJustifiedRow(currentRow, currentSumAr, safeContainerWidth, safeGap));
      currentRow = [entry];
      currentSumAr = aspectRatio;
    } else {
      currentRow.push(entry);
      currentSumAr = nextSumAr;
      rows.push(buildJustifiedRow(currentRow, currentSumAr, safeContainerWidth, safeGap));
      currentRow = [];
      currentSumAr = 0;
    }
  }

  if (currentRow.length > 0) {
    const n = currentRow.length;
    const totalGap = (n - 1) * safeGap;
    const naturalWidth = currentSumAr * targetRowHeight + totalGap;
    const justifiedHeight = (safeContainerWidth - totalGap) / currentSumAr;

    if (naturalWidth >= safeContainerWidth * justifyLastRowThreshold && justifiedHeight <= maxRowHeight) {
      rows.push(buildJustifiedRow(currentRow, currentSumAr, safeContainerWidth, safeGap));
    } else {
      rows.push(buildUnjustifiedRow(currentRow, currentSumAr, safeContainerWidth, targetRowHeight, safeGap));
    }
  }

  return { rows };
}
