import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserStats, TrackAction } from '@/types';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const INITIAL: UserStats = {
  reputation: 0,
  cardsCreated: 0,
  cardsCompleted: 0,
  commentsAdded: 0,
  attachmentsAdded: 0,
  templatesApplied: 0,
  templatesCreated: 0,
  labelsCreated: 0,
  boardsCreated: 0,
  subtasksCompleted: 0,
  actionsByDay: {},
  streak: { current: 0, longest: 0, lastActiveDate: '' },
  achievements: [],
  firstUseAt: Date.now(),
  lastActiveAt: Date.now(),
};

interface StatsStore {
  stats: UserStats;
  trackAction: (action: TrackAction) => void;
  reset: () => void;
  recomputeStreak: () => void;
}

export const useStats = create<StatsStore>()(
  persist(
    (set) => ({
      stats: INITIAL,

      trackAction: (action) => {
        const today = todayKey();
        const yesterday = yesterdayKey();

        set((state) => {
          const s = state.stats;
          const counters: Partial<UserStats> = {};
          switch (action) {
            case 'card_created':
            case 'card_created_full':
              counters.cardsCreated = s.cardsCreated + 1;
              break;
            case 'card_completed':
              counters.cardsCompleted = s.cardsCompleted + 1;
              break;
            case 'comment_added':
              counters.commentsAdded = s.commentsAdded + 1;
              break;
            case 'attachment_added':
              counters.attachmentsAdded = s.attachmentsAdded + 1;
              break;
            case 'template_applied':
              counters.templatesApplied = s.templatesApplied + 1;
              break;
            case 'template_created':
              counters.templatesCreated = s.templatesCreated + 1;
              break;
            case 'label_created':
              counters.labelsCreated = s.labelsCreated + 1;
              break;
            case 'board_created':
              counters.boardsCreated = s.boardsCreated + 1;
              break;
            case 'subtask_completed':
              counters.subtasksCompleted = s.subtasksCompleted + 1;
              break;
          }

          const actionsByDay = { ...s.actionsByDay };
          actionsByDay[today] = (actionsByDay[today] ?? 0) + 1;

          let current = s.streak.current;
          let longest = s.streak.longest;

          if (s.streak.lastActiveDate === today) {
            // ya contó hoy
          } else if (s.streak.lastActiveDate === yesterday) {
            current = current + 1;
            longest = Math.max(longest, current);
          } else if (s.streak.lastActiveDate === '') {
            current = 1;
            longest = Math.max(longest, 1);
          } else {
            current = 1;
          }

          return {
            stats: {
              ...s,
              ...counters,
              reputation: s.reputation + 1,
              actionsByDay,
              streak: { current, longest, lastActiveDate: today },
              lastActiveAt: Date.now(),
            },
          };
        });
      },

      recomputeStreak: () => {
        set((state) => {
          const today = todayKey();
          const yesterday = yesterdayKey();
          const last = state.stats.streak.lastActiveDate;
          if (last === today || last === yesterday || last === '') return state;
          return {
            ...state,
            stats: {
              ...state.stats,
              streak: { ...state.stats.streak, current: 0 },
            },
          };
        });
      },

      reset: () => set({ stats: INITIAL }),
    }),
    { name: 'architablox-stats', version: 1 }
  )
);