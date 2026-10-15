/**
 * T6: Architecture & Dependency Direction Test
 *
 * Verifies that core/ and store/ maintain strict layer purity and do not import
 * React, Next.js, UI widgets, studio features, or outer platform/template code.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Allowed exceptions with architectural reasons (T6 / PB-D-02)
const ALLOWED_EXCEPTIONS = {
  "PromptBarStoreContext.js": "React Context provider bridging Zustand vanilla store to React tree",
  "usePromptBarStore.js": "React hook selector for consuming vanilla store in React components",
  "usePromptBarRouteWatcher.js": "React hook watching Next.js route navigation to reset store registry instances (PB-D-14)",
  "useRealBackendModels.js": "PB-D-02 backwards-compatibility shim re-exporting from adapters",
};

const FORBIDDEN_IMPORT_PATTERNS = [
  /^react(\/.*)?$/,
  /^next(\/.*)?$/,
  /@\/features\/studio/,
  /@\/widgets/,
  /@\/app/,
  /ui\//,
  /platform\//,
  /templates\//,
];

function getFilesRecursively(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else if (file.endsWith(".js") || file.endsWith(".jsx") || file.endsWith(".mjs")) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("T6: Core and Store Dependency Direction", () => {
  const promptBarDir = path.resolve(__dirname, "..");
  const coreDir = path.join(promptBarDir, "core");
  const storeDir = path.join(promptBarDir, "store");

  const filesToScan = [...getFilesRecursively(coreDir), ...getFilesRecursively(storeDir)];

  it("core and store modules have zero forbidden framework or outer-layer imports", () => {
    const violations = [];

    for (const filePath of filesToScan) {
      const fileName = path.basename(filePath);
      if (ALLOWED_EXCEPTIONS[fileName]) {
        continue;
      }

      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        const importMatch = line.match(/(?:import|from)\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          const importSource = importMatch[1];
          for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
            if (pattern.test(importSource)) {
              violations.push({
                file: path.relative(promptBarDir, filePath).replace(/\\/g, "/"),
                line: index + 1,
                importSource,
                pattern: pattern.toString(),
              });
            }
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it("shim at core/useRealBackendModels.js properly delegates to adapters/useRealBackendModels.js", () => {
    const shimPath = path.join(coreDir, "useRealBackendModels.js");
    expect(fs.existsSync(shimPath)).toBe(true);

    const content = fs.readFileSync(shimPath, "utf-8");
    expect(content).toContain('export { useRealBackendModels } from "../adapters/useRealBackendModels.js"');

    const adapterPath = path.join(promptBarDir, "adapters", "useRealBackendModels.js");
    expect(fs.existsSync(adapterPath)).toBe(true);
  });
});
