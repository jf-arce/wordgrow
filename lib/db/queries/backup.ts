import "server-only";
import { prisma } from "../index";
import { backupSchema, type Backup } from "@/lib/schemas";

export async function exportAll(userId: string): Promise<Backup> {
  const [decks, settings] = await Promise.all([
    prisma.deck.findMany({
      where: { userId },
      orderBy: { id: "asc" },
      select: {
        name: true,
        description: true,
        color: true,
        lang: true,
        createdAt: true,
        cards: {
          orderBy: { id: "asc" },
          select: {
            term: true,
            meaning: true,
            example: true,
            notes: true,
            kind: true,
            createdAt: true,
            progress: { select: { stage: true, dueAt: true, reps: true, lapses: true, lastReviewedAt: true } },
            reviews: { orderBy: { id: "asc" }, select: { mode: true, correct: true, grade: true, responseMs: true, reviewedAt: true } },
          },
        },
      },
    }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  return {
    app: "wordgrow",
    version: 2,
    exportedAt: new Date().toISOString(),
    decks: decks.map((d) => ({
      name: d.name,
      description: d.description,
      color: d.color,
      lang: d.lang,
      createdAt: d.createdAt.toISOString(),
      cards: d.cards.map((c) => ({
        term: c.term,
        meaning: c.meaning,
        example: c.example,
        notes: c.notes,
        kind: c.kind,
        createdAt: c.createdAt.toISOString(),
        // Toda carta activa tiene progreso (se crea junto con ella); si faltara, la
        // exportación no puede armar un backup consistente.
        progress: {
          stage: c.progress!.stage,
          dueAt: c.progress!.dueAt.toISOString(),
          reps: c.progress!.reps,
          lapses: c.progress!.lapses,
          lastReviewedAt: c.progress!.lastReviewedAt?.toISOString() ?? null,
        },
        reviews: c.reviews.map((r) => ({ mode: r.mode, correct: r.correct, grade: r.grade, responseMs: r.responseMs, reviewedAt: r.reviewedAt.toISOString() })),
      })),
    })),
    settings: settings
      ? {
          dailyGoal: settings.dailyGoal,
          ttsRate: settings.ttsRate,
          autoplayAudio: settings.autoplayAudio,
          theme: settings.theme,
          ttsVoice: settings.ttsVoice,
          studySource: settings.studySource,
          studyMode: settings.studyMode,
          studyLimit: settings.studyLimit,
          studyDeckScope: settings.studyDeckScope,
          reminderEnabled: settings.reminderEnabled,
          reminderDays: settings.reminderDays,
          reminderTime: settings.reminderTime,
        }
      : null,
  };
}

/** Reemplaza todo el contenido del usuario por el del backup. Todo o nada. */
export async function importAll(userId: string, value: unknown): Promise<{ decks: number; cards: number }> {
  const parsed = backupSchema.safeParse(value);
  if (!parsed.success) throw new Error("El archivo no es un backup de WordGrow.");
  const backup = parsed.data;

  return prisma.$transaction(async (tx) => {
    // Cascade se encarga de cartas, progreso y repasos.
    await tx.deck.deleteMany({ where: { userId } });

    for (const deck of backup.decks) {
      const createdDeck = await tx.deck.create({
        data: {
          userId,
          name: deck.name,
          description: deck.description,
          color: deck.color,
          lang: deck.lang,
          createdAt: new Date(deck.createdAt),
        },
      });

      // Se insertan cartas, progreso y repasos en tandas separadas (en vez de un create
      // anidado de varios niveles): con muchas cartas, el motor de Prisma 7 puede terminar
      // insertando `card_progress` antes de que la tanda de `cards` haya terminado.
      const createdCards = await tx.card.createManyAndReturn({
        data: deck.cards.map((card) => ({
          deckId: createdDeck.id,
          term: card.term,
          meaning: card.meaning,
          example: card.example,
          notes: card.notes,
          kind: card.kind,
          createdAt: new Date(card.createdAt),
        })),
        select: { id: true },
      });

      await tx.cardProgress.createMany({
        data: deck.cards.map((card, i) => ({
          cardId: createdCards[i].id,
          stage: card.progress.stage,
          dueAt: new Date(card.progress.dueAt),
          reps: card.progress.reps,
          lapses: card.progress.lapses,
          lastReviewedAt: card.progress.lastReviewedAt ? new Date(card.progress.lastReviewedAt) : null,
        })),
      });

      await tx.review.createMany({
        data: deck.cards.flatMap((card, i) =>
          card.reviews.map((r) => ({
            cardId: createdCards[i].id,
            mode: r.mode,
            correct: r.correct,
            grade: r.grade,
            responseMs: r.responseMs,
            reviewedAt: new Date(r.reviewedAt),
          })),
        ),
      });
    }

    if (backup.settings) {
      await tx.userSettings.upsert({ where: { userId }, create: { userId, ...backup.settings }, update: backup.settings });
    }

    return { decks: backup.decks.length, cards: backup.decks.reduce((n, d) => n + d.cards.length, 0) };
  });
}

export async function resetAll(userId: string): Promise<void> {
  await prisma.$transaction([
    // Cascade se encarga de cartas, progreso y repasos.
    prisma.deck.deleteMany({ where: { userId } }),
    prisma.userSettings.deleteMany({ where: { userId } }),
  ]);
}
