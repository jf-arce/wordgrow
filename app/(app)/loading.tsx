export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Cargando">
      <div className="h-10 w-2/3 max-w-md animate-pulse rounded-full bg-paper-2" />
      <div className="h-24 w-full animate-pulse rounded-3xl bg-paper-2" />
      <div className="h-40 w-full animate-pulse rounded-3xl bg-paper-2" />
    </div>
  );
}
