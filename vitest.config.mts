import { defineConfig } from "vitest/config";

const root = new URL("./", import.meta.url).pathname;

export default defineConfig({
  test: { include: ["tests/**/*.test.ts"] },
  resolve: {
    alias: {
      "@": root,
      // `server-only` lanza fuera de un bundle de Next; en los tests no hace falta.
      "server-only": `${root}tests/empty-module.ts`,
    },
  },
});
