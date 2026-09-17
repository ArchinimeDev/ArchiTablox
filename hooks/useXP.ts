// hooks/useXP.ts
'use client';

import { useEffect, useRef } from 'react';
import { useBoard } from '@/store/board';
import { useProfile } from '@/store/profile';
import { useStats } from '@/store/stats';
import { XP_VALUES, AP_VALUES, getStreakMultiplier } from '@/lib/xp';
import { getCosmetic, COSMETICS_BY_LEVEL } from '@/lib/cosmetics';
import { useToast } from '../app/components/Toast';
import type { ActivityType, TrackAction } from '@/types';

const ACTION_MAP: Partial<Record<ActivityType, TrackAction>> = {
  card_created: 'card_created',
  card_moved: 'card_moved',
  card_completed: 'card_completed',
  comment_added: 'comment_added',
  template_applied: 'template_applied',
  attachment_added: 'attachment_added',
};

// ★ Clave compartida entre pestañas para evitar doble conteo
const LAST_SEEN_KEY = 'architablox-last-seen-activity';

// ★ Solo premiamos actividades creadas recientemente. Las que vienen del
//   cloud, de un import o de un merge tienen timestamps viejos → se ignoran.
const RECENT_WINDOW_MS = 15_000;

// ★ Margen de espera tras el mount antes de empezar a premiar.
//   Da tiempo a que useSyncBoards termine de aplicar los datos del cloud.
const READY_DELAY_MS = 2000;

export function useXP() {
  const addXP = useProfile((s) => s.addXP);
  const trackAction = useStats((s) => s.trackAction);
  const recomputeStreak = useStats((s) => s.recomputeStreak);
  const { toast } = useToast();
  const lastSeenId = useRef<string | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    recomputeStreak();
  }, [recomputeStreak]);

  // Inicializa desde localStorage + delay para "ready"
  useEffect(() => {
    try {
      lastSeenId.current = localStorage.getItem(LAST_SEEN_KEY);
    } catch {}

    const t = setTimeout(() => {
      readyRef.current = true;
    }, READY_DELAY_MS);

    return () => clearTimeout(t);
  }, []);

  // Sincroniza entre pestañas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LAST_SEEN_KEY && e.newValue) {
        lastSeenId.current = e.newValue;
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const unsub = useBoard.subscribe((state) => {
      const board = state.boards.find((b) => b.id === state.activeBoardId);
      const latest = board?.activity?.[0];
      if (!latest) return;
      if (latest.id === lastSeenId.current) return;

      // ★ Siempre recordar el último ID visto (para no reprocesar)
      lastSeenId.current = latest.id;
      try {
        localStorage.setItem(LAST_SEEN_KEY, latest.id);
      } catch {}

      // ★ Skip si todavía no está listo (carga inicial del cloud)
      if (!readyRef.current) return;

      // ★ Skip si la actividad es vieja (viene del cloud, no es nueva)
      if (Date.now() - latest.timestamp > RECENT_WINDOW_MS) return;

      const action = ACTION_MAP[latest.type];
      if (!action) return;

      trackAction(action);

      const currentStreak = useStats.getState().stats.streak.current;
      const mult = getStreakMultiplier(currentStreak);

      const baseXP = XP_VALUES[action] ?? 0;
      const baseAP = AP_VALUES[action] ?? 0;
      if (baseXP === 0 && baseAP === 0) return;

      const xpGain = Math.round(baseXP * mult);
      const apGain = baseAP;

      const { leveledUp, newLevel } = addXP(xpGain, apGain);

      if (xpGain > 0) {
        toast(`+${xpGain} XP · +${apGain} AP`, 'info', 1500);
      }

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
  }, [addXP, toast, trackAction]);
}