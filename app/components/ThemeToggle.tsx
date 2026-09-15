'use client';

import { useState, useEffect } from 'react';
import {
  applyTheme,
  getSavedTheme,
  saveTheme,
  type Theme,
} from './ThemeProvider';

interface Props {
  /** Variante visual: 'header' para escritorio, 'menu' para el drawer móvil */
  variant?: 'header' | 'menu';
  onToggle?: () => void;
}

export function ThemeToggle({ variant = 'header', onToggle }: Props) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getSavedTheme());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    saveTheme(next);
    onToggle?.();
  };

  if (!mounted) {
    return variant === 'header' ? (
      <div className="w-8 h-8 sm:w-auto sm:px-2.5 h-9 rounded-lg bg-slate-900 border border-slate-800 shrink-0" />
    ) : (
      <div className="w-full h-11 rounded-lg bg-slate-950/60 border border-slate-800" />
    );
  }

  const isLight = theme === 'light';
  const label = isLight ? 'Modo oscuro' : 'Modo claro';
  const Icon = isLight ? MoonIcon : SunIcon;

  if (variant === 'menu') {
    return (
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-3 h-11 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
      >
        <Icon className="text-slate-500" />
        <span className="flex-1 text-left">{label}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          {isLight ? 'Día' : 'Noche'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      title={label}
      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg w-8 h-8 sm:w-auto sm:px-2.5 flex items-center justify-center gap-1.5 transition-colors shrink-0"
    >
      <Icon className="text-slate-400" />
      <span className="hidden sm:inline text-xs text-slate-400">{label}</span>
    </button>
  );
}

function SunIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}