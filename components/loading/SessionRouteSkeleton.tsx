"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SessionSkeleton } from "./SessionSkeleton";

function SessionModeSkeleton() {
  const searchParams = useSearchParams();
  return <SessionSkeleton mode={searchParams.get("mode") ?? "mixed"} />;
}

export function SessionRouteSkeleton() {
  return <Suspense fallback={<SessionSkeleton />}><SessionModeSkeleton /></Suspense>;
}
