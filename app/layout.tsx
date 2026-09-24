import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque } from "next/font/google";
import { cookies } from "next/headers";
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
  // El tema vive en la base de datos (Ajustes), pero acá se lee de una cookie que
  // `saveSettingsAction` mantiene sincronizada: el <html data-theme> tiene que salir
  // antes del primer paint (no se puede Suspender un atributo), y esperar a Neon para
  // eso dejaba la pantalla en negro hasta que respondía. Leer la cookie sigue forzando
  // el render dinámico (igual que antes con `connection()`), pero sin ida y vuelta a la
  // base. Sin cookie (primera visita) se usa "system", el mismo default que la DB.
  const jar = await cookies();
  const cookieTheme = jar.get("wg_theme")?.value;
  const theme = cookieTheme === "light" || cookieTheme === "dark" ? cookieTheme : "system";

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
