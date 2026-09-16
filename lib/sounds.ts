// lib/sounds.ts
'use client';

import { useSound } from '@/store/sound';
import {
  SOUND_PACKS,
  type SoundAction,
  type ToneDef,
} from '@/lib/sound-packs';

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

function playTone(
  audio: AudioContext,
  { freq, duration, type = 'sine', volume = 0.1, delay = 0, sweepTo }: ToneDef,
  master: number
) {
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

function playAction(action: SoundAction) {
  const store = useSound.getState();
  if (!store.enabled) return;

  const packId = store.getActivePack();
  const pack = SOUND_PACKS[packId] ?? SOUND_PACKS.default;
  const tones = pack[action];
  if (!tones || tones.length === 0) return;

  const audio = getCtx();
  if (!audio) return;

  for (const t of tones) {
    playTone(audio, t, store.volume);
  }
}

// ============================================================
// API pública
// ============================================================
export const sounds = {
  click: () => playAction('click'),
  nav: () => playAction('nav'),
  hover: () => playAction('hover'),
  preview: () => playAction('preview'),
  cancel: () => playAction('cancel'),
  equip: () => playAction('equip'),
  purchase: () => playAction('purchase'),
  error: () => playAction('error'),
  levelUp: () => playAction('levelUp'),
  notification: () => playAction('notification'),
  cardCreate: () => playAction('cardCreate'),
  cardDone: () => playAction('cardDone'),
  cardMove: () => playAction('cardMove'),
  open: () => playAction('open'),
  close: () => playAction('close'),

  /** Reproduce una demo encadenada de un pack específico (para preview) */
  demoPack: (packId: keyof typeof SOUND_PACKS) => {
    const store = useSound.getState();
    if (!store.enabled) return;
    const audio = getCtx();
    if (!audio) return;
    const pack = SOUND_PACKS[packId];
    if (!pack) return;

    // click → equip → purchase (con delays escalonados)
    for (const t of pack.click) playTone(audio, t, store.volume);
    for (const t of pack.equip)
      playTone(audio, { ...t, delay: (t.delay ?? 0) + 0.35 }, store.volume);
    for (const t of pack.purchase)
      playTone(audio, { ...t, delay: (t.delay ?? 0) + 0.85 }, store.volume);
  },
};