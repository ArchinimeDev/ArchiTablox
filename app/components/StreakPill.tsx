'use client';

import { useStats } from '@/store/stats';

interface Props {
  compact?: boolean;
}

export function StreakPill({ compact = false }: Props) {
  const streak = useStats((s) => s.stats.streak.current);

  if (streak === 0) return null;

  if (compact) {
    return (
      <div
        className="flex items-center gap-1 px-2 h-9 rounded-lg bg-slate-900 border border-slate-800 shrink-0"
        title={`Racha de ${streak} día${streak === 1 ? '' : 's'}`}
      >
        <span className="text-sm leading-none">🔥</span>
        <span className="text-xs font-semibold text-amber-400 font-mono tabular-nums">
          {streak}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-2.5 h-9 rounded-lg bg-slate-900 border border-slate-800 shrink-0 hover:border-slate-700 transition-colors"
      title={`Racha de ${streak} día${streak === 1 ? '' : 's'}`}
    >
      <span className="text-sm leading-none">🔥</span>
      <span className="text-xs font-semibold text-amber-400 font-mono tabular-nums">
        {streak}
      </span>
    </div>
  );
}