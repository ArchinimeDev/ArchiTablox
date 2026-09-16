'use client';

import type { Board, NotificationSettings } from '@/types';
import { LevelBadge } from './LevelBadge';
import { NotificationsPanel } from './NotificationsPanel';

interface Props {
  board: Board | undefined;
  user: { email: string; name: string | null; avatarUrl: string | null } | null;
  onOpenMenu: () => void;
  onOpenCommand: () => void;
  onOpenCard: (id: string) => void;
  onUpdateNotificationSettings: (patch: Partial<NotificationSettings>) => void;
  onInviteAccepted: () => void;
}

export function MobileHeader({
  board,
  user,
  onOpenMenu,
  onOpenCommand,
  onOpenCard,
  onUpdateNotificationSettings,
  onInviteAccepted,
}: Props) {
  return (
    <header className="lg:hidden h-14 flex items-center gap-1.5 px-3 border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-30">
      <button
        onClick={onOpenMenu}
        className="interactive w-9 h-9 rounded-lg overflow-hidden bg-amber-500 hover:bg-amber-400 active:bg-amber-500 flex items-center justify-center text-gray-950 font-black text-sm shrink-0"
        title="Menú"
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          'A'
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium leading-none">
          Tablero
        </div>
        <div className="text-sm font-semibold text-slate-100 truncate leading-tight">
          {board?.name ?? 'Sin tablero'}
        </div>
      </div>

      {user && <LevelBadge size="sm" />}

      {user && board && (
        <NotificationsPanel
          board={board}
          onOpenCard={onOpenCard}
          onUpdateSettings={onUpdateNotificationSettings}
          onInviteAccepted={onInviteAccepted}
        />
      )}

      <button
        onClick={onOpenCommand}
        className="interactive w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center shrink-0"
        title="Buscar"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-400"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      {user && (
        <div
          className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 p-1"
          title={user.name ? `${user.name} · ${user.email}` : user.email}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="w-full h-full object-cover rounded-md"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-amber-500/25 flex items-center justify-center text-[10px] font-bold text-amber-400">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
    </header>
  );
}