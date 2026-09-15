'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) router.push(nextUrl);
    };
    checkUser();
  }, [router, nextUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${nextUrl}`,
          },
        });
        if (error) throw error;
        setInfo(
          'Cuenta creada. Revisa tu email para confirmarla (si tienes la confirmación activada en Supabase), o inicia sesión directamente.'
        );
        setTimeout(() => setMode('login'), 2000);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(nextUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xl mx-auto mb-3">
            A
          </div>
          <h1 className="text-2xl font-bold text-slate-100">ArchiTablox</h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'login'
              ? 'Inicia sesión para continuar'
              : 'Crea tu cuenta'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex gap-1 mb-5 bg-slate-950 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setInfo(null);
              }}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setInfo(null);
              }}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-slate-700 transition-colors placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-slate-700 transition-colors placeholder:text-slate-600"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            {info && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-400">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {loading
                ? 'Procesando...'
                : mode === 'login'
                ? 'Iniciar sesión'
                : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          <a href="/" className="hover:text-slate-400 transition-colors">
            Continuar sin iniciar sesión
          </a>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
          <p className="text-sm">Cargando...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}