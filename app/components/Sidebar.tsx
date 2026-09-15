'use client';

import { useState } from 'react';
import type { Board } from '@/types';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  boards: Board[];
  activeBoardId: string;
  boardRoles: Record<string, string>;
  newBoardIds: string[];
  user: { email: string } | null;
  view: 'board' | 'calendar';
  archivedCount: number;
  onSwitchBoard: (id: string) => void;
  onSetView: (v: 'board' | 'calendar') => void;
  onCreateBoard: (name: string) => void;
  onOpenShare: () => void;
  onOpenArchive: () => void;
  onOpenCommand: () => void;
  onOpenShortcuts: () => void;
  onLogout: () => void;
  onBoardOpened: (id: string) => void;
}

export function Sidebar({
  boards,
  activeBoardId,
  boardRoles,
  newBoardIds,
  user,
  view,
  archivedCount,
  onSwitchBoard,
  onSetView,
  onCreateBoard,
  onOpenShare,
  onOpenArchive,
  onOpenCommand,
  onOpenShortcuts,
  onLogout,
  onBoardOpened,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const commitCreate = () => {
    const t = newName.trim();
    if (!t) return;
    onCreateBoard(t);
    setNewName('');
    setCreating(false);
  };

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 flex-col bg-slate-950 border-r border-slate-800 z-40">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-slate-800 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-sm shrink-0">
          A
        </div>
        <span className="text-sm font-bold text-slate-100 truncate">
          ArchiTablox
        </span>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {/* Botón buscar */}
        <button
          onClick={onOpenCommand}
          className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="flex-1 text-left">Buscar...</span>
          <kbd className="font-mono text-[10px] text-slate-500 bg-slate-950 border border-slate-800 rounded px-1 py-0.5">
            ⌘K
          </kbd>
        </button>

        {/* Sección Tableros */}
        <div className="mb-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Tableros
            </span>
            <button
              onClick={() => setCreating(true)}
              className="text-slate-500 hover:text-amber-400 transition-colors p-0.5"
              title="Nuevo tablero"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          {creating && (
            <div className="px-1 mb-1.5 flex gap-1">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitCreate();
                  if (e.key === 'Escape') {
                    setCreating(false);
                    setNewName('');
                  }
                }}
                placeholder="Nombre..."
                autoFocus
                className="flex-1 bg-slate-900 border border-amber-500/60 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none"
              />
              <button
                onClick={commitCreate}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded px-2 text-xs transition-colors"
              >
                ✓
              </button>
            </div>
          )}

          <nav className="space-y-0.5">
            {boards.map((b) => {
              const isActive = b.id === activeBoardId;
              const isNew = newBoardIds.includes(b.id);
              const role = boardRoles[b.id];
              const isOwner = role === 'owner';

              return (
                <button
                  key={b.id}
                  onClick={() => {
                    onSwitchBoard(b.id);
                    onBoardOpened(b.id);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-slate-100 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isActive ? 'text-amber-400 shrink-0' : 'text-slate-500 shrink-0'}
                  >
                    <rect x="3" y="3" width="7" height="18" rx="1" />
                    <rect x="14" y="3" width="7" height="18" rx="1" />
                  </svg>
                  <span className="flex-1 text-left truncate">{b.name}</span>
                  {isNew && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  )}
                  {!isOwner && role && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-emerald-400/70 shrink-0"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sección Vistas */}
        <div className="mb-3">
          <div className="px-2 mb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Vista
          </div>
          <nav className="space-y-0.5">
            <button
              onClick={() => onSetView('board')}
              className={`w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs transition-colors ${
                view === 'board'
                  ? 'bg-slate-800 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={view === 'board' ? 'text-amber-400' : 'text-slate-500'}>
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="18" rx="1" />
              </svg>
              <span className="flex-1 text-left">Tablero</span>
            </button>
            <button
              onClick={() => onSetView('calendar')}
              className={`w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs transition-colors ${
                view === 'calendar'
                  ? 'bg-slate-800 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={view === 'calendar' ? 'text-amber-400' : 'text-slate-500'}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span className="flex-1 text-left">Calendario</span>
            </button>
            <button
              onClick={onOpenArchive}
              className="w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                <rect x="2" y="3" width="20" height="5" rx="1" />
                <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
              </svg>
              <span className="flex-1 text-left">Archivados</span>
              {archivedCount > 0 && (
                <span className="bg-slate-800 text-slate-400 text-[10px] font-mono px-1.5 rounded-full min-w-[18px] text-center">
                  {archivedCount > 99 ? '99+' : archivedCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 p-2 shrink-0">
        <button
          onClick={onOpenShare}
          className="w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors mb-0.5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Compartir tablero
        </button>

        <button
          onClick={onOpenShortcuts}
          className="w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors mb-0.5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
          </svg>
          Atajos de teclado
        </button>

        <div className="my-2 border-t border-slate-800" />

        {/* Usuario */}
        {user ? (
          <div className="flex items-center gap-2 px-1.5 py-1 rounded-lg bg-slate-900/60 mb-1">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px] font-bold text-amber-400 shrink-0">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-slate-300 truncate font-medium">
                {user.email.split('@')[0]}
              </div>
              <div className="text-[10px] text-slate-600 truncate">
                {user.email}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors shrink-0"
              title="Cerrar sesión"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          <a
            href="/login"
            className="w-full flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg h-8 text-xs transition-colors mb-1"
          >
            Iniciar sesión
          </a>
        )}

        <ThemeToggle variant="sidebar" />
      </div>
    </aside>
  );
}