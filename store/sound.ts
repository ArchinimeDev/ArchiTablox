// store/sound.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SoundPackId } from '@/lib/sound-packs';

interface SoundStore {
  enabled: boolean;
  volume: number;
  packId: SoundPackId;
  previewPackId: SoundPackId | null;
  toggle: () => void;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setPack: (packId: SoundPackId) => void;
  setPreviewPack: (packId: SoundPackId | null) => void;
  /** Devuelve el pack activo (preview tiene prioridad) */
  getActivePack: () => SoundPackId;
}

export const useSound = create<SoundStore>()(
  persist(
    (set, get) => ({
      enabled: true,
      volume: 0.7,
      packId: 'default',
      previewPackId: null,
      toggle: () => set((s) => ({ enabled: !s.enabled })),
      setEnabled: (enabled) => set({ enabled }),
      setVolume: (volume) =>
        set({ volume: Math.max(0, Math.min(1, volume)) }),
      setPack: (packId) => set({ packId }),
      setPreviewPack: (packId) => set({ previewPackId: packId }),
      getActivePack: () => {
        const s = get();
        return s.previewPackId ?? s.packId;
      },
    }),
    {
      name: 'architablox-sound',
      // No persistimos previewPackId
      partialize: (state) => ({
        enabled: state.enabled,
        volume: state.volume,
        packId: state.packId,
      }),
    }
  )
);