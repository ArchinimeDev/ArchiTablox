'use client';

import { useEffect } from 'react';

export const THEMES = [
  // Gratis (por defecto)
  { id: 'light',     name: 'Claro',       icon: '☀️', color: '#f8fafc', free: true },
  { id: 'dark',      name: 'Oscuro',      icon: '🌙', color: '#020617',  free: true },
  { id: 'midnight',  name: 'Medianoche',  icon: '🌌', color: '#0a0e27',  free: true },
  { id: 'forest',    name: 'Bosque',      icon: '🌲', color: '#0a1a12',  free: true },
  { id: 'sunset',    name: 'Atardecer',   icon: '🌅', color: '#fef3e2',  free: true },
  { id: 'rose',      name: 'Rosa',        icon: '🌸', color: '#fff1f5',  free: true },

  // Premium (tienda)
  { id: 'cyber',     name: 'Cyber',       icon: '🌃', color: '#0a0a14',  free: false },
  { id: 'ocean',     name: 'Océano',      icon: '🌊', color: '#031a2e',  free: false },
  { id: 'sakura',    name: 'Sakura',      icon: '🌸', color: '#fff5f7',  free: false },
  { id: 'paper',     name: 'Papel',       icon: '📜', color: '#faf6ef',  free: false },
  { id: 'vaporwave', name: 'Vaporwave',   icon: '💜', color: '#1a0b2e',  free: false },
] as const;

export type ThemeId = typeof THEMES[number]['id'];

export const DEFAULT_THEME: ThemeId = 'light';
const STORAGE_KEY = 'architablox-theme';

export function applyTheme(theme: ThemeId) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);

  const meta = THEMES.find((t) => t.id === theme);
  const isDark =
    theme === 'dark' ||
    theme === 'midnight' ||
    theme === 'forest' ||
    theme === 'cyber' ||
    theme === 'ocean' ||
    theme === 'vaporwave';
  root.style.colorScheme = isDark ? 'dark' : 'light';

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