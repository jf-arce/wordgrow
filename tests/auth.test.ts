import { describe, expect, it } from "vitest";

process.env.WORDGROW_DB = ":memory:";

const { hashPassword, verifyPassword } = await import("@/lib/auth/password");
const { createUser, getUserByEmail, createSession, getSession, deleteSession, hasAnyUser } = await import(
  "@/lib/db/queries/auth"
);

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
  it("crea un usuario y lo encuentra por email, sin importar mayúsculas", () => {
    createUser({ firstName: "Ada", lastName: "Lovelace", email: "Ada@Example.com", passwordHash: hashPassword("x") });
    expect(hasAnyUser()).toBe(true);
    expect(getUserByEmail("ada@example.com")?.firstName).toBe("Ada");
  });

  it("no dos usuarios con el mismo email", () => {
    expect(() =>
      createUser({ firstName: "Otra", lastName: "Ada", email: "ada@example.com", passwordHash: hashPassword("y") }),
    ).toThrow();
  });
});

describe("sesiones", () => {
  it("una sesión válida devuelve el usuario; una vencida, no", () => {
    const userId = createUser({
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      passwordHash: hashPassword("z"),
    });
    const now = Date.now();
    createSession({ id: "tok-viva", userId, expiresAt: now + 10_000 });
    createSession({ id: "tok-vencida", userId, expiresAt: now - 10_000 });

    expect(getSession("tok-viva", now)?.userId).toBe(userId);
    expect(getSession("tok-vencida", now)).toBeNull();
    expect(getSession("no-existe", now)).toBeNull();
  });

  it("borrar la sesión la invalida", () => {
    const userId = createUser({
      firstName: "Margaret",
      lastName: "Hamilton",
      email: "margaret@example.com",
      passwordHash: hashPassword("w"),
    });
    createSession({ id: "tok-a-borrar", userId, expiresAt: Date.now() + 10_000 });
    expect(getSession("tok-a-borrar")?.userId).toBe(userId);
    deleteSession("tok-a-borrar");
    expect(getSession("tok-a-borrar")).toBeNull();
  });
});
