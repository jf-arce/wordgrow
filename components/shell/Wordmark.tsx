import Link from "next/link";
import { FoxMark } from "@/components/brand/FoxMark";

export function Wordmark() {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
      <FoxMark />
      <span>
        Word<span className="text-gold-ink">Grow</span>
      </span>
    </Link>
  );
}
