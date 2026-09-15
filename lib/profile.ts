import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProfileStats, EquippedCosmetics } from '@/types';
import { levelFromXP } from '@/lib/xp';
import { getCosmetic } from '@/lib/cosmetics';

const INITIAL: ProfileStats = {
  xp: 0,
  ap: 0,
  level: 1,
  owned: {
    av_default: Date.now(),
    fr_none: Date.now(),
    bg_slate: Date.now(),
    ti_none: Date.now(),
  },
  equipped: {
    avatar: 'av_default',
    frame: 'fr_none',
    background: 'bg_slate',
    title: 'ti_none',
  },
};

interface ProfileStore {
  profile: ProfileStats;

  /** Añade XP y AP, recalcula nivel, devuelve info del cambio */
  addXP: (xp: number, ap: number) => { leveledUp: boolean; oldLevel: number; newLevel: number };

  /** Compra un cosmético con AP. Devuelve true si tuvo éxito */
  buy: (cosmeticId: string) => boolean;

  /** Equipa un cosmético (debe estar owned) */
  equip: (cosmeticId: string) => void;

  /** Desequipa una categoría */
  unequip: (category: 'avatar' | 'frame' | 'background' | 'title') => void;

  /** Otorga un cosmético gratis (por logro) */
  grant: (cosmeticId: string) => void;

  /** Resetea todo */
  reset: () => void;
}

export const useProfile = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: INITIAL,

      addXP: (xpGain, apGain) => {
        const { profile } = get();
        const oldLevel = profile.level;
        const nextXP = profile.xp + xpGain;
        const newLevel = levelFromXP(nextXP);

        // Auto-desbloquear cosméticos por nivel
        const owned = { ...profile.owned };
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

        for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
          const rewards = COSMETICS_BY_LEVEL[lvl];
          if (rewards) {
            for (const id of rewards) {
              if (getCosmetic(id)) owned[id] = Date.now();
            }
          }
        }

        set({
          profile: {
            ...profile,
            xp: nextXP,
            ap: profile.ap + apGain,
            level: newLevel,
            owned,
          },
        });

        return { leveledUp: newLevel > oldLevel, oldLevel, newLevel };
      },

      buy: (cosmeticId) => {
        const cosmetic = getCosmetic(cosmeticId);
        if (!cosmetic || !cosmetic.price) return false;
        const { profile } = get();
        if (profile.owned[cosmeticId]) return false;
        if (profile.ap < cosmetic.price) return false;

        set({
          profile: {
            ...profile,
            ap: profile.ap - cosmetic.price,
            owned: { ...profile.owned, [cosmeticId]: Date.now() },
          },
        });
        return true;
      },

      equip: (cosmeticId) => {
        const cosmetic = getCosmetic(cosmeticId);
        if (!cosmetic) return;
        const { profile } = get();
        if (!profile.owned[cosmeticId]) return;

        set({
          profile: {
            ...profile,
            equipped: {
              ...profile.equipped,
              [cosmetic.category]: cosmeticId,
            },
          },
        });
      },

      unequip: (category) => {
        const { profile } = get();
        set({
          profile: {
            ...profile,
            equipped: {
              ...profile.equipped,
              [category]: undefined,
            },
          },
        });
      },

      grant: (cosmeticId) => {
        const cosmetic = getCosmetic(cosmeticId);
        if (!cosmetic) return;
        const { profile } = get();
        if (profile.owned[cosmeticId]) return;
        set({
          profile: {
            ...profile,
            owned: { ...profile.owned, [cosmeticId]: Date.now() },
          },
        });
      },

      reset: () => set({ profile: INITIAL }),
    }),
    {
      name: 'architablox-profile',
      version: 1,
    }
  )
);