import { z } from "zod";
import { CARD_KINDS } from "./quiz";

const quizOptionSchema = z.object({ id: z.number(), text: z.string() });

/** Forma persistida de `QuizItem` (`lib/quiz.ts`): valida el JSON que vuelve de la columna
 * `items`/`answers` de `study_sessions` antes de tratarlo como confiable. */
export const quizItemSchema = z.object({
  cardId: z.number(),
  mode: z.enum(["choice", "reverse", "typed", "cloze", "flashcard"]),
  lang: z.string(),
  stage: z.number(),
  term: z.string(),
  meaning: z.string(),
  example: z.string(),
  prompt: z.string(),
  answer: z.string(),
  options: z.array(quizOptionSchema).optional(),
  correctOptionId: z.number().optional(),
});

export const queueItemSchema = quizItemSchema.extend({ retry: z.boolean() });
export const queueSchema = z.array(queueItemSchema);

const resultSchema = z.enum(["correct", "unsure", "wrong"]);

const sessionAnswerSchema = z.object({
  result: resultSchema,
  stageAfter: z.number(),
  selectedId: z.number().optional(),
  typed: z.string().optional(),
  close: z.boolean().optional(),
});
export const currentAnswerSchema = sessionAnswerSchema.nullable();

export const firstAttemptSchema = sessionAnswerSchema.extend({ item: quizItemSchema });
export const firstsSchema = z.array(firstAttemptSchema);

export const DECK_COLORS = ["leaf", "sun", "lilac", "sky", "rose"] as const;
export type DeckColor = (typeof DECK_COLORS)[number];

/** Sólo se estudia inglés por ahora: no se ofrece elegir idioma. */
export const DEFAULT_LANG = "en-US";

export const deckSchema = z.object({
  name: z.string().trim().min(1, "Poné un nombre para el mazo").max(60, "Máximo 60 caracteres"),
  description: z.string().trim().max(200, "Máximo 200 caracteres"),
  color: z.enum(DECK_COLORS),
  lang: z.string().min(2),
});
export type DeckInput = z.infer<typeof deckSchema>;

export const cardSchema = z.object({
  term: z.string().trim().min(1, "Escribí la palabra o frase").max(120, "Máximo 120 caracteres"),
  meaning: z.string().trim().min(1, "Escribí el significado").max(300, "Máximo 300 caracteres"),
  example: z.string().trim().max(300, "Máximo 300 caracteres"),
  notes: z.string().trim().max(300, "Máximo 300 caracteres"),
  kind: z.enum(CARD_KINDS),
});
export type CardInput = z.infer<typeof cardSchema>;

export const importSchema = z.object({
  deckId: z.number().int().positive(),
  rows: z.array(cardSchema).min(1).max(2000),
});

export const settingsSchema = z.object({
  dailyGoal: z.number().int().min(1).max(200),
  ttsRate: z.number().min(0.5).max(1.2),
  autoplayAudio: z.boolean(),
  theme: z.enum(["system", "light", "dark"]),
  /** Nombre de la voz del navegador elegida en Ajustes, o "" para dejar que el navegador elija. */
  ttsVoice: z.string().max(200),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

export const reminderPrefsSchema = z.object({
  enabled: z.boolean(),
  /** Días de la semana: 0 domingo … 6 sábado. */
  days: z.array(z.number().int().min(0).max(6)),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida"),
});
export type ReminderPrefsInput = z.infer<typeof reminderPrefsSchema>;

export const STUDY_SOURCES = ["due", "all", "hard", "new"] as const;
export const STUDY_MODES = ["mixed", "choice", "reverse", "typed", "cloze", "flashcard"] as const;

export const studyPrefsSchema = z.object({
  source: z.enum(STUDY_SOURCES),
  mode: z.enum(STUDY_MODES),
  limit: z.number().int().min(1).max(100),
  deckScope: z.enum(["all", "selected"]),
  deckIds: z.array(z.number().int().positive()).max(50),
}).refine((v) => v.deckScope === "all" || v.deckIds.length > 0, { message: "Elegí al menos un mazo.", path: ["deckIds"] });
export type StudyPrefsInput = z.infer<typeof studyPrefsSchema>;

const passwordSchema = z
  .string()
  .min(8, "La contraseña necesita al menos 8 caracteres")
  .max(200)
  .regex(/[a-zA-Z]/, "La contraseña necesita al menos una letra")
  .regex(/[0-9]/, "La contraseña necesita al menos un número");

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, "Escribí tu nombre").max(80),
    lastName: z.string().trim().min(1, "Escribí tu apellido").max(80),
    email: z.string().trim().toLowerCase().email("Poné un email válido").max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Poné un email válido").max(200),
  password: z.string().min(1, "Escribí tu contraseña").max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const reviewSchema = z.object({
  cardId: z.number().int().positive(),
  mode: z.enum(["choice", "reverse", "typed", "cloze", "flashcard"]),
  result: z.enum(["correct", "unsure", "wrong"]),
  responseMs: z.number().int().min(0).max(3_600_000),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

/** Formato de backup (Ajustes → exportar/restaurar). Sin ids de base: al restaurar, cada
 * mazo y cada carta se recrean desde cero para el usuario que importa. `.strict()` en cada
 * nivel: un campo que no se reconoce (de otra versión, o alterado a mano) rechaza el
 * archivo entero en vez de importarlo a medias. */
const backupReviewSchema = z
  .object({
    mode: z.enum(["choice", "reverse", "typed", "cloze", "flashcard"]),
    correct: z.boolean(),
    grade: z.enum(["correct", "unsure", "wrong"]),
    responseMs: z.number().int().min(0),
    reviewedAt: z.string().datetime({ offset: true }),
  })
  .strict();

const backupProgressSchema = z
  .object({
    stage: z.number().int().min(0),
    dueAt: z.string().datetime({ offset: true }),
    reps: z.number().int().min(0),
    lapses: z.number().int().min(0),
    lastReviewedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();

const backupCardSchema = z
  .object({
    term: z.string(),
    meaning: z.string(),
    example: z.string(),
    notes: z.string(),
    kind: z.enum(CARD_KINDS),
    createdAt: z.string().datetime({ offset: true }),
    progress: backupProgressSchema,
    reviews: z.array(backupReviewSchema),
  })
  .strict();

const backupDeckSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    color: z.string(),
    lang: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    cards: z.array(backupCardSchema),
  })
  .strict();

const backupSettingsSchema = z
  .object({
    dailyGoal: z.number().int(),
    ttsRate: z.number(),
    autoplayAudio: z.boolean(),
    theme: z.enum(["system", "light", "dark"]),
    ttsVoice: z.string(),
    studySource: z.enum(STUDY_SOURCES),
    studyMode: z.enum(STUDY_MODES),
    studyLimit: z.number().int(),
    studyDeckScope: z.enum(["all", "selected"]),
    reminderEnabled: z.boolean(),
    reminderDays: z.array(z.number().int().min(0).max(6)),
    reminderTime: z.string(),
  })
  .strict();

export const backupSchema = z
  .object({
    app: z.literal("wordgrow"),
    version: z.literal(2),
    exportedAt: z.string().datetime({ offset: true }),
    decks: z.array(backupDeckSchema),
    settings: backupSettingsSchema.nullable(),
  })
  .strict();
export type Backup = z.infer<typeof backupSchema>;
