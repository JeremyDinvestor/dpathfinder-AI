import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.test.js"],
    testTimeout: 30000,
    // The first run downloads a MongoDB binary for tests, which can be slow.
    hookTimeout: 180000,
  },
});
