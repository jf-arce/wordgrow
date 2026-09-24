"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";

/** El ID ya está en la URL; sólo el nombre del mazo necesita la consulta. */
export function DeckBackLink({ cancel = false }: { cancel?: boolean }) {
  const { id } = useParams();
  const href = typeof id === "string" ? `/mazos/${encodeURIComponent(id)}` : "/mazos";
  if (cancel) return <Link href={href} className="btn btn-quiet">Cancelar</Link>;
  return <BackLink href={href} label="Volver al mazo" className="self-start" />;
}
