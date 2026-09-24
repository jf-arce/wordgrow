import { z } from "zod";
import { CARD_KINDS } from "./quiz";

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
