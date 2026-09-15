'use client';

import { useProfile } from '@/store/profile';
import { getLevelTier } from '@/lib/xp';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function LevelBadge({ size = 'sm', showLabel = false }: Props) {
  const level = useProfile((s) => s.profile.level);
  const tier = getLevelTier(level);

  const sizeClasses = {
    sm: 'h-5 min-w-[22px] px-1.5 text-[10px]',
    md: 'h-7 min-w-[30px] px-2 text-xs',
    lg: 'h-10 min-w-[44px] px-3 text-sm',
  }[size];

  return (
    <span
      className={`
        inline-flex items-center justify-center gap-1
        rounded-full border font-bold font-mono tabular-nums
        transition-transform
        ${tier.bg} ${tier.color} ${sizeClasses}
      `}
      title={`Nivel ${level} · ${tier.label}`}
    >
      {level}
      {showLabel && (
        <span className="text-[9px] uppercase tracking-wider opacity-80">
          {tier.label}
        </span>
      )}
    </span>
  );
}