import type { TrackAction } from '@/types';

// ============================================================
// XP POR ACCIÓN
// ============================================================

export const XP_VALUES: Record<TrackAction, number> = {
  card_completed: 10,
  template_applied: 5,
  card_created_full: 6,
  comment_added: 5,
  subtask_completed: 3,
  card_created: 3,
  card_moved: 1,
  attachment_added: 3,
  template_created: 15,
  label_created: 3,
  board_created: 20,
};

// ============================================================
// AP POR ACCIÓN (moneda para comprar cosméticos)
// ============================================================

export const AP_VALUES: Record<TrackAction, number> = {
  card_completed: 5,
  template_applied: 3,
  card_created_full: 3,
  comment_added: 2,
  subtask_completed: 1,
  card_created: 1,
  card_moved: 0,
  attachment_added: 1,
  template_created: 8,
  label_created: 1,
  board_created: 10,
};

// ============================================================
// MULTIPLICADOR POR RACHA
// ============================================================

export function getStreakMultiplier(streak: number): number {
  if (streak >= 90) return 3.0;
  if (streak >= 30) return 2.0;
  if (streak >= 7) return 1.5;
  return 1.0;
}

// ============================================================
// CURVA DE NIVELES (100 niveles)
// ============================================================

/**
 * XP total acumulada necesaria para alcanzar el nivel N.
 * Nivel 1 = 0 XP. Curva progresiva pero no brutal.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Curva polinomial: n^2.4 aprox
  return Math.floor(50 * Math.pow(level - 1, 2.4));
}

/**
 * Devuelve el nivel actual dado el XP total.
 */
export function levelFromXP(xp: number): number {
  let level = 1;
  while (level < 100 && xpForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

/**
 * Progreso dentro del nivel actual.
 */
export function levelProgress(xp: number): {
  level: number;
  current: number; // XP dentro del nivel
  needed: number;  // XP total del nivel
  percent: number; // 0-100
  toNext: number;  // XP faltante para subir
} {
  const level = levelFromXP(xp);
  if (level >= 100) {
    return { level: 100, current: 0, needed: 1, percent: 100, toNext: 0 };
  }
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  const current = xp - start;
  const needed = end - start;
  return {
    level,
    current,
    needed,
    percent: Math.min(100, (current / needed) * 100),
    toNext: end - xp,
  };
}

// ============================================================
// COLORES DE NIVEL (por tramo)
// ============================================================

export interface LevelTier {
  name: string;
  min: number;
  max: number;
  color: string;       // texto
  bg: string;          // badge
  ring: string;        // anillo decorativo
  label: string;
}

export const LEVEL_TIERS: LevelTier[] = [
  { name: 'bronze',   min: 1,  max: 10,  color: 'text-amber-700',  bg: 'bg-amber-700/20 border-amber-700/40',   ring: 'ring-amber-700/50',  label: 'Bronce' },
  { name: 'silver',   min: 11, max: 25,  color: 'text-slate-300',  bg: 'bg-slate-400/15 border-slate-400/40',   ring: 'ring-slate-400/50',  label: 'Plata' },
  { name: 'gold',     min: 26, max: 50,  color: 'text-amber-400',  bg: 'bg-amber-400/15 border-amber-400/40',   ring: 'ring-amber-400/50',  label: 'Oro' },
  { name: 'platinum', min: 51, max: 75,  color: 'text-cyan-300',   bg: 'bg-cyan-400/15 border-cyan-400/40',     ring: 'ring-cyan-400/50',   label: 'Platino' },
  { name: 'legend',   min: 76, max: 100, color: 'text-fuchsia-400',bg: 'bg-fuchsia-500/15 border-fuchsia-500/40',ring: 'ring-fuchsia-500/50', label: 'Leyenda' },
];

export function getLevelTier(level: number): LevelTier {
  for (const t of LEVEL_TIERS) {
    if (level >= t.min && level <= t.max) return t;
  }
  return LEVEL_TIERS[0];
}