// app/api/send-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

const ALLOWED_TYPES = ['assigned', 'comment', 'due_soon', 'overdue', 'test'] as const;
type EmailType = (typeof ALLOWED_TYPES)[number];

// Rate limit en memoria (por instancia serverless). Suficiente para frenar abuso casual.
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
  return s.slice(0, max).replace(/[<>]/g, '');
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
        subject: `📌 Te asignaron: ${data.cardTitle ?? ''}`,
        html: wrap(
          '📌',
          'Te asignaron una tarjeta',
          `<b>${data.fromUser ?? 'Alguien'}</b> te asignó a <b>${data.cardTitle ?? ''}</b>${
            data.boardName ? ` en el tablero <b>${data.boardName}</b>` : ''
          }.`
        ),
      };
    case 'comment':
      return {
        subject: `💬 Nuevo comentario en: ${data.cardTitle ?? ''}`,
        html: wrap(
          '💬',
          'Nuevo comentario',
          `<b>${data.fromUser ?? 'Alguien'}</b> comentó en <b>${data.cardTitle ?? ''}</b>:
           <div style="margin:16px 0;padding:12px 16px;background:#f1f5f9;border-left:3px solid #f59e0b;border-radius:6px;text-align:left;color:#334155;font-style:italic;">
             "${data.commentText ?? ''}"
           </div>`
        ),
      };
    case 'due_soon':
      return {
        subject: `⏰ Vence pronto: ${data.cardTitle ?? ''}`,
        html: wrap(
          '⏰',
          'Una tarjeta vence pronto',
          `<b>${data.cardTitle ?? ''}</b> vence el <b>${data.dueDate ?? ''}</b>.`
        ),
      };
    case 'overdue':
      return {
        subject: `⚠️ Vencida: ${data.cardTitle ?? ''}`,
        html: wrap(
          '⚠️',
          'Una tarjeta está vencida',
          `<b>${data.cardTitle ?? ''}</b> venció el <b>${data.dueDate ?? ''}</b>. ¡Revísala!`
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
    // 1. Auth obligatoria
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 2. Rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Demasiados envíos. Intenta más tarde.' },
        { status: 429 }
      );
    }

    // 3. Config
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Servicio no configurado' },
        { status: 500 }
      );
    }

    // 4. Validar payload
    const body = await request.json();
    const { to, type, data } = body ?? {};

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

    // 5. Anti-abuse: no auto-notificarse (excepto test)
    if (type !== 'test' && to.toLowerCase() === user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'No puedes notificarte a ti mismo' },
        { status: 400 }
      );
    }

    // 6. Sanitizar
    const safeData = {
      cardTitle: sanitize(data?.cardTitle, 200),
      boardName: sanitize(data?.boardName, 100),
      fromUser: sanitize(data?.fromUser, 100),
      commentText: sanitize(data?.commentText, 500),
      dueDate: sanitize(data?.dueDate, 40),
    };

    const { subject, html } = buildEmail({ to, type, data: safeData });

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