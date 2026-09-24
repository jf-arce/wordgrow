import "server-only";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { __wordgrowPrisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Falta la variable de entorno DATABASE_URL.");
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

/** Instancia única, también entre recargas en desarrollo. */
export const prisma = (globalForPrisma.__wordgrowPrisma ??= createClient());

if (process.env.NODE_ENV !== "production") globalForPrisma.__wordgrowPrisma = prisma;
