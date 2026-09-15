'use client';

import type { Board } from '@/types';
import { NotificationsPanel } from './NotificationsPanel';
import { MembersAvatars } from './MembersAvatars';

interface Props {
  board: Board | undefined;
  user: { email: string } | null;
  syncStatus: 'idle' | 'loading' | 'saving' | 'synced' | 'error';
  onOpenCommand: () => void;
  onOpenShare: () => void;
  onOpenCard: (id: string) => void;
  onUpdateNotificationSettings: (patch: any) => void;
  onInviteAccepted: () => void;
}

export function Topbar({
  board,
  user,
  syncStatus,
  onOpenCommand,
  onOpenShare,
  onOpenCard,
  onUpdateNotificationSettings,
  onInviteAccepted,
}: Props) {
  return (
    <header className="hidden lg:flex h-14 items-center gap-4 px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
      {/* Nombre del tablero */}
      <h1 className="text-sm font-semibold text-slate-100 truncate max-w-xs">
        {board?.name ?? 'Tablero'}
      </h1>

      {board && (
        <MembersAvatars boardId={board.id} onOpenShare={onOpenShare} />
      )}

      <div className="flex-1" />

      {/* Buscador centrado */}
      <button
        onClick={onOpenCommand}
        className="group flex items-center gap-2.5 h-9 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-500 hover:text-slate-200 transition-all w-72"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="flex-1 text-left">Buscar tarjetas, tableros...</span>
        <kbd className="font-mono text-[10px] text-slate-600 group-hover:text-slate-500 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </button>

      {/* Sync status */}
      {user && (
        <div
          className="flex items-center gap-1.5 text-[10px] text-slate-500"
          title={
            syncStatus === 'synced'
              ? 'Sincronizado'
              : syncStatus === 'saving'
              ? 'Guardando...'
              : syncStatus === 'loading'
              ? 'Cargando...'
              : 'Error'
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              syncStatus === 'synced'
                ? 'bg-emerald-500'
                : syncStatus === 'saving' || syncStatus === 'loading'
                ? 'bg-amber-500 animate-pulse'
                : syncStatus === 'error'
                ? 'bg-red-500'
                : 'bg-slate-700'
            }`}
          />
        </div>
      )}

      {/* Notificaciones */}
      {user && board && (
        <NotificationsPanel
          board={board}
          onOpenCard={onOpenCard}
          onUpdateSettings={onUpdateNotificationSettings}
          onInviteAccepted={onInviteAccepted}
        />
      )}
    </header>
  );
}