'use client';

import { useEffect } from 'react';

export type Theme = 'dark' | 'light';

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
}

export function getSavedTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('architablox-theme');
  return saved === 'light' ? 'light' : 'dark';
}

export function saveTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('architablox-theme', theme);
}

export function ThemeProvider() {
  useEffect(() => {
    applyTheme(getSavedTheme());
  }, []);

  return null;
}