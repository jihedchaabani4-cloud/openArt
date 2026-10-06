import test from "node:test";
import assert from "node:assert/strict";
import { findNearestCard, isLeftmostCard } from "../spatialNavigation.js";

function createMockElement(rect) {
  return {
    getBoundingClientRect: () => ({
      left: rect.left,
      top: rect.top,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      width: rect.width,
      height: rect.height,
    }),
  };
}

test("Spatial Navigation: findNearestCard 2x2 grid navigation", () => {
  // Grid layout:
  // [0: (0,0, 100x100)]   [1: (120,0, 100x100)]
  // [2: (0,120, 100x100)] [3: (120,120, 100x100)]
  const cards = [
    createMockElement({ left: 0, top: 0, width: 100, height: 100 }),
    createMockElement({ left: 120, top: 0, width: 100, height: 100 }),
    createMockElement({ left: 0, top: 120, width: 100, height: 100 }),
    createMockElement({ left: 120, top: 120, width: 100, height: 100 }),
  ];

  // From card 0:
  // ArrowRight -> card 1
  assert.equal(findNearestCard(cards[0], cards, "ArrowRight"), 1);
  // ArrowDown -> card 2
  assert.equal(findNearestCard(cards[0], cards, "ArrowDown"), 2);
  // ArrowLeft -> -1 (none)
  assert.equal(findNearestCard(cards[0], cards, "ArrowLeft"), -1);
  // ArrowUp -> -1 (none)
  assert.equal(findNearestCard(cards[0], cards, "ArrowUp"), -1);

  // From card 3:
  // ArrowLeft -> card 2
  assert.equal(findNearestCard(cards[3], cards, "ArrowLeft"), 2);
  // ArrowUp -> card 1
  assert.equal(findNearestCard(cards[3], cards, "ArrowUp"), 1);
});

test("Spatial Navigation: isLeftmostCard edge detection", () => {
  // Row 1: [0: left=0], [1: left=120]
  // Row 2: [2: left=0], [3: left=150]
  const cards = [
    createMockElement({ left: 0, top: 0, width: 100, height: 100 }),
    createMockElement({ left: 120, top: 0, width: 100, height: 100 }),
    createMockElement({ left: 0, top: 120, width: 100, height: 100 }),
    createMockElement({ left: 150, top: 120, width: 100, height: 100 }),
  ];

  assert.equal(isLeftmostCard(cards[0], cards), true, "Card 0 is leftmost in row 1");
  assert.equal(isLeftmostCard(cards[1], cards), false, "Card 1 is NOT leftmost in row 1");
  assert.equal(isLeftmostCard(cards[2], cards), true, "Card 2 is leftmost in row 2");
  assert.equal(isLeftmostCard(cards[3], cards), false, "Card 3 is NOT leftmost in row 2");
});
