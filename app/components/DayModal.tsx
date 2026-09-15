'use client';

import type { Card, Label } from '@/types';
import { RARITY_DOT, RARITY_LABEL } from '@/lib/gamification';
import { hexWithAlpha } from '@/lib/labels';
import { formatLongDate } from '@/lib/dateUtils';

interface Props {
  date: number;
  cards: Card[];
  labels: Label[];
  onClose: () => void;
  onOpenCard: (id: string) => void;
}

export function DayModal({ date, cards, labels, onClose, onOpenCard }: Props) {
  const sorted = [...cards].sort((a, b) => {
    const order = { urgent: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 sm:border border-slate-800 sm:rounded-xl rounded-none w-full max-w-lg shadow-2xl flex flex-col h-screen sm:h-auto sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-100 capitalize">
              {formatLongDate(date)}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {sorted.length} {sorted.length === 1 ? 'tarjeta' : 'tarjetas'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 p-1 rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1.5">
            {sorted.map((card) => {
              const cardLabels = (card.labelIds ?? [])
                .map((id) => labels.find((l) => l.id === id))
                .filter((l): l is Label => !!l);

              return (
                <button
                  key={card.id}
                  onClick={() => onOpenCard(card.id)}
                  className="w-full text-left bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-3 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${RARITY_DOT[card.priority]}`}
                    />
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                      {RARITY_LABEL[card.priority]}
                    </span>
                    {cardLabels.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-auto">
                        {cardLabels.map((l) => (
                          <span
                            key={l.id}
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium border"
                            style={{
                              backgroundColor: hexWithAlpha(l.color, 0.12),
                              color: l.color,
                              borderColor: hexWithAlpha(l.color, 0.3),
                            }}
                          >
                            {l.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-slate-100 break-words">
                    {card.title}
                  </p>

                  {card.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {card.description}
                    </p>
                  )}

                  {card.subtasks && card.subtasks.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      <span className="font-mono">
                        {card.subtasks.filter((s) => s.done).length}/
                        {card.subtasks.length}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 border-t border-slate-800 flex justify-end shrink-0">
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