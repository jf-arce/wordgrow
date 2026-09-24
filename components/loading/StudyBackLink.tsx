"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";

function StudyBackDestination() {
  const searchParams = useSearchParams();
  const deck = Number(searchParams.get("deck"));
  return Number.isInteger(deck) && deck > 0
    ? <BackLink href={`/mazos/${deck}`} label="Volver al mazo" className="self-start" />
    : <BackLink href="/" label="Estudiar" className="self-start" />;
}

export function StudyBackLink() {
  return (
    <Suspense fallback={<BackLink href="/" label="Estudiar" className="self-start" />}>
      <StudyBackDestination />
    </Suspense>
  );
}
