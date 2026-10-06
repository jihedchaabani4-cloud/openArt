import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateModelCredits, formatCredits } from "../core/creditCalculationService.js";

describe("Credit Calculation Service Contract", () => {
  it("Video Model (LTX 2.3 Fast): calculates credits based on duration", () => {
    const ltxModel = {
      id: "ltx_2_3_fast",
      category: "video",
      pricing: {
        currency: "credits",
        table: {
          "6": 12,
          "8": 16,
          "10": 20,
          "12": 24,
          "14": 28,
          "16": 32,
          "18": 36,
          "20": 40,
          default: 16,
        },
      },
    };

    assert.equal(calculateModelCredits(ltxModel, { duration: "6" }), 12);
    assert.equal(calculateModelCredits(ltxModel, { duration: "8s" }), 16);
    assert.equal(calculateModelCredits(ltxModel, { duration: "10 s" }), 20);
    assert.equal(calculateModelCredits(ltxModel, { duration: 20 }), 40);
    assert.equal(calculateModelCredits(ltxModel, {}), 16); // default fallback
  });

  it("Video Model (Seedance 2.5): applies count multiplier", () => {
    const seedanceModel = {
      id: "seedance_2_5",
      category: "video",
      pricing: {
        currency: "credits",
        table: {
          "5": 40,
          "10": 75,
          default: 40,
        },
      },
    };

    assert.equal(calculateModelCredits(seedanceModel, { duration: "5" }, 1), 40);
    assert.equal(calculateModelCredits(seedanceModel, { duration: "5" }, 2), 80);
    assert.equal(calculateModelCredits(seedanceModel, { duration: "10" }, 3), 225);
  });

  it("Image Model (NanoBanana Pro): calculates credits based on resolution", () => {
    const imageModel = {
      id: "nanobana_pro",
      category: "image",
      pricing: {
        currency: "credits",
        table: {
          "1k": 10,
          "2k": 16,
          "4k": 25,
          default: 10,
        },
      },
    };

    assert.equal(calculateModelCredits(imageModel, { resolution: "1k" }, 1), 10);
    assert.equal(calculateModelCredits(imageModel, { resolution: "2k" }, 1), 16);
    assert.equal(calculateModelCredits(imageModel, { resolution: "4k" }, 2), 50);
  });

  it("Image Model (GPT Image 2): handles compound resolution:quality keys", () => {
    const compoundModel = {
      id: "gpt_image_2",
      category: "image",
      pricing: {
        currency: "credits",
        table: {
          "1k:low": 8,
          "1k:medium": 12,
          "1k:high": 24,
          "2k:high": 36,
          "4k:high": 50,
          default: 12,
        },
      },
    };

    assert.equal(calculateModelCredits(compoundModel, { resolution: "1k", quality: "high" }), 24);
    assert.equal(calculateModelCredits(compoundModel, { resolution: "2k", quality: "high" }), 36);
    assert.equal(calculateModelCredits(compoundModel, { resolution: "unknown" }), 12);
  });

  it("Fixed price model (LLM): uses fixedPrice", () => {
    const llmModel = {
      id: "gemini_3_1_flash_lite",
      category: "llm",
      pricing: {
        fixedPrice: 1,
      },
    };

    assert.equal(calculateModelCredits(llmModel, {}, 1), 1);
    assert.equal(calculateModelCredits(llmModel, {}, 3), 3);
  });

  it("Null / undefined model handling: returns 0 safely", () => {
    assert.equal(calculateModelCredits(null), 0);
    assert.equal(calculateModelCredits(undefined), 0);
  });

  it("formatCredits helper: formats pluralization correctly", () => {
    assert.equal(formatCredits(0), "0 crédits");
    assert.equal(formatCredits(1), "1 crédit");
    assert.equal(formatCredits(16), "16 crédits");
  });
});
