"use client";

import { forwardRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { deleteCardAction, resetCardAction, updateCardAction } from "@/app/actions/cards";
import { KIND_LABELS, type CardKind } from "@/lib/quiz";
import { KIND_STYLE } from "@/lib/cardKind";
import { stageInfo } from "@/lib/srs";
import { KindGlyph } from "@/components/card/KindGlyph";
import { RankBadge } from "@/components/collection/RankBadge";
import { SpeakButton } from "@/components/SpeakButton";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { CardEditor } from "@/components/forms/CardEditor";
import { CardHover3D } from "@/components/card/CardHover3D";
import { WordCard } from "@/components/card/WordCard";

export type CardDetailData = {
  id: number;
  term: string;
  meaning: string;
  example: string;
  notes: string;
  kind: CardKind;
  stage: number;
  reps?: number;
  due?: boolean;
  dueLabel: string;
};

/** Panel de detalle de una carta: se abre al tocar `CardTile`. Reúne el significado,
 * ejemplo, notas y vencimiento, más las acciones que antes vivían en `CardRow` (fila de
 * lista, ahora reemplazada por el álbum). */
export const CardDetailModal = forwardRef<HTMLDialogElement, { card: CardDetailData; lang: string }>(
  function CardDetailModal({ card, lang }, ref) {
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const stage = stageInfo(card.stage);
    const style = KIND_STYLE[card.kind];

    function close() {
      if (ref && "current" in ref) ref.current?.close();
    }

    return (
      <dialog
        ref={ref}
        className="modal"
        onClose={() => setEditing(false)}
        aria-label={`Detalle de “${card.term}”`}
      >
        <div className="modal-box card-detail-panel relative">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute top-3 right-3" aria-label="Cerrar">
              <X size={16} aria-hidden />
            </button>
          </form>

          <div className="grid min-w-0 gap-6 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-8">
            <div className="mx-auto w-full max-w-56 self-start sm:sticky sm:top-0">
              <CardHover3D className="w-full">
                <WordCard term={card.term} stage={card.stage} kind={card.kind} lang={lang} reps={card.reps} size="full" due={card.due} />
              </CardHover3D>
            </div>
            <div className="min-w-0 pt-2 sm:pt-6">
              <div className="flex items-start gap-3 pr-8">
                <RankBadge stage={card.stage} size={40} title={stage.name} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold wrap-anywhere" lang={lang.split("-")[0]}>{card.term}</h2>
                  <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.soft} ${style.ink}`}>
                    <KindGlyph kind={card.kind} size={12} />
                    {KIND_LABELS[card.kind]}
                  </span>
                </div>
              </div>

              {editing ? (
                <div className="mt-5">
                  <CardEditor
                    idPrefix={`card-${card.id}`}
                    defaults={{ term: card.term, meaning: card.meaning, example: card.example, notes: card.notes, kind: card.kind }}
                    submitLabel="Guardar"
                    showNotes
                    autoFocus
                    onCancel={() => setEditing(false)}
                    onSubmit={async (values) => {
                      const res = await updateCardAction(card.id, values);
                      if (!res.ok) return res.error;
                      setEditing(false);
                      router.refresh();
                      return null;
                    }}
                  />
                </div>
              ) : (
                <>
                  <p className="mt-4" lang="es">{card.meaning}</p>
                  {card.example && <p className="mt-2 text-ink-soft italic" lang={lang.split("-")[0]}>“{card.example}”</p>}
                  {card.notes && <p className="mt-2 text-sm text-ink-soft">{card.notes}</p>}
                  <p className="mt-3 text-sm font-semibold text-ink-soft">{card.dueLabel}</p>

                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <SpeakButton text={card.term} lang={lang} />
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                      <Pencil size={16} aria-hidden />
                      Editar
                    </button>
                    {card.stage > 0 && (
                      <ConfirmButton
                        className="btn btn-outline btn-sm"
                        title="¿Reiniciar el progreso?"
                        description={`“${card.term}” vuelve a ser novata y se repasa hoy.`}
                        confirmLabel="Reiniciar"
                        onConfirm={async () => {
                          await resetCardAction(card.id);
                          router.refresh();
                        }}
                      >
                        <RotateCcw size={16} aria-hidden />
                        Reiniciar
                      </ConfirmButton>
                    )}
                    <ConfirmButton
                      className="btn btn-outline btn-error btn-sm"
                      title="¿Borrar esta carta?"
                      description={`Se borra “${card.term}” y su historial. No se puede deshacer.`}
                      confirmLabel="Borrar"
                      onConfirm={async () => {
                        await deleteCardAction(card.id);
                        close();
                        router.refresh();
                      }}
                    >
                      <Trash2 size={16} aria-hidden />
                      Borrar
                    </ConfirmButton>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>Cerrar</button>
        </form>
      </dialog>
    );
  },
);
