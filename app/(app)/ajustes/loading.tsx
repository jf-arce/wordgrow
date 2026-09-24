export default function Loading() {
  return (
    <div className="flex flex-col gap-10" role="status" aria-label="Cargando ajustes">
      <div className="skeleton h-6 w-24" />
      <div className="skeleton h-10 w-40" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-16 w-full" />
        ))}
      </div>
      <span className="visually-hidden">Cargando</span>
    </div>
  );
}
