// store/sound.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SoundStore {
  enabled: boolean;
  volume: number;
  toggle: () => void;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
}

export const useSound = create<SoundStore>()(
  persist(
    (set) => ({
      enabled: true,
      volume: 0.7,
      toggle: () => set((s) => ({ enabled: !s.enabled })),
      setEnabled: (enabled) => set({ enabled }),
      setVolume: (volume) =>
        set({ volume: Math.max(0, Math.min(1, volume)) }),
    }),
    { name: 'architablox-sound' }
  )
);