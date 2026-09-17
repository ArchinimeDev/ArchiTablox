// components/NotificationsPanel.tsx
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Board, NotificationSettings } from '@/types';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getDueCards,
  describeDueDays,
  type DueCardInfo,
} from '@/lib/notifications';
import { RARITY_DOT, RARITY_LABEL } from '@/lib/gamification';
import { dayKey } from '@/lib/dateUtils';
import { createClient } from '@/utils/supabase/client';

interface Props {
  board: Board;
  onOpenCard: (id: string) => void;
  onUpdateSettings: (patch: Partial<NotificationSettings>) => void;
  onInviteAccepted: () => void;
}

interface PendingInvite {
  invite_id: string;
  board_id: string;
  board_name: string;
  invitee_email: string;
  invite_role: string;
  inviter_email: string;
  invite_created_at: string;
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Propietario',
  editor: 'Editor',
  viewer: 'Lector',
};

export function NotificationsPanel({
  board,
  onOpenCard,
  onUpdateSettings,
  onInviteAccepted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [permissionState, setPermissionState] = useState<string>('default');
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // ★ Ref local: se resetea al desmontar (logout) y al cambiar de board
  const notifiedRef = useRef<Set<string>>(new Set());

  const settings = board.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS;

  const dueCards = useMemo(
    () => getDueCards(Object.values(board.cards), settings),
    [board.cards, settings]
  );

  const overdue = dueCards.filter((d) => d.status === 'overdue');
  const today = dueCards.filter((d) => d.status === 'today');
  const upcoming = dueCards.filter((d) => d.status === 'upcoming');
  const totalCardCount = dueCards.length;
  const totalInviteCount = invites.length;
  const totalCount = totalCardCount + totalInviteCount;
  const isUrgent = overdue.length > 0;

  const loadInvites = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_my_pending_invites');
    if (error) {
      console.error('[INVITES] Error:', error.message);
      return;
    }
    if (data) setInvites(data as PendingInvite[]);
  };

  // ★ Limpiar notificaciones "ya vistas" cuando cambia el board
  useEffect(() => {
    notifiedRef.current.clear();
  }, [board.id]);

  // Solo cargar cuando el panel se abre
  useEffect(() => {
    if (open) loadInvites();
  }, [open]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    } else {
      setPermissionState('no-soportado');
    }
  }, [open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSettings(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }
  }, [open]);

  useEffect(() => {
    if (!settings.enabled) return;
    if (!settings.browserNotifications) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const priorityLabel = {
      urgent: 'Urgente',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
    };

    for (const d of dueCards) {
      const key = `${dayKey(Date.now())}::${d.card.id}`;
      // ★ Usar el ref local en vez del Set module-level
      if (notifiedRef.current.has(key)) continue;
      notifiedRef.current.add(key);

      const emoji =
        d.status === 'overdue' ? '⚠️' : d.status === 'today' ? '🔔' : '📅';

      const timeLabel = describeDueDays(d.daysDiff);
      const title = `${emoji} ${d.card.title}`;
      const body = `${timeLabel} · Prioridad ${priorityLabel[d.card.priority]}`;

      try {
        const notif = new Notification(title, {
          body,
          tag: d.card.id,
          icon: '/favicon.ico',
        });
        notif.onclick = () => {
          window.focus();
          onOpenCard(d.card.id);
          notif.close();
        };
      } catch {}
    }
  }, [dueCards, settings, onOpenCard]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones.');
      return;
    }

    if (Notification.permission === 'denied') {
      alert(
        'Las notificaciones están bloqueadas para este sitio.\n\n' +
          'Haz click en el candado 🔒 de la barra de direcciones → Notificaciones → Permitir → recarga.'
      );
      return;
    }

    const permission = await Notification.requestPermission();
    setPermissionState(permission);

    if (permission === 'granted') {
      onUpdateSettings({ browserNotifications: true });
      try {
        new Notification('✅ Notificaciones activadas', {
          body: 'Ya funcionan.',
          icon: '/favicon.ico',
        });
      } catch {}
    } else {
      onUpdateSettings({ browserNotifications: false });
    }
  };

  const sendTestNotification = () => {
    if (Notification.permission !== 'granted') {
      alert('Primero activa las notificaciones del navegador.');
      return;
    }
    try {
      new Notification('🔔 Prueba', {
        body: 'Si ves esto, las notificaciones funcionan.',
        icon: '/favicon.ico',
      });
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  const toggleToday = () => {
    const has = settings.daysBefore.includes(0);
    const newDays = has
      ? settings.daysBefore.filter((d) => d !== 0)
      : [...settings.daysBefore, 0].sort((a, b) => a - b);
    onUpdateSettings({ daysBefore: newDays });
  };

  const toggleTomorrow = () => {
    const has = settings.daysBefore.includes(1);
    const newDays = has
      ? settings.daysBefore.filter((d) => d !== 1)
      : [...settings.daysBefore, 1].sort((a, b) => a - b);
    onUpdateSettings({ daysBefore: newDays });
  };

  const todayChecked = settings.daysBefore.includes(0);
  const tomorrowChecked = settings.daysBefore.includes(1);

  const handleAcceptInvite = async (invite: PendingInvite) => {
    setProcessingInvite(invite.invite_id);
    const supabase = createClient();

    const { data, error } = await supabase.rpc('accept_invite_by_id', {
      p_invite_id: invite.invite_id,
    });

    if (error || (data as any)?.error) {
      alert('Error: ' + (error?.message || (data as any).error));
      setProcessingInvite(null);
      return;
    }

    await loadInvites();
    onInviteAccepted();
    setProcessingInvite(null);
    setOpen(false);
  };

  const handleRejectInvite = async (invite: PendingInvite) => {
    if (!window.confirm(`¿Rechazar la invitación a "${invite.board_name}"?`))
      return;

    setProcessingInvite(invite.invite_id);
    const supabase = createClient();

    const { error } = await supabase.rpc('reject_invite_by_id', {
      p_invite_id: invite.invite_id,
    });

    if (error) {
      alert('Error: ' + error.message);
      setProcessingInvite(null);
      return;
    }

    await loadInvites();
    setProcessingInvite(null);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`bg-slate-900 hover:bg-slate-800 border rounded-lg w-8 h-8 flex items-center justify-center transition-colors relative shrink-0 ${
          isUrgent
            ? 'border-red-500/50 hover:border-red-500/70'
            : totalInviteCount > 0
            ? 'border-amber-500/60 hover:border-amber-500/80'
            : 'border-slate-800 hover:border-slate-700'
        }`}
        title={
          totalCount === 0
            ? 'Sin notificaciones'
            : `${totalCount} notificación${totalCount === 1 ? '' : 'es'}`
        }
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
          className={
            isUrgent
              ? 'text-red-400'
              : totalCount > 0
              ? 'text-amber-400'
              : 'text-slate-500'
          }
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {totalCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
              isUrgent ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'
            }`}
          >
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-[calc(100vw-1.5rem)] max-w-96 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setShowSettings(false)}
              className={`text-xs font-medium transition-colors ${
                !showSettings
                  ? 'text-slate-100'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Notificaciones
              {totalCount > 0 && (
                <span className="ml-1.5 text-slate-500">({totalCount})</span>
              )}
            </button>
            <button
              onClick={() => setShowSettings((s) => !s)}
              className={`p-1 rounded transition-colors ${
                showSettings
                  ? 'text-amber-400 bg-slate-800'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
              title="Configurar"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>

          {showSettings ? (
            <div className="p-3 space-y-4 max-h-[70vh] overflow-y-auto">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) =>
                    onUpdateSettings({ enabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <span className="text-sm text-slate-200 font-medium">
                  Mostrar avisos en la campana
                </span>
              </label>

              {settings.enabled && (
                <>
                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2">
                      ¿Cuándo te aviso?
                    </p>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={todayChecked}
                          onChange={toggleToday}
                          className="w-4 h-4 accent-amber-500 cursor-pointer"
                        />
                        <span className="text-slate-300">El mismo día</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={tomorrowChecked}
                          onChange={toggleTomorrow}
                          className="w-4 h-4 accent-amber-500 cursor-pointer"
                        />
                        <span className="text-slate-300">1 día antes</span>
                      </label>
                    </div>
                    {!todayChecked && !tomorrowChecked && (
                      <p className="text-[10px] text-amber-400 mt-2">
                        ⚠️ No has marcado ningún día.
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2">
                      Notificaciones del sistema
                    </p>

                    {permissionState === 'granted' &&
                    settings.browserNotifications ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Activadas
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={sendTestNotification}
                            className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded px-2 py-1.5 transition-colors"
                          >
                            Probar
                          </button>
                          <button
                            onClick={() =>
                              onUpdateSettings({ browserNotifications: false })
                            }
                            className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 rounded px-2 py-1.5 transition-colors"
                          >
                            Desactivar
                          </button>
                        </div>
                      </div>
                    ) : permissionState === 'denied' ? (
                      <div className="bg-red-500/10 border border-red-500/30 rounded p-2.5 text-xs">
                        <p className="text-red-400 font-medium mb-1">
                          Bloqueadas por el navegador
                        </p>
                        <p className="text-red-400/80 leading-relaxed">
                          Click en el candado 🔒 de la barra → Notificaciones →
                          Permitir → recarga.
                        </p>
                      </div>
                    ) : permissionState === 'no-soportado' ? (
                      <p className="text-xs text-slate-500">
                        Tu navegador no soporta notificaciones.
                      </p>
                    ) : (
                      <button
                        onClick={requestPermission}
                        className="w-full text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded px-3 py-2 transition-colors"
                      >
                        Activar notificaciones del navegador
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {invites.length > 0 && (
                <div className="border-b border-slate-800">
                  <div className="px-3 py-1.5 flex items-center gap-2 bg-amber-500/5 border-b border-amber-500/20">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400">
                      Invitaciones
                    </span>
                    <span className="text-[10px] font-mono text-amber-400/70">
                      {invites.length}
                    </span>
                  </div>
                  <div className="p-1.5 space-y-1.5">
                    {invites.map((inv) => (
                      <div
                        key={inv.invite_id}
                        className="bg-slate-950/60 border border-amber-500/30 rounded-md p-2.5"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold text-amber-400">
                            {inv.inviter_email.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-200 leading-snug">
                              <b className="text-slate-100">
                                {inv.inviter_email}
                              </b>{' '}
                              te ha invitado a{' '}
                              <b className="text-amber-400">
                                {inv.board_name}
                              </b>
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Rol:{' '}
                              {ROLE_LABEL[inv.invite_role] ?? inv.invite_role}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleAcceptInvite(inv)}
                            disabled={processingInvite === inv.invite_id}
                            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-medium rounded px-3 py-1.5 text-xs transition-colors"
                          >
                            {processingInvite === inv.invite_id
                              ? '...'
                              : 'Aceptar'}
                          </button>
                          <button
                            onClick={() => handleRejectInvite(inv)}
                            disabled={processingInvite === inv.invite_id}
                            className="px-3 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-400 transition-colors"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!settings.enabled ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Las notificaciones están desactivadas.
                </div>
              ) : totalCardCount === 0 && invites.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Todo al día. Sin tarjetas pendientes.
                </div>
              ) : totalCardCount === 0 ? null : (
                <>
                  {overdue.length > 0 && (
                    <Section title="Vencidas" count={overdue.length} accent="red">
                      {overdue.map((d) => (
                        <CardRow
                          key={d.card.id}
                          info={d}
                          onOpen={(id) => {
                            onOpenCard(id);
                            setOpen(false);
                          }}
                        />
                      ))}
                    </Section>
                  )}
                  {today.length > 0 && (
                    <Section title="Hoy" count={today.length} accent="amber">
                      {today.map((d) => (
                        <CardRow
                          key={d.card.id}
                          info={d}
                          onOpen={(id) => {
                            onOpenCard(id);
                            setOpen(false);
                          }}
                        />
                      ))}
                    </Section>
                  )}
                  {upcoming.length > 0 && (
                    <Section
                      title="Mañana"
                      count={upcoming.length}
                      accent="slate"
                    >
                      {upcoming.map((d) => (
                        <CardRow
                          key={d.card.id}
                          info={d}
                          onOpen={(id) => {
                            onOpenCard(id);
                            setOpen(false);
                          }}
                        />
                      ))}
                    </Section>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent: 'red' | 'amber' | 'slate';
  children: React.ReactNode;
}) {
  const colorMap = {
    red: 'text-red-400',
    amber: 'text-amber-400',
    slate: 'text-slate-400',
  };
  return (
    <div className="border-b border-slate-800 last:border-b-0">
      <div className="px-3 py-1.5 flex items-center gap-2 bg-slate-950/40">
        <span
          className={`text-[10px] uppercase tracking-wider font-bold ${colorMap[accent]}`}
        >
          {title}
        </span>
        <span className="text-[10px] font-mono text-slate-500">{count}</span>
      </div>
      <div className="p-1">{children}</div>
    </div>
  );
}

function CardRow({
  info,
  onOpen,
}: {
  info: DueCardInfo;
  onOpen: (id: string) => void;
}) {
  const { card, daysDiff, status } = info;

  return (
    <button
      onClick={() => onOpen(card.id)}
      className="w-full text-left rounded-md px-2 py-1.5 hover:bg-slate-800 transition-colors"
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${RARITY_DOT[card.priority]}`}
        />
        <span
          className={`text-[10px] font-medium ${
            status === 'overdue'
              ? 'text-red-400'
              : status === 'today'
              ? 'text-amber-400'
              : 'text-slate-500'
          }`}
        >
          {describeDueDays(daysDiff)}
        </span>
        <span className="text-[10px] text-slate-600 uppercase tracking-wider ml-auto">
          {RARITY_LABEL[card.priority]}
        </span>
      </div>
      <div className="text-xs text-slate-200 truncate pl-3.5">
        {card.title}
      </div>
    </button>
  );
}