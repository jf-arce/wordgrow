import { execSync } from "node:child_process";

/** Corre una vez antes de toda la suite: deja el branch de test de Neon con el esquema
 * limpio, aplicando las migraciones de `prisma/migrations`. `--skip-seed` ya no existe en
 * esta versión de Prisma CLI, así que el seed corre igual; no interfiere con los tests
 * porque usan sus propios emails/ids. */
export default function setup() {
  execSync("npx prisma migrate reset --force", { stdio: "inherit" });
}
