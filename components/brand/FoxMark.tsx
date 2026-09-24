import Image from "next/image";
import fox from "@/public/brand/wordgrow-fox.webp";
import celebrate from "@/public/brand/wordgrow-fox-celebrate.webp";
import retry from "@/public/brand/wordgrow-fox-retry.webp";

const expressions = { neutral: fox, celebrate, retry };

/** Acompaña texto visible, por eso no repite una descripción al lector de pantalla. */
export function FoxMark({ size = 40, className = "", expression = "neutral" }: {
  size?: number;
  className?: string;
  expression?: keyof typeof expressions;
}) {
  return (
    <Image
      src={expressions[expression]}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      sizes={`${size}px`}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
