// lib/metrics.ts
import type { Card, Column, ActivityEvent } from '@/types';
import { startOfDay } from './dateUtils';

// ============================================================
// TIPOS
// ============================================================

export interface TimeSeriesPoint {
  date: number;
  value: number;
}

export interface CfdPoint {
  date: number;
  counts: Record<string, number>;
}

// ============================================================
// HELPERS
// ============================================================

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDuration(ms: number | null): string {
  if (ms === null || !isFinite(ms)) return '—';
  if (ms < 0) return '—';

  const days = ms / 86_400_000;
  if (days >= 1) {
    if (days < 10) return `${days.toFixed(1)}d`;
    return `${Math.round(days)}d`;
  }

  const hours = ms / 3_600_000;
  if (hours >= 1) return `${hours.toFixed(1)}h`;

  const mins = ms / 60_000;
  return `${Math.max(1, Math.round(mins))}m`;
}

// ============================================================
// LEAD TIME
// ============================================================

export function getAverageLeadTime(
  cards: Record<string, Card>
): number | null {
  const completed = Object.values(cards).filter(
    (c) => c.completedAt && !c.archived
  );
  if (completed.length === 0) return null;
  const total = completed.reduce(
    (sum, c) => sum + (c.completedAt! - c.createdAt),
    0
  );
  return total / completed.length;
}

export function getMedianLeadTime(
  cards: Record<string, Card>
): number | null {
  const completed = Object.values(cards).filter(
    (c) => c.completedAt && !c.archived
  );
  if (completed.length === 0) return null;
  const times = completed
    .map((c) => c.completedAt! - c.createdAt)
    .sort((a, b) => a - b);
  const mid = Math.floor(times.length / 2);
  return times.length % 2 === 0
    ? (times[mid - 1] + times[mid]) / 2
    : times[mid];
}

// ============================================================
// CYCLE TIME (aprox = lead time, ya que no trackeamos "start")
// ============================================================

export function getAverageCycleTime(
  cards: Record<string, Card>
): number | null {
  return getAverageLeadTime(cards);
}

// ============================================================
// WIP ACTUAL
// ============================================================

export function getCurrentWip(cards: Record<string, Card>): number {
  return Object.values(cards).filter(
    (c) => !c.archived && !c.completedAt
  ).length;
}

// ============================================================
// THROUGHPUT (tarjetas completadas por día)
// ============================================================

export function getThroughput(
  cards: Record<string, Card>,
  days: number
): TimeSeriesPoint[] {
  const now = startOfDay(Date.now());
  const result: TimeSeriesPoint[] = [];
  const dayMap: Record<string, number> = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dayKey(d.getTime());
    dayMap[key] = 0;
    result.push({ date: d.getTime(), value: 0 });
  }

  for (const card of Object.values(cards)) {
    if (!card.completedAt || card.archived) continue;
    const key = dayKey(card.completedAt);
    if (key in dayMap) dayMap[key]++;
  }

  return result.map((p) => ({ ...p, value: dayMap[dayKey(p.date)] }));
}

// ============================================================
// CFD (Cumulative Flow Diagram)
// ============================================================

export function getCfd(
  cards: Record<string, Card>,
  columns: Column[],
  activity: ActivityEvent[],
  days: number
): CfdPoint[] {
  // Cutoffs al final de cada día
  const now = startOfDay(Date.now());
  const cutoffs: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(23, 59, 59, 999);
    cutoffs.push(d.getTime());
  }

  // Orden cronológico
  const sorted = [...activity].sort((a, b) => a.timestamp - b.timestamp);

  const cardState: Record<
    string,
    { column: string | null; deleted: boolean }
  > = {};
  const result: CfdPoint[] = [];
  let evIdx = 0;

  for (const cutoff of cutoffs) {
    // Aplicar eventos hasta cutoff
    while (evIdx < sorted.length && sorted[evIdx].timestamp <= cutoff) {
      const ev = sorted[evIdx++];
      if (!ev.cardId) continue;

      if (!cardState[ev.cardId]) {
        cardState[ev.cardId] = { column: null, deleted: false };
      }
      const st = cardState[ev.cardId];

      switch (ev.type) {
        case 'card_created':
          st.column = ev.toColumn ?? null;
          break;
        case 'card_moved':
        case 'card_completed':
        case 'card_uncompleted':
        case 'card_restored':
          st.column = ev.toColumn ?? st.column;
          break;
        case 'card_archived':
        case 'card_deleted':
          st.deleted = true;
          break;
      }
    }

    // Contar tarjetas por columna
    const counts: Record<string, number> = {};
    columns.forEach((c) => (counts[c.id] = 0));

    for (const state of Object.values(cardState)) {
      if (state.deleted || !state.column) continue;
      const col = columns.find((c) => c.title === state.column);
      if (col) counts[col.id]++;
    }

    result.push({ date: cutoff, counts });
  }

  return result;
}

// ============================================================
// DISTRIBUCIÓN ACTUAL
// ============================================================

export function getCurrentDistribution(
  cards: Record<string, Card>,
  columns: Column[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  columns.forEach((c) => (counts[c.id] = 0));

  for (const card of Object.values(cards)) {
    if (card.archived) continue;
    if (counts[card.columnId] !== undefined) counts[card.columnId]++;
  }

  return counts;
}

// ============================================================
// ESTADÍSTICAS EXTRA
// ============================================================

export function getCompletedCount(cards: Record<string, Card>): number {
  return Object.values(cards).filter((c) => c.completedAt && !c.archived)
    .length;
}

export function getCardsCreatedInRange(
  cards: Record<string, Card>,
  days: number
): number {
  const cutoff = Date.now() - days * 86_400_000;
  return Object.values(cards).filter((c) => c.createdAt >= cutoff).length;
}