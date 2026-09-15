'use client';

import { useProfile } from '@/store/profile';
import { levelProgress, getLevelTier } from '@/lib/xp';
import { LevelBadge } from './LevelBadge';

interface Props {
  variant?: 'compact' | 'full';
}

export function XPBar({ variant = 'compact' }: Props) {
  const profile = useProfile((s) => s.profile);
  const progress = levelProgress(profile.xp);
  const tier = getLevelTier(progress.level);

  if (variant === 'compact') {
    return (
      <div
        className="flex items-center gap-2 px-2 h-9 rounded-lg bg-slate-900 border border-slate-800 shrink-0"
        title={`Nivel ${progress.level} · ${progress.current}/${progress.needed} XP`}
      >
        <LevelBadge size="sm" />
        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <LevelBadge size="md" />
          <span className={`text-xs font-bold ${tier.color}`}>{tier.label}</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono tabular-nums">
          {progress.current.toLocaleString()} / {progress.needed.toLocaleString()} XP
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700 ease-out rounded-full"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-slate-500 font-mono">
        <span>Nivel {progress.level}</span>
        <span>{progress.toNext.toLocaleString()} XP para el siguiente</span>
      </div>
    </div>
  );
}