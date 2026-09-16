'use client';

import { useMemo, useState, useEffect } from 'react';
import { useProfile } from '@/store/profile';
import { useStats } from '@/store/stats';
import {
  COSMETICS,
  RARITY_COLORS,
  getCosmetic,
  getFrameClass,
  getBackgroundStyle,
} from '@/lib/cosmetics';
import { levelProgress, getLevelTier } from '@/lib/xp';
import { applyTheme, type ThemeId } from './ThemeProvider';
import { useToast } from './Toast';
import type {
  ProfileTab,
  Cosmetic,
  CosmeticCategory,
  EquippedCosmetics,
  ProfileStats,
} from '@/types';

interface Props {
  user: { email: string; avatarUrl: string | null } | null;
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
  theme: 'Temas',
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
  const [previewCosmetic, setPreviewCosmetic] = useState<Cosmetic | null>(null);

  const profile = useProfile((s) => s.profile);
  const equip = useProfile((s) => s.equip);
  const buy = useProfile((s) => s.buy);
  const isAdmin = useProfile((s) => s.isAdmin);
  const stats = useStats((s) => s.stats);
  const { toast } = useToast();

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setPreviewCosmetic(null);
  }, [tab]);

  const effectiveEquipped: EquippedCosmetics = previewCosmetic
    ? { ...profile.equipped, [previewCosmetic.category]: previewCosmetic.id }
    : profile.equipped;

  const previewOwned = previewCosmetic
    ? !!profile.owned[previewCosmetic.id]
    : false;

  // Equipa + aplica tema si corresponde
  const equipWithTheme = (cosmeticId: string) => {
    const cosmetic = getCosmetic(cosmeticId);
    equip(cosmeticId);
    if (cosmetic?.category === 'theme') {
      applyTheme(cosmetic.value as ThemeId);
    }
  };

  const handleBuyPreview = () => {
    if (!previewCosmetic) return;
    const cosmetic = previewCosmetic;
    const ok = buy(cosmetic.id);
    if (!ok) {
      toast('No tienes suficientes AP', 'error');
      return;
    }
    equipWithTheme(cosmetic.id);
    toast(`✨ Desbloqueaste: ${cosmetic.name}`, 'success', 3000);
    setPreviewCosmetic(null);
  };

  const handleEquipPreview = () => {
    if (!previewCosmetic) return;
    const cosmetic = previewCosmetic;
    equipWithTheme(cosmetic.id);
    toast(`✓ Equipado: ${cosmetic.name}`, 'success', 2000);
    setPreviewCosmetic(null);
  };

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

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-4">
      {/* HEADER */}
      <ProfileHeader
        profile={profile}
        equipped={effectiveEquipped}
        userEmail={user.email}
        avatarUrl={user.avatarUrl}
        isAdmin={isAdmin}
        isPreviewing={!!previewCosmetic}
      />

      {/* PREVIEW BAR */}
      {previewCosmetic && (
        <PreviewBar
          cosmetic={previewCosmetic}
          owned={previewOwned}
          isAdmin={isAdmin}
          ap={profile.ap}
          onBuy={handleBuyPreview}
          onEquip={handleEquipPreview}
          onCancel={() => setPreviewCosmetic(null)}
        />
      )}

      {/* TABS */}
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

      {/* CONTENIDO DE TABS */}
      {tab === 'profile' && (
        <ProfileTabContent
          stats={stats}
          onOpenShare={onOpenShare}
          onOpenDrawer={onOpenDrawer}
          onOpenShortcuts={onOpenShortcuts}
          onLogout={onLogout}
        />
      )}

      {tab === 'shop' && (
        <ShopGrid
          profile={profile}
          isAdmin={isAdmin}
          previewId={previewCosmetic?.id}
          onPreview={setPreviewCosmetic}
        />
      )}

      {tab === 'collection' && (
        <CollectionGrid
          profile={profile}
          previewId={previewCosmetic?.id}
          onPreview={setPreviewCosmetic}
        />
      )}
    </div>
  );
}

// ============================================================
// HEADER
// ============================================================

function ProfileHeader({
  profile,
  equipped,
  userEmail,
  avatarUrl,
  isAdmin,
  isPreviewing,
}: {
  profile: ProfileStats;
  equipped: EquippedCosmetics;
  userEmail: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  isPreviewing: boolean;
}) {
  const progress = levelProgress(profile.xp);
  const tier = getLevelTier(progress.level);

  const equippedTitle = getCosmetic(equipped.title ?? 'ti_none');
  const equippedAvatar = equipped.avatar ?? 'av_default';
  const frameClass = getFrameClass(equipped.frame);
  const bgStyle = getBackgroundStyle(equipped.background);

  // Avatar a mostrar: cosmético custom > Google > inicial
  const renderAvatar = () => {
    if (equippedAvatar !== 'av_default') {
      const av = getCosmetic(equippedAvatar);
      return <span className="text-3xl">{av?.value ?? '?'}</span>;
    }
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt=""
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <span className="text-3xl font-bold text-amber-400">
        {userEmail.charAt(0).toUpperCase()}
      </span>
    );
  };

  return (
    <div
      className={`
        rounded-xl overflow-hidden border transition-all duration-200
        ${isPreviewing
          ? 'border-amber-500/60 shadow-[0_0_30px_-8px_rgba(245,158,11,0.5)]'
          : 'border-slate-800'
        }
      `}
    >
      <div className="h-28 relative" style={bgStyle}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/40" />
        {isPreviewing && (
          <div className="absolute top-2 right-2 text-[10px] font-bold text-amber-400 bg-slate-950/80 backdrop-blur border border-amber-500/40 rounded px-2 py-1">
            VISTA PREVIA
          </div>
        )}
      </div>
      <div className="bg-slate-900 px-4 pb-4 -mt-12 relative">
        <div className="flex items-end gap-3 mb-3">
          <div className={`w-20 h-20 rounded-full shrink-0 bg-slate-950 flex items-center justify-center overflow-hidden ${frameClass}`}>
            {renderAvatar()}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <div className="text-base font-bold text-slate-100 truncate">
                {userEmail.split('@')[0]}
              </div>
              {isAdmin && (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/40 rounded px-1.5 py-0.5 shrink-0">
                  ADMIN
                </span>
              )}
            </div>
            {equippedTitle?.value && (
              <div className={`text-xs font-medium ${tier.color} truncate`}>
                {equippedTitle.value}
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-500 truncate mb-4">
          {userEmail}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-bold ${tier.color}`}>
              Nivel {progress.level} · {tier.label}
            </span>
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

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-amber-400 text-sm">◆</span>
            <span className="text-sm font-bold font-mono tabular-nums text-slate-100">
              {isAdmin ? '∞' : profile.ap.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              AP
            </span>
          </div>
          {isAdmin && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/40 rounded px-2 py-1">
              ∞ AP · Compras ilimitadas
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PREVIEW BAR
// ============================================================

function PreviewBar({
  cosmetic,
  owned,
  isAdmin,
  ap,
  onBuy,
  onEquip,
  onCancel,
}: {
  cosmetic: Cosmetic;
  owned: boolean;
  isAdmin: boolean;
  ap: number;
  onBuy: () => void;
  onEquip: () => void;
  onCancel: () => void;
}) {
  const rar = RARITY_COLORS[cosmetic.rarity];
  const canAfford = isAdmin || ap >= (cosmetic.price ?? 0);

  return (
    <div className="animate-fade-slide-up rounded-xl border-2 border-amber-500/50 bg-amber-500/5 p-3 flex items-center gap-3">
      <div className={`w-12 h-12 rounded-lg ${rar.bg} border ${rar.border} flex items-center justify-center shrink-0 overflow-hidden`}>
        <CosmeticIcon cosmetic={cosmetic} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold leading-none">
          Vista previa
        </div>
        <div className="text-sm font-semibold text-slate-100 truncate mt-0.5">
          {cosmetic.name}
        </div>
        <div className={`text-[10px] font-bold ${rar.text}`}>
          {rar.label}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {owned ? (
          <button
            onClick={onEquip}
            className="interactive bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg px-3 py-2 text-xs"
          >
            Equipar
          </button>
        ) : (
          <button
            onClick={onBuy}
            disabled={!canAfford}
            className={`
              interactive font-semibold rounded-lg px-3 py-2 text-xs whitespace-nowrap
              ${canAfford
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            {isAdmin ? '∞ Desbloquear' : `◆ ${cosmetic.price}`}
          </button>
        )}
        <button
          onClick={onCancel}
          className="interactive text-slate-500 hover:text-slate-200 p-2 rounded-lg border border-slate-800 hover:border-slate-700"
          title="Cancelar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// TAB PERFIL
// ============================================================

function ProfileTabContent({
  stats,
  onOpenShare,
  onOpenDrawer,
  onOpenShortcuts,
  onLogout,
}: {
  stats: any;
  onOpenShare: () => void;
  onOpenDrawer: () => void;
  onOpenShortcuts: () => void;
  onLogout: () => void;
}) {
  const last90 = useMemo(() => getLast90Days(), []);
  const maxActions = useMemo(
    () => Math.max(1, ...Object.values(stats.actionsByDay as Record<string, number>)),
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

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Racha" value={`🔥 ${stats.streak.current}`} accent />
        <StatCard label="Máx" value={String(stats.streak.longest)} />
        <StatCard label="Logros" value={String(stats.achievements.length)} />
      </div>

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
                const count = (stats.actionsByDay as Record<string, number>)[key] ?? 0;
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

const ALL_CATEGORIES: (CosmeticCategory | 'all')[] = [
  'all',
  'avatar',
  'frame',
  'background',
  'title',
  'theme',
];

function ShopGrid({
  profile,
  isAdmin,
  previewId,
  onPreview,
}: {
  profile: any;
  isAdmin: boolean;
  previewId: string | undefined;
  onPreview: (c: Cosmetic) => void;
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
        {ALL_CATEGORIES.map((c) => (
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
            const affordable = isAdmin || profile.ap >= (c.price ?? 0);
            const isPreviewing = previewId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onPreview(c)}
                className={`
                  interactive text-left p-3 rounded-xl border transition-all
                  ${rar.border} ${rar.bg}
                  hover:scale-[1.02]
                  ${isPreviewing ? 'ring-2 ring-amber-400 shadow-[0_0_20px_-4px_rgba(245,158,11,0.8)]' : ''}
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <CosmeticIcon cosmetic={c} size="large" />
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${rar.text}`}>
                    {rar.label}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-100 truncate">
                  {c.name}
                </div>
                {c.description && (
                  <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {c.description}
                  </div>
                )}
                <div className="flex items-center gap-1 mt-1.5">
                  {isAdmin ? (
                    <span className="text-[10px] font-bold text-amber-400">
                      ∞ GRATIS
                    </span>
                  ) : (
                    <>
                      <span className="text-amber-400 text-xs">◆</span>
                      <span className={`text-xs font-mono tabular-nums ${affordable ? 'text-slate-200' : 'text-red-400'}`}>
                        {c.price}
                      </span>
                    </>
                  )}
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
  previewId,
  onPreview,
}: {
  profile: any;
  previewId: string | undefined;
  onPreview: (c: Cosmetic) => void;
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
          {ALL_CATEGORIES.map((c) => (
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
          const isPreviewing = previewId === c.id;
          const rar = RARITY_COLORS[c.rarity];

          return (
            <button
              key={c.id}
              onClick={() => onPreview(c)}
              className={`
                interactive relative text-left p-2 rounded-xl border transition-all
                ${owned ? rar.border + ' ' + rar.bg : 'border-slate-800 bg-slate-950/60'}
                ${owned ? 'hover:scale-[1.03]' : 'opacity-70'}
                ${equipped ? 'ring-2 ring-amber-400' : ''}
                ${isPreviewing ? 'ring-2 ring-amber-400 shadow-[0_0_20px_-4px_rgba(245,158,11,0.8)]' : ''}
              `}
            >
              <div className={`flex items-center justify-center h-12 ${owned ? '' : 'opacity-40'}`}>
                <CosmeticIcon cosmetic={c} size="large" />
              </div>
              <div className={`text-[10px] font-medium text-center mt-1 truncate ${owned ? 'text-slate-200' : 'text-slate-500'}`}>
                {c.name}
              </div>
              {!owned && (
                <div className="absolute top-1 right-1 text-[10px] text-slate-500">
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

function CosmeticIcon({
  cosmetic,
  size = 'normal',
}: {
  cosmetic: Cosmetic;
  size?: 'normal' | 'large';
}) {
  const emojiSize = size === 'large' ? 'text-2xl' : 'text-lg';

  if (cosmetic.category === 'avatar') {
    return <span className={emojiSize}>{cosmetic.value === 'initial' ? '👤' : cosmetic.value}</span>;
  }

  if (cosmetic.category === 'frame') {
    if (cosmetic.value === 'none') {
      return (
        <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-600" />
      );
    }
    const frameCls = getFrameClass(cosmetic.id);
    return (
      <div className={`w-7 h-7 rounded-full bg-slate-800 ${frameCls}`} />
    );
  }

  if (cosmetic.category === 'background') {
    return (
      <div
        className="w-12 h-7 rounded-md border border-slate-700"
        style={{ background: cosmetic.value }}
      />
    );
  }

  if (cosmetic.category === 'title') {
    return (
      <span className="text-[10px] font-bold text-slate-300 truncate max-w-full px-1">
        {cosmetic.value || '—'}
      </span>
    );
  }

  if (cosmetic.category === 'theme') {
    const themeColors: Record<string, string> = {
      cyber: 'linear-gradient(135deg, #0ea5e9 0%, #0a0a14 100%)',
      ocean: 'linear-gradient(135deg, #06b6d4 0%, #031a2e 100%)',
      sakura: 'linear-gradient(135deg, #ec4899 0%, #fff5f7 100%)',
      paper: 'linear-gradient(135deg, #a8a29e 0%, #faf6ef 100%)',
      vaporwave: 'linear-gradient(135deg, #d946ef 0%, #1a0b2e 100%)',
    };
    return (
      <div
        className="w-12 h-7 rounded-md border border-slate-700"
        style={{ background: themeColors[cosmetic.value] ?? 'linear-gradient(135deg, #333, #000)' }}
      />
    );
  }

  return null;
}