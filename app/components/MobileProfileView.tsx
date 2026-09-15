'use client';

import { ThemeToggle } from './ThemeToggle';

interface Props {
  user: { email: string } | null;
  boardsCount: number;
  onOpenDrawer: () => void;
  onOpenShare: () => void;
  onOpenShortcuts: () => void;
  onLogout: () => void;
}

export function MobileProfileView({
  user,
  boardsCount,
  onOpenDrawer,
  onOpenShare,
  onOpenShortcuts,
  onLogout,
}: Props) {
  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-bold text-slate-100">Perfil</h1>
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            No has iniciado sesión
          </p>
          <a
            href="/login"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors"
          >
            Iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-slate-100">Perfil</h1>

      {/* Card del usuario */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center text-xl font-bold text-amber-400 shrink-0">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-100 truncate">
              {user.email.split('@')[0]}
            </div>
            <div className="text-xs text-slate-500 truncate mt-0.5">
              {user.email}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              Tableros
            </div>
            <div className="text-lg font-bold text-slate-100 mt-0.5">
              {boardsCount}
            </div>
          </div>
          <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              Estado
            </div>
            <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Activo
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <button
          onClick={onOpenShare}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800 active:bg-slate-800/60 transition-colors text-left border-b border-slate-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <span className="flex-1 text-sm text-slate-200">
            Compartir tablero
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        <button
          onClick={onOpenDrawer}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800 active:bg-slate-800/60 transition-colors text-left border-b border-slate-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0">
            <rect x="3" y="3" width="7" height="18" rx="1" />
            <rect x="14" y="3" width="7" height="18" rx="1" />
          </svg>
          <span className="flex-1 text-sm text-slate-200">
            Gestionar tableros
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        <button
          onClick={onOpenShortcuts}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800 active:bg-slate-800/60 transition-colors text-left"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
          </svg>
          <span className="flex-1 text-sm text-slate-200">
            Atajos de teclado
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Tema */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">
          Tema de la app
        </div>
        <ThemeToggle variant="menu" />
      </div>

      {/* Logout */}
      <button
        onClick={() => {
          if (window.confirm('¿Cerrar sesión?')) onLogout();
        }}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 active:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-medium text-sm transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Cerrar sesión
      </button>
    </div>
  );
}