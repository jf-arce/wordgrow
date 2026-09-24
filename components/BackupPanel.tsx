"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";
import { exportBackupAction, importBackupAction, resetAllAction } from "@/app/actions/backup";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

export function BackupPanel() {
  const router = useRouter();
  const fileId = useId();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  async function exportData() {
    setMessage(null);
    const res = await exportBackupAction();
    if (!res.ok) {
      setMessage({ kind: "error", text: res.error });
      return;
    }
    const url = URL.createObjectURL(new Blob([res.data.json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = res.data.filename;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ kind: "ok", text: `Backup descargado: ${res.data.filename}` });
  }

  async function importData(file: File) {
    setMessage(null);
    const res = await importBackupAction(await file.text());
    setPendingFile(null);
    if (!res.ok) {
      setMessage({ kind: "error", text: res.error });
      return;
    }
    setMessage({ kind: "ok", text: `Backup restaurado: ${res.data.decks} mazos y ${res.data.cards} palabras.` });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-quiet" onClick={exportData}>
          <Download size={18} aria-hidden />
          Descargar backup
        </button>

        <label htmlFor={fileId} className="btn btn-quiet cursor-pointer has-focus-visible:outline-3 has-focus-visible:outline-(--focus)">
          <Upload size={18} aria-hidden />
          Restaurar desde un archivo
          <input
            id={fileId}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={(e) => {
              setPendingFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </label>

        <ConfirmButton
          className="btn btn-danger"
          title="¿Borrar todo?"
          description="Se borran todos tus mazos, palabras, progreso e historial. Descargá un backup antes si querés conservarlos."
          confirmLabel="Borrar todo"
          onConfirm={async () => {
            await resetAllAction();
            setMessage({ kind: "ok", text: "Se borró todo." });
            router.refresh();
          }}
        >
          Borrar todos los datos
        </ConfirmButton>
      </div>

      {pendingFile && (
        <div role="alertdialog" aria-label="Confirmar restauración" className="rounded-2xl bg-gold-soft p-4 text-gold-ink">
          <p className="font-semibold">
            Restaurar “{pendingFile.name}” reemplaza todo lo que tenés ahora. ¿Seguimos?
          </p>
          <div className="mt-3 flex gap-3">
            <button type="button" className="btn btn-primary btn-small" onClick={() => importData(pendingFile)}>
              Sí, restaurar
            </button>
            <button type="button" className="btn btn-quiet btn-small" onClick={() => setPendingFile(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <p
        role="status"
        className={message?.kind === "error" ? "font-medium text-berry-ink" : "font-medium text-azure-strong"}
      >
        {message?.text}
      </p>
    </div>
  );
}
