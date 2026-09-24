import { execSync } from "node:child_process";

/** Corre una vez antes de toda la suite: deja el branch de test de Neon con el esquema
 * limpio y sin datos, aplicando las migraciones de `prisma/migrations`. */
export default function setup() {
  execSync("npx prisma migrate reset --force --skip-seed", { stdio: "inherit" });
}
