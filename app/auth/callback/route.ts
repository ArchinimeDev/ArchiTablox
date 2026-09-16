import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Solo permite rutas internas que empiecen por "/" y NO por "//" o "/\".
 * Bloquea open redirects vía backslash o doble slash.
 */
function safeNext(raw: string | null): string {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/';

  try {
    const decoded = decodeURIComponent(raw).trim();
    if (!decoded.startsWith('/')) return '/';
    if (decoded.startsWith('//') || decoded.startsWith('/\\')) return '/';
  } catch {
    return '/';
  }

  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('[auth/callback] exchange error:', error?.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}