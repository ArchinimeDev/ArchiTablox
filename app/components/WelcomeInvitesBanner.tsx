'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface PendingInvite {
  invite_id: string;
  board_id: string;
  board_name: string;
  invitee_email: string;
  invite_role: string;
  inviter_email: string;
  invite_created_at: string;
}

interface Props {
  userId: string | null;
  onAccepted: () => void;
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Propietario',
  editor: 'Editor',
  viewer: 'Lector',
};

export function WelcomeInvitesBanner({ userId, onAccepted }: Props) {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const load = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_my_pending_invites');
    if (error) {
      console.error('[WELCOME] Error:', error.message);
      return;
    }
    if (data) setInvites(data as PendingInvite[]);
  };

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  const handleAccept = async (id: string) => {
    setProcessing(id);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('accept_invite_by_id', {
      p_invite_id: id,
    });
    if (error || (data as any)?.error) {
      alert('Error: ' + (error?.message || (data as any).error));
      setProcessing(null);
      return;
    }
    await load();
    onAccepted();
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('¿Rechazar esta invitación?')) return;
    setProcessing(id);
    const supabase = createClient();
    await supabase.rpc('reject_invite_by_id', { p_invite_id: id });
    await load();
    setProcessing(null);
  };

  if (dismissed || invites.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-xl p-4 shadow-lg shadow-amber-500/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            {/* 🆕 Icono de personas (compartir) */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-400"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-amber-300">
                  {invites.length === 1
                    ? 'Tienes 1 invitación pendiente'
                    : `Tienes ${invites.length} invitaciones pendientes`}
                </h3>
                <p className="text-xs text-amber-400/70 mt-0.5">
                  Alguien ha compartido un tablero contigo
                </p>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="text-amber-500/60 hover:text-amber-300 transition-colors p-1 -mt-1 -mr-1"
                title="Ocultar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 mt-3">
              {invites.map((inv) => (
                <div
                  key={inv.invite_id}
                  className="flex flex-wrap items-center gap-3 bg-slate-950/60 rounded-lg p-3 border border-slate-800/80"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-sm shrink-0 font-bold text-amber-400">
                    {inv.inviter_email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 leading-snug">
                      <b className="text-slate-100">{inv.inviter_email}</b> te
                      ha invitado a{' '}
                      <b className="text-amber-400">{inv.board_name}</b>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Rol: {ROLE_LABEL[inv.invite_role] ?? inv.invite_role}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAccept(inv.invite_id)}
                      disabled={processing === inv.invite_id}
                      className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-medium rounded px-3 py-1.5 text-xs transition-colors"
                    >
                      {processing === inv.invite_id ? '...' : 'Aceptar'}
                    </button>
                    <button
                      onClick={() => handleReject(inv.invite_id)}
                      disabled={processing === inv.invite_id}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-400 rounded px-2.5 py-1.5 text-xs transition-colors"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}