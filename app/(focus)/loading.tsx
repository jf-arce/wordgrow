/** Calco del header de la sesión (Salir + contador/barra) y la tarjeta de la pregunta,
 * ocupando el alto disponible del layout (`flex flex-1`) en vez de sumar padding propio
 * que empuje a un scroll vacío. */
export default function Loading() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6" role="status" aria-label="Cargando la sesión">
      <div className="flex items-center gap-3">
        <div className="skeleton h-9 w-16 shrink-0 rounded-lg" />
        <div className="skeleton h-3 flex-1 rounded-full" />
      </div>
      <div className="skeleton mx-auto mt-[2vh] h-56 w-full max-w-md sm:mt-[4vh]" />
      <span className="visually-hidden">Cargando</span>
    </div>
  );
}
