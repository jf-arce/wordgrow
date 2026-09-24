import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

const PUBLIC_ROUTES = ["/ingresar", "/registro"];

/**
 * Chequeo optimista: sólo mira si existe la cookie de sesión, nunca consulta la base.
 * Proxy corre en cada request, incluidos los prefetch, así que una consulta acá sería
 * un costo por cada link que el usuario pasa a llevar el mouse por encima.
 * La verificación real (¿la sesión sigue siendo válida?) vive en la DAL (`lib/auth/dal.ts`).
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r);

  if (!hasSession && !isPublic) {
    const url = new URL("/ingresar", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Si hay cookie pero ya no corresponde a una sesión válida (por ejemplo, se reseteó la base
  // local), no conviene redirigir a "/" acá: esa cookie huérfana nunca se limpia sola (sólo
  // endSession() la borra) y "/" volvería a mandar para acá, generando un loop infinito. La
  // página de /ingresar y /registro valida la sesión real contra la DB y redirige si hace falta.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|manifest.webmanifest|sw.js|icons/).*)"],
};
