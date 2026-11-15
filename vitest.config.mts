import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    env: {
      // Unit tests never touch a database; these only satisfy module-level checks.
      JWT_SECRET: "unit-test-secret-that-is-at-least-32-characters-long",
    },
  },
});
