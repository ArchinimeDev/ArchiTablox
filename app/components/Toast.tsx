'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

type ToastType = 'info' | 'success' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3000) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onDone]);

  const styles = {
    info: {
      bg: 'bg-slate-900 border-slate-700',
      text: 'text-slate-200',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      ),
    },
    success: {
      bg: 'bg-emerald-950/90 border-emerald-500/40',
      text: 'text-emerald-200',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-950/90 border-red-500/40',
      text: 'text-red-200',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      ),
    },
  }[toast.type];

  return (
    <div
      className={`
        animate-slide-in-right pointer-events-auto
        flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border
        shadow-2xl backdrop-blur-md
        min-w-[260px] max-w-[380px]
        ${styles.bg}
      `}
    >
      <div className="shrink-0">{styles.icon}</div>
      <span className={`text-xs font-medium flex-1 ${styles.text}`}>
        {toast.message}
      </span>
      <button
        onClick={onDone}
        className="interactive text-slate-500 hover:text-slate-200 p-0.5 shrink-0"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}