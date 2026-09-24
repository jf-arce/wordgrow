import { defineConfig } from "vitest/config";
import { config } from "dotenv";

const root = new URL("./", import.meta.url).pathname;

// Los tests corren contra un branch de Neon dedicado (nunca el de desarrollo/producción).
config({ path: `${root}.env.test` });

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Todos los archivos de test comparten la misma base: correrlos en paralelo pisaría
    // los datos entre sí (cada archivo asume un estado propio, no aislado por proceso).
    fileParallelism: false,
    globalSetup: ["tests/global-setup.ts"],
  },
  resolve: {
    alias: {
      "@": root,
      // `server-only` lanza fuera de un bundle de Next; en los tests no hace falta.
      "server-only": `${root}tests/empty-module.ts`,
    },
  },
});
