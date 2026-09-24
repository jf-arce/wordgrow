"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { CARD_KINDS, KIND_LABELS, type CardKind } from "@/lib/quiz";
import { STAGES } from "@/lib/srs";

export function CardFilters({
  deckId,
  q,
  stage,
  kind,
}: {
  deckId: number;
  q: string;
  stage?: number;
  kind?: CardKind;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(q);
  const [selectedStage, setSelectedStage] = useState(stage?.toString() ?? "");
  const [selectedKind, setSelectedKind] = useState(kind ?? "");
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  function apply(nextQuery: string, nextStage: string, nextKind: string, delay: number) {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const search = nextQuery.trim();
      if (search) params.set("q", search); else params.delete("q");
      if (nextStage) params.set("stage", nextStage); else params.delete("stage");
      if (nextKind) params.set("kind", nextKind); else params.delete("kind");
      const suffix = params.toString();
      router.replace(`/mazos/${deckId}${suffix ? `?${suffix}` : ""}`, { scroll: false });
      timer.current = null;
    }, delay);
  }

  function clear() {
    setQuery("");
    setSelectedStage("");
    setSelectedKind("");
    apply("", "", "", 0);
  }

  const hasFilters = query.trim() !== "" || selectedStage !== "" || selectedKind !== "";

  return (
    <form
      role="search"
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        apply(query, selectedStage, selectedKind, 0);
      }}
    >
      <div className="min-w-56 flex-1">
        <label htmlFor="f-q" className="mb-1.5 block text-sm font-semibold">Buscar</label>
        <div className="relative">
          <Search size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-soft" />
          <input
            id="f-q"
            name="q"
            value={query}
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              apply(next, selectedStage, selectedKind, 300);
            }}
            className="field-input pl-10"
            placeholder="Palabra o significado"
            autoComplete="off"
          />
        </div>
      </div>
      <div>
        <label htmlFor="f-stage" className="mb-1.5 block text-sm font-semibold">Etapa</label>
        <select
          id="f-stage"
          name="stage"
          value={selectedStage}
          onChange={(event) => {
            const next = event.target.value;
            setSelectedStage(next);
            apply(query, next, selectedKind, 0);
          }}
          className="field-input"
        >
          <option value="">Todas</option>
          {STAGES.map((item) => <option key={item.stage} value={item.stage}>{item.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-kind" className="mb-1.5 block text-sm font-semibold">Tipo</label>
        <select
          id="f-kind"
          name="kind"
          value={selectedKind}
          onChange={(event) => {
            const next = event.target.value;
            setSelectedKind(next);
            apply(query, selectedStage, next, 0);
          }}
          className="field-input"
        >
          <option value="">Todos</option>
          {CARD_KINDS.map((item) => <option key={item} value={item}>{KIND_LABELS[item]}</option>)}
        </select>
      </div>
      {hasFilters && <button type="button" className="btn btn-quiet" onClick={clear}>Limpiar</button>}
    </form>
  );
}
