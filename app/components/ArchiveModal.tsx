'use client';

import type { Card, Column, Label } from '@/types';
import { hexWithAlpha } from '@/lib/labels';
import { RARITY_DOT, RARITY_LABEL } from '@/lib/gamification';

interface Props {
  archivedCards: Card[];
  columns: Column[];
  labels: Label[];
  onClose: () => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onEmpty: () => void;
}

export function ArchiveModal({
  archivedCards,
  columns,
  labels,
  onClose,
  onRestore,
  onDelete,
  onEmpty,
}: Props) {
  const sorted = [...archivedCards].sort(
    (a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0)
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 sm:border border-slate-800 sm:rounded-xl rounded-none w-full max-w-2xl sm:my-8 shadow-2xl flex flex-col h-screen sm:h-auto sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              📦 Archivados
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {sorted.length}{' '}
              {sorted.length === 1 ? 'tarjeta' : 'tarjetas'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 p-1.5 rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {sorted.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-sm">No hay tarjetas archivadas.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
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
                    className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap text-[10px] text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${RARITY_DOT[card.priority]}`}
                            />
                            {RARITY_LABEL[card.priority]}
                          </span>
                          <span className="text-slate-700">·</span>
                          <span>{columnName}</span>
                          {card.archivedAt && (
                            <>
                              <span className="text-slate-700">·</span>
                              <span>
                                {new Date(card.archivedAt).toLocaleDateString(
                                  'es',
                                  {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  }
                                )}
                              </span>
                            </>
                          )}
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

                        <p className="text-sm text-slate-100 break-words">
                          {card.title}
                        </p>

                        {card.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {card.description}
                          </p>
                        )}
                      </div>

                      <div className="flex sm:flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => onRestore(card.id)}
                          className="flex-1 sm:flex-none text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded px-2.5 py-1 transition-colors whitespace-nowrap"
                        >
                          Restaurar
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Eliminar definitivamente "${card.title}"?`
                              )
                            )
                              onDelete(card.id);
                          }}
                          className="flex-1 sm:flex-none text-xs bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded px-2.5 py-1 transition-colors whitespace-nowrap"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-800 flex flex-wrap gap-2 justify-between items-center shrink-0">
          <button
            onClick={() => {
              if (sorted.length === 0) return;
              if (
                window.confirm(
                  `¿Vaciar archivados? Se eliminarán ${sorted.length} tarjeta(s).`
                )
              )
                onEmpty();
            }}
            disabled={sorted.length === 0}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-500"
          >
            Vaciar archivados
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}