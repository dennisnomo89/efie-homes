import { defineConfig } from "vitest/config";

/**
 * API tests talk to a running Efie Homes server over HTTP.
 * They need a database loaded with the demo seed (npx prisma db seed).
 *   API_BASE_URL defaults to http://localhost:3000
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/api/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Tests share one database, so run files one after another.
    fileParallelism: false,
  },
});
