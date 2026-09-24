import "server-only";
import { prisma } from "../index";
import { Prisma } from "@/lib/generated/prisma/client";

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type UserRow = User & { passwordHash: string };

/** Crea el usuario junto con su fila de ajustes por defecto. El email se guarda y se busca
 * siempre en minúsculas, para que dos cuentas nunca difieran sólo por mayúsculas. */
export async function createUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}): Promise<number> {
  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      settings: { create: {} },
    },
    select: { id: true },
  });
  return user.id;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, firstName: true, lastName: true, email: true, passwordHash: true },
  });
  return user ?? null;
}

export async function getUserById(id: number): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  return user ?? null;
}

export async function createSession(input: { id: string; userId: number; expiresAt: number }): Promise<void> {
  const now = new Date();
  await prisma.session.create({
    data: { id: input.id, userId: input.userId, createdAt: now, expiresAt: new Date(input.expiresAt), lastSeenAt: now },
  });
}

export async function getSession(id: string, now = Date.now()): Promise<{ userId: number; expiresAt: number } | null> {
  const session = await prisma.session.findUnique({ where: { id }, select: { userId: true, expiresAt: true } });
  if (!session || session.expiresAt.getTime() <= now) return null;
  return { userId: session.userId, expiresAt: session.expiresAt.getTime() };
}

export async function touchSession(id: string, expiresAt: number): Promise<void> {
  try {
    await prisma.session.update({ where: { id }, data: { lastSeenAt: new Date(), expiresAt: new Date(expiresAt) } });
  } catch (error) {
    // La sesión pudo haber sido borrada (logout en otra pestaña) justo antes del touch.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return;
    throw error;
  }
}

export async function deleteSession(id: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id } });
}
