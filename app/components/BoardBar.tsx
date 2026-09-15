'use client';

import { useState, useEffect, useRef } from 'react';
import type { Board } from '@/types';

interface Props {
  boards: Board[];
  activeBoardId: string;
  boardRoles: Record<string, string>;
  newBoardIds: string[];
  onOpened: () => void;
  onBoardOpened: (id: string) => void;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BoardBar({
  boards,
  activeBoardId,
  boardRoles,
  newBoardIds,
  onOpened,
  onBoardOpened,
  onSwitch,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const hasNewBoards = newBoardIds.length > 0;

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditingId(null);
        setCreating(false);
        setNewName('');
      }
    };
    if (open) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && onOpened) onOpened();
  };

  const startRename = (b: Board) => {
    setEditingId(b.id);
    setEditDraft(b.name);
  };

  const commitRename = () => {
    if (!editingId) return;
    const t = editDraft.trim();
    if (t) onRename(editingId, t);
    setEditingId(null);
    setEditDraft('');
  };

  const commitCreate = () => {
    const t = newName.trim();
    if (!t) return;
    onCreate(t);
    setNewName('');
    setCreating(false);
    setOpen(false);
  };

  const handleSwitchBoard = (id: string) => {
    onSwitch(id);
    onBoardOpened(id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={handleToggle}
        className={`bg-slate-900 hover:bg-slate-800 border rounded-lg px-2.5 h-9 text-xs sm:text-sm flex items-center gap-1.5 transition-colors relative w-full ${
          hasNewBoards
            ? 'border-red-500/60 hover:border-red-500/80'
            : 'border-slate-800 hover:border-slate-700'
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
          className={
            hasNewBoards ? 'text-red-400 shrink-0' : 'text-slate-500 shrink-0'
          }
        >
          <rect x="3" y="3" width="7" height="18" rx="1" />
          <rect x="14" y="3" width="7" height="18" rx="1" />
        </svg>
        <span className="font-medium flex-1 text-left truncate">
          {activeBoard?.name ?? 'Tablero'}
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
          className={`shrink-0 ${hasNewBoards ? 'text-red-400' : 'text-slate-500'}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>

        {hasNewBoards && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-[calc(100vw-1.5rem)] max-w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-medium border-b border-slate-800 flex items-center justify-between">
            <span>Mis tableros</span>
            <span className="text-slate-600 font-mono">{boards.length}</span>
          </div>

          <div className="max-h-80 overflow-y-auto p-1">
            {boards.map((b) => {
              const isActive = b.id === activeBoardId;
              const isEditing = editingId === b.id;
              const role = boardRoles[b.id];
              const isOwner = role === 'owner';
              const isShared = role && role !== 'owner';
              const isNew = newBoardIds.includes(b.id);

              return (
                <div
                  key={b.id}
                  className={`group flex items-center gap-1 rounded-md ${
                    isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'
                  } ${isNew ? 'ring-1 ring-red-500/40' : ''}`}
                >
                  {isEditing ? (
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
                      className="flex-1 bg-slate-950 border border-amber-500/60 rounded px-2 py-1.5 text-sm mx-1 my-0.5 focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSwitchBoard(b.id)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (isOwner) startRename(b);
                      }}
                      className="flex-1 text-left px-2 py-1.5 text-sm truncate flex items-center gap-2 min-w-0 relative"
                      title={
                        isOwner
                          ? 'Doble click para renombrar'
                          : 'Tablero compartido contigo'
                      }
                    >
                      <span className="w-3 flex-shrink-0 text-amber-400">
                        {isActive ? '✓' : ''}
                      </span>
                      <span className="truncate flex-1">{b.name}</span>

                      {isNew && (
                        <>
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-red-400 font-bold shrink-0">
                            Nuevo
                          </span>
                        </>
                      )}

                      {!isNew && isOwner && (
                        <span
                          className="text-[9px] uppercase tracking-wider text-amber-400/70 font-semibold shrink-0 flex items-center gap-0.5"
                          title="Tablero propio"
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l2.39 7.36H22l-6.19 4.5L18.18 21 12 16.5 5.82 21l2.37-7.14L2 9.36h7.61z" />
                          </svg>
                          Propio
                        </span>
                      )}

                      {!isNew && isShared && (
                        <span
                          className="text-[9px] uppercase tracking-wider text-emerald-400/70 font-semibold shrink-0 flex items-center gap-0.5"
                          title={`Compartido · ${role}`}
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          Compartido
                        </span>
                      )}
                    </button>
                  )}

                  {!isEditing && isOwner && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(b);
                        }}
                        className="text-slate-500 hover:text-slate-200 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Renombrar"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={boards.length <= 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `¿Eliminar el tablero "${b.name}"? Se perderán todas sus tarjetas.`
                            )
                          )
                            onDelete(b.id);
                        }}
                        className="text-slate-500 hover:text-red-400 p-1.5 pr-2 opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed transition-opacity"
                        title={
                          boards.length <= 1
                            ? 'No puedes eliminar el último tablero'
                            : 'Eliminar tablero'
                        }
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-800 p-1">
            {creating ? (
              <div className="flex gap-1.5 p-1">
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
                  className="flex-1 bg-slate-950 border border-amber-500/60 rounded px-2 py-1.5 text-xs focus:outline-none"
                />
                <button
                  onClick={commitCreate}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded px-2.5 py-1.5 text-xs transition-colors"
                >
                  Crear
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setCreating(true)}
                  className="w-full text-left px-2.5 py-1.5 text-sm rounded-md hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span>Nuevo tablero</span>
                </button>
                {activeBoard && boardRoles[activeBoard.id] === 'owner' && (
                  <button
                    onClick={() => {
                      onDuplicate(activeBoardId);
                      setOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-sm rounded-md hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Duplicar tablero actual</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}