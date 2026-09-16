'use client';

import { useEffect } from 'react';
import { useProfile } from '@/store/profile';

export type ThemeId =
  | 'light'
  | 'dark'
  | 'midnight'
  | 'forest'
  | 'sunset'
  | 'rose'
  | 'cyber'
  | 'ocean'
  | 'sakura'
  | 'paper'
  | 'vaporwave';

const DARK_THEMES: ThemeId[] = [
  'dark',
  'midnight',
  'forest',
  'cyber',
  'ocean',
  'vaporwave',
];

const THEME_COLORS: Record<ThemeId, string> = {
  light: '#f8fafc',
  dark: '#0a0a0a',
  midnight: '#0a0e27',
  forest: '#0a1a12',
  sunset: '#fef3e2',
  rose: '#fff1f5',
  cyber: '#0a0a14',
  ocean: '#031a2e',
  sakura: '#fff5f7',
  paper: '#faf6ef',
  vaporwave: '#1a0b2e',
};

// Mapea id del cosmético → id del tema CSS
const COSMETIC_TO_THEME: Record<string, ThemeId> = {
  th_light: 'light',
  th_dark: 'dark',
  th_midnight: 'midnight',
  th_forest: 'forest',
  th_sunset: 'sunset',
  th_rose: 'rose',
  th_cyber: 'cyber',
  th_ocean: 'ocean',
  th_sakura: 'sakura',
  th_paper: 'paper',
  th_vaporwave: 'vaporwave',
};

export function resolveThemeId(cosmeticId: string | undefined): ThemeId {
  if (!cosmeticId) return 'light';
  return COSMETIC_TO_THEME[cosmeticId] ?? 'light';
}

export function applyTheme(themeId: ThemeId) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', themeId);
  root.style.colorScheme = DARK_THEMES.includes(themeId) ? 'dark' : 'light';

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[themeId]);
}

export function ThemeProvider() {
  const equippedTheme = useProfile((s) => s.profile.equipped.theme);

  useEffect(() => {
    applyTheme(resolveThemeId(equippedTheme));
  }, [equippedTheme]);

  return null;
}