import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Integration tests (real MongoDB via mongodb-memory-server) are heavy — the binary is a
    // large one-time download. They run via `npm run test:integration`, not the fast default.
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.integration.test.js"],
  },
});
