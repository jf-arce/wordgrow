import Link from "next/link";
import { PendingButton, FieldSkeleton, LoadingFrame, TextSkeleton } from "@/components/loading/Skeleton";
import { ReminderSkeleton, ThemeSkeleton } from "@/components/loading/SettingsSkeleton";

export default function Loading() {
  return (
    <LoadingFrame label="Cargando bienvenida" className="m-auto flex w-full max-w-lg flex-col gap-8 py-10">
      <div><TextSkeleton className="text-4xl" width="w-56" /><p className="mt-2 text-lg text-ink-soft">Configuremos un par de cosas antes de arrancar. Todo esto lo podés cambiar después en Ajustes.</p></div>
      <div className="flex flex-col gap-6"><FieldSkeleton label="Meta diaria de repasos" hint="Cuántas preguntas querés responder por día. Lo podés cambiar cuando quieras en Ajustes." className="[&>.loading-shape]:max-w-32" /><ThemeSkeleton /><PendingButton className="btn-primary btn-large self-start">Empezar a estudiar</PendingButton></div>
      <div className="flex flex-col gap-3 border-t border-line pt-6"><h2 className="text-xl font-bold">Recordatorios (opcional)</h2><ReminderSkeleton /></div>
      <Link href="/" className="text-center text-ink-soft underline-offset-4 hover:underline">Saltear y empezar ya</Link>
    </LoadingFrame>
  );
}
