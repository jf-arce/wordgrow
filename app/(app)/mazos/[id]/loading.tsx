export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Cargando mazo">
      <div className="skeleton h-6 w-24" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="skeleton h-10 w-56" />
        <div className="flex gap-2">
          <div className="skeleton h-11 w-11 rounded-lg" />
          <div className="skeleton h-11 w-11 rounded-lg" />
        </div>
      </div>
      <div className="skeleton h-11 w-full max-w-md" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))] gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton aspect-[3/4] w-full" />
        ))}
      </div>
      <span className="visually-hidden">Cargando</span>
    </div>
  );
}
