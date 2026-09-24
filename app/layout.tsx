import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque } from "next/font/google";
import { connection } from "next/server";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/db/queries/settings";
import { getCurrentUser } from "@/lib/auth/dal";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const body = Atkinson_Hyperlegible_Next({
  variable: "--font-body",
  adjustFontFallback: false,
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "WordGrow", template: "%s · WordGrow" },
  description: "Armá tu mazo, entrená con repaso espaciado y subí de rango cada palabra.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8eaee" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d10" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // El tema vive en la base de datos (lectura sincrónica), así que la página no se prerenderiza.
  await connection();
  // Sin sesión (páginas de /ingresar y /registro) se usa el tema por defecto: acá nunca se
  // exige login, para no generar un redirect en bucle contra esas mismas páginas.
  const user = await getCurrentUser();
  const { theme } = user ? await getSettings(user.id) : DEFAULT_SETTINGS;

  return (
    <html
      lang="es"
      data-theme={theme === "system" ? undefined : theme}
      className={`${display.variable} ${body.variable}`}
    >
      <body className="min-h-dvh">
        <a
          href="#contenido"
          className="visually-hidden focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-mist"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
