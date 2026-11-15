import "dotenv/config";
import { defineConfig } from "prisma/config";

/*
 * Prisma CLI configuration (migrations, seeding, Prisma Studio).
 * Migrations use the DIRECT connection (DATABASE_URL_UNPOOLED); the app itself connects through
 * the pooled DATABASE_URL in src/lib/prisma.ts. Prisma 7 doesn't read .env on its own, hence dotenv.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Fall back to DATABASE_URL so a single-URL setup (e.g. CI) still works.
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "",
  },
});
