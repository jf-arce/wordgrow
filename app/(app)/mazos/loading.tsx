export default function Loading() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Cargando mazos">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="skeleton h-10 w-40" />
        <div className="skeleton h-11 w-36 rounded-lg" />
      </div>
      <ul className="grid min-w-0 gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="skeleton h-32 w-full" />
        ))}
      </ul>
      <span className="visually-hidden">Cargando</span>
    </div>
  );
}
