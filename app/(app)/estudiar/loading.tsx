export default function Loading() {
  return (
    <div className="flex max-w-3xl flex-col gap-8" role="status" aria-label="Cargando configuración de estudio">
      <div className="skeleton h-6 w-24" />
      <div className="skeleton h-10 w-56" />
      <div className="skeleton h-32 w-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-16 w-full" />
        ))}
      </div>
      <span className="visually-hidden">Cargando</span>
    </div>
  );
}
