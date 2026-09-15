'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Card, Column, Label } from '@/types';
import { CardItem } from './CardItem';

interface Props {
  column: Column;
  cards: Record<string, Card>;
  cardOrder: string[];
  labels: Label[];
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
        w-72 shrink-0 flex flex-col snap-start rounded-xl border
        transition-colors duration-150
        ${
          isOver
            ? 'bg-slate-900 border-amber-500/60'
            : 'bg-slate-900/40 border-slate-800/80'
        }
      `}
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2 min-w-0 flex-1">
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
              className="flex-1 bg-slate-950 border border-amber-500/60 rounded px-2 py-0.5 text-sm font-semibold focus:outline-none"
            />
          ) : (
            <h2
              className="font-semibold text-sm text-slate-100 cursor-pointer hover:text-amber-400 transition-colors truncate"
              onDoubleClick={() => setEditingTitle(true)}
              title="Doble click para renombrar"
            >
              {column.title}
            </h2>
          )}
          <span
            className={`
              text-[11px] font-mono px-1.5 rounded shrink-0
              ${
                isFull
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-slate-800 text-slate-400'
              }
            `}
          >
            {column.cardIds.length}
            {column.wipLimit ? `/${column.wipLimit}` : ''}
          </span>
        </div>

        {!column.isDone && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="text-slate-500 hover:text-slate-200 p-1 rounded transition-colors"
              title="Configurar"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
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
              className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
              title="Eliminar columna"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Ajustes WIP */}
      {showSettings && (
        <div className="px-3 py-2.5 border-b border-slate-800/80 bg-slate-950/40">
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-medium">
            Límite de tarjetas
          </label>
          <div className="flex gap-1.5">
            <input
              type="number"
              min={1}
              value={wipDraft}
              onChange={(e) => setWipDraft(e.target.value)}
              placeholder="Sin límite"
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-500/60"
            />
            <button
              onClick={saveWip}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1 rounded transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[80px]"
      >
        <SortableContext items={cardOrder} strategy={verticalListSortingStrategy}>
          {cardOrder.length === 0 && (
            <div className="text-xs text-slate-600 italic py-6 text-center">
              {isOver ? 'Suelta aquí' : 'Sin tarjetas'}
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