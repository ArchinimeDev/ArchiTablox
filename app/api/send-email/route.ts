import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';

const ALLOWED_TYPES = ['assigned', 'comment', 'due_soon', 'overdue', 'test'] as const;
type EmailType = (typeof ALLOWED_TYPES)[number];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: unknown): s is string =>
  typeof s === 'string' && UUID_REGEX.test(s);

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const MAX_PER_HOUR = 30;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(userId);
  if (!entry || entry.resetAt < now) {
    RATE_LIMIT.set(userId, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= MAX_PER_HOUR) return false;
  entry.count++;
  return true;
}

function sanitize(s: unknown, max = 200): string {
  if (typeof s !== 'string') return '';
  return s
    .slice(0, max)
    .replace(/[<>]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface EmailPayload {
  to: string;
  type: EmailType;
  data: {
    cardTitle?: string;
    boardName?: string;
    fromUser?: string;
    commentText?: string;
    dueDate?: string;
  };
}

function buildEmail(payload: EmailPayload): { subject: string; html: string } {
  const { type, data } = payload;
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://archi-tablox.vercel.app';

  const safe = {
    cardTitle: escapeHtml(data.cardTitle ?? ''),
    boardName: escapeHtml(data.boardName ?? ''),
    fromUser: escapeHtml(data.fromUser ?? ''),
    commentText: escapeHtml(data.commentText ?? ''),
    dueDate: escapeHtml(data.dueDate ?? ''),
  };

  const wrap = (icon: string, title: string, body: string) => `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
          <tr><td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
              <tr><td style="padding:32px 32px 16px;text-align:center;">
                <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:#f59e0b;line-height:48px;font-size:24px;font-weight:900;color:#020617;text-align:center;">A</div>
                <h1 style="margin:12px 0 0;font-size:20px;color:#0f172a;font-weight:700;">ArchiTablox</h1>
              </td></tr>
              <tr><td style="padding:8px 32px 24px;">
                <div style="text-align:center;font-size:36px;margin-bottom:8px;">${icon}</div>
                <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;font-weight:600;text-align:center;">${title}</h2>
                <div style="font-size:14px;color:#475569;line-height:1.6;text-align:center;">
                  ${body}
                </div>
              </td></tr>
              <tr><td style="padding:0 32px 32px;text-align:center;">
                <a href="${baseUrl}" style="display:inline-block;background:#f59e0b;color:#020617;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;">Abrir en ArchiTablox</a>
              </td></tr>
              <tr><td style="padding:20px 32px;background:#f8fafc;text-align:center;font-size:11px;color:#94a3b8;">
                Recibes este email porque tienes cuenta en ArchiTablox.
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>
  `;

  switch (type) {
    case 'assigned':
      return {
        subject: `📌 Te asignaron: ${safe.cardTitle}`,
        html: wrap(
          '📌',
          'Te asignaron una tarjeta',
          `<b>${safe.fromUser}</b> te asignó a <b>${safe.cardTitle}</b>${
            safe.boardName ? ` en el tablero <b>${safe.boardName}</b>` : ''
          }.`
        ),
      };
    case 'comment':
      return {
        subject: `💬 Nuevo comentario en: ${safe.cardTitle}`,
        html: wrap(
          '💬',
          'Nuevo comentario',
          `<b>${safe.fromUser}</b> comentó en <b>${safe.cardTitle}</b>:
           <div style="margin:16px 0;padding:12px 16px;background:#f1f5f9;border-left:3px solid #f59e0b;border-radius:6px;text-align:left;color:#334155;font-style:italic;">
             "${safe.commentText}"
           </div>`
        ),
      };
    case 'due_soon':
      return {
        subject: `⏰ Vence pronto: ${safe.cardTitle}`,
        html: wrap(
          '⏰',
          'Una tarjeta vence pronto',
          `<b>${safe.cardTitle}</b> vence el <b>${safe.dueDate}</b>.`
        ),
      };
    case 'overdue':
      return {
        subject: `⚠️ Vencida: ${safe.cardTitle}`,
        html: wrap(
          '⚠️',
          'Una tarjeta está vencida',
          `<b>${safe.cardTitle}</b> venció el <b>${safe.dueDate}</b>. ¡Revísala!`
        ),
      };
    case 'test':
      return {
        subject: '✅ Prueba de notificaciones de ArchiTablox',
        html: wrap(
          '✅',
          '¡Las notificaciones funcionan!',
          `Este es un email de prueba.`
        ),
      };
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Demasiados envíos. Intenta más tarde.' },
        { status: 429 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Servicio no configurado' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { to, type, data, boardId } = body ?? {};

    if (typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        { error: 'Email destino inválido' },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }
    if (data && typeof data !== 'object') {
      return NextResponse.json({ error: 'data inválido' }, { status: 400 });
    }

    if (type !== 'test' && to.toLowerCase() === user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'No puedes notificarte a ti mismo' },
        { status: 400 }
      );
    }

    // ★ Validar membership (excepto 'test')
    if (type !== 'test') {
      if (!isUuid(boardId)) {
        return NextResponse.json(
          { error: 'boardId inválido' },
          { status: 400 }
        );
      }

      const { data: me } = await supabase
        .from('board_members')
        .select('role')
        .eq('board_id', boardId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!me) {
        return NextResponse.json(
          { error: 'No perteneces a este tablero' },
          { status: 403 }
        );
      }

      const { data: isMember, error: rpcErr } = await supabase.rpc(
        'is_board_member_by_email',
        { p_board_id: boardId, p_email: to.toLowerCase() }
      );

      if (rpcErr) {
        console.error('[EMAIL] member check error:', rpcErr.message);
        return NextResponse.json(
          { error: 'Error de validación' },
          { status: 500 }
        );
      }

      if (!isMember) {
        return NextResponse.json(
          { error: 'El destinatario no es miembro del tablero' },
          { status: 403 }
        );
      }
    }

    const safeData = {
      cardTitle: sanitize(data?.cardTitle, 200),
      boardName: sanitize(data?.boardName, 100),
      // ★ fromUser se fuerza al usuario autenticado, no lo que diga el cliente
      fromUser: sanitize(user.email ?? 'Alguien', 100),
      commentText: sanitize(data?.commentText, 500),
      dueDate: sanitize(data?.dueDate, 40),
    };

    const { subject, html } = buildEmail({ to, type, data: safeData });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: 'ArchiTablox <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error('[EMAIL] Resend:', result.error);
      return NextResponse.json(
        { error: 'No se pudo enviar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch (err: any) {
    console.error('[EMAIL] Error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}