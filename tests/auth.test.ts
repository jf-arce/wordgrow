import { describe, expect, it } from "vitest";

const { hashPassword, verifyPassword } = await import("@/lib/auth/password");
const { createUser, getUserByEmail, createSession, getSession, deleteSession } = await import("@/lib/db/queries/auth");

describe("contraseñas", () => {
  it("verifica una contraseña correcta y rechaza una incorrecta", () => {
    const hash = hashPassword("correcthorse1");
    expect(verifyPassword("correcthorse1", hash)).toBe(true);
    expect(verifyPassword("wrongpassword1", hash)).toBe(false);
  });

  it("nunca guarda la contraseña en texto plano", () => {
    const hash = hashPassword("correcthorse1");
    expect(hash).not.toContain("correcthorse1");
    expect(hash.startsWith("scrypt$")).toBe(true);
  });

  it("dos hashes de la misma contraseña son distintos (salt aleatoria) pero ambos verifican", () => {
    const a = hashPassword("correcthorse1");
    const b = hashPassword("correcthorse1");
    expect(a).not.toBe(b);
    expect(verifyPassword("correcthorse1", a)).toBe(true);
    expect(verifyPassword("correcthorse1", b)).toBe(true);
  });

  it("rechaza hashes mal formados sin tirar una excepción", () => {
    expect(verifyPassword("cualquiera", "no-es-un-hash")).toBe(false);
  });
});

describe("usuarios", () => {
  it("crea un usuario y lo encuentra por email, sin importar mayúsculas", async () => {
    await createUser({ firstName: "Ada", lastName: "Lovelace", email: "Ada-Auth@Example.com", passwordHash: hashPassword("x") });
    expect((await getUserByEmail("ada-auth@example.com"))?.firstName).toBe("Ada");
  });

  it("no dos usuarios con el mismo email", async () => {
    await createUser({ firstName: "Otra", lastName: "Ada", email: "dup-auth@example.com", passwordHash: hashPassword("y") });
    await expect(createUser({ firstName: "Otra", lastName: "Ada", email: "DUP-AUTH@example.com", passwordHash: hashPassword("y") })).rejects.toThrow();
  });
});

describe("sesiones", () => {
  it("una sesión válida devuelve el usuario; una vencida, no", async () => {
    const userId = await createUser({
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace-auth@example.com",
      passwordHash: hashPassword("z"),
    });
    const now = Date.now();
    await createSession({ id: "tok-viva", userId, expiresAt: now + 10_000 });
    await createSession({ id: "tok-vencida", userId, expiresAt: now - 10_000 });

    expect((await getSession("tok-viva", now))?.userId).toBe(userId);
    expect(await getSession("tok-vencida", now)).toBeNull();
    expect(await getSession("no-existe", now)).toBeNull();
  });

  it("borrar la sesión la invalida", async () => {
    const userId = await createUser({
      firstName: "Margaret",
      lastName: "Hamilton",
      email: "margaret-auth@example.com",
      passwordHash: hashPassword("w"),
    });
    await createSession({ id: "tok-a-borrar", userId, expiresAt: Date.now() + 10_000 });
    expect((await getSession("tok-a-borrar"))?.userId).toBe(userId);
    await deleteSession("tok-a-borrar");
    expect(await getSession("tok-a-borrar")).toBeNull();
  });
});
