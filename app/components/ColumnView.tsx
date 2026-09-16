'use client';

import { useState, useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Card, Column, Label } from '@/types';
import { CardItem } from './CardItem';
import { useBoard } from '@/store/board';
import { COLUMN_COLORS } from '@/lib/labels';

interface Member {
  user_id: string;
  email: string;
  role: string;
}

interface Props {
  column: Column;
  cards: Record<string, Card>;
  cardOrder: string[];
  labels: Label[];
  members: Member[];
  onArchive: (id: string) => void;
  onOpen: (id: string) => void;
  onUpdateColumn: (id: string, patch: Partial<Column>) => void;
  onDeleteColumn: (id: string) => void;
}

export function ColumnView({
  column,
  cards,
  cardOrder,
  labels,
  members,
  onArchive,
  onOpen,
  onUpdateColumn,
  onDeleteColumn,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(column.title);
  const [showSettings, setShowSettings] = useState(false);
  const [wipDraft, setWipDraft] = useState(
    column.wipLimit ? String(column.wipLimit) : ''
  );
  const [countBounce, setCountBounce] = useState(false);
  const prevCount = useRef(column.cardIds.length);

  const isFull = !!column.wipLimit && column.cardIds.length >= column.wipLimit;

  // Índice de esta columna para asignar color automático por posición
  const activeColumns = useBoard((s) =>
    s.boards.find((b) => b.id === s.activeBoardId)?.columns
  );
  const columnIndex = activeColumns
    ? activeColumns.findIndex((c) => c.id === column.id)
    : 0;
  const safeIndex = columnIndex < 0 ? 0 : columnIndex;
  const accentColor =
    column.color ?? COLUMN_COLORS[safeIndex % COLUMN_COLORS.length];

  // Bounce cuando cambia el contador
  useEffect(() => {
    if (prevCount.current !== column.cardIds.length) {
      setCountBounce(true);
      const t = setTimeout(() => setCountBounce(false), 300);
      prevCount.current = column.cardIds.length;
      return () => clearTimeout(t);
    }
  }, [column.cardIds.length]);

  const saveTitle = () => {
    const t = titleDraft.trim();
    if (t && t !== column.title) onUpdateColumn(column.id, { title: t });
    else setTitleDraft(column.title);
    setEditingTitle(false);
  };

  const saveWip = () => {
    const n = parseInt(wipDraft, 10);
    onUpdateColumn(column.id, {
      wipLimit: !isNaN(n) && n > 0 ? n : undefined,
    });
  };

  return (
    <div
      id={`col-${column.id}`}
      className={`
        rounded-xl p-2.5 w-[85vw] sm:w-[320px] lg:w-[340px] xl:w-[360px] shrink-0
        border flex flex-col relative
        transition-all duration-200 snap-start
        ${
          isOver
            ? 'bg-slate-800/90 border-amber-400/70 ring-2 ring-amber-400/40 shadow-[0_0_40px_-8px_rgba(245,158,11,0.35)]'
            : 'bg-slate-900/70 border-slate-800'
        }
      `}
      style={{ borderTop: `3px solid ${accentColor}` }}
    >
      <div className="flex justify-between items-center mb-2 px-0.5 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Punto de color de la columna */}
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 8px ${accentColor}80`,
            }}
          />
          {editingTitle ? (
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') {
                  setTitleDraft(column.title);
                  setEditingTitle(false);
                }
              }}
              autoFocus
              className="flex-1 bg-slate-950 border border-amber-500 rounded px-2 py-0.5 text-sm font-bold focus:outline-none text-slate-100 min-w-0"
            />
          ) : (
            <h2
              className="font-bold text-sm cursor-pointer hover:text-amber-400 transition-colors truncate min-w-0"
              onDoubleClick={() => setEditingTitle(true)}
              title="Doble click para renombrar"
            >
              {column.isDone && '🏁 '}
              {column.title}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`
              text-xs px-2 py-0.5 rounded-full font-mono transition-colors
              ${countBounce ? 'animate-count-bounce' : ''}
              ${
                isFull
                  ? 'bg-red-900/60 text-red-300 ring-1 ring-red-500/50'
                  : 'bg-slate-800 text-slate-400'
              }
            `}
          >
            {column.cardIds.length}
            {column.wipLimit ? ` / ${column.wipLimit}` : ''}
          </span>

          {!column.isDone && (
            <>
              <button
                onClick={() => setShowSettings((s) => !s)}
                className="interactive text-slate-500 hover:text-amber-400 transition-colors text-xs"
                title="Configurar límite WIP y color"
              >
                ⚙
              </button>
              <button
                onClick={() => {
                  if (
                    column.cardIds.length > 0 &&
                    !window.confirm(
                      `Esta columna tiene ${column.cardIds.length} tarjeta(s). ¿Eliminar y moverlas a otra columna?`
                    )
                  )
                    return;
                  onDeleteColumn(column.id);
                }}
                className="interactive text-slate-500 hover:text-red-400 transition-colors text-xs"
                title="Eliminar columna"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="mb-2 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs animate-scale-in">
          <label className="block text-slate-400 mb-1.5">
            Límite WIP (vacío = sin límite)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              min={1}
              value={wipDraft}
              onChange={(e) => setWipDraft(e.target.value)}
              placeholder="Sin límite"
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-amber-500 text-slate-100"
            />
            <button
              onClick={saveWip}
              className="interactive bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded"
            >
              OK
            </button>
          </div>

          <label className="block text-slate-400 mb-1.5">
            Color de la columna
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {COLUMN_COLORS.map((c) => {
              const active = (column.color ?? accentColor) === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdateColumn(column.id, { color: c })}
                  className={`w-6 h-6 rounded-md transition-transform hover:scale-110 ${
                    active
                      ? 'ring-2 ring-white/80 ring-offset-1 ring-offset-slate-950'
                      : ''
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              );
            })}
          </div>
        </div>
      )}

      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-[100px] space-y-1.5 overflow-y-auto rounded-lg
          transition-all duration-200
          ${isOver ? 'p-1 bg-amber-500/5' : ''}
        `}
      >
        <SortableContext items={cardOrder} strategy={verticalListSortingStrategy}>
          {cardOrder.length === 0 && (
            <div
              className={`
                text-xs italic py-6 text-center border-2 border-dashed rounded-lg
                transition-all duration-300
                ${
                  isOver
                    ? 'border-amber-400/60 text-amber-400/80 bg-amber-500/5 animate-breathe'
                    : 'border-slate-800 text-slate-600'
                }
              `}
            >
              {isOver ? '✨ Suelta aquí' : 'Arrastra tarjetas aquí'}
            </div>
          )}

          {cardOrder.map((id) => {
            const card = cards[id];
            if (!card) return null;
            return (
              <CardItem
                key={id}
                card={card}
                labels={labels}
                members={members}
                onArchive={onArchive}
                onOpen={onOpen}
              />
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
}