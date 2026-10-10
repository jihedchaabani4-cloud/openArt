import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Hermetic unit tests: jsdom, no network, no .env loading.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
    restoreMocks: true,
  },
});
