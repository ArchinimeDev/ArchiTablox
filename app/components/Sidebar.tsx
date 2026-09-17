// app/components/Sidebar.tsx
'use client';

import { useState } from 'react';
import type { Board } from '@/types';
import { LevelBadge } from './LevelBadge';
import { sounds } from '@/lib/sounds';

type ViewId =
  | 'board'
  | 'calendar'
  | 'search'
  | 'archive'
  | 'profile'
  | 'shop'
  | 'metrics'
  | 'myCards';

interface Props {
  boards: Board[];
  activeBoardId: string;
  boardRoles: Record<string, string>;
  newBoardIds: string[];
  user: { email: string; name: string | null; avatarUrl: string | null } | null;
  view: ViewId;
  archivedCount: number;
  myCardsCount: number;
  onSwitchBoard: (id: string) => void;
  onSetView: (v: ViewId) => void;
  onCreateBoard: (name: string) => void;
  onDeleteBoard: (id: string) => void;
  onRenameBoard: (id: string, name: string) => void;
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
  myCardsCount,
  onSwitchBoard,
  onSetView,
  onCreateBoard,
  onDeleteBoard,
  onRenameBoard,
  onOpenShare,
  onOpenArchive,
  onOpenCommand,
  onOpenShortcuts,
  onLogout,
  onBoardOpened,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const commitCreate = () => {
    const t = newName.trim();
    if (!t) return;
    sounds.click();
    onCreateBoard(t);
    setNewName('');
    setCreating(false);
  };

  const cancelCreate = () => {
    sounds.cancel();
    setCreating(false);
    setNewName('');
  };

  const startRename = (b: Board) => {
    sounds.click();
    setEditingId(b.id);
    setEditDraft(b.name);
  };

  const commitRename = () => {
    if (!editingId) return;
    const t = editDraft.trim();
    if (t) {
      sounds.click();
      onRenameBoard(editingId, t);
    }
    setEditingId(null);
    setEditDraft('');
  };

  const handleDelete = (b: Board) => {
    if (boards.length <= 1) {
      alert('No puedes eliminar el último tablero. Crea otro primero.');
      return;
    }
    if (
      window.confirm(
        `¿Eliminar el tablero "${b.name}"?\n\nSe perderán todas sus tarjetas, columnas y comentarios. Esta acción no se puede deshacer.`
      )
    ) {
      sounds.close();
      onDeleteBoard(b.id);
    }
  };

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 flex-col bg-slate-950 border-r border-slate-800 z-40">
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-slate-800 shrink-0">
        <div className="interactive w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-gray-950 font-black text-sm shrink-0 cursor-pointer">
          A
        </div>
        <span className="text-sm font-bold text-slate-100 truncate">
          ArchiTablox
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2">
        <button
          onClick={() => {
            sounds.open();
            onOpenCommand();
          }}
          className="interactive w-full flex items-center gap-2.5 px-3 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 mb-3"
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

        {/* TABLEROS */}
        <div className="mb-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Mis tableros
            </span>
            {!creating && (
              <button
                onClick={() => {
                  sounds.click();
                  setCreating(true);
                }}
                className="interactive flex items-center gap-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-500 text-gray-950 font-bold rounded-md px-2 py-1 text-[10px] shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
                title="Nuevo tablero"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>Nuevo</span>
              </button>
            )}
          </div>

          {creating && (
            <div className="mx-1 mb-2 bg-slate-900 border-2 border-amber-500/60 rounded-lg p-2 animate-fade-slide-up shadow-lg shadow-amber-500/10">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-950">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                  Nuevo tablero
                </span>
              </div>

              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitCreate();
                  if (e.key === 'Escape') cancelCreate();
                }}
                placeholder="Nombre del tablero..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500/80 placeholder:text-slate-600 mb-2"
              />

              <div className="flex gap-1.5">
                <button
                  onClick={commitCreate}
                  disabled={!newName.trim()}
                  className="interactive flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-gray-950 font-bold rounded px-2 py-1 text-[11px] flex items-center justify-center gap-1"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Crear
                </button>
                <button
                  onClick={cancelCreate}
                  className="interactive flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded px-2 py-1 text-[11px] flex items-center justify-center gap-1"
                  title="Cancelar (Esc)"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <nav className="space-y-0.5">
            {boards.map((b) => {
              const isActive = b.id === activeBoardId;
              const isNew = newBoardIds.includes(b.id);
              const role = boardRoles[b.id];
              const isOwner = role === 'owner' || !role;
              const isEditing = editingId === b.id;
              const canDelete = isOwner && boards.length > 1;

              if (isEditing) {
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-1 px-1"
                  >
                    <input
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditDraft('');
                        }
                      }}
                      autoFocus
                      className="flex-1 bg-slate-900 border border-amber-500/60 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none"
                    />
                    <button
                      onClick={commitRename}
                      className="interactive bg-amber-500 hover:bg-amber-400 text-gray-950 font-medium rounded px-2 py-1 text-xs"
                    >
                      ✓
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={b.id}
                  className={`group nav-item w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs ${
                    isActive
                      ? 'bg-slate-800 text-slate-100 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <button
                    onClick={() => {
                      sounds.nav();
                      onSwitchBoard(b.id);
                      onBoardOpened(b.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (isOwner) startRename(b);
                    }}
                    className="flex-1 flex items-center gap-2 min-w-0 text-left"
                    title={isOwner ? 'Doble click para renombrar' : b.name}
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
                    <span className="flex-1 truncate">{b.name}</span>
                  </button>

                  {isNew && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-breathe" />
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

                  {isOwner && (
                    <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 ml-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(b);
                        }}
                        className="interactive text-slate-500 hover:text-amber-400 p-0.5 rounded"
                        title="Renombrar"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!canDelete) {
                            alert('No puedes eliminar el último tablero. Crea otro primero.');
                            return;
                          }
                          handleDelete(b);
                        }}
                        disabled={!canDelete}
                        className={`interactive p-0.5 rounded ${
                          canDelete
                            ? 'text-slate-500 hover:text-red-400'
                            : 'text-slate-700 cursor-not-allowed'
                        }`}
                        title={
                          canDelete
                            ? 'Eliminar tablero'
                            : 'No puedes eliminar el último tablero'
                        }
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* VISTAS */}
        <div className="mb-3">
          <div className="px-2 mb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Vistas
          </div>
          <nav className="space-y-0.5">
            <button
              data-active={view === 'board'}
              onClick={() => {
                sounds.nav();
                onSetView('board');
              }}
              className={`nav-item w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs ${
                view === 'board'
                  ? 'bg-slate-800 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={view === 'board' ? 'text-amber-400' : 'text-slate-500'}>
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="18" rx="1" />
              </svg>
              <span className="flex-1 text-left">Kanban</span>
            </button>
            <button
              data-active={view === 'calendar'}
              onClick={() => {
                sounds.nav();
                onSetView('calendar');
              }}
              className={`nav-item w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs ${
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
              onClick={() => {
                sounds.open();
                onOpenArchive();
              }}
              className="nav-item w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900"
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
            <button
              data-active={view === 'myCards'}
              onClick={() => {
                sounds.nav();
                onSetView('myCards');
              }}
              className={`nav-item w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs ${
                view === 'myCards'
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
                className={view === 'myCards' ? 'text-amber-400' : 'text-slate-500'}
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="flex-1 text-left">Mis tarjetas</span>
              {myCardsCount > 0 && (
                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-mono px-1.5 rounded-full min-w-[18px] text-center">
                  {myCardsCount > 99 ? '99+' : myCardsCount}
                </span>
              )}
            </button>
            <button
              data-active={view === 'metrics'}
              onClick={() => {
                sounds.nav();
                onSetView('metrics');
              }}
              className={`nav-item w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs ${
                view === 'metrics'
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
                className={view === 'metrics' ? 'text-amber-400' : 'text-slate-500'}
              >
                <line x1="3" y1="20" x2="21" y2="20" />
                <rect x="5" y="12" width="3" height="6" />
                <rect x="10.5" y="8" width="3" height="10" />
                <rect x="16" y="4" width="3" height="14" />
              </svg>
              <span className="flex-1 text-left">Métricas</span>
            </button>
          </nav>
        </div>

        {/* CUENTA */}
        <div className="mb-3">
          <div className="px-2 mb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Cuenta
          </div>
          <nav className="space-y-0.5">
            <button
              onClick={() => {
                sounds.nav();
                onSetView('profile');
              }}
              className="nav-item w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="flex-1 text-left">Mi perfil</span>
              {user && <LevelBadge size="sm" />}
            </button>
            <button
              onClick={() => {
                sounds.nav();
                onSetView('shop');
              }}
              className="nav-item w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 4.6A2 2 0 0 0 6.5 21H20" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="19" cy="20" r="1" />
              </svg>
              <span className="flex-1 text-left">Tienda</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 p-2 shrink-0">
        <button
          onClick={() => {
            sounds.open();
            onOpenShare();
          }}
          className="interactive w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 mb-0.5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Compartir tablero
        </button>

        <button
          onClick={() => {
            sounds.open();
            onOpenShortcuts();
          }}
          className="interactive w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
          </svg>
          Atajos de teclado
        </button>

        {!user && (
          <>
            <div className="my-2 border-t border-slate-800" />
            <a
              href="/login"
              className="interactive w-full flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-lg h-8 text-xs"
            >
              Iniciar sesión
            </a>
          </>
        )}
      </div>
    </aside>
  );
}