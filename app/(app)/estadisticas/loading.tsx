export default function Loading() {
  return (
    <div className="flex flex-col gap-10" role="status" aria-label="Cargando estadísticas">
      <div className="skeleton h-6 w-24" />
      <div className="skeleton h-10 w-56" />
      <div className="surface grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-16 w-full" />
        ))}
      </div>
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-64 w-full" />
      <span className="visually-hidden">Cargando</span>
    </div>
  );
}
