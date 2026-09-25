import { describe, expect, it } from "vitest";
import { setCookieToHeader } from "better-auth/cookies";

const { auth } = await import("@/lib/auth/server");

async function signUp(email: string, password = "correcthorse1") {
  return auth.api.signUpEmail({
    body: { name: "Ada Lovelace", firstName: "Ada", lastName: "Lovelace", email, password },
  });
}

describe("usuarios", () => {
  it("crea un usuario y lo puede volver a encontrar por email, sin importar mayúsculas", async () => {
    await signUp("Ada-Auth@Example.com");
    const { user } = await auth.api.signInEmail({ body: { email: "ada-auth@example.com", password: "correcthorse1" } });
    expect(user.email).toBe("ada-auth@example.com");
  });

  it("no permite dos cuentas con el mismo email", async () => {
    await signUp("dup-auth@example.com");
    await expect(signUp("DUP-AUTH@example.com")).rejects.toThrow();
  });
});

describe("login", () => {
  it("rechaza una contraseña incorrecta", async () => {
    await signUp("wrongpass-auth@example.com", "correcthorse1");
    await expect(
      auth.api.signInEmail({ body: { email: "wrongpass-auth@example.com", password: "wrongpassword1" } }),
    ).rejects.toThrow();
  });
});

describe("sesiones", () => {
  it("cerrar sesión invalida el token", async () => {
    await signUp("logout-auth@example.com");
    const response = await auth.api.signInEmail({
      body: { email: "logout-auth@example.com", password: "correcthorse1" },
      asResponse: true,
    });
    const signInHeaders = new Headers();
    setCookieToHeader(signInHeaders)({ response });

    const active = await auth.api.getSession({ headers: signInHeaders });
    expect(active?.user.email).toBe("logout-auth@example.com");

    await auth.api.signOut({ headers: signInHeaders });
    // disableCookieCache: chequeo autoritativo contra la DB, sin fiarse de la cache
    // firmada de la cookie (que puede seguir siendo "válida" unos minutos más).
    const afterSignOut = await auth.api.getSession({ headers: signInHeaders, query: { disableCookieCache: true } });
    expect(afterSignOut).toBeNull();
  });
});
