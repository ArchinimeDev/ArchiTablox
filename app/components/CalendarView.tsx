'use client';

import { useState, useMemo } from 'react';
import type { Card, Label } from '@/types';
import { RARITY_DOT } from '@/lib/gamification';
import { hexWithAlpha } from '@/lib/labels';
import { dayKey } from '@/lib/dateUtils';

interface Props {
  cards: Card[];
  labels: Label[];
  onOpen: (id: string) => void;
  onOpenDay: (dateTs: number) => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const getWeekStart = (d: Date) => {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function CalendarView({ cards, labels, onOpen, onOpenDay }: Props) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursor, setCursor] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const cardsByDay = useMemo(() => {
    const map: Record<string, Card[]> = {};
    for (const c of cards) {
      if (!c.dueDate) continue;
      const key = dayKey(c.dueDate);
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return map;
  }, [cards]);

  const cardsWithoutDate = useMemo(
    () => cards.filter((c) => !c.dueDate),
    [cards]
  );

  const grid = useMemo(() => {
    const firstOfMonth = startOfMonth(cursor);
    const gridStart = getWeekStart(firstOfMonth);
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    const lastOfMonth = new Date(year, month + 1, 0);
    const totalDays =
      Math.round(
        (lastOfMonth.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    const weeks = Math.ceil(totalDays / 7);

    const cells: Date[] = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      cells.push(d);
    }
    return cells;
  }, [cursor]);

  const goPrev = () =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  const goToday = () =>
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthLabel = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg w-8 h-8 flex items-center justify-center transition-colors"
            title="Mes anterior"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={goNext}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg w-8 h-8 flex items-center justify-center transition-colors"
            title="Mes siguiente"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <button
            onClick={goToday}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 transition-colors"
          >
            Hoy
          </button>
        </div>

        <h2 className="text-base sm:text-lg font-semibold text-slate-100 capitalize">
          {monthLabel}
        </h2>

        <div className="text-xs text-slate-500">
          {cards.filter((c) => c.dueDate).length} con fecha
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-[10px] uppercase tracking-wider text-slate-500 font-medium text-center py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((day) => {
          const key = dayKey(day.getTime());
          const isToday = sameDay(day, today);
          const isCurrentMonth = day.getMonth() === cursor.getMonth();
          const dayCards = cardsByDay[key] ?? [];
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={key}
              className={`
                min-h-[110px] rounded-lg border p-1.5 flex flex-col transition-colors
                ${
                  isToday
                    ? 'bg-amber-500/5 border-amber-500/40'
                    : isCurrentMonth
                    ? 'bg-slate-900/40 border-slate-800/80'
                    : 'bg-slate-950/40 border-slate-900'
                }
                ${isWeekend && isCurrentMonth && !isToday ? 'bg-slate-900/20' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-1 px-0.5">
                <span
                  className={`
                    text-[11px] font-mono tabular-nums
                    ${
                      isToday
                        ? 'text-amber-400 font-bold'
                        : isCurrentMonth
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }
                  `}
                >
                  {day.getDate()}
                </span>
                {dayCards.length > 0 && (
                  <span className="text-[9px] font-mono text-slate-500">
                    {dayCards.length}
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                {dayCards.slice(0, 3).map((c) => {
                  const cardLabels = (c.labelIds ?? [])
                    .map((id) => labels.find((l) => l.id === id))
                    .filter((l): l is Label => !!l);

                  return (
                    <button
                      key={c.id}
                      onClick={() => onOpen(c.id)}
                      className="group text-left rounded bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-slate-600 px-1.5 py-1 transition-colors"
                      title={c.title}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <span
                          className={`w-1 h-1 rounded-full shrink-0 ${RARITY_DOT[c.priority]}`}
                        />
                        {cardLabels.length > 0 && (
                          <div className="flex gap-0.5">
                            {cardLabels.slice(0, 3).map((l) => (
                              <span
                                key={l.id}
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: l.color }}
                                title={l.name}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-200 leading-tight line-clamp-2 break-words">
                        {c.title}
                      </div>
                    </button>
                  );
                })}

                {dayCards.length > 3 && (
                  <button
                    onClick={() => onOpenDay(day.getTime())}
                    className="text-[9px] text-slate-500 hover:text-amber-400 text-left px-1.5 transition-colors font-medium"
                  >
                    +{dayCards.length - 3} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {cardsWithoutDate.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-medium">
              Sin fecha
            </h3>
            <span className="text-[10px] font-mono text-slate-600">
              {cardsWithoutDate.length}
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cardsWithoutDate.map((c) => {
              const cardLabels = (c.labelIds ?? [])
                .map((id) => labels.find((l) => l.id === id))
                .filter((l): l is Label => !!l);

              return (
                <button
                  key={c.id}
                  onClick={() => onOpen(c.id)}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md px-2 py-1 transition-colors max-w-[240px]"
                  title={c.title}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${RARITY_DOT[c.priority]}`}
                  />
                  {cardLabels.length > 0 && (
                    <div className="flex gap-0.5 shrink-0">
                      {cardLabels.slice(0, 2).map((l) => (
                        <span
                          key={l.id}
                          className="w-1.5 h-1.5 rounded-full border"
                          style={{
                            backgroundColor: hexWithAlpha(l.color, 0.5),
                            borderColor: l.color,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-slate-300 truncate">
                    {c.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {cards.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          No hay tarjetas que coincidan con los filtros.
        </div>
      )}
    </div>
  );
}