'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Board, Card } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  boards: Board[];
  activeBoardId: string;
  onOpenCard: (cardId: string, boardId: string) => void;
  onSwitchBoard: (boardId: string) => void;
}

type ResultType = 'card' | 'board' | 'label';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  boardId?: string;
  cardId?: string;
  labelColor?: string;
  priority?: string;
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-slate-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const q = query.toLowerCase();
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let idx = lower.indexOf(q);

  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push(text.slice(lastIndex, idx));
    }
    parts.push(
      <mark
        key={idx}
        className="bg-amber-500/30 text-amber-200 rounded px-0.5"
      >
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    lastIndex = idx + q.length;
    idx = lower.indexOf(q, lastIndex);
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}

export function CommandPalette({
  open,
  onClose,
  boards,
  activeBoardId,
  onOpenCard,
  onSwitchBoard,
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const results: SearchResult[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: SearchResult[] = [];

    const cardResults: SearchResult[] = [];
    for (const board of boards) {
      for (const card of Object.values(board.cards)) {
        if (card.archived) continue;

        const titleMatch = card.title.toLowerCase().includes(q);
        const descMatch = (card.description ?? '').toLowerCase().includes(q);

        if (!q || titleMatch || descMatch) {
          cardResults.push({
            id: `card-${board.id}-${card.id}`,
            type: 'card',
            title: card.title,
            subtitle: board.name,
            boardId: board.id,
            cardId: card.id,
            priority: card.priority,
          });
        }
      }
    }
    cardResults.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(q);
      const bTitle = b.title.toLowerCase().includes(q);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      return 0;
    });

    const boardResults: SearchResult[] = [];
    for (const board of boards) {
      if (!q || board.name.toLowerCase().includes(q)) {
        boardResults.push({
          id: `board-${board.id}`,
          type: 'board',
          title: board.name,
          subtitle: board.id === activeBoardId ? 'Tablero actual' : 'Tablero',
          boardId: board.id,
        });
      }
    }

    const labelResults: SearchResult[] = [];
    const seenLabels = new Set<string>();
    for (const board of boards) {
      for (const label of board.labels) {
        if (seenLabels.has(label.name.toLowerCase())) continue;
        if (!q || label.name.toLowerCase().includes(q)) {
          seenLabels.add(label.name.toLowerCase());
          const count = Object.values(board.cards).filter((c) =>
            (c.labelIds ?? []).includes(label.id)
          ).length;
          labelResults.push({
            id: `label-${board.id}-${label.id}`,
            type: 'label',
            title: label.name,
            subtitle: `${count} tarjeta${count === 1 ? '' : 's'}`,
            labelColor: label.color,
            boardId: board.id,
          });
        }
      }
    }

    if (!q) {
      out.push(...boardResults);
      out.push(...cardResults.slice(0, 20));
    } else {
      out.push(...cardResults.slice(0, 30));
      out.push(...boardResults.slice(0, 10));
      out.push(...labelResults.slice(0, 10));
    }

    return out;
  }, [query, boards, activeBoardId]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [results.length, query]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-idx="${selectedIdx}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIdx]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const r = results[selectedIdx];
      if (r) handleSelect(r);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // ★ SIMPLIFICADO: el page.tsx gestiona la apertura pendiente.
  // Aquí solo avisamos; no usamos setTimeout.
  const handleSelect = (r: SearchResult) => {
    if (r.type === 'card' && r.cardId && r.boardId) {
      onOpenCard(r.cardId, r.boardId);
      onClose();
    } else if (r.type === 'board' && r.boardId) {
      onSwitchBoard(r.boardId);
      onClose();
    } else if (r.type === 'label' && r.boardId) {
      onSwitchBoard(r.boardId);
      onClose();
    }
  };

  if (!open) return null;

  const grouped: { type: ResultType; label: string; items: SearchResult[] }[] =
    [];
  const cards = results.filter((r) => r.type === 'card');
  const boardsR = results.filter((r) => r.type === 'board');
  const labelsR = results.filter((r) => r.type === 'label');

  if (cards.length) grouped.push({ type: 'card', label: 'Tarjetas', items: cards });
  if (boardsR.length) grouped.push({ type: 'board', label: 'Tableros', items: boardsR });
  if (labelsR.length) grouped.push({ type: 'label', label: 'Etiquetas', items: labelsR });

  let runningIdx = 0;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
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
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar tarjetas, tableros, etiquetas..."
            className="flex-1 bg-transparent border-0 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-slate-500 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 shrink-0">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="overflow-y-auto flex-1 p-1.5">
          {results.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-3xl mb-2 opacity-40">🔍</div>
              <p className="text-xs">
                {query.trim()
                  ? `Sin resultados para "${query}"`
                  : 'Empieza a escribir para buscar'}
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.type} className="mb-1">
                <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                  {group.label}
                </div>
                {group.items.map((r) => {
                  const myIdx = runningIdx++;
                  const isSelected = myIdx === selectedIdx;
                  return (
                    <button
                      key={r.id}
                      data-idx={myIdx}
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setSelectedIdx(myIdx)}
                      className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                        isSelected ? 'bg-slate-800' : 'hover:bg-slate-800/50'
                      }`}
                    >
                      {r.type === 'card' && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            PRIORITY_DOT[r.priority ?? 'medium']
                          }`}
                        />
                      )}
                      {r.type === 'board' && (
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-slate-500 shrink-0"
                        >
                          <rect x="3" y="3" width="7" height="18" rx="1" />
                          <rect x="14" y="3" width="7" height="18" rx="1" />
                        </svg>
                      )}
                      {r.type === 'label' && (
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border"
                          style={{
                            backgroundColor:
                              (r.labelColor ?? '#64748b') + '40',
                            borderColor: r.labelColor ?? '#64748b',
                          }}
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-100 truncate">
                          <Highlight text={r.title} query={query} />
                        </div>
                        {r.subtitle && (
                          <div className="text-[10px] text-slate-500 truncate">
                            {r.subtitle}
                            {r.priority && ` · ${PRIORITY_LABEL[r.priority]}`}
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-slate-500 shrink-0"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-800 px-3 py-2 flex items-center gap-3 text-[10px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-slate-950 border border-slate-800 rounded px-1 py-0.5">
              ↑↓
            </kbd>
            Navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-slate-950 border border-slate-800 rounded px-1 py-0.5">
              ⏎
            </kbd>
            Abrir
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-slate-950 border border-slate-800 rounded px-1 py-0.5">
              Esc
            </kbd>
            Cerrar
          </span>
          <span className="ml-auto text-slate-600">
            {results.length} resultado{results.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  );
}