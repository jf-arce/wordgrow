import clsx from "clsx";

/** Dorso de la carta: se ve antes de dar vuelta la tarjeta en modo flashcard. */
export function CardBack({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "card-frame frame-silver flex aspect-[5/7] items-center justify-center overflow-hidden p-4",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className="grid h-full w-full place-items-center rounded-md"
        style={{
          background:
            "repeating-linear-gradient(135deg, var(--color-azure-soft) 0 10px, var(--color-paper-2) 10px 20px)",
        }}
      >
        <span className="font-display text-2xl font-extrabold tracking-tight text-azure-strong opacity-70">
          W<span className="text-gold-ink">G</span>
        </span>
      </div>
    </div>
  );
}
