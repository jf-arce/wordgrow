import { redirect } from "next/navigation";
import { Wordmark } from "@/components/shell/Wordmark";
import { getCurrentUser } from "@/lib/auth/dal";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  // Chequeo real (contra la DB) de si ya hay sesión válida: proxy.ts sólo mira si existe la
  // cookie, y si esa cookie quedó huérfana (sesión borrada en la base) redirigir desde ahí
  // generaba un loop infinito entre "/" y "/ingresar". Acá, con sesión inválida, simplemente
  // se muestra el formulario.
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-10">
      <Wordmark />
      {children}
    </main>
  );
}
