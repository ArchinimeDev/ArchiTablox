'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Card, Column, Label } from '@/types';
import { CardItem } from './CardItem';

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

  const isFull = !!column.wipLimit && column.cardIds.length >= column.wipLimit;

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
    setShowSettings(false);
  };

  return (
    <div
      id={`col-${column.id}`}
      className={`
        rounded-xl p-2.5 w-72 sm:w-72 lg:w-80 shrink-0 border flex flex-col relative
        transition-all duration-200 snap-start
        ${
          isOver
            ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/50'
            : 'bg-slate-900/70 border-slate-800'
        }
      `}
    >
      <div className="flex justify-between items-center mb-2 px-0.5 gap-2">
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
            className="flex-1 bg-slate-950 border border-amber-500 rounded px-2 py-0.5 text-sm font-bold focus:outline-none"
          />
        ) : (
          <h2
            className="font-bold text-sm cursor-pointer hover:text-amber-400 transition truncate"
            onDoubleClick={() => setEditingTitle(true)}
            title="Doble click para renombrar"
          >
            {column.isDone && '🏁 '}
            {column.title}
          </h2>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`
              text-xs px-2 py-0.5 rounded-full font-mono transition
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
                className="text-slate-500 hover:text-amber-400 transition text-xs"
                title="Configurar límite WIP"
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
                className="text-slate-500 hover:text-red-400 transition text-xs"
                title="Eliminar columna"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="mb-2 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs">
          <label className="block text-slate-400 mb-1.5">
            Límite WIP (vacío = sin límite)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={wipDraft}
              onChange={(e) => setWipDraft(e.target.value)}
              placeholder="Sin límite"
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={saveWip}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div
        ref={setNodeRef}
        className="flex-1 min-h-[100px] space-y-1.5 overflow-y-auto"
      >
        <SortableContext items={cardOrder} strategy={verticalListSortingStrategy}>
          {cardOrder.length === 0 && (
            <div className="text-xs text-slate-600 italic py-5 text-center border-2 border-dashed border-slate-800 rounded-lg">
              {isOver ? 'Suelta aquí' : 'Arrastra tarjetas aquí'}
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