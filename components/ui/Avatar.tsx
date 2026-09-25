import Image from "next/image";
import { DECK_COLOR_CLASSES } from "@/components/ui/DeckColor";
import { DECK_COLORS } from "@/lib/schemas";

function ringClasses(seed: string): { soft: string; ink: string } {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const color = DECK_COLORS[hash % DECK_COLORS.length];
  return DECK_COLOR_CLASSES[color];
}

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function Avatar({
  firstName,
  lastName,
  image,
  size = 36,
}: {
  firstName: string;
  lastName: string;
  image?: string | null;
  size?: number;
}) {
  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const { soft, ink } = ringClasses(`${firstName}${lastName}`);
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${soft} ${ink}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials(firstName, lastName)}
    </span>
  );
}
