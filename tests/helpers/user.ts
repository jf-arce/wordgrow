import { auth } from "@/lib/auth/server";

/** Crea un usuario vía Better Auth para usar como fixture en tests que no prueban auth
 * en sí mismos, sólo necesitan un `userId` real para colgarle mazos/cartas/sesiones. */
export async function createTestUser(input: { firstName: string; lastName: string; email: string; password: string }): Promise<string> {
  const { user } = await auth.api.signUpEmail({
    body: {
      name: `${input.firstName} ${input.lastName}`,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
    },
  });
  return user.id;
}
