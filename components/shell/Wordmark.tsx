import Link from "next/link";

export function Wordmark() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
      <span>
        Word<span className="text-gold-ink">Grow</span>
      </span>
    </Link>
  );
}
