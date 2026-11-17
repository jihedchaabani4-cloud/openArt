/**
 * spatialNavigation.js
 *
 * Geometric nearest-neighbor spatial navigation for fluid 2D grid/masonry layouts.
 * Computes exact Euclidean centroid distances and overlap weighting using getBoundingClientRect().
 */

/**
 * Finds the index of the nearest card in the specified arrow direction.
 * @param {HTMLElement} currentEl - The currently focused/highlighted DOM element.
 * @param {Array<HTMLElement>} cardElements - All candidate card DOM elements in order.
 * @param {('ArrowDown'|'ArrowUp'|'ArrowLeft'|'ArrowRight')} direction - Navigation direction.
 * @returns {number} The index of the nearest card, or -1 if no valid card exists in that direction.
 */
export function findNearestCard(currentEl, cardElements, direction) {
  if (!currentEl || !Array.isArray(cardElements) || cardElements.length === 0) {
    return -1;
  }

  const currentRect = currentEl.getBoundingClientRect();
  const c1 = {
    x: currentRect.left + currentRect.width / 2,
    y: currentRect.top + currentRect.height / 2,
  };

  let bestIndex = -1;
  let bestScore = Infinity;

  cardElements.forEach((el, idx) => {
    if (!el || el === currentEl) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return; // ignore hidden or unmeasured elements

    const c2 = {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
    };

    if (direction === "ArrowDown") {
      // Must be visually below current card
      if (r.top >= currentRect.bottom - 10) {
        const dy = c2.y - c1.y;
        const dx = Math.abs(c2.x - c1.x);
        const overlap = Math.max(
          0,
          Math.min(currentRect.right, r.right) - Math.max(currentRect.left, r.left)
        );
        // Heavily prioritize cards with horizontal overlap or closest horizontal center
        const score = dy + dx * 2.2 - overlap * 1.8;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = idx;
        }
      }
    } else if (direction === "ArrowUp") {
      // Must be visually above current card
      if (r.bottom <= currentRect.top + 10) {
        const dy = c1.y - c2.y;
        const dx = Math.abs(c2.x - c1.x);
        const overlap = Math.max(
          0,
          Math.min(currentRect.right, r.right) - Math.max(currentRect.left, r.left)
        );
        const score = dy + dx * 2.2 - overlap * 1.8;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = idx;
        }
      }
    } else if (direction === "ArrowRight") {
      // Must be visually to the right
      if (r.left >= currentRect.right - 10) {
        const dx = c2.x - c1.x;
        const dy = Math.abs(c2.y - c1.y);
        const overlap = Math.max(
          0,
          Math.min(currentRect.bottom, r.bottom) - Math.max(currentRect.top, r.top)
        );
        // Heavily penalize vertical distance so horizontal stays on same row
        const score = dx + dy * 3.5 - overlap * 2.0;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = idx;
        }
      }
    } else if (direction === "ArrowLeft") {
      // Must be visually to the left
      if (r.right <= currentRect.left + 10) {
        const dx = c1.x - c2.x;
        const dy = Math.abs(c2.y - c1.y);
        const overlap = Math.max(
          0,
          Math.min(currentRect.bottom, r.bottom) - Math.max(currentRect.top, r.top)
        );
        const score = dx + dy * 3.5 - overlap * 2.0;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = idx;
        }
      }
    }
  });

  return bestIndex;
}

/**
 * Checks whether the current card is at the leftmost edge of its visual row.
 * Used to decide if pressing ArrowLeft should hand off focus to the Category Sidebar.
 * @param {HTMLElement} currentEl - The currently focused card element.
 * @param {Array<HTMLElement>} cardElements - All card elements.
 * @returns {boolean} True if no other card exists to the left in the same visual row.
 */
export function isLeftmostCard(currentEl, cardElements) {
  if (!currentEl || !Array.isArray(cardElements) || cardElements.length === 0) {
    return true;
  }

  const currentRect = currentEl.getBoundingClientRect();

  return !cardElements.some((el) => {
    if (!el || el === currentEl) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;

    // Check if there is visual vertical overlap with this card (same row)
    const verticalOverlap =
      Math.min(currentRect.bottom, r.bottom) - Math.max(currentRect.top, r.top);

    // If it shares the row and its right boundary is to the left of our left boundary
    return verticalOverlap > 15 && r.right <= currentRect.left + 10;
  });
}
