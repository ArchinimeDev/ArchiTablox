'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('Procesando invitación...');
  const [boardName, setBoardName] = useState<string | null>(null);
  const [expectedEmail, setExpectedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const run = async () => {
      const supabase = createClient();

      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.replace(`/login?next=/join/${token}`);
        return;
      }

      const { data, error } = await supabase.rpc('accept_board_token', {
        p_token: token,
      });

      if (error) {
        setStatus('error');
        setMessage('Error al procesar: ' + error.message);
        return;
      }

      const result = data as any;

      if (result?.error) {
        const errorMessages: Record<string, string> = {
          not_authenticated: 'Debes iniciar sesión primero.',
          invalid_token: 'Este link no es válido o ha expirado.',
          expired_token: 'Este link ya ha expirado.',
          board_not_found: 'El tablero ya no existe.',
        };

        if (result.error === 'email_mismatch') {
          setStatus('error');
          setExpectedEmail(result.expected ?? null);
          setMessage(
            `Este link es para ${result.expected}. Inicia sesión con esa cuenta para acceder.`
          );
          return;
        }

        setStatus('error');
        setMessage(
          errorMessages[result.error] ?? 'Error desconocido: ' + result.error
        );
        return;
      }

      setStatus('success');
      setBoardName(result.board_name ?? null);
      setMessage(`¡Te has unido a "${result.board_name}"!`);

      setTimeout(() => {
        router.replace('/');
        router.refresh();
      }, 1500);
    };

    run();
  }, [token, router]);

  const handleLogoutAndRetry = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(`/login?next=/join/${token}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xl mx-auto mb-6">
          A
        </div>

        <div
          className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            status === 'loading'
              ? 'bg-amber-500/15'
              : status === 'success'
              ? 'bg-emerald-500/15'
              : 'bg-red-500/15'
          }`}
        >
          {status === 'loading' && (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-400 animate-spin"
            >
              <path d="M21 12a9 9 0 1 1-6.22-8.56" />
            </svg>
          )}
          {status === 'success' && (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-400"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
          {status === 'error' && (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-400"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          )}
        </div>

        <h1 className="text-lg font-semibold text-slate-100 mb-2">
          {status === 'loading'
            ? 'Uniéndote al tablero...'
            : status === 'success'
            ? '¡Listo!'
            : 'Ups'}
        </h1>

        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
          {message}
        </p>

        {status === 'success' && boardName && (
          <p className="text-xs text-slate-500">Redirigiendo al tablero...</p>
        )}

        {status === 'error' && expectedEmail && (
          <div className="space-y-2">
            <button
              onClick={handleLogoutAndRetry}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded-lg px-4 py-2 text-sm transition-colors"
            >
              Cerrar sesión e iniciar con otra cuenta
            </button>
            <a
              href="/"
              className="block w-full bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg px-4 py-2 text-sm transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        )}

        {status === 'error' && !expectedEmail && (
          <a
            href="/"
            className="inline-block bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg px-4 py-2 text-sm transition-colors"
          >
            Volver al inicio
          </a>
        )}
      </div>
    </main>
  );
}