import { Suspense, type ReactNode } from "react";
import { AuthSkeleton } from "@/components/loading/AuthSkeleton";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/shell/Wordmark";
import { getCurrentUser } from "@/lib/auth/dal";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-10">
      <Wordmark />
      <Suspense fallback={<AuthSkeleton />}>
        <GuestContent>{children}</GuestContent>
      </Suspense>
    </main>
  );
}

/** La comprobación de sesión conserva su lugar antes del formulario; el shell puede
 * mostrarse mientras responde la base de datos. */
async function GuestContent({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return children;
}
