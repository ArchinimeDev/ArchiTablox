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
// Se asignan automáticamente por posición si la columna no tiene
// un color propio. El usuario puede cambiarlos con el selector
// de color en la configuración de la columna (⚙).
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

// Devuelve un color hex con alpha (00-ff)
export function hexWithAlpha(hex: string, alpha: number) {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return hex + a;
}