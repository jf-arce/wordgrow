/** Fallback genérico para navegaciones entre grupos de rutas (por ejemplo, saliendo de
 * la sesión de estudio hacia el resto de la app), donde no aplica un `loading.tsx` más
 * específico. */
export default function Loading() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-8" role="status" aria-label="Cargando">
      <div className="skeleton h-10 w-40 rounded-full" />
      <span className="visually-hidden">Cargando</span>
    </div>
  );
}
