'use client';

import type { Board } from '@/types';

type ViewMode = 'board' | 'calendar' | 'search' | 'archive' | 'profile' | 'shop';

interface Props {
  board: Board | undefined;
  view: ViewMode;
  user: { email: string; name: string | null; avatarUrl: string | null } | null;
  archivedCount: number;
  onSetView: (v: ViewMode) => void;
}

export function MobileBottomNav({
  board,
  view,
  user,
  archivedCount,
  onSetView,
}: Props) {
  const items: {
    label: string;
    icon: React.ReactNode;
    active: boolean;
    onClick: () => void;
    badge?: number;
  }[] = [
    {
      label: 'Tablero',
      active: view === 'board',
      onClick: () => onSetView('board'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="18" rx="1" />
          <rect x="14" y="3" width="7" height="18" rx="1" />
        </svg>
      ),
    },
    {
      label: 'Buscar',
      active: view === 'search',
      onClick: () => onSetView('search'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      ),
    },
    {
      label: 'Calendario',
      active: view === 'calendar',
      onClick: () => onSetView('calendar'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ),
    },
    {
      label: 'Archivados',
      active: view === 'archive',
      onClick: () => onSetView('archive'),
      badge: archivedCount,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="5" rx="1" />
          <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
        </svg>
      ),
    },
    {
      label: user ? 'Perfil' : 'Entrar',
      active: view === 'profile' || view === 'shop',
      onClick: () => onSetView('profile'),
      icon: user ? (
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors overflow-hidden ${
            view === 'profile' || view === 'shop'
              ? 'ring-2 ring-amber-500'
              : 'ring-2 ring-amber-500/40'
          }`}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${
                view === 'profile' || view === 'shop'
                  ? 'bg-amber-500 text-gray-950'
                  : 'bg-amber-500/25 text-amber-400'
              }`}
            >
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800">
      <div className="flex items-center justify-around h-14 px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className={`interactive flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg relative ${
              item.active
                ? 'text-amber-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-gray-950 text-[9px] font-bold rounded-full min-w-[14px] h-3.5 px-1 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}