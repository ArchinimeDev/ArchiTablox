// lib/sound-packs.ts
'use client';

export type SoundPackId =
  | 'default'
  | 'retro'
  | 'scifi'
  | 'zen'
  | 'arcade'
  | 'cyber';

export type SoundAction =
  | 'click'
  | 'nav'
  | 'hover'
  | 'preview'
  | 'cancel'
  | 'equip'
  | 'purchase'
  | 'error'
  | 'levelUp'
  | 'notification'
  | 'cardCreate'
  | 'cardDone'
  | 'cardMove'
  | 'open'
  | 'close';

export interface ToneDef {
  freq: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  delay?: number;
  sweepTo?: number;
}

export type SoundPack = Record<SoundAction, ToneDef[]>;

// ============================================================
// PACK: DEFAULT (neutro, cálido)
// ============================================================
const DEFAULT_PACK: SoundPack = {
  click: [{ freq: 900, duration: 0.05, type: 'sine', volume: 0.08 }],
  nav: [{ freq: 800, duration: 0.06, type: 'sine', volume: 0.06 }],
  hover: [{ freq: 1400, duration: 0.03, type: 'sine', volume: 0.025 }],
  preview: [
    { freq: 660, duration: 0.08, type: 'triangle', volume: 0.09 },
    { freq: 990, duration: 0.1, type: 'triangle', volume: 0.07, delay: 0.05 },
  ],
  cancel: [
    { freq: 400, duration: 0.08, type: 'triangle', volume: 0.07, sweepTo: 250 },
  ],
  equip: [
    { freq: 523.25, duration: 0.1, type: 'triangle', volume: 0.1 },
    { freq: 783.99, duration: 0.15, type: 'triangle', volume: 0.1, delay: 0.06 },
  ],
  purchase: [
    { freq: 659.25, duration: 0.1, type: 'triangle', volume: 0.11 },
    { freq: 987.77, duration: 0.1, type: 'triangle', volume: 0.11, delay: 0.08 },
    { freq: 1318.5, duration: 0.28, type: 'triangle', volume: 0.1, delay: 0.16 },
    { freq: 1760, duration: 0.3, type: 'sine', volume: 0.05, delay: 0.2 },
  ],
  error: [
    { freq: 220, duration: 0.12, type: 'sawtooth', volume: 0.1 },
    { freq: 180, duration: 0.18, type: 'sawtooth', volume: 0.1, delay: 0.08 },
  ],
  levelUp: [
    { freq: 523.25, duration: 0.12, type: 'triangle', volume: 0.11 },
    { freq: 659.25, duration: 0.12, type: 'triangle', volume: 0.11, delay: 0.1 },
    { freq: 783.99, duration: 0.12, type: 'triangle', volume: 0.11, delay: 0.2 },
    { freq: 1046.5, duration: 0.35, type: 'triangle', volume: 0.13, delay: 0.3 },
  ],
  notification: [
    { freq: 880, duration: 0.08, type: 'sine', volume: 0.09 },
    { freq: 1318.5, duration: 0.15, type: 'sine', volume: 0.08, delay: 0.08 },
  ],
  cardCreate: [
    { freq: 587.33, duration: 0.07, type: 'triangle', volume: 0.08, sweepTo: 880 },
  ],
  cardDone: [
    { freq: 659.25, duration: 0.1, type: 'triangle', volume: 0.1 },
    { freq: 987.77, duration: 0.2, type: 'triangle', volume: 0.11, delay: 0.08 },
    { freq: 1318.5, duration: 0.25, type: 'sine', volume: 0.06, delay: 0.15 },
  ],
  cardMove: [
    { freq: 700, duration: 0.04, type: 'sine', volume: 0.05, sweepTo: 500 },
  ],
  open: [
    { freq: 500, duration: 0.06, type: 'sine', volume: 0.06, sweepTo: 750 },
  ],
  close: [
    { freq: 750, duration: 0.06, type: 'sine', volume: 0.06, sweepTo: 500 },
  ],
};

// ============================================================
// PACK: RETRO (8-bit, onda cuadrada, chip-tune)
// ============================================================
const RETRO_PACK: SoundPack = {
  click: [{ freq: 1200, duration: 0.03, type: 'square', volume: 0.06 }],
  nav: [{ freq: 1046, duration: 0.04, type: 'square', volume: 0.05 }],
  hover: [{ freq: 1600, duration: 0.02, type: 'square', volume: 0.02 }],
  preview: [
    { freq: 880, duration: 0.05, type: 'square', volume: 0.06 },
    { freq: 1108, duration: 0.05, type: 'square', volume: 0.05, delay: 0.05 },
    { freq: 1318, duration: 0.05, type: 'square', volume: 0.05, delay: 0.1 },
  ],
  cancel: [
    { freq: 500, duration: 0.08, type: 'square', volume: 0.06, sweepTo: 200 },
  ],
  equip: [
    { freq: 660, duration: 0.06, type: 'square', volume: 0.06 },
    { freq: 990, duration: 0.06, type: 'square', volume: 0.06, delay: 0.06 },
    { freq: 1318, duration: 0.12, type: 'square', volume: 0.06, delay: 0.12 },
  ],
  purchase: [
    { freq: 523, duration: 0.06, type: 'square', volume: 0.07 },
    { freq: 659, duration: 0.06, type: 'square', volume: 0.07, delay: 0.06 },
    { freq: 784, duration: 0.06, type: 'square', volume: 0.07, delay: 0.12 },
    { freq: 1046, duration: 0.2, type: 'square', volume: 0.07, delay: 0.18 },
  ],
  error: [
    { freq: 200, duration: 0.1, type: 'square', volume: 0.08 },
    { freq: 150, duration: 0.15, type: 'square', volume: 0.08, delay: 0.1 },
  ],
  levelUp: [
    { freq: 523, duration: 0.08, type: 'square', volume: 0.07 },
    { freq: 659, duration: 0.08, type: 'square', volume: 0.07, delay: 0.08 },
    { freq: 784, duration: 0.08, type: 'square', volume: 0.07, delay: 0.16 },
    { freq: 1046, duration: 0.08, type: 'square', volume: 0.07, delay: 0.24 },
    { freq: 1318, duration: 0.3, type: 'square', volume: 0.08, delay: 0.32 },
  ],
  notification: [
    { freq: 1046, duration: 0.06, type: 'square', volume: 0.06 },
    { freq: 1568, duration: 0.12, type: 'square', volume: 0.06, delay: 0.06 },
  ],
  cardCreate: [
    { freq: 660, duration: 0.05, type: 'square', volume: 0.06, sweepTo: 990 },
  ],
  cardDone: [
    { freq: 660, duration: 0.06, type: 'square', volume: 0.06 },
    { freq: 990, duration: 0.06, type: 'square', volume: 0.06, delay: 0.06 },
    { freq: 1318, duration: 0.15, type: 'square', volume: 0.06, delay: 0.12 },
  ],
  cardMove: [
    { freq: 800, duration: 0.03, type: 'square', volume: 0.04, sweepTo: 600 },
  ],
  open: [
    { freq: 440, duration: 0.05, type: 'square', volume: 0.05, sweepTo: 880 },
  ],
  close: [
    { freq: 880, duration: 0.05, type: 'square', volume: 0.05, sweepTo: 440 },
  ],
};

// ============================================================
// PACK: SCIFI (whooshes, sawtooth, futurista)
// ============================================================
const SCIFI_PACK: SoundPack = {
  click: [
    { freq: 600, duration: 0.1, type: 'sawtooth', volume: 0.05, sweepTo: 1200 },
  ],
  nav: [
    { freq: 700, duration: 0.08, type: 'sawtooth', volume: 0.05, sweepTo: 1100 },
  ],
  hover: [
    { freq: 800, duration: 0.05, type: 'sine', volume: 0.02, sweepTo: 1000 },
  ],
  preview: [
    { freq: 300, duration: 0.15, type: 'sawtooth', volume: 0.06, sweepTo: 900 },
    { freq: 500, duration: 0.2, type: 'sine', volume: 0.04, delay: 0.05, sweepTo: 1200 },
  ],
  cancel: [
    { freq: 1000, duration: 0.15, type: 'sawtooth', volume: 0.06, sweepTo: 200 },
  ],
  equip: [
    { freq: 400, duration: 0.15, type: 'sawtooth', volume: 0.06, sweepTo: 1000 },
    { freq: 800, duration: 0.2, type: 'sine', volume: 0.05, delay: 0.1, sweepTo: 1600 },
  ],
  purchase: [
    { freq: 200, duration: 0.2, type: 'sawtooth', volume: 0.07, sweepTo: 800 },
    { freq: 600, duration: 0.25, type: 'sine', volume: 0.06, delay: 0.1, sweepTo: 1600 },
    { freq: 1200, duration: 0.3, type: 'sine', volume: 0.05, delay: 0.25, sweepTo: 2000 },
  ],
  error: [
    { freq: 300, duration: 0.15, type: 'sawtooth', volume: 0.08 },
    { freq: 200, duration: 0.2, type: 'sawtooth', volume: 0.08, delay: 0.1 },
  ],
  levelUp: [
    { freq: 300, duration: 0.2, type: 'sawtooth', volume: 0.06, sweepTo: 1200 },
    { freq: 600, duration: 0.25, type: 'sine', volume: 0.06, delay: 0.15, sweepTo: 1800 },
    { freq: 900, duration: 0.4, type: 'sine', volume: 0.05, delay: 0.3, sweepTo: 2400 },
  ],
  notification: [
    { freq: 1000, duration: 0.15, type: 'sawtooth', volume: 0.05, sweepTo: 1400 },
    { freq: 1400, duration: 0.2, type: 'sine', volume: 0.04, delay: 0.1, sweepTo: 1800 },
  ],
  cardCreate: [
    { freq: 500, duration: 0.12, type: 'sawtooth', volume: 0.05, sweepTo: 1200 },
  ],
  cardDone: [
    { freq: 400, duration: 0.15, type: 'sawtooth', volume: 0.05, sweepTo: 1200 },
    { freq: 800, duration: 0.25, type: 'sine', volume: 0.05, delay: 0.1, sweepTo: 2000 },
  ],
  cardMove: [
    { freq: 500, duration: 0.08, type: 'sawtooth', volume: 0.04, sweepTo: 900 },
  ],
  open: [
    { freq: 300, duration: 0.15, type: 'sawtooth', volume: 0.05, sweepTo: 800 },
  ],
  close: [
    { freq: 800, duration: 0.12, type: 'sawtooth', volume: 0.05, sweepTo: 300 },
  ],
};

// ============================================================
// PACK: ZEN (calmado, sinusoidal, largo)
// ============================================================
const ZEN_PACK: SoundPack = {
  click: [{ freq: 500, duration: 0.15, type: 'sine', volume: 0.04 }],
  nav: [{ freq: 500, duration: 0.15, type: 'sine', volume: 0.04 }],
  hover: [{ freq: 700, duration: 0.1, type: 'sine', volume: 0.015 }],
  preview: [
    { freq: 400, duration: 0.3, type: 'sine', volume: 0.05 },
    { freq: 600, duration: 0.4, type: 'sine', volume: 0.04, delay: 0.15 },
  ],
  cancel: [
    { freq: 400, duration: 0.3, type: 'sine', volume: 0.04, sweepTo: 250 },
  ],
  equip: [
    { freq: 400, duration: 0.3, type: 'sine', volume: 0.05 },
    { freq: 500, duration: 0.4, type: 'sine', volume: 0.05, delay: 0.2 },
    { freq: 600, duration: 0.5, type: 'sine', volume: 0.05, delay: 0.4 },
  ],
  purchase: [
    { freq: 300, duration: 0.4, type: 'sine', volume: 0.06 },
    { freq: 400, duration: 0.5, type: 'sine', volume: 0.05, delay: 0.2 },
    { freq: 500, duration: 0.6, type: 'sine', volume: 0.05, delay: 0.4 },
    { freq: 600, duration: 0.8, type: 'sine', volume: 0.04, delay: 0.6 },
  ],
  error: [{ freq: 200, duration: 0.5, type: 'sine', volume: 0.05 }],
  levelUp: [
    { freq: 400, duration: 0.4, type: 'sine', volume: 0.05 },
    { freq: 500, duration: 0.5, type: 'sine', volume: 0.05, delay: 0.3 },
    { freq: 600, duration: 0.6, type: 'sine', volume: 0.05, delay: 0.6 },
    { freq: 800, duration: 0.8, type: 'sine', volume: 0.05, delay: 0.9 },
  ],
  notification: [
    { freq: 500, duration: 0.3, type: 'sine', volume: 0.04 },
    { freq: 700, duration: 0.4, type: 'sine', volume: 0.04, delay: 0.2 },
  ],
  cardCreate: [
    { freq: 500, duration: 0.3, type: 'sine', volume: 0.04, sweepTo: 700 },
  ],
  cardDone: [
    { freq: 400, duration: 0.3, type: 'sine', volume: 0.04 },
    { freq: 600, duration: 0.5, type: 'sine', volume: 0.04, delay: 0.2 },
  ],
  cardMove: [
    { freq: 500, duration: 0.15, type: 'sine', volume: 0.03, sweepTo: 400 },
  ],
  open: [
    { freq: 400, duration: 0.2, type: 'sine', volume: 0.04, sweepTo: 600 },
  ],
  close: [
    { freq: 600, duration: 0.2, type: 'sine', volume: 0.04, sweepTo: 400 },
  ],
};

// ============================================================
// PACK: ARCADE (bleeps agudos, videojuego clásico)
// ============================================================
const ARCADE_PACK: SoundPack = {
  click: [{ freq: 1500, duration: 0.03, type: 'square', volume: 0.05 }],
  nav: [{ freq: 1400, duration: 0.04, type: 'square', volume: 0.05 }],
  hover: [{ freq: 2000, duration: 0.02, type: 'square', volume: 0.02 }],
  preview: [
    { freq: 1200, duration: 0.05, type: 'square', volume: 0.05 },
    { freq: 1500, duration: 0.05, type: 'square', volume: 0.05, delay: 0.05 },
    { freq: 1800, duration: 0.08, type: 'square', volume: 0.05, delay: 0.1 },
  ],
  cancel: [
    { freq: 1000, duration: 0.05, type: 'square', volume: 0.05, sweepTo: 500 },
  ],
  equip: [
    { freq: 1000, duration: 0.05, type: 'square', volume: 0.06 },
    { freq: 1200, duration: 0.05, type: 'square', volume: 0.06, delay: 0.05 },
    { freq: 1500, duration: 0.1, type: 'square', volume: 0.06, delay: 0.1 },
  ],
  purchase: [
    { freq: 800, duration: 0.04, type: 'square', volume: 0.06 },
    { freq: 1000, duration: 0.04, type: 'square', volume: 0.06, delay: 0.04 },
    { freq: 1200, duration: 0.04, type: 'square', volume: 0.06, delay: 0.08 },
    { freq: 1500, duration: 0.04, type: 'square', volume: 0.06, delay: 0.12 },
    { freq: 1800, duration: 0.15, type: 'square', volume: 0.06, delay: 0.16 },
  ],
  error: [
    { freq: 300, duration: 0.08, type: 'square', volume: 0.07 },
    { freq: 250, duration: 0.1, type: 'square', volume: 0.07, delay: 0.08 },
  ],
  levelUp: [
    { freq: 800, duration: 0.05, type: 'square', volume: 0.07 },
    { freq: 1000, duration: 0.05, type: 'square', volume: 0.07, delay: 0.05 },
    { freq: 1200, duration: 0.05, type: 'square', volume: 0.07, delay: 0.1 },
    { freq: 1500, duration: 0.05, type: 'square', volume: 0.07, delay: 0.15 },
    { freq: 1800, duration: 0.25, type: 'square', volume: 0.07, delay: 0.2 },
  ],
  notification: [
    { freq: 1200, duration: 0.05, type: 'square', volume: 0.05 },
    { freq: 1800, duration: 0.1, type: 'square', volume: 0.05, delay: 0.05 },
  ],
  cardCreate: [
    { freq: 1000, duration: 0.04, type: 'square', volume: 0.05, sweepTo: 1500 },
  ],
  cardDone: [
    { freq: 1000, duration: 0.05, type: 'square', volume: 0.06 },
    { freq: 1500, duration: 0.05, type: 'square', volume: 0.06, delay: 0.05 },
    { freq: 1800, duration: 0.15, type: 'square', volume: 0.06, delay: 0.1 },
  ],
  cardMove: [
    { freq: 1200, duration: 0.03, type: 'square', volume: 0.04, sweepTo: 800 },
  ],
  open: [
    { freq: 600, duration: 0.05, type: 'square', volume: 0.05, sweepTo: 1200 },
  ],
  close: [
    { freq: 1200, duration: 0.05, type: 'square', volume: 0.05, sweepTo: 600 },
  ],
};

// ============================================================
// PACK: CYBER (glitches, digital, stutter)
// ============================================================
const CYBER_PACK: SoundPack = {
  click: [
    { freq: 1600, duration: 0.02, type: 'square', volume: 0.05 },
    { freq: 1200, duration: 0.02, type: 'square', volume: 0.04, delay: 0.02 },
  ],
  nav: [
    { freq: 1400, duration: 0.03, type: 'square', volume: 0.05 },
    { freq: 1000, duration: 0.04, type: 'sawtooth', volume: 0.04, delay: 0.03 },
  ],
  hover: [{ freq: 1800, duration: 0.015, type: 'square', volume: 0.02 }],
  preview: [
    { freq: 800, duration: 0.05, type: 'sawtooth', volume: 0.05, sweepTo: 1600 },
    { freq: 1600, duration: 0.05, type: 'square', volume: 0.05, delay: 0.06 },
    { freq: 900, duration: 0.04, type: 'sawtooth', volume: 0.05, delay: 0.12, sweepTo: 1400 },
  ],
  cancel: [
    { freq: 600, duration: 0.06, type: 'sawtooth', volume: 0.06, sweepTo: 300 },
    { freq: 300, duration: 0.06, type: 'square', volume: 0.05, delay: 0.06 },
  ],
  equip: [
    { freq: 500, duration: 0.04, type: 'square', volume: 0.06 },
    { freq: 1000, duration: 0.04, type: 'sawtooth', volume: 0.06, delay: 0.04, sweepTo: 1800 },
    { freq: 1400, duration: 0.08, type: 'square', volume: 0.06, delay: 0.1 },
  ],
  purchase: [
    { freq: 400, duration: 0.05, type: 'square', volume: 0.06 },
    { freq: 800, duration: 0.05, type: 'sawtooth', volume: 0.06, delay: 0.05, sweepTo: 1600 },
    { freq: 1200, duration: 0.05, type: 'square', volume: 0.06, delay: 0.1 },
    { freq: 1600, duration: 0.05, type: 'sawtooth', volume: 0.06, delay: 0.15, sweepTo: 2400 },
    { freq: 2000, duration: 0.2, type: 'square', volume: 0.05, delay: 0.22 },
  ],
  error: [
    { freq: 400, duration: 0.04, type: 'sawtooth', volume: 0.07 },
    { freq: 200, duration: 0.04, type: 'sawtooth', volume: 0.07, delay: 0.04 },
    { freq: 400, duration: 0.04, type: 'sawtooth', volume: 0.07, delay: 0.08 },
    { freq: 200, duration: 0.15, type: 'sawtooth', volume: 0.07, delay: 0.12 },
  ],
  levelUp: [
    { freq: 500, duration: 0.05, type: 'square', volume: 0.06 },
    { freq: 1000, duration: 0.05, type: 'sawtooth', volume: 0.06, delay: 0.05, sweepTo: 1400 },
    { freq: 1500, duration: 0.05, type: 'square', volume: 0.06, delay: 0.1 },
    { freq: 2000, duration: 0.05, type: 'sawtooth', volume: 0.06, delay: 0.15, sweepTo: 2600 },
    { freq: 2400, duration: 0.3, type: 'square', volume: 0.06, delay: 0.2 },
  ],
  notification: [
    { freq: 1800, duration: 0.04, type: 'square', volume: 0.05 },
    { freq: 2200, duration: 0.04, type: 'square', volume: 0.05, delay: 0.05 },
    { freq: 2600, duration: 0.1, type: 'square', volume: 0.05, delay: 0.1 },
  ],
  cardCreate: [
    { freq: 1000, duration: 0.05, type: 'sawtooth', volume: 0.05, sweepTo: 1600 },
  ],
  cardDone: [
    { freq: 1000, duration: 0.04, type: 'square', volume: 0.06 },
    { freq: 1500, duration: 0.04, type: 'sawtooth', volume: 0.06, delay: 0.04, sweepTo: 2000 },
    { freq: 2200, duration: 0.15, type: 'square', volume: 0.06, delay: 0.1 },
  ],
  cardMove: [
    { freq: 1200, duration: 0.03, type: 'square', volume: 0.04, sweepTo: 1600 },
  ],
  open: [
    { freq: 800, duration: 0.03, type: 'square', volume: 0.05 },
    { freq: 1200, duration: 0.06, type: 'sawtooth', volume: 0.05, delay: 0.04, sweepTo: 1800 },
  ],
  close: [
    { freq: 1800, duration: 0.03, type: 'square', volume: 0.05 },
    { freq: 1200, duration: 0.06, type: 'sawtooth', volume: 0.05, delay: 0.04, sweepTo: 500 },
  ],
};

// ============================================================
// REGISTRO
// ============================================================
export const SOUND_PACKS: Record<SoundPackId, SoundPack> = {
  default: DEFAULT_PACK,
  retro: RETRO_PACK,
  scifi: SCIFI_PACK,
  zen: ZEN_PACK,
  arcade: ARCADE_PACK,
  cyber: CYBER_PACK,
};

export const SOUND_PACK_LABELS: Record<SoundPackId, string> = {
  default: 'Clásicos',
  retro: 'Retro 8-bit',
  scifi: 'Sci-Fi',
  zen: 'Zen',
  arcade: 'Arcade',
  cyber: 'Cyber',
};