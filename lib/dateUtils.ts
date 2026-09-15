// Utilidades de fecha que NO dependen de UTC (evitan el bug de sumar un día)

export const toDateInput = (ts?: number): string => {
  if (!ts) return '';
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const fromDateInput = (s: string): number | undefined => {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  // Guardamos a mediodía local → evita conversiones raras de zona horaria
  return new Date(y, m - 1, d, 12, 0, 0, 0).getTime();
};

export const startOfDay = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const isSameDay = (a: number, b: number): boolean =>
  startOfDay(a) === startOfDay(b);

export const dayKey = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatLongDate = (ts: number): string => {
  return new Date(ts).toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};