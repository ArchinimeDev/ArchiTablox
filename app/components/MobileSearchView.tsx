'use client';

import type { Card, Label } from '@/types';
import { RARITY_DOT, RARITY_LABEL } from '@/lib/gamification';
import { hexWithAlpha } from '@/lib/labels';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  cards: Card[];
  labels: Label[];
  onOpenCard: (id: string) => void;
}

export function MobileSearchView({
  search,
  onSearchChange,
  cards,
  labels,
  onOpenCard,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Título */}
      <div>
        <h1 className="text-lg font-bold text-slate-100">Buscar</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Encuentra tarjetas por título, descripción, etiqueta...
        </p>
      </div>

      {/* Input grande */}
      <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-xl px-3.5 h-12 focus-within:border-amber-500/60 transition-colors">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-500 shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          autoFocus
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar..."
          className="flex-1 bg-transparent border-0 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none min-w-0"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="text-slate-500 hover:text-slate-200 p-1 shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Contador */}
      {search.trim() && (
        <div className="text-xs text-slate-500 px-1">
          {cards.length} resultado{cards.length === 1 ? '' : 's'}
        </div>
      )}

      {/* Resultados */}
      {!search.trim() ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-30">🔍</div>
          <p className="text-sm text-slate-500">
            Escribe para buscar en tus tarjetas
          </p>
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-30">🤷</div>
          <p className="text-sm text-slate-500">
            Sin resultados para &ldquo;{search}&rdquo;
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((c) => {
            const cardLabels = (c.labelIds ?? [])
              .map((id) => labels.find((l) => l.id === id))
              .filter((l): l is Label => !!l);

            return (
              <button
                key={c.id}
                onClick={() => onOpenCard(c.id)}
                className="w-full text-left bg-slate-900 border border-slate-800 hover:border-slate-700 active:bg-slate-800/80 rounded-xl p-3.5 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${RARITY_DOT[c.priority]}`}
                  />
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    {RARITY_LABEL[c.priority]}
                  </span>
                </div>
                <div className="text-sm text-slate-100 break-words font-medium">
                  {c.title}
                </div>
                {c.description && (
                  <div className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {c.description}
                  </div>
                )}
                {cardLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
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
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}