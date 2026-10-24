import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import {
  DEFAULT_UPLOAD_POLICY,
  ELEMENT_REFERENCE_UPLOAD_POLICY,
  ELEMENT_SHEET_UPLOAD_POLICY,
  CHARACTER_SHEET_UPLOAD_POLICY,
  CHARACTER_DETAIL_UPLOAD_POLICY,
  UPLOAD_POLICIES,
  validateFilesAgainstPolicy,
  getAcceptedMimeTypes,
} from "../uploadPolicy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendPath = path.resolve(
  __dirname,
  "../../../../../apiOpenArt/src/platform/media-ingestion/UploadPolicy.js"
);
const backendExists = fs.existsSync(backendPath);

let backendPolicies = null;
if (backendExists) {
  try {
    const backendCode = fs.readFileSync(backendPath, "utf8");
    const dataUrl = `data:text/javascript;base64,${Buffer.from(backendCode).toString("base64")}`;
    backendPolicies = await import(dataUrl);
  } catch {
    backendPolicies = null;
  }
}

const describeParity = backendExists ? describe : describe.skip;
const suiteReason = backendExists
  ? ""
  : " (skipped: backend UploadPolicy.js not found at apiOpenArt/src/platform/media-ingestion/UploadPolicy.js)";

describeParity(`Frontend UPLOAD_POLICIES & Backend Parity (Ticket 07)${suiteReason}`, () => {
  const POLICY_NAMES = [
    "DEFAULT_UPLOAD_POLICY",
    "ELEMENT_REFERENCE_UPLOAD_POLICY",
    "ELEMENT_SHEET_UPLOAD_POLICY",
    "CHARACTER_SHEET_UPLOAD_POLICY",
    "CHARACTER_DETAIL_UPLOAD_POLICY",
  ];

  it("mirrors all 5 backend presets with exact deep equality on client-used fields", () => {
    const frontendPresets = {
      DEFAULT_UPLOAD_POLICY,
      ELEMENT_REFERENCE_UPLOAD_POLICY,
      ELEMENT_SHEET_UPLOAD_POLICY,
      CHARACTER_SHEET_UPLOAD_POLICY,
      CHARACTER_DETAIL_UPLOAD_POLICY,
    };

    for (const name of POLICY_NAMES) {
      const frontendPolicy = frontendPresets[name];
      const backendPolicy = backendPolicies[name];

      expect(frontendPolicy, `Frontend policy ${name} must exist`).toBeDefined();
      expect(backendPolicy, `Backend policy ${name} must exist`).toBeDefined();

      // Parity compares only fields the client uses (Ticket 07 fixup)
      expect(frontendPolicy.allowedTypes).toEqual(backendPolicy.allowedTypes);
      expect(frontendPolicy.allowedMimeTypes).toEqual(backendPolicy.allowedMimeTypes);
      expect(frontendPolicy.maxImageSize).toBe(backendPolicy.maxImageSize);
      expect(frontendPolicy.maxVideoSize).toBe(backendPolicy.maxVideoSize);
      expect(frontendPolicy.maxFilesPerRequest).toBe(backendPolicy.maxFilesPerRequest);
    }
  });

  it("exports frozen objects and nested arrays", () => {
    expect(Object.isFrozen(UPLOAD_POLICIES)).toBe(true);

    for (const name of POLICY_NAMES) {
      const policy = UPLOAD_POLICIES[name];
      expect(Object.isFrozen(policy), `${name} must be frozen`).toBe(true);
      expect(Object.isFrozen(policy.allowedTypes), `${name}.allowedTypes must be frozen`).toBe(true);
      expect(Object.isFrozen(policy.allowedMimeTypes), `${name}.allowedMimeTypes must be frozen`).toBe(true);
    }
  });

  it("preserves distinction between maxFilesPerRequest and domain entity quotas", () => {
    // maxFilesPerRequest is a per-request limit, NOT an entity quota
    expect(ELEMENT_REFERENCE_UPLOAD_POLICY.maxFilesPerRequest).toBe(6);
    expect(CHARACTER_DETAIL_UPLOAD_POLICY.maxFilesPerRequest).toBe(5);
    expect(DEFAULT_UPLOAD_POLICY.maxFilesPerRequest).toBe(1);
    expect(ELEMENT_SHEET_UPLOAD_POLICY.maxFilesPerRequest).toBe(1);
    expect(CHARACTER_SHEET_UPLOAD_POLICY.maxFilesPerRequest).toBe(1);
  });
});

describe("Client-Side UX Pre-flight Validation (validateFilesAgainstPolicy)", () => {
  const makeMockFile = ({ name = "test.png", type = "image/png", size = 1024 * 1024 } = {}) => ({
    name,
    type,
    size,
  });

  it("returns valid: true for files conforming to policy", () => {
    const files = [makeMockFile({ name: "valid.png", type: "image/png", size: 5 * 1024 * 1024 })];
    const result = validateFilesAgainstPolicy(files, ELEMENT_REFERENCE_UPLOAD_POLICY);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.message).toBeNull();
  });

  it("rejects disallowed MIME type with UNSUPPORTED_MEDIA_TYPE", () => {
    const files = [makeMockFile({ name: "clip.mp4", type: "video/mp4", size: 10 * 1024 * 1024 })];
    const result = validateFilesAgainstPolicy(files, ELEMENT_REFERENCE_UPLOAD_POLICY);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].code).toBe("UNSUPPORTED_MEDIA_TYPE");
    expect(result.errors[0].file.name).toBe("clip.mp4");
    expect(result.message).toMatch(/unsupported file type/i);
  });

  it("rejects oversized image with FILE_TOO_LARGE", () => {
    const files = [makeMockFile({ name: "huge.png", type: "image/png", size: 25 * 1024 * 1024 })]; // >20 MB
    const result = validateFilesAgainstPolicy(files, ELEMENT_REFERENCE_UPLOAD_POLICY);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].code).toBe("FILE_TOO_LARGE");
    expect(result.message).toMatch(/20 MB/i);
  });

  it("rejects oversized video with FILE_TOO_LARGE on DEFAULT_UPLOAD_POLICY", () => {
    const files = [makeMockFile({ name: "huge.mp4", type: "video/mp4", size: 105 * 1024 * 1024 })]; // >100 MB
    const result = validateFilesAgainstPolicy(files, DEFAULT_UPLOAD_POLICY);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].code).toBe("FILE_TOO_LARGE");
    expect(result.message).toMatch(/100 MB/i);
  });

  it("rejects files exceeding policy maxFilesPerRequest with MAX_FILES_EXCEEDED", () => {
    const files = Array.from({ length: 7 }, (_, i) => makeMockFile({ name: `img${i}.png` }));
    const result = validateFilesAgainstPolicy(files, ELEMENT_REFERENCE_UPLOAD_POLICY); // max 6

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MAX_FILES_EXCEEDED")).toBe(true);
    expect(result.message).toMatch(/maximum/i);
  });

  it("respects custom maxFiles override (e.g. remaining quota capacity)", () => {
    const files = [
      makeMockFile({ name: "img1.png" }),
      makeMockFile({ name: "img2.png" }),
      makeMockFile({ name: "img3.png" }),
    ];
    // Character has 3 existing details, remaining quota is 2
    const result = validateFilesAgainstPolicy(files, CHARACTER_DETAIL_UPLOAD_POLICY, { maxFiles: 2 });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MAX_FILES_EXCEEDED")).toBe(true);
    expect(result.message).toMatch(/2/);
  });

  it("handles single File instance or empty array gracefully", () => {
    const single = makeMockFile({ name: "single.jpg", type: "image/jpeg", size: 1024 });
    const singleRes = validateFilesAgainstPolicy(single, DEFAULT_UPLOAD_POLICY);
    expect(singleRes.valid).toBe(true);

    const emptyRes = validateFilesAgainstPolicy([], DEFAULT_UPLOAD_POLICY);
    expect(emptyRes.valid).toBe(true);
  });

  it("getAcceptedMimeTypes returns comma-delimited accept string for file inputs", () => {
    const elementAccept = getAcceptedMimeTypes(ELEMENT_REFERENCE_UPLOAD_POLICY);
    expect(elementAccept).toBe("image/jpeg,image/png,image/webp,image/avif");
    expect(elementAccept).not.toContain("video");

    const defaultAccept = getAcceptedMimeTypes(DEFAULT_UPLOAD_POLICY);
    expect(defaultAccept).toContain("video/mp4");
    expect(defaultAccept).toContain("image/png");
  });
});
