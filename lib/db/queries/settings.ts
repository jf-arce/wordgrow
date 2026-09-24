import "server-only";
import { getDb } from "../index";
import type { SettingsInput, StudyPrefsInput, ReminderPrefsInput } from "@/lib/schemas";
import { DEFAULT_REMINDER_PREFS } from "@/lib/reminders";

export const DEFAULT_SETTINGS: SettingsInput = {
  dailyGoal: 20,
  ttsRate: 0.9,
  autoplayAudio: false,
  theme: "system",
  ttsVoice: "",
};

export const DEFAULT_STUDY_PREFS: StudyPrefsInput = {
  source: "due",
  mode: "mixed",
  limit: 20,
  deckIds: [],
  deckScope: "all",
};

function readMap(userId: number): Map<string, string> {
  const rows = getDb().prepare("SELECT key, value FROM settings WHERE user_id = ?").all(userId) as {
    key: string;
    value: string;
  }[];
  return new Map(rows.map((r) => [r.key, r.value]));
}

export function getSettings(userId: number): SettingsInput {
  const map = readMap(userId);
  const num = (k: string, d: number) => {
    const v = Number(map.get(k));
    return map.has(k) && Number.isFinite(v) ? v : d;
  };
  const theme = map.get("theme");
  return {
    dailyGoal: num("daily_goal", DEFAULT_SETTINGS.dailyGoal),
    ttsRate: num("tts_rate", DEFAULT_SETTINGS.ttsRate),
    autoplayAudio: map.get("autoplay_audio") === "1",
    theme: theme === "light" || theme === "dark" ? theme : "system",
    ttsVoice: map.get("tts_voice") ?? DEFAULT_SETTINGS.ttsVoice,
  };
}

export function saveSettings(userId: number, s: SettingsInput): void {
  const stmt = getDb().prepare(
    "INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value",
  );
  stmt.run(userId, "daily_goal", String(s.dailyGoal));
  stmt.run(userId, "tts_rate", String(s.ttsRate));
  stmt.run(userId, "autoplay_audio", s.autoplayAudio ? "1" : "0");
  stmt.run(userId, "theme", s.theme);
  stmt.run(userId, "tts_voice", s.ttsVoice);
}

const STUDY_SOURCES = ["due", "all", "hard", "new"] as const;
const STUDY_MODES = ["mixed", "choice", "reverse", "typed", "cloze", "flashcard"] as const;

/** CSV de ids ordenados ascendente, como se guarda en `study_sessions.deck_ids`. */
function parseDeckIds(csv: string | undefined): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);
}

export function getStudyPrefs(userId: number): StudyPrefsInput {
  const map = readMap(userId);
  const source = map.get("study_source");
  const mode = map.get("study_mode");
  const limit = Number(map.get("study_limit"));
  // "study_decks" (lista) reemplaza a la vieja "study_deck" (un solo mazo o 0 = todos);
  // si no hay preferencia nueva guardada, se cae a la vieja para no resetear a nadie.
  const storedDeckIds = map.has("study_decks")
    ? parseDeckIds(map.get("study_decks"))
    : (() => {
        const legacy = Number(map.get("study_deck"));
        return Number.isFinite(legacy) && legacy > 0 ? [legacy] : [];
      })();
  const deckScope = map.get("study_deck_scope") === "selected" && storedDeckIds.length > 0 ? "selected" : storedDeckIds.length > 0 && !map.has("study_deck_scope") ? "selected" : "all";
  const deckIds = deckScope === "selected" ? storedDeckIds : [];
  return {
    source: (STUDY_SOURCES as readonly string[]).includes(source ?? "") ? (source as StudyPrefsInput["source"]) : DEFAULT_STUDY_PREFS.source,
    mode: (STUDY_MODES as readonly string[]).includes(mode ?? "") ? (mode as StudyPrefsInput["mode"]) : DEFAULT_STUDY_PREFS.mode,
    limit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_STUDY_PREFS.limit,
    deckIds,
    deckScope,
  };
}

export function saveStudyPrefs(userId: number, p: StudyPrefsInput): void {
  const stmt = getDb().prepare(
    "INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value",
  );
  stmt.run(userId, "study_source", p.source);
  stmt.run(userId, "study_mode", p.mode);
  stmt.run(userId, "study_limit", String(p.limit));
  stmt.run(userId, "study_decks", p.deckScope === "selected" ? [...new Set(p.deckIds)].sort((a, b) => a - b).join(",") : "");
  stmt.run(userId, "study_deck_scope", p.deckScope);
}

export function getReminderPrefs(userId: number): ReminderPrefsInput {
  const map = readMap(userId);
  const enabled = map.get("reminder_enabled") === "1";
  const daysRaw = map.get("reminder_days");
  const days = daysRaw
    ? daysRaw
        .split(",")
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    : DEFAULT_REMINDER_PREFS.days;
  const time = map.get("reminder_time") ?? DEFAULT_REMINDER_PREFS.time;
  return { enabled, days, time };
}

export function saveReminderPrefs(userId: number, p: ReminderPrefsInput): void {
  const stmt = getDb().prepare(
    "INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value",
  );
  stmt.run(userId, "reminder_enabled", p.enabled ? "1" : "0");
  stmt.run(userId, "reminder_days", p.days.join(","));
  stmt.run(userId, "reminder_time", p.time);
}
