'use client';

import { useMemo, useState } from 'react';
import type { Board, Card } from '@/types';
import { RARITY_DOT, RARITY_LABEL, RARITY_TEXT } from '@/lib/gamification';
import { dayKey } from '@/lib/dateUtils';
import { sounds } from '@/lib/sounds';

interface Props {
  boards: Board[];
  userId: string | null;
  onOpenCard: (cardId: string, boardId: string) => void;
  onSwitchBoard: (boardId: string) => void;
}

interface AssignedCard {
  card: Card;
  boardId: string;
  boardName: string;
  columnTitle: string;
  columnIsDone: boolean;
}

type Filter = 'all' | 'pending' | 'overdue' | 'today' | 'done';

const FILTERS: { id: Filter; label: string; icon: string }[] = [
  { id: 'all', label: 'Todas', icon: '📋' },
  { id: 'pending', label: 'Pendientes', icon: '⏳' },
  { id: 'today', label: 'Hoy', icon: '📅' },
  { id: 'overdue', label: 'Vencidas', icon: '⚠️' },
  { id: 'done', label: 'Completadas', icon: '✅' },
];

export function MyCardsView({
  boards,
  userId,
  onOpenCard,
  onSwitchBoard,
}: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [groupBy, setGroupBy] = useState<'board' | 'priority'>('board');

  const allAssigned = useMemo<AssignedCard[]>(() => {
    if (!userId) return [];
    const out: AssignedCard[] = [];

    for (const board of boards) {
      for (const card of Object.values(board.cards)) {
        if (card.archived) continue;
        if (!(card.assigneeIds ?? []).includes(userId)) continue;

        const col = board.columns.find((c) => c.id === card.columnId);
        out.push({
          card,
          boardId: board.id,
          boardName: board.name,
          columnTitle: col?.title ?? '—',
          columnIsDone: !!col?.isDone,
        });
      }
    }
    return out;
  }, [boards, userId]);

  const filtered = useMemo(() => {
    const today = dayKey(Date.now());

    return allAssigned.filter((item) => {
      const { card, columnIsDone } = item;
      switch (filter) {
        case 'pending':
          return !columnIsDone;
        case 'done':
          return columnIsDone;
        case 'overdue':
          return (
            !columnIsDone &&
            !!card.dueDate &&
            dayKey(card.dueDate) < today &&
            !card.completedAt
          );
        case 'today':
          return (
            !columnIsDone && !!card.dueDate && dayKey(card.dueDate) === today
          );
        case 'all':
        default:
          return true;
      }
    });
  }, [allAssigned, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, AssignedCard[]>();
    for (const item of filtered) {
      const key =
        groupBy === 'board'
          ? item.boardName
          : RARITY_LABEL[item.card.priority];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    // Ordenar dentro de cada grupo por prioridad y luego por fecha
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const result: [string, AssignedCard[]][] = [];
    for (const [key, items] of map) {
      items.sort((a, b) => {
        const pa = priorityOrder[a.card.priority];
        const pb = priorityOrder[b.card.priority];
        if (pa !== pb) return pa - pb;
        const da = a.card.dueDate ?? Infinity;
        const db = b.card.dueDate ?? Infinity;
        return da - db;
      });
      result.push([key, items]);
    }
    result.sort(([a], [b]) => a.localeCompare(b));
    return result;
  }, [filtered, groupBy]);

  const counts = useMemo(() => {
    const today = dayKey(Date.now());
    let pending = 0;
    let done = 0;
    let overdue = 0;
    let todayCount = 0;
    for (const item of allAssigned) {
      if (item.columnIsDone) done++;
      else pending++;
      if (
        !item.columnIsDone &&
        item.card.dueDate &&
        dayKey(item.card.dueDate) < today &&
        !item.card.completedAt
      ) {
        overdue++;
      }
      if (
        !item.columnIsDone &&
        item.card.dueDate &&
        dayKey(item.card.dueDate) === today
      ) {
        todayCount++;
      }
    }
    return {
      total: allAssigned.length,
      pending,
      done,
      overdue,
      today: todayCount,
    };
  }, [allAssigned]);

  if (!userId) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm">
        Inicia sesión para ver tus tarjetas asignadas.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-4">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Mis tarjetas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {counts.total === 0
              ? 'No tienes tarjetas asignadas'
              : `${counts.total} tarjeta${
                  counts.total === 1 ? '' : 's'
                } asignada${
                  counts.total === 1 ? '' : 's'
                } en todos tus tableros`}
          </p>
        </div>

        {/* Group toggle */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => {
              sounds.click();
              setGroupBy('board');
            }}
            className={`interactive px-3 h-7 rounded-md text-xs font-medium transition-colors ${
              groupBy === 'board'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Por tablero
          </button>
          <button
            onClick={() => {
              sounds.click();
              setGroupBy('priority');
            }}
            className={`interactive px-3 h-7 rounded-md text-xs font-medium transition-colors ${
              groupBy === 'priority'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Por prioridad
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3 px-3">
        {FILTERS.map((f) => {
          const count =
            f.id === 'all'
              ? counts.total
              : f.id === 'pending'
              ? counts.pending
              : f.id === 'done'
              ? counts.done
              : f.id === 'overdue'
              ? counts.overdue
              : counts.today;

          const isActive = filter === f.id;

          return (
            <button
              key={f.id}
              onClick={() => {
                sounds.click();
                setFilter(f.id);
              }}
              className={`interactive shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border transition-colors ${
                isActive
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-4xl mb-3 opacity-40">
            {filter === 'done' ? '📭' : '🎉'}
          </div>
          <p className="text-sm text-slate-400 mb-1">
            {filter === 'done'
              ? 'Aún no has completado tarjetas'
              : filter === 'overdue'
              ? '¡Sin tarjetas vencidas!'
              : filter === 'today'
              ? 'Nada para hoy'
              : filter === 'pending'
              ? '¡Todo completado!'
              : 'No tienes tarjetas asignadas todavía'}
          </p>
          <p className="text-xs text-slate-500">
            {filter === 'all'
              ? 'Ve a un tablero y asígnate alguna tarjeta.'
              : 'Cambia el filtro para ver otras.'}
          </p>
        </div>
      )}

      {/* GROUPS */}
      {grouped.map(([groupName, items]) => (
        <div key={groupName}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              {groupName}
            </h2>
            <span className="text-[10px] font-mono text-slate-600 bg-slate-900 border border-slate-800 rounded-full px-2 py-0.5">
              {items.length}
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <AssignedCardRow
                key={`${item.boardId}-${item.card.id}`}
                item={item}
                onOpen={() => {
                  sounds.open();
                  onOpenCard(item.card.id, item.boardId);
                }}
                onGoToBoard={() => {
                  sounds.nav();
                  onSwitchBoard(item.boardId);
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// CARD ROW
// ============================================================

function AssignedCardRow({
  item,
  onOpen,
  onGoToBoard,
}: {
  item: AssignedCard;
  onOpen: () => void;
  onGoToBoard: () => void;
}) {
  const { card, boardName, columnTitle, columnIsDone } = item;
  const today = dayKey(Date.now());
  const isOverdue =
    !columnIsDone &&
    !!card.dueDate &&
    dayKey(card.dueDate) < today &&
    !card.completedAt;

  const dueLabel = card.dueDate
    ? new Date(card.dueDate).toLocaleDateString('es', {
        day: '2-digit',
        month: 'short',
      })
    : null;

  const subtasks = card.subtasks ?? [];
  const doneSubtasks = subtasks.filter((s) => s.done).length;
  const commentCount = card.comments?.length ?? 0;
  const attachmentCount = card.attachments?.length ?? 0;

  return (
    <div
      className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 transition-colors cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        {/* Priority dot */}
        <span
          className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${RARITY_DOT[card.priority]}`}
          title={RARITY_LABEL[card.priority]}
        />

        <div className="flex-1 min-w-0">
          {/* Title */}
          <p
            className={`text-sm font-medium break-words ${
              columnIsDone
                ? 'text-slate-500 line-through'
                : 'text-slate-100'
            }`}
          >
            {card.title}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[10px] text-slate-500">
            {/* Board name */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGoToBoard();
              }}
              className="interactive flex items-center gap-1 hover:text-amber-400 transition-colors"
              title="Ir al tablero"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="18" rx="1" />
              </svg>
              <span className="truncate max-w-[120px]">{boardName}</span>
            </button>

            <span className="text-slate-700">·</span>

            {/* Column */}
            <span className="flex items-center gap-1 truncate max-w-[100px]">
              {columnIsDone && '🏁 '}
              {columnTitle}
            </span>

            {/* Priority text */}
            <span className="text-slate-700">·</span>
            <span
              className={`font-semibold uppercase tracking-wider ${RARITY_TEXT[card.priority]}`}
            >
              {RARITY_LABEL[card.priority]}
            </span>
          </div>

          {/* Description */}
          {card.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
              {card.description}
            </p>
          )}

          {/* Footer icons */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 flex-wrap">
            {subtasks.length > 0 && (
              <span className="flex items-center gap-1" title="Subtareas">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span className="font-mono">
                  {doneSubtasks}/{subtasks.length}
                </span>
              </span>
            )}
            {commentCount > 0 && (
              <span className="flex items-center gap-1">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="font-mono">{commentCount}</span>
              </span>
            )}
            {attachmentCount > 0 && (
              <span className="flex items-center gap-1">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <span className="font-mono">{attachmentCount}</span>
              </span>
            )}
          </div>
        </div>

        {/* Due date */}
        {dueLabel && (
          <span
            className={`shrink-0 text-[10px] flex items-center gap-1 font-medium ${
              isOverdue
                ? 'text-red-400'
                : columnIsDone
                ? 'text-slate-600'
                : 'text-slate-500'
            }`}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {dueLabel}
          </span>
        )}
      </div>
    </div>
  );
}