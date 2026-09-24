export default function Loading() {
  return (
    <div className="m-auto flex w-full max-w-md flex-col gap-6 py-16" role="status" aria-label="Cargando la sesión">
      <div className="h-3 w-full animate-pulse rounded-full bg-paper-2" />
      <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-paper-2" />
      <div className="h-40 w-full animate-pulse rounded-3xl bg-paper-2" />
    </div>
  );
}
