import "server-only";
import { prisma } from "../index";
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

async function readSettings(userId: string) {
  return prisma.userSettings.findUnique({ where: { userId } });
}

export async function getSettings(userId: string): Promise<SettingsInput> {
  const s = await readSettings(userId);
  if (!s) return DEFAULT_SETTINGS;
  return { dailyGoal: s.dailyGoal, ttsRate: s.ttsRate, autoplayAudio: s.autoplayAudio, theme: s.theme, ttsVoice: s.ttsVoice };
}

export async function saveSettings(userId: string, s: SettingsInput): Promise<void> {
  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, dailyGoal: s.dailyGoal, ttsRate: s.ttsRate, autoplayAudio: s.autoplayAudio, theme: s.theme, ttsVoice: s.ttsVoice },
    update: { dailyGoal: s.dailyGoal, ttsRate: s.ttsRate, autoplayAudio: s.autoplayAudio, theme: s.theme, ttsVoice: s.ttsVoice },
  });
}

export async function getStudyPrefs(userId: string): Promise<StudyPrefsInput> {
  const s = await readSettings(userId);
  if (!s) return DEFAULT_STUDY_PREFS;
  return {
    source: s.studySource,
    mode: s.studyMode,
    limit: s.studyLimit,
    deckScope: s.studyDeckScope,
    deckIds: s.studyDeckScope === "selected" ? s.studyDeckIds : [],
  };
}

export async function saveStudyPrefs(userId: string, p: StudyPrefsInput): Promise<void> {
  const deckIds = p.deckScope === "selected" ? [...new Set(p.deckIds)].sort((a, b) => a - b) : [];
  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, studySource: p.source, studyMode: p.mode, studyLimit: p.limit, studyDeckScope: p.deckScope, studyDeckIds: deckIds },
    update: { studySource: p.source, studyMode: p.mode, studyLimit: p.limit, studyDeckScope: p.deckScope, studyDeckIds: deckIds },
  });
}

export async function getReminderPrefs(userId: string): Promise<ReminderPrefsInput> {
  const s = await readSettings(userId);
  if (!s) return DEFAULT_REMINDER_PREFS;
  return { enabled: s.reminderEnabled, days: s.reminderDays, time: s.reminderTime };
}

export async function saveReminderPrefs(userId: string, p: ReminderPrefsInput): Promise<void> {
  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, reminderEnabled: p.enabled, reminderDays: p.days, reminderTime: p.time },
    update: { reminderEnabled: p.enabled, reminderDays: p.days, reminderTime: p.time },
  });
}
