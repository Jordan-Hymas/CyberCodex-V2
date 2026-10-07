import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Explicit opt-in: the default config and local SQLite DB remain untouched.
// DIRECT_URL must be a direct or session-pooler connection, not transaction mode.
export default defineConfig({
  schema: "prisma/postgresql/schema.prisma",
  migrations: { path: "prisma/postgresql/migrations" },
  engine: "classic",
  datasource: { url: env("DIRECT_URL") },
});
