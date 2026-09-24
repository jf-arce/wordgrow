/** Calco del grid del dashboard (hero + actividad/mazos + foco + colección), para que la
 * navegación entre páginas no deje la pantalla en blanco mientras carga. */
export default function Loading() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" role="status" aria-label="Cargando">
      <div className="skeleton col-span-2 row-span-2 h-72 md:col-span-3 md:row-span-1 md:h-48 lg:col-span-2 lg:row-span-2 lg:h-80" />
      <div className="skeleton col-span-2 h-40 md:col-span-3 lg:col-span-2" />
      <div className="skeleton col-span-2 h-56 md:col-span-3 lg:col-span-2" />
      <div className="skeleton col-span-2 h-48 md:col-span-3 lg:col-span-4" />
      <div className="skeleton col-span-2 h-48 md:col-span-3 lg:col-span-4" />
      <span className="visually-hidden">Cargando</span>
    </div>
  );
}
