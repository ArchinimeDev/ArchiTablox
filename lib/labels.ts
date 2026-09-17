// lib/labels.ts

// Colores disponibles para etiquetas
export const LABEL_COLORS = [
  '#ef4444', // rojo
  '#f97316', // naranja
  '#eab308', // amarillo
  '#22c55e', // verde
  '#06b6d4', // cyan
  '#3b82f6', // azul
  '#8b5cf6', // violeta
  '#ec4899', // rosa
  '#64748b', // gris
];

// ============================================================
// COLORES DE COLUMNA (para el Kanban)
// ============================================================

export const COLUMN_COLORS = [
  '#3b82f6', // azul     → Por hacer
  '#f59e0b', // ámbar    → En progreso
  '#10b981', // verde    → Hecho
  '#8b5cf6', // violeta
  '#ec4899', // rosa
  '#06b6d4', // cyan
  '#f97316', // naranja
  '#84cc16', // lima
];

/**
 * Devuelve un color hex con alpha (00-ff).
 * Acepta `#abc`, `abc`, `#aabbcc` y `aabbcc`.
 * Si el input no es un hex válido, devuelve el original sin alpha.
 */
export function hexWithAlpha(hex: string, alpha: number): string {
  let h = (hex ?? '').trim();

  // Añadir # si falta
  if (h && !h.startsWith('#')) h = '#' + h;

  // Expandir shorthand #abc → #aabbcc
  if (h.length === 4) {
    h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  }

  // Si no es un hex de 6 dígitos, devolvemos el original
  if (h.length !== 7) return hex;

  // Clamp alpha
  const clamped = Math.max(0, Math.min(1, alpha));
  const a = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');

  return h + a;
}