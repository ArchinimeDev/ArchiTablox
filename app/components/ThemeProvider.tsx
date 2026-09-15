'use client';

import { useEffect } from 'react';

export const THEMES = [
  { id: 'light',    name: 'Claro',      icon: '☀️', color: '#f8fafc' },
  { id: 'dark',     name: 'Oscuro',     icon: '🌙', color: '#020617' },
  { id: 'midnight', name: 'Medianoche', icon: '🌌', color: '#0a0e27' },
  { id: 'forest',   name: 'Bosque',     icon: '🌲', color: '#0a1a12' },
  { id: 'sunset',   name: 'Atardecer',  icon: '🌅', color: '#fef3e2' },
  { id: 'rose',     name: 'Rosa',       icon: '🌸', color: '#fff1f5' },
] as const;

export type ThemeId = typeof THEMES[number]['id'];

export const DEFAULT_THEME: ThemeId = 'light';
const STORAGE_KEY = 'architablox-theme';

export function applyTheme(theme: ThemeId) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);

  // color-scheme para que el navegador ajuste scrollbars, inputs, etc.
  const meta = THEMES.find((t) => t.id === theme);
  const isDark =
    theme === 'dark' || theme === 'midnight' || theme === 'forest';
  root.style.colorScheme = isDark ? 'dark' : 'light';

  // Actualizar el theme-color del manifest PWA dinámicamente
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme && meta) {
    metaTheme.setAttribute('content', meta.color);
  }
}

export function getSavedTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && THEMES.some((t) => t.id === saved)) {
    return saved as ThemeId;
  }
  return DEFAULT_THEME;
}

export function saveTheme(theme: ThemeId) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeProvider() {
  useEffect(() => {
    applyTheme(getSavedTheme());
  }, []);

  return null;
}