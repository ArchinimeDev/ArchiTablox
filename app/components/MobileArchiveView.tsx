'use client';

import type { Card, Column, Label } from '@/types';
import { RARITY_DOT, RARITY_LABEL } from '@/lib/gamification';
import { hexWithAlpha } from '@/lib/labels';

interface Props {
  archivedCards: Card[];
  columns: Column[];
  labels: Label[];
  onOpenCard: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onEmpty: () => void;
}

export function MobileArchiveView({
  archivedCards,
  columns,
  labels,
  onOpenCard,
  onRestore,
  onDelete,
  onEmpty,
}: Props) {
  const sorted = [...archivedCards].sort(
    (a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0)
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Título */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Archivados</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {sorted.length}{' '}
            {sorted.length === 1 ? 'tarjeta' : 'tarjetas'} archivadas
          </p>
        </div>
        {sorted.length > 0 && (
          <button
            onClick={() => {
              if (
                window.confirm(
                  `¿Vaciar archivados? Se eliminarán ${sorted.length} tarjeta(s) definitivamente.`
                )
              )
                onEmpty();
            }}
            className="text-xs text-slate-500 hover:text-red-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-red-900 transition-colors shrink-0"
          >
            Vaciar todo
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-30">📦</div>
          <p className="text-sm text-slate-500">
            No hay tarjetas archivadas
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((card) => {
            const cardLabels = (card.labelIds ?? [])
              .map((id) => labels.find((l) => l.id === id))
              .filter((l): l is Label => !!l);
            const columnName =
              columns.find((c) => c.id === card.columnId)?.title ??
              '(columna eliminada)';

            return (
              <div
                key={card.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => onOpenCard(card.id)}
                  className="w-full text-left p-3.5 hover:bg-slate-800/60 active:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap text-[10px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${RARITY_DOT[card.priority]}`}
                      />
                      {RARITY_LABEL[card.priority]}
                    </span>
                    <span className="text-slate-700">·</span>
                    <span>{columnName}</span>
                  </div>

                  {cardLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {cardLabels.map((label) => (
                        <span
                          key={label.id}
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium border"
                          style={{
                            backgroundColor: hexWithAlpha(
                              label.color,
                              0.12
                            ),
                            color: label.color,
                            borderColor: hexWithAlpha(label.color, 0.3),
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-slate-100 break-words font-medium">
                    {card.title}
                  </div>
                  {card.description && (
                    <div className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {card.description}
                    </div>
                  )}
                </button>

                <div className="flex border-t border-slate-800">
                  <button
                    onClick={() => onRestore(card.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-emerald-400 hover:bg-emerald-500/10 active:bg-emerald-500/15 transition-colors font-medium"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                    Restaurar
                  </button>
                  <div className="w-px bg-slate-800" />
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `¿Eliminar "${card.title}" definitivamente?`
                        )
                      )
                        onDelete(card.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-red-400 hover:bg-red-500/10 active:bg-red-500/15 transition-colors font-medium"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}