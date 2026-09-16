// store/profile.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProfileStats } from '@/types';
import { levelFromXP } from '@/lib/xp';
import { getCosmetic, COSMETICS, COSMETICS_BY_LEVEL } from '@/lib/cosmetics';
import { useAdmin } from './admin';

const FREE_THEME_IDS = [
  'th_light',
  'th_dark',
  'th_midnight',
  'th_forest',
  'th_sunset',
  'th_rose',
];

const now = Date.now();

const INITIAL: ProfileStats = {
  xp: 0,
  ap: 0,
  level: 1,
  owned: {
    av_default: now,
    fr_none: now,
    bg_slate: now,
    ti_none: now,
    sp_default: now,
    ...Object.fromEntries(FREE_THEME_IDS.map((id) => [id, now])),
  },
  equipped: {
    avatar: 'av_default',
    frame: 'fr_none',
    background: 'bg_slate',
    title: 'ti_none',
    theme: 'th_light',
    sound: 'sp_default',
  },
};

interface ProfileStore {
  profile: ProfileStats;

  addXP: (
    xp: number,
    ap: number
  ) => { leveledUp: boolean; oldLevel: number; newLevel: number };
  buy: (cosmeticId: string) => boolean;
  equip: (cosmeticId: string) => void;
  unequip: (
    category: 'avatar' | 'frame' | 'background' | 'title' | 'theme' | 'sound'
  ) => void;
  grant: (cosmeticId: string) => void;
  reset: () => void;
}

export const useProfile = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: INITIAL,

      addXP: (xpGain, apGain) => {
        const { profile } = get();
        const isAdmin = useAdmin.getState().isAdmin;
        const oldLevel = profile.level;
        const nextXP = profile.xp + xpGain;
        const newLevel = levelFromXP(nextXP);

        const owned = { ...profile.owned };
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
            ap: isAdmin ? profile.ap : profile.ap + apGain,
            level: newLevel,
            owned,
          },
        });

        return { leveledUp: newLevel > oldLevel, oldLevel, newLevel };
      },

      buy: (cosmeticId) => {
        const cosmetic = getCosmetic(cosmeticId);
        if (!cosmetic) return false;

        if (useAdmin.getState().isAdmin) return true;

        const { profile } = get();

        if (cosmetic.free) return false;
        if (!cosmetic.price) return false;
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
        const isAdmin = useAdmin.getState().isAdmin;
        if (!isAdmin && !profile.owned[cosmeticId]) return;

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
            equipped: { ...profile.equipped, [category]: undefined },
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
      version: 4,
      migrate: (persisted: any, version) => {
        const next = persisted ?? {};

        if (next.isAdmin !== undefined) delete next.isAdmin;

        if (version < 2) {
          const p = next.profile ?? {};
          if (!p.owned) p.owned = {};
          const ts = Date.now();
          for (const id of FREE_THEME_IDS) {
            if (!p.owned[id]) p.owned[id] = ts;
          }
          if (!p.equipped) p.equipped = {};
          if (!p.equipped.theme) p.equipped.theme = 'th_light';
          next.profile = p;
        }

        // v4: añadir sound pack por defecto a usuarios existentes
        if (version < 4) {
          const p = next.profile ?? {};
          if (!p.owned) p.owned = {};
          if (!p.owned.sp_default) p.owned.sp_default = Date.now();
          if (!p.equipped) p.equipped = {};
          if (!p.equipped.sound) p.equipped.sound = 'sp_default';
          next.profile = p;
        }

        return next;
      },
    }
  )
);