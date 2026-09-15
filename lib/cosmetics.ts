import type { Cosmetic } from '@/types';

// ============================================================
// CATÁLOGO DE COSMÉTICOS
// ============================================================

export const COSMETICS: Cosmetic[] = [
  // ----------------------------------------------------------
  // AVATARES (emoji)
  // ----------------------------------------------------------
  { id: 'av_default',   name: 'Inicial',    category: 'avatar', rarity: 'common',  free: true, value: 'initial', preview: 'A' },
  { id: 'av_fire',      name: 'Fuego',      category: 'avatar', rarity: 'common',  price: 50,  value: '🔥',  preview: '🔥' },
  { id: 'av_bolt',      name: 'Rayo',       category: 'avatar', rarity: 'common',  price: 100, value: '⚡',  preview: '⚡' },
  { id: 'av_wave',      name: 'Ola',        category: 'avatar', rarity: 'common',  price: 100, value: '🌊',  preview: '🌊' },
  { id: 'av_moon',      name: 'Luna',       category: 'avatar', rarity: 'rare',    price: 200, value: '🌙',  preview: '🌙' },
  { id: 'av_star',      name: 'Estrella',   category: 'avatar', rarity: 'rare',    price: 250, value: '⭐',  preview: '⭐' },
  { id: 'av_diamond',   name: 'Diamante',   category: 'avatar', rarity: 'epic',    price: 500, value: '💎',  preview: '💎' },
  { id: 'av_crown',     name: 'Corona',     category: 'avatar', rarity: 'epic',    price: 750, value: '👑',  preview: '👑' },
  { id: 'av_eagle',     name: 'Águila',     category: 'avatar', rarity: 'legendary', unlockedByLevel: 30, value: '🦅', preview: '🦅' },
  { id: 'av_dragon',    name: 'Dragón',     category: 'avatar', rarity: 'mythic',  unlockedByLevel: 50, value: '🐉', preview: '🐉' },

  // ----------------------------------------------------------
  // MARCOS
  // ----------------------------------------------------------
  { id: 'fr_none',      name: 'Sin marco',     category: 'frame', rarity: 'common',    free: true, value: 'none' },
  { id: 'fr_ring',      name: 'Anillo',        category: 'frame', rarity: 'common',    price: 80,  value: 'ring' },
  { id: 'fr_ring_dual', name: 'Anillo doble',  category: 'frame', rarity: 'rare',      price: 200, value: 'ring-dual' },
  { id: 'fr_waves',     name: 'Ondas',         category: 'frame', rarity: 'rare',      unlockedByLevel: 5, value: 'waves' },
  { id: 'fr_crystal',   name: 'Cristal',       category: 'frame', rarity: 'epic',      unlockedByLevel: 15, value: 'crystal' },
  { id: 'fr_crown',     name: 'Corona',        category: 'frame', rarity: 'epic',      unlockedByLevel: 30, value: 'crown' },
  { id: 'fr_aurora',    name: 'Aurora',        category: 'frame', rarity: 'legendary', unlockedByLevel: 50, value: 'aurora' },
  { id: 'fr_legend',    name: 'Leyenda',       category: 'frame', rarity: 'mythic',    unlockedByLevel: 100, value: 'legend' },

  // ----------------------------------------------------------
  // FONDOS (gradientes / patrones)
  // ----------------------------------------------------------
  { id: 'bg_slate',     name: 'Slate',         category: 'background', rarity: 'common',  free: true, value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
  { id: 'bg_sunrise',   name: 'Amanecer',      category: 'background', rarity: 'common',  price: 100, value: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)' },
  { id: 'bg_grid',      name: 'Cuadrícula',    category: 'background', rarity: 'common',  price: 150, value: 'repeating-linear-gradient(45deg, #1e293b 0, #1e293b 2px, #0f172a 2px, #0f172a 12px)' },
  { id: 'bg_ocean',     name: 'Océano',        category: 'background', rarity: 'rare',    price: 250, value: 'linear-gradient(135deg, #0ea5e9 0%, #1e3a8a 100%)' },
  { id: 'bg_forest',    name: 'Bosque',        category: 'background', rarity: 'rare',    price: 250, value: 'linear-gradient(135deg, #22c55e 0%, #14532d 100%)' },
  { id: 'bg_galaxy',    name: 'Galaxia',       category: 'background', rarity: 'epic',    price: 500, value: 'linear-gradient(135deg, #7c3aed 0%, #1e1b4b 50%, #0f172a 100%)' },
  { id: 'bg_aurora',    name: 'Aurora',        category: 'background', rarity: 'epic',    unlockedByLevel: 20, value: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)' },
  { id: 'bg_cyberpunk', name: 'Cyberpunk',     category: 'background', rarity: 'legendary', unlockedByLevel: 25, value: 'linear-gradient(135deg, #f0abfc 0%, #7c3aed 40%, #0f172a 100%)' },
  { id: 'bg_plasma',    name: 'Plasma',        category: 'background', rarity: 'legendary', price: 1200, value: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 50%, #facc15 100%)' },

  // ----------------------------------------------------------
  // TÍTULOS
  // ----------------------------------------------------------
  { id: 'ti_none',       name: 'Sin título',    category: 'title', rarity: 'common',    free: true, value: '' },
  { id: 'ti_novato',     name: 'Novato',        category: 'title', rarity: 'common',    unlockedByLevel: 4, value: 'Novato' },
  { id: 'ti_aprendiz',   name: 'Aprendiz',      category: 'title', rarity: 'common',    unlockedByLevel: 7, value: 'Aprendiz' },
  { id: 'ti_constructor',name: 'Constructor',   category: 'title', rarity: 'rare',      unlockedByLevel: 15, value: 'Constructor' },
  { id: 'ti_arquitecto', name: 'Arquitecto',    category: 'title', rarity: 'epic',      unlockedByLevel: 40, value: 'Arquitecto' },
  { id: 'ti_maestro',    name: 'Maestro',       category: 'title', rarity: 'legendary', unlockedByLevel: 75, value: 'Maestro' },
  { id: 'ti_leyenda',    name: 'Leyenda',       category: 'title', rarity: 'mythic',    unlockedByLevel: 100, value: 'Leyenda' },
];

export function getCosmetic(id: string): Cosmetic | undefined {
  return COSMETICS.find((c) => c.id === id);
}

export function getCosmeticsByCategory(category: Cosmetic['category']): Cosmetic[] {
  return COSMETICS.filter((c) => c.category === category);
}

export const RARITY_COLORS: Record<Cosmetic['rarity'], { border: string; bg: string; text: string; label: string }> = {
  common:    { border: 'border-slate-700',   bg: 'bg-slate-800/40',      text: 'text-slate-400',  label: 'Común' },
  rare:      { border: 'border-blue-500/60', bg: 'bg-blue-500/10',       text: 'text-blue-400',   label: 'Raro' },
  epic:      { border: 'border-violet-500/60', bg: 'bg-violet-500/10',   text: 'text-violet-400', label: 'Épico' },
  legendary: { border: 'border-amber-500/60', bg: 'bg-amber-500/10',     text: 'text-amber-400',  label: 'Legendario' },
  mythic:    { border: 'border-red-500/60',  bg: 'bg-red-500/10',        text: 'text-red-400',    label: 'Mítico' },
};

// ============================================================
// HELPERS PARA APLICAR COSMÉTICOS
// ============================================================

export function getFrameClass(frameId: string | undefined): string {
  switch (frameId) {
    case 'ring':
      return 'ring-2 ring-amber-400';
    case 'ring-dual':
      return 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950';
    case 'waves':
      return 'ring-2 ring-cyan-400 shadow-[0_0_20px_-4px_rgba(34,211,238,0.7)]';
    case 'crystal':
      return 'ring-2 ring-violet-400 shadow-[0_0_25px_-4px_rgba(167,139,250,0.8)]';
    case 'crown':
      return 'ring-[3px] ring-amber-400 shadow-[0_0_30px_-2px_rgba(251,191,36,0.9)]';
    case 'aurora':
      return 'ring-[3px] ring-transparent bg-gradient-to-tr from-cyan-400 via-violet-400 to-pink-400 p-[2px]';
    case 'legend':
      return 'ring-[3px] ring-fuchsia-400 shadow-[0_0_35px_-2px_rgba(232,121,249,1)]';
    default:
      return '';
  }
}

export function getAvatarPreview(
  avatarId: string | undefined,
  email: string
): React.ReactNode {
  const cosmetic = avatarId ? getCosmetic(avatarId) : null;
  if (!cosmetic || cosmetic.value === 'initial') {
    return email.charAt(0).toUpperCase();
  }
  return cosmetic.value;
}

export function getBackgroundStyle(backgroundId: string | undefined): React.CSSProperties {
  const cosmetic = backgroundId ? getCosmetic(backgroundId) : null;
  const value = cosmetic?.value ?? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
  return { background: value };
}