// lib/sounds.ts
'use client';

import { useSound } from '@/store/sound';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

interface ToneOptions {
  freq: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  delay?: number;
  sweepTo?: number;
}

function tone({
  freq,
  duration,
  type = 'sine',
  volume = 0.15,
  delay = 0,
  sweepTo,
}: ToneOptions) {
  const { enabled, volume: master } = useSound.getState();
  if (!enabled) return;

  const audio = getCtx();
  if (!audio) return;

  const t0 = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, sweepTo),
      t0 + duration
    );
  }

  const final = Math.max(0, Math.min(0.5, volume * master));
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(final, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// ============================================================
// CATÁLOGO DE SONIDOS
// ============================================================

export const sounds = {
  /** Click genérico en botones */
  click: () => tone({ freq: 900, duration: 0.05, type: 'sine', volume: 0.08 }),

  /** Hover suave (para items de tienda) */
  hover: () =>
    tone({ freq: 1400, duration: 0.03, type: 'sine', volume: 0.025 }),

  /** Al seleccionar un cosmético para previsualizar */
  preview: () => {
    tone({ freq: 660, duration: 0.08, type: 'triangle', volume: 0.09 });
    tone({
      freq: 990,
      duration: 0.1,
      type: 'triangle',
      volume: 0.07,
      delay: 0.05,
    });
  },

  /** Al cancelar un preview */
  cancel: () =>
    tone({
      freq: 400,
      duration: 0.08,
      type: 'triangle',
      volume: 0.07,
      sweepTo: 250,
    }),

  /** Al equipar un cosmético */
  equip: () => {
    tone({ freq: 523.25, duration: 0.1, type: 'triangle', volume: 0.1 });
    tone({
      freq: 783.99,
      duration: 0.15,
      type: 'triangle',
      volume: 0.1,
      delay: 0.06,
    });
  },

  /** Al comprar un cosmético (fanfare de monedas) */
  purchase: () => {
    tone({ freq: 659.25, duration: 0.1, type: 'triangle', volume: 0.11 });
    tone({
      freq: 987.77,
      duration: 0.1,
      type: 'triangle',
      volume: 0.11,
      delay: 0.08,
    });
    tone({
      freq: 1318.5,
      duration: 0.28,
      type: 'triangle',
      volume: 0.1,
      delay: 0.16,
    });
    tone({ freq: 1760, duration: 0.3, type: 'sine', volume: 0.05, delay: 0.2 });
  },

  /** Al cometer un error (sin AP, etc.) */
  error: () => {
    tone({ freq: 220, duration: 0.12, type: 'sawtooth', volume: 0.1 });
    tone({
      freq: 180,
      duration: 0.18,
      type: 'sawtooth',
      volume: 0.1,
      delay: 0.08,
    });
  },

  /** Al subir de nivel */
  levelUp: () => {
    tone({ freq: 523.25, duration: 0.12, type: 'triangle', volume: 0.11 });
    tone({
      freq: 659.25,
      duration: 0.12,
      type: 'triangle',
      volume: 0.11,
      delay: 0.1,
    });
    tone({
      freq: 783.99,
      duration: 0.12,
      type: 'triangle',
      volume: 0.11,
      delay: 0.2,
    });
    tone({
      freq: 1046.5,
      duration: 0.35,
      type: 'triangle',
      volume: 0.13,
      delay: 0.3,
    });
  },

  /** Notificación nueva */
  notification: () => {
    tone({ freq: 880, duration: 0.08, type: 'sine', volume: 0.09 });
    tone({
      freq: 1318.5,
      duration: 0.15,
      type: 'sine',
      volume: 0.08,
      delay: 0.08,
    });
  },

  /** Al crear una tarjeta */
  cardCreate: () =>
    tone({
      freq: 587.33,
      duration: 0.07,
      type: 'triangle',
      volume: 0.08,
      sweepTo: 880,
    }),

  /** Al completar una tarjeta */
  cardDone: () => {
    tone({ freq: 659.25, duration: 0.1, type: 'triangle', volume: 0.1 });
    tone({
      freq: 987.77,
      duration: 0.2,
      type: 'triangle',
      volume: 0.11,
      delay: 0.08,
    });
    tone({
      freq: 1318.5,
      duration: 0.25,
      type: 'sine',
      volume: 0.06,
      delay: 0.15,
    });
  },

  /** Al mover una tarjeta */
  cardMove: () =>
    tone({
      freq: 700,
      duration: 0.04,
      type: 'sine',
      volume: 0.05,
      sweepTo: 500,
    }),

  /** Al abrir un modal */
  open: () =>
    tone({
      freq: 500,
      duration: 0.06,
      type: 'sine',
      volume: 0.06,
      sweepTo: 750,
    }),

  /** Al cerrar un modal */
  close: () =>
    tone({
      freq: 750,
      duration: 0.06,
      type: 'sine',
      volume: 0.06,
      sweepTo: 500,
    }),
};