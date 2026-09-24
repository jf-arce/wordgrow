import { logoutAction } from "@/app/actions/auth";
import { LogOut } from "lucide-react";
import { BackupPanel } from "@/components/BackupPanel";
import { BackLink } from "@/components/ui/BackLink";
import { PendingButton, FieldSkeleton, LoadingFrame, Skeleton, TextSkeleton } from "./Skeleton";

export function ThemeSkeleton() {
  return <div><p className="mb-2 font-semibold">Tema</p><div className="grid gap-2 sm:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <div key={i} className="surface flex min-h-14 items-center gap-3 px-4 py-3"><Skeleton className="size-4 shrink-0 rounded-full" /><span className="font-semibold">{["Automático", "Claro", "Oscuro"][i]}</span></div>)}</div></div>;
}

export function ReminderSkeleton() {
  return <div className="flex flex-col gap-5"><div className="flex items-center justify-between gap-4"><p className="text-sm text-ink-soft">Un aviso cuando te toca practicar, mientras tengas WordGrow abierto.</p><PendingButton className="btn-quiet btn-small shrink-0">Activar</PendingButton></div><PendingButton>Guardar recordatorios</PendingButton></div>;
}

export function SettingsSkeleton() {
  return (
    <LoadingFrame label="Cargando ajustes" className="flex flex-col gap-10">
      <BackLink href="/" label="Estudiar" className="self-start" /><h1 className="text-4xl font-extrabold">Ajustes</h1>
      <div className="flex max-w-xl flex-col gap-7">
        <div><FieldSkeleton label="Meta diaria de repasos" className="[&>.loading-shape]:max-w-32" hint="Cuántas preguntas querés responder por día para completar el anillo." /></div>
        <div className="flex flex-col gap-3">
          <p className="mb-1 font-semibold">Audio</p>
          <FieldSkeleton label="Velocidad de la voz" className="max-w-48" /><FieldSkeleton label="Voz" className="max-w-72" />
          <div className="flex items-center gap-3"><Skeleton className="size-11 rounded-full" /><span className="text-sm text-ink-soft">Probar la voz</span></div>
          <div className="flex min-h-11 items-center gap-3"><Skeleton className="size-5 shrink-0" /><span>Reproducir la pronunciación automáticamente en las sesiones</span></div>
        </div>
        <ThemeSkeleton /><PendingButton>Guardar ajustes</PendingButton>
      </div>
      <div className="flex flex-col gap-3 border-t border-line pt-8"><h2 className="text-2xl font-bold">Recordatorios</h2><ReminderSkeleton /></div>
      <div className="flex flex-col gap-3 border-t border-line pt-8"><h2 className="text-2xl font-bold">Tu cuenta</h2><TextSkeleton width="w-72" /><form action={logoutAction}><button type="submit" className="btn btn-quiet"><LogOut size={18} aria-hidden />Cerrar sesión</button></form></div>
      <div className="flex flex-col gap-3 border-t border-line pt-8"><h2 className="text-2xl font-bold">Tus datos</h2><p className="max-w-prose text-ink-soft">Descargá un backup para llevarlo a otro lado o para tener una copia de seguridad.</p><BackupPanel /></div>
    </LoadingFrame>
  );
}
