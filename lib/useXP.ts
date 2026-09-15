'use client';

import { useEffect, useRef } from 'react';
import { useBoard } from '@/store/board';
import { useProfile } from '@/store/profile';
import { XP_VALUES, AP_VALUES, getStreakMultiplier } from '@/lib/xp';
import { getCosmetic } from '@/lib/cosmetics';
import { useToast } from '@/components/Toast';
import type { ActivityType, TrackAction } from '@/types';

const ACTION_MAP: Partial<Record<ActivityType, TrackAction>> = {
  card_created: 'card_created',
  card_moved: 'card_moved',
  card_completed: 'card_completed',
  comment_added: 'comment_added',
  template_applied: 'template_applied',
  attachment_added: 'attachment_added',
};

const COSMETICS_BY_LEVEL: Record<number, string[]> = {
  4: ['ti_novato'],
  5: ['fr_waves'],
  7: ['ti_aprendiz'],
  15: ['fr_crystal', 'ti_constructor'],
  20: ['bg_aurora'],
  25: ['bg_cyberpunk'],
  30: ['av_eagle', 'fr_crown'],
  40: ['ti_arquitecto'],
  50: ['av_dragon', 'fr_aurora'],
  75: ['ti_maestro'],
  100: ['ti_leyenda', 'fr_legend'],
};

export function useXP() {
  const addXP = useProfile((s) => s.addXP);
  const profile = useProfile((s) => s.profile);
  const { toast } = useToast();
  const lastSeenId = useRef<string | null>(null);
  const streakRef = useRef<number>(1);

  // Leer racha actual del store de stats
  useEffect(() => {
    const unsub = (window as any).__readStreak;
    // fallback: leer localStorage directo
    try {
      const raw = localStorage.getItem('architablox-stats');
      if (raw) {
        const parsed = JSON.parse(raw);
        const streak = parsed?.state?.stats?.streak?.current ?? 1;
        streakRef.current = streak;
      }
    } catch {}
  }, []);

  // Suscripción a los eventos del tablero activo
  useEffect(() => {
    const unsub = useBoard.subscribe((state) => {
      const board = state.boards.find((b) => b.id === state.activeBoardId);
      const latest = board?.activity?.[0];
      if (!latest) return;
      if (latest.id === lastSeenId.current) return;
      lastSeenId.current = latest.id;

      const action = ACTION_MAP[latest.type];
      if (!action) return;

      const baseXP = XP_VALUES[action] ?? 0;
      const baseAP = AP_VALUES[action] ?? 0;
      if (baseXP === 0 && baseAP === 0) return;

      const mult = getStreakMultiplier(streakRef.current);
      const xpGain = Math.round(baseXP * mult);
      const apGain = baseAP;

      const { leveledUp, newLevel } = addXP(xpGain, apGain);

      // Toast de XP (pequeño, no intrusivo)
      if (xpGain > 0) {
        toast(`+${xpGain} XP · +${apGain} AP`, 'info', 1500);
      }

      // Toast de subida de nivel
      if (leveledUp) {
        setTimeout(() => {
          const rewards = COSMETICS_BY_LEVEL[newLevel] ?? [];
          const rewardNames = rewards
            .map((id) => getCosmetic(id)?.name)
            .filter(Boolean)
            .join(' · ');
          const msg = rewardNames
            ? `🎉 Nivel ${newLevel} · Nuevo: ${rewardNames}`
            : `🎉 Nivel ${newLevel} alcanzado`;
          toast(msg, 'success', 5000);
        }, 500);
      }
    });
    return unsub;
  }, [addXP, toast]);

  return profile;
}