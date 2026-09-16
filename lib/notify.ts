// lib/notify.ts
export type EmailType =
  | 'assigned'
  | 'comment'
  | 'due_soon'
  | 'overdue'
  | 'test';

export interface SendEmailPayload {
  to: string;
  type: EmailType;
  /**
   * Obligatorio para todos los tipos excepto 'test'.
   * El endpoint valida que tanto emisor como destinatario sean miembros.
   */
  boardId?: string;
  data: {
    cardTitle?: string;
    boardName?: string;
    fromUser?: string;
    commentText?: string;
    dueDate?: string;
  };
}

export interface SendEmailResult {
  ok: true;
  id?: string;
}

/**
 * Llama al endpoint /api/send-email.
 * Lanza si el servidor responde con error HTTP.
 */
export async function sendEmail(
  payload: SendEmailPayload
): Promise<SendEmailResult> {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Error ${res.status}`);
  }

  return (await res.json()) as SendEmailResult;
}