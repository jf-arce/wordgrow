import "server-only";
import { cookies } from "next/headers";
import type { SettingsInput } from "./schemas";

/** Cookie que `app/layout.tsx` lee para pintar `<html data-theme>` sin ir a la base:
 * el tema real sigue viviendo en `UserSettings`, esto es sólo un espejo rápido. Un año
 * de vida (no hay nada sensible) y `lax` como el resto de las cookies de la app. */
const THEME_COOKIE = "wg_theme";
const ONE_YEAR_S = 60 * 60 * 24 * 365;

export async function setThemeCookie(theme: SettingsInput["theme"]): Promise<void> {
  const store = await cookies();
  if (theme === "system") {
    store.delete(THEME_COOKIE);
    return;
  }
  store.set(THEME_COOKIE, theme, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_S,
  });
}

export async function clearThemeCookie(): Promise<void> {
  const store = await cookies();
  store.delete(THEME_COOKIE);
}
