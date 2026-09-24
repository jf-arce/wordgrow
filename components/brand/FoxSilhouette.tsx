import fox from "@/public/brand/wordgrow-fox.webp";

export function FoxSilhouette({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`fox-silhouette ${className}`}
      style={{ maskImage: `url(${fox.src})`, WebkitMaskImage: `url(${fox.src})` }}
    />
  );
}
