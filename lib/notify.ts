type EmailType = 'assigned' | 'comment' | 'due_soon' | 'overdue' | 'test';

interface NotifyOptions {
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

export async function sendEmail(options: NotifyOptions): Promise<boolean> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) {
      console.warn('[notify] Error:', await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[notify] Error de red:', err);
    return false;
  }
}