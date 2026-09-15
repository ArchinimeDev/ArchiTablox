'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Board } from '@/types';

interface Props {
  board: Board;
  currentUserId: string | null;
  onClose: () => void;
}

interface Member {
  id: string;
  user_id: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  created_at: string;
}

interface Invite {
  id: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  created_at: string;
}

interface ShareToken {
  token: string;
  role: 'editor' | 'viewer';
  invited_email: string | null;
  created_at: string;
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Propietario',
  editor: 'Editor',
  viewer: 'Lector',
};

const ROLE_COLOR: Record<string, string> = {
  owner: 'text-amber-400',
  editor: 'text-emerald-400',
  viewer: 'text-slate-400',
};

function generateToken(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < bytes.length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export function ShareModal({ board, currentUserId, onClose }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newInviteToken, setNewInviteToken] = useState<{
    email: string;
    token: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const isOwner = members.some(
    (m) => m.user_id === currentUserId && m.role === 'owner'
  );

  const reload = async () => {
    const supabase = createClient();

    const { data: mems } = await supabase.rpc('get_board_members', {
      p_board_id: board.id,
    });
    if (mems) {
      setMembers(
        (mems as Member[]).map((m) => ({
          ...m,
          role: m.role as Member['role'],
        }))
      );
    }

    const { data: invs } = await supabase.rpc('list_board_invites', {
      p_board_id: board.id,
    });
    setInvites((invs ?? []) as Invite[]);

    const { data: tks } = await supabase.rpc('list_board_tokens', {
      p_board_id: board.id,
    });
    setTokens((tks ?? []) as ShareToken[]);

    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id]);

  const handleInvite = async () => {
    setError(null);
    setSuccess(null);
    setNewInviteToken(null);
    setCopied(false);

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Introduce un email válido');
      return;
    }

    setSending(true);
    const supabase = createClient();

    // ✅ RPC para crear la invitación (bypass RLS)
    const { data: invData, error: invErr } = await supabase.rpc(
      'create_board_invite',
      {
        p_board_id: board.id,
        p_email: targetEmail,
        p_role: role,
      }
    );

    if (invErr) {
      setError(invErr.message);
      setSending(false);
      return;
    }

    const invResult = invData as any;
    if (invResult?.error) {
      const msg =
        invResult.error === 'not_owner'
          ? 'Solo el propietario del tablero puede invitar'
          : invResult.error === 'not_authenticated'
          ? 'Debes iniciar sesión primero'
          : invResult.error === 'already_member'
          ? 'Ese email ya es miembro del tablero'
          : invResult.error === 'already_invited'
          ? 'Ya hay una invitación pendiente para ese email'
          : invResult.error;
      setError(msg);
      setSending(false);
      return;
    }

    // Generar token de link mágico (opcional)
    const token = generateToken();
    const { data: tokenData, error: tokenErr } = await supabase.rpc(
      'create_share_token',
      {
        p_board_id: board.id,
        p_token: token,
        p_role: role,
        p_invited_email: targetEmail,
      }
    );

    if (tokenErr || (tokenData as any)?.error) {
      // No bloqueante: la invitación ya se creó
      setSuccess(
        `✓ Invitación enviada a ${targetEmail}. Verá la notificación al abrir la app.`
      );
    } else {
      setNewInviteToken({
        email: targetEmail,
        token,
        role,
      });
      setSuccess(
        `✓ Invitación enviada a ${targetEmail}. Verá la notificación al abrir la app.`
      );
    }

    setEmail('');
    setSending(false);
    reload();
  };

  const copyInviteLink = () => {
    if (!newInviteToken) return;
    const url = `${window.location.origin}/join/${newInviteToken.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async (member: Member) => {
    if (!window.confirm(`¿Quitar a ${member.email} del tablero?`)) return;
    const supabase = createClient();
    const { data, error } = await supabase.rpc('remove_board_member', {
      p_member_id: member.id,
    });
    if (error || (data as any)?.error) {
      alert('Error: ' + (error?.message || (data as any).error));
      return;
    }
    reload();
  };

  const handleChangeRole = async (
    member: Member,
    newRole: 'editor' | 'viewer'
  ) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('change_member_role', {
      p_member_id: member.id,
      p_role: newRole,
    });
    if (error || (data as any)?.error) {
      alert('Error: ' + (error?.message || (data as any).error));
      return;
    }
    reload();
  };

  const handleCancelInvite = async (invite: Invite) => {
    if (!window.confirm(`¿Cancelar la invitación a ${invite.email}?`)) return;
    const supabase = createClient();

    // ✅ RPC para cancelar (bypass RLS)
    const { data, error } = await supabase.rpc('cancel_board_invite', {
      p_invite_id: invite.id,
    });

    if (error || (data as any)?.error) {
      alert('Error: ' + (error?.message || (data as any).error));
      return;
    }

    // Revocar token asociado
    const tokenForEmail = tokens.find(
      (t) => t.invited_email === invite.email
    );
    if (tokenForEmail) {
      await supabase.rpc('revoke_share_token', {
        p_token: tokenForEmail.token,
      });
    }

    reload();
  };

  const handleRevokeToken = async (token: string) => {
    if (!window.confirm('¿Revocar este link?')) return;
    const supabase = createClient();
    await supabase.rpc('revoke_share_token', { p_token: token });
    reload();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 sm:border border-slate-800 sm:rounded-xl rounded-none w-full max-w-lg shadow-2xl flex flex-col h-screen sm:h-auto sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Compartir tablero
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {board.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 p-1 rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {isOwner && (
            <div className="mb-5">
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
                Invitar a alguien
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  placeholder="email@ejemplo.com"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-slate-700 placeholder:text-slate-600"
                />
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as 'editor' | 'viewer')
                  }
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-slate-700 cursor-pointer"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Lector</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={sending}
                  className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-medium rounded-lg px-4 py-2 text-sm transition-colors"
                >
                  {sending ? '...' : 'Invitar'}
                </button>
              </div>

              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                <b className="text-slate-400">Editor</b>: puede crear y editar
                tarjetas. <b className="text-slate-400">Lector</b>: solo ver.
                <br />
                La persona recibirá la invitación dentro de la app y podrá
                aceptarla o rechazarla.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-400 mt-3">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 text-xs text-emerald-400 mt-3">
                  {success}
                </div>
              )}

              {newInviteToken && (
                <div className="bg-slate-950 border border-amber-500/40 rounded-lg p-3 mt-3">
                  <p className="text-[10px] uppercase tracking-wider text-amber-400 font-medium mb-2">
                    🔗 Link opcional para {newInviteToken.email}
                  </p>
                  <div className="flex gap-1.5">
                    <input
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${newInviteToken.token}`}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[11px] text-slate-400 font-mono focus:outline-none truncate"
                    />
                    <button
                      onClick={copyInviteLink}
                      className={`text-xs font-medium rounded px-3 py-1.5 transition-colors shrink-0 ${
                        copied
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {copied ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    Puedes mandarlo por WhatsApp, Telegram o email si quieres
                    avisarle por fuera. La persona también verá la invitación
                    dentro de la app.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mb-5 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Miembros
              </span>
              <span className="text-[10px] font-mono text-slate-600">
                {members.length}
              </span>
            </div>

            {loading ? (
              <p className="text-xs text-slate-500 italic">Cargando...</p>
            ) : (
              <div className="space-y-1.5">
                {members.map((m) => {
                  const isMe = m.user_id === currentUserId;
                  const isOwnerMember = m.role === 'owner';
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">
                        {m.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-200 truncate">
                          {m.email}
                          {isMe && (
                            <span className="text-slate-500"> (tú)</span>
                          )}
                        </div>
                      </div>

                      {isOwner && !isOwnerMember ? (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            handleChangeRole(
                              m,
                              e.target.value as 'editor' | 'viewer'
                            )
                          }
                          className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Lector</option>
                        </select>
                      ) : (
                        <span
                          className={`text-[10px] font-medium ${ROLE_COLOR[m.role]}`}
                        >
                          {ROLE_LABEL[m.role]}
                        </span>
                      )}

                      {isOwner && !isOwnerMember && (
                        <button
                          onClick={() => handleRemoveMember(m)}
                          className="text-slate-600 hover:text-red-400 transition text-xs shrink-0"
                          title="Quitar"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {invites.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                  Invitaciones pendientes
                </span>
                <span className="text-[10px] font-mono text-slate-600">
                  {invites.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {invites.map((inv) => {
                  const invToken = tokens.find(
                    (t) => t.invited_email === inv.email
                  );
                  return (
                    <div
                      key={inv.id}
                      className="bg-slate-950/40 border border-dashed border-slate-800 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                          ✉
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-400 truncate">
                            {inv.email}
                          </div>
                          <div className="text-[10px] text-slate-600">
                            Esperando respuesta · {ROLE_LABEL[inv.role]}
                          </div>
                        </div>
                        {isOwner && (
                          <button
                            onClick={() => handleCancelInvite(inv)}
                            className="text-slate-600 hover:text-red-400 transition text-xs shrink-0"
                            title="Cancelar"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {invToken && (
                        <div className="flex gap-1.5 mt-2">
                          <input
                            readOnly
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${invToken.token}`}
                            onFocus={(e) => e.target.select()}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-500 font-mono focus:outline-none truncate"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/join/${invToken.token}`
                              );
                            }}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded px-2 py-1 transition-colors shrink-0"
                          >
                            Copiar
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => handleRevokeToken(invToken.token)}
                              className="text-[10px] text-slate-600 hover:text-red-400 transition-colors shrink-0 px-1"
                              title="Revocar link"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}