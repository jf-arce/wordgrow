import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

/** Reparte el `name` de Google (single field) en firstName/lastName propios de la app,
 * para no tener que tocar el resto del código que ya lee esos dos campos por separado. */
function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") || parts[0] || "" };
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      firstName: { type: "string", required: false, input: true },
      lastName: { type: "string", required: false, input: true },
    },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (user.firstName && user.lastName) return { data: user };
          const { firstName, lastName } = splitName(user.name);
          return { data: { ...user, firstName, lastName } };
        },
      },
    },
  },
  // Debe ir al final: hace que auth.api.* setee las cookies de sesión con next/headers
  // cuando se llama desde Server Actions o Route Handlers.
  plugins: [nextCookies()],
});
