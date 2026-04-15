import pluginNext  from "@next/eslint-plugin-next";
import pluginReact from "eslint-plugin-react";
import pluginHooks from "eslint-plugin-react-hooks";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // ── File scope ───────────────────────────────────────────────────────────
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    plugins: {
      "@next/next":  pluginNext,
      "react":       pluginReact,
      "react-hooks": pluginHooks,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        // Node globals (for API files)
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      // ── React Hooks (catches early-return violations) ──────────────────
      "react-hooks/rules-of-hooks":  "error",
      "react-hooks/exhaustive-deps": "warn",

      // ── Next.js ───────────────────────────────────────────────────────
      ...pluginNext.configs.recommended.rules,

      // ── React ─────────────────────────────────────────────────────────
      "react/jsx-uses-react":   "off",  // Not needed with React 17+ transform
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-vars":    "error", // Prevent false 'unused' warnings for JSX components

      // ── General ───────────────────────────────────────────────────────
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console":     "off",
    },
  },

  // ── Ignore build artifacts ───────────────────────────────────────────────
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "public/**",
      "*.config.js",
      "*.config.mjs",
    ],
  },
];
