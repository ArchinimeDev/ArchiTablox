import type { Card, NotificationSettings } from '@/types';
import { startOfDay } from './dateUtils';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  daysBefore: [0, 1],
  browserNotifications: false,
};

export const DAY_OPTIONS: { value: number; label: string; short: string }[] = [
  { value: 0, label: 'El mismo día', short: 'hoy' },
  { value: 1, label: '1 día antes', short: 'mañana' },
];

export type DueStatus = 'overdue' | 'today' | 'upcoming';

export interface DueCardInfo {
  card: Card;
  status: DueStatus;
  daysDiff: number;
}

export function getDueCards(
  cards: Card[],
  settings: NotificationSettings | undefined
): DueCardInfo[] {
  if (!settings || !settings.enabled) return [];

  const todayStart = startOfDay(Date.now());
  const result: DueCardInfo[] = [];

  for (const card of cards) {
    if (card.archived || !card.dueDate) continue;
    if (card.completedAt) continue;

    const dueStart = startOfDay(card.dueDate);
    const daysDiff = Math.round(
      (dueStart - todayStart) / (1000 * 60 * 60 * 24)
    );

    let status: DueStatus | null = null;

    if (daysDiff < 0) {
      // Vencidas: SIEMPRE se muestran (no dependen de daysBefore)
      status = 'overdue';
    } else if (daysDiff === 0) {
      if (settings.daysBefore.includes(0)) status = 'today';
    } else {
      if (settings.daysBefore.includes(daysDiff)) status = 'upcoming';
    }

    if (status) result.push({ card, status, daysDiff });
  }

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  return result.sort((a, b) => {
    if (a.daysDiff !== b.daysDiff) return a.daysDiff - b.daysDiff;
    return priorityOrder[a.card.priority] - priorityOrder[b.card.priority];
  });
}

export function describeDueDays(daysDiff: number): string {
  if (daysDiff < 0) {
    const n = Math.abs(daysDiff);
    return n === 1 ? 'Venció ayer' : `Venció hace ${n} días`;
  }
  if (daysDiff === 0) return 'Hoy';
  if (daysDiff === 1) return 'Mañana';
  if (daysDiff < 7) return `En ${daysDiff} días`;
  if (daysDiff < 30) {
    const weeks = Math.round(daysDiff / 7);
    return weeks === 1 ? 'En 1 semana' : `En ${weeks} semanas`;
  }
  return `En ${daysDiff} días`;
}