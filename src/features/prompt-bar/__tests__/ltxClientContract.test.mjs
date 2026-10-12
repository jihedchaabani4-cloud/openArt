import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isLtxModel,
  resolveLtxDuration,
  resolveLtxResolution,
} from "../providers/ltx/ltxClient.js";

describe("LTX Client Contract & Parameter Normalization", () => {
  it("isLtxModel detects both hyphen and underscore model naming conventions", () => {
    assert.strictEqual(isLtxModel("ltx-2-3-pro"), true);
    assert.strictEqual(isLtxModel("ltx_2_3_pro"), true);
    assert.strictEqual(isLtxModel("ltx-2-5-fast"), true);
    assert.strictEqual(isLtxModel("ltx_2_5_fast"), true);
    assert.strictEqual(isLtxModel("seedance_2_5"), false);
    assert.strictEqual(isLtxModel("wan_3_0"), false);
    assert.strictEqual(isLtxModel(null), false);
    assert.strictEqual(isLtxModel(undefined), false);
  });

  it("resolveLtxDuration safely defaults and parses duration numbers", () => {
    assert.strictEqual(resolveLtxDuration(undefined), 8);
    assert.strictEqual(resolveLtxDuration(null), 8);
    assert.strictEqual(resolveLtxDuration(""), 8);
    assert.strictEqual(resolveLtxDuration(0), 8);
    assert.strictEqual(resolveLtxDuration(6), 6);
    assert.strictEqual(resolveLtxDuration(10), 10);
    assert.strictEqual(resolveLtxDuration("8s"), 8);
    assert.strictEqual(resolveLtxDuration("10 s"), 10);
  });

  it("resolveLtxResolution translates resolution tiers and aspect ratios into WxH strings", () => {
    assert.strictEqual(resolveLtxResolution("720p", "16:9"), "1280x720");
    assert.strictEqual(resolveLtxResolution("720p", "9:16"), "720x1280");
    assert.strictEqual(resolveLtxResolution("1080p", "16:9"), "1920x1080");
    assert.strictEqual(resolveLtxResolution("1080p", "9:16"), "1080x1920");
    assert.strictEqual(resolveLtxResolution("1920x1080"), "1920x1080");
    assert.strictEqual(resolveLtxResolution(undefined, "16:9"), "1280x720");
    assert.strictEqual(resolveLtxResolution(undefined, "9:16"), "720x1280");
  });
});
