import { defineConfig } from "vitest/config";

// Runs the DB-backed integration tests (real MongoDB via mongodb-memory-server). Separate from
// the fast default suite because the mongod binary is a large one-time download.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.integration.test.js"],
    hookTimeout: 600000, // first run downloads the mongod binary
    testTimeout: 60000,
  },
});
