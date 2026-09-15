'use client';

import { useMemo, useState } from 'react';
import { useProfile } from '@/store/profile';
import { useStats } from '@/store/stats';
import {
  COSMETICS,
  RARITY_COLORS,
  getCosmetic,
  getFrameClass,
  getAvatarPreview,
  getBackgroundStyle,
} from '@/lib/cosmetics';
import { levelProgress, getLevelTier } from '@/lib/xp';
import { useToast } from './Toast';
import { ThemeToggle } from './ThemeToggle';
import type { ProfileTab, Cosmetic, CosmeticCategory } from '@/types';

interface Props {
  user: { email: string } | null;
  boardsCount: number;
  initialTab?: ProfileTab;
  onOpenDrawer: () => void;
  onOpenShare: () => void;
  onOpenShortcuts: () => void;
  onLogout: () => void;
}

const CATEGORY_LABELS: Record<CosmeticCategory, string> = {
  avatar: 'Avatares',
  frame: 'Marcos',
  background: 'Fondos',
  title: 'Títulos',
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function getLast90Days(): Date[] {
  const arr: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    arr.push(d);
  }
  return arr;
}

export function ProfileView({
  user,
  boardsCount,
  initialTab,
  onOpenDrawer,
  onOpenShare,
  onOpenShortcuts,
  onLogout,
}: Props) {
  const [tab, setTab] = useState<ProfileTab>(initialTab ?? 'profile');
  const profile = useProfile((s) => s.profile);
  const equip = useProfile((s) => s.equip);
  const buy = useProfile((s) => s.buy);
  const stats = useStats((s) => s.stats);
  const { toast } = useToast();

  const progress = levelProgress(profile.xp);
  const tier = getLevelTier(progress.level);

  const equippedAvatar = getCosmetic(profile.equipped.avatar ?? 'av_default');
  const equippedTitle = getCosmetic(profile.equipped.title ?? 'ti_none');
  const frameClass = getFrameClass(profile.equipped.frame);
  const bgStyle = getBackgroundStyle(profile.equipped.background);

  const last90 = useMemo(() => getLast90Days(), []);
  const maxActions = useMemo(
    () => Math.max(1, ...Object.values(stats.actionsByDay)),
    [stats.actionsByDay]
  );

  const weeks = useMemo(() => {
    const grid: Date[][] = [];
    let current: Date[] = [];
    last90.forEach((d, i) => {
      current.push(d);
      if (current.length === 7 || i === last90.length - 1) {
        grid.push(current);
        current = [];
      }
    });
    return grid;
  }, [last90]);

  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-bold text-slate-100">Perfil</h1>
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-500"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="text-sm text-slate-400 mb-4">No has iniciado sesión</p>
          <a
            href="/login"
            className="interactive inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg px-6 py-2.5 text-sm"
          >
            Iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  const userEmail = user.email;

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-4">
      {/* Tabs */}
      <div className="sticky top-0 z-10 -mx-3 px-3 py-2 bg-slate-950/95 backdrop-blur border-b border-slate-800 lg:-mx-6 lg:px-6">
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 w-fit">
          {(['profile', 'shop', 'collection'] as ProfileTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`
                interactive px-3.5 h-8 rounded-md text-xs font-medium transition-all
                ${tab === t
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
                }
              `}
            >
              {t === 'profile' && 'Perfil'}
              {t === 'shop' && 'Tienda'}
              {t === 'collection' && 'Colección'}
            </button>
          ))}
        </div>
      </div>

      {/* ============ TAB PERFIL ============ */}
      {tab === 'profile' && (
        <>
          {/* Cabecera personalizada */}
          <div className="rounded-xl overflow-hidden border border-slate-800">
            <div className="h-28 relative" style={bgStyle}>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/40" />
            </div>
            <div className="bg-slate-900 px-4 pb-4 -mt-12 relative">
              <div className="flex items-end gap-3 mb-3">
                <div
                  className={`
                    w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center
                    text-3xl shrink-0
                    ${frameClass}
                  `}
                >
                  <div className="w-[68px] h-[68px] rounded-full bg-amber-500/20 flex items-center justify-center text-3xl font-bold text-amber-400">
                    {getAvatarPreview(profile.equipped.avatar, userEmail)}
                  </div>
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="text-base font-bold text-slate-100 truncate">
                      {userEmail.split('@')[0]}
                    </div>
                  </div>
                  {equippedTitle?.value && (
                    <div className={`text-xs font-medium ${tier.color}`}>
                      {equippedTitle.value}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-500 truncate mb-4">
                {userEmail}
              </div>

              {/* XP bar full */}
              <XPBarFull />

              {/* Moneda AP */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-amber-400 text-sm">◆</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-slate-100">
                    {profile.ap.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    AP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Racha" value={`🔥 ${stats.streak.current}`} accent />
            <StatCard label="Máx" value={String(stats.streak.longest)} />
            <StatCard label="Logros" value={String(stats.achievements.length)} />
          </div>

          {/* Heatmap */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Actividad · últimos 90 días
              </span>
            </div>
            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1 shrink-0">
                  {week.map((day) => {
                    const key = dayKey(day);
                    const count = stats.actionsByDay[key] ?? 0;
                    const intensity = count === 0 ? 0 : Math.ceil((count / maxActions) * 4);
                    const bg =
                      intensity === 0
                        ? 'bg-slate-800/60'
                        : intensity === 1
                        ? 'bg-amber-500/25'
                        : intensity === 2
                        ? 'bg-amber-500/45'
                        : intensity === 3
                        ? 'bg-amber-500/70'
                        : 'bg-amber-500';
                    return (
                      <div
                        key={key}
                        className={`w-3 h-3 rounded-sm ${bg} transition-transform hover:scale-125`}
                        title={`${key}: ${count}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <button onClick={onOpenShare} className="interactive w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800 transition-colors text-left border-b border-slate-800">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span className="flex-1 text-sm text-slate-200">Compartir tablero</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            <button onClick={onOpenDrawer} className="interactive w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800 transition-colors text-left border-b border-slate-800">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="18" rx="1" />
              </svg>
              <span className="flex-1 text-sm text-slate-200">Gestionar tableros</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            <button onClick={onOpenShortcuts} className="interactive w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800 transition-colors text-left">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
              </svg>
              <span className="flex-1 text-sm text-slate-200">Atajos de teclado</span>
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
            className="interactive w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/40 text-red-400 font-medium text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </>
      )}

      {/* ============ TAB TIENDA ============ */}
      {tab === 'shop' && (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-lg">◆</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-100">
                {profile.ap.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Archi Points
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Gana AP cerrando tarjetas, comentando y manteniendo rachas.
            </p>
          </div>

          <ShopGrid
            profile={profile}
            onBuy={(id) => {
              const cosmetic = getCosmetic(id);
              if (!cosmetic) return;
              const ok = buy(id);
              if (ok) {
                toast(`✨ Desbloqueaste: ${cosmetic.name}`, 'success', 3000);
              } else {
                toast('No tienes suficientes AP', 'error');
              }
            }}
          />
        </>
      )}

      {/* ============ TAB COLECCIÓN ============ */}
      {tab === 'collection' && (
        <CollectionGrid
          profile={profile}
          onEquip={(id) => {
            const cosmetic = getCosmetic(id);
            if (!cosmetic) return;
            equip(id);
            toast(`✓ Equipado: ${cosmetic.name}`, 'success', 2000);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTES
// ============================================================

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">
        {label}
      </div>
      <div className={`text-base font-bold font-mono tabular-nums mt-0.5 ${accent ? 'text-amber-400' : 'text-slate-200'}`}>
        {value}
      </div>
    </div>
  );
}

function XPBarFull() {
  const profile = useProfile((s) => s.profile);
  const progress = levelProgress(profile.xp);
  const tier = getLevelTier(progress.level);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${tier.color}`}>
            Nivel {progress.level} · {tier.label}
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono tabular-nums">
          {progress.current} / {progress.needed} XP
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}

function ShopGrid({
  profile,
  onBuy,
}: {
  profile: any;
  onBuy: (id: string) => void;
}) {
  const [cat, setCat] = useState<CosmeticCategory | 'all'>('all');

  const items = useMemo(() => {
    return COSMETICS.filter((c) => {
      if (!c.price) return false;
      if (profile.owned[c.id]) return false;
      if (cat !== 'all' && c.category !== cat) return false;
      return true;
    });
  }, [cat, profile.owned]);

  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3 px-3">
        {(['all', 'avatar', 'frame', 'background', 'title'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`interactive shrink-0 px-3 h-8 rounded-lg text-xs font-medium border transition-colors ${
              cat === c
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {c === 'all' ? 'Todo' : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-3xl mb-2 opacity-40">🛍️</div>
          <p className="text-sm text-slate-500">
            No hay más cosméticos para comprar en esta categoría.
          </p>
          <p className="text-[11px] text-slate-600 mt-1">
            Sube de nivel para desbloquear más.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map((c) => {
            const rar = RARITY_COLORS[c.rarity];
            const affordable = profile.ap >= (c.price ?? 0);
            return (
              <button
                key={c.id}
                onClick={() => affordable && onBuy(c.id)}
                disabled={!affordable}
                className={`
                  interactive text-left p-3 rounded-xl border transition-all
                  ${rar.border} ${rar.bg}
                  ${affordable ? 'hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'}
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <CosmeticPreview cosmetic={c} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${rar.text}`}>
                    {rar.label}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-100 truncate">
                  {c.name}
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-amber-400 text-xs">◆</span>
                  <span className={`text-xs font-mono tabular-nums ${affordable ? 'text-slate-200' : 'text-red-400'}`}>
                    {c.price}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function CollectionGrid({
  profile,
  onEquip,
}: {
  profile: any;
  onEquip: (id: string) => void;
}) {
  const [cat, setCat] = useState<CosmeticCategory | 'all'>('all');
  const [filter, setFilter] = useState<'all' | 'owned' | 'locked'>('all');

  const items = useMemo(() => {
    return COSMETICS.filter((c) => {
      if (cat !== 'all' && c.category !== cat) return false;
      const owned = !!profile.owned[c.id];
      if (filter === 'owned' && !owned) return false;
      if (filter === 'locked' && owned) return false;
      return true;
    });
  }, [cat, filter, profile.owned]);

  const equippedIds = Object.values(profile.equipped).filter(Boolean) as string[];

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3 px-3">
          {(['all', 'avatar', 'frame', 'background', 'title'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`interactive shrink-0 px-3 h-8 rounded-lg text-xs font-medium border transition-colors ${
                cat === c
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c === 'all' ? 'Todo' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['all', 'owned', 'locked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`interactive px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors ${
                filter === f
                  ? 'bg-slate-800 text-slate-200'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'owned' ? 'Tengo' : 'Faltan'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {items.map((c) => {
          const owned = !!profile.owned[c.id];
          const equipped = equippedIds.includes(c.id);
          const rar = RARITY_COLORS[c.rarity];

          return (
            <button
              key={c.id}
              onClick={() => owned && onEquip(c.id)}
              disabled={!owned}
              className={`
                interactive relative text-left p-2 rounded-xl border transition-all
                ${owned ? rar.border + ' ' + rar.bg : 'border-slate-800 bg-slate-950/60'}
                ${owned && !equipped ? 'hover:scale-[1.03]' : ''}
                ${equipped ? 'ring-2 ring-amber-400' : ''}
                ${!owned ? 'cursor-not-allowed' : ''}
              `}
            >
              <div className={`flex items-center justify-center h-12 ${owned ? '' : 'opacity-30 grayscale'}`}>
                <CosmeticPreview cosmetic={c} large />
              </div>
              <div className={`text-[10px] font-medium text-center mt-1 truncate ${owned ? 'text-slate-200' : 'text-slate-600'}`}>
                {c.name}
              </div>
              {!owned && (
                <div className="absolute top-1 right-1 text-[10px] text-slate-600">
                  {c.price ? `◆${c.price}` : c.unlockedByLevel ? `Nv${c.unlockedByLevel}` : '🔒'}
                </div>
              )}
              {equipped && (
                <div className="absolute top-1 right-1 text-[10px] text-amber-400">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

function CosmeticPreview({ cosmetic, large = false }: { cosmetic: Cosmetic; large?: boolean }) {
  const size = large ? 'text-2xl' : 'text-lg';

  if (cosmetic.category === 'avatar') {
    return <span className={size}>{cosmetic.value === 'initial' ? '👤' : cosmetic.value}</span>;
  }
  if (cosmetic.category === 'frame') {
    return (
      <div className={`w-7 h-7 rounded-full bg-amber-500/20 border-2 border-amber-400 ${cosmetic.value === 'legend' ? 'shadow-[0_0_12px_rgba(232,121,249,1)]' : ''}`} />
    );
  }
  if (cosmetic.category === 'background') {
    return (
      <div className="w-12 h-7 rounded-md border border-slate-700" style={{ background: cosmetic.value }} />
    );
  }
  if (cosmetic.category === 'title') {
    return <span className={`text-xs font-bold text-slate-300 ${large ? 'text-sm' : ''}`}>{cosmetic.value || '—'}</span>;
  }
  return null;
}