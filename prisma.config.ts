import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Las migraciones corren contra la URL directa (sin pooler); el cliente en runtime usa
  // DATABASE_URL (pooled) — ver lib/db/index.ts.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
