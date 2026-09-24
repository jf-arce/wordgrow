import Link from "next/link";
import { RankBadge } from "@/components/collection/RankBadge";

export function Wordmark() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
      <span className="grid size-10 place-items-center rounded-2xl bg-paper-2">
        <RankBadge stage={2} size={32} />
      </span>
      <span>
        Word<span className="text-gold-ink">Grow</span>
      </span>
    </Link>
  );
}
