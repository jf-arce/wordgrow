import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";

/** Botón "← Volver" para navegar hacia atrás en flujos de varios pasos. Destino siempre explícito. */
export function BackLink({ href, label = "Volver", className }: { href: string; label?: string; className?: string }) {
  return (
    <Link href={href} className={clsx("btn btn-quiet", className)}>
      <ArrowLeft size={18} aria-hidden />
      {label}
    </Link>
  );
}
