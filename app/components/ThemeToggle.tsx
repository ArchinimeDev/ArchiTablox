'use client';

import { useState, useEffect, useRef } from 'react';
import {
  applyTheme,
  getSavedTheme,
  saveTheme,
  THEMES,
  type ThemeId,
} from './ThemeProvider';

interface Props {
  variant?: 'header' | 'menu' | 'sidebar';
  onToggle?: () => void;
}

export function ThemeToggle({ variant = 'header', onToggle }: Props) {
  const [theme, setTheme] = useState<ThemeId>('light');
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(getSavedTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }
  }, [open]);

  const handleSelect = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
    saveTheme(id);
    setOpen(false);
    onToggle?.();
  };

  const currentTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  if (!mounted) {
    if (variant === 'menu') {
      return (
        <div className="w-full h-11 rounded-lg bg-slate-950/60 border border-slate-800" />
      );
    }
    if (variant === 'sidebar') {
      return (
        <div className="w-full h-8 rounded-lg bg-slate-900 border border-slate-800" />
      );
    }
    return (
      <div className="w-8 h-8 sm:w-auto sm:px-2.5 sm:h-9 rounded-lg bg-slate-900 border border-slate-800 shrink-0" />
    );
  }

  // ============ VARIANTE SIDEBAR (PC) ============
  if (variant === 'sidebar') {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
        >
          <span className="text-sm leading-none">{currentTheme.icon}</span>
          <span className="flex-1 text-left">{currentTheme.name}</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-600"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {open && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden p-1">
            {THEMES.map((t) => {
              const active = t.id === theme;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors text-xs ${
                    active ? 'bg-slate-800' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-sm leading-none shrink-0">
                    {t.icon}
                  </span>
                  <span className="flex-1 text-left text-slate-200">
                    {t.name}
                  </span>
                  <span
                    className="w-3 h-3 rounded-full border border-slate-700 shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ============ VARIANTE MENÚ (móvil) ============
  if (variant === 'menu') {
    return (
      <div className="w-full">
        <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-2">
          <span>🎨 Tema</span>
          <span className="text-slate-600 normal-case tracking-normal">
            {currentTheme.name}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 px-1">
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs transition-all border ${
                  active
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span className="text-lg leading-none">{t.icon}</span>
                <span className="text-[10px] font-medium leading-none">
                  {t.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ============ VARIANTE HEADER (escritorio) ============
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Cambiar tema"
        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg w-8 h-8 sm:w-auto sm:px-2.5 flex items-center justify-center gap-1.5 transition-colors shrink-0"
      >
        <span className="text-sm leading-none">{currentTheme.icon}</span>
        <span className="hidden sm:inline text-xs text-slate-400">
          {currentTheme.name}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-500 hidden sm:block"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden p-1.5">
          <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            Elegir tema
          </div>
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors ${
                  active ? 'bg-slate-800' : 'hover:bg-slate-800/60'
                }`}
              >
                <span className="text-base leading-none shrink-0">
                  {t.icon}
                </span>
                <span className="flex-1 text-left text-sm text-slate-200">
                  {t.name}
                </span>
                <span
                  className="w-3 h-3 rounded-full border border-slate-700 shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                {active && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-400 shrink-0"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}