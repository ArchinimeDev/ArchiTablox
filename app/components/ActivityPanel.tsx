'use client';

import { useState, useRef, useEffect } from 'react';
import type { ActivityEvent } from '@/types';

interface Props {
  activity: ActivityEvent[];
  onOpenCard: (id: string) => void;
  onClear: () => void;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 30) return 'ahora';
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(ts).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
  });
}

function describeEvent(e: ActivityEvent): {
  icon: string;
  color: string;
  text: React.ReactNode;
} {
  switch (e.type) {
    case 'card_created':
      return {
        icon: '✨',
        color: 'text-emerald-400',
        text: (
          <>
            creó <b className="text-slate-200">{e.cardTitle}</b>
            {e.toColumn && (
              <>
                {' '}
                en <span className="text-slate-400">{e.toColumn}</span>
              </>
            )}
          </>
        ),
      };
    case 'card_moved':
      return {
        icon: '→',
        color: 'text-blue-400',
        text: (
          <>
            movió <b className="text-slate-200">{e.cardTitle}</b>
            {e.fromColumn && e.toColumn && (
              <>
                {' '}
                de <span className="text-slate-400">{e.fromColumn}</span> a{' '}
                <span className="text-slate-400">{e.toColumn}</span>
              </>
            )}
          </>
        ),
      };
    case 'card_completed':
      return {
        icon: '✅',
        color: 'text-emerald-400',
        text: (
          <>
            completó <b className="text-slate-200">{e.cardTitle}</b>
            {e.toColumn && (
              <>
                {' '}
                en <span className="text-slate-400">{e.toColumn}</span>
              </>
            )}
          </>
        ),
      };
    case 'card_uncompleted':
      return {
        icon: '↩️',
        color: 'text-amber-400',
        text: (
          <>
            reabrió <b className="text-slate-200">{e.cardTitle}</b>
            {e.fromColumn && (
              <>
                {' '}
                desde <span className="text-slate-400">{e.fromColumn}</span>
              </>
            )}
          </>
        ),
      };
    case 'card_archived':
      return {
        icon: '📥',
        color: 'text-slate-400',
        text: (
          <>
            archivó <b className="text-slate-200">{e.cardTitle}</b>
          </>
        ),
      };
    case 'card_restored':
      return {
        icon: '♻️',
        color: 'text-emerald-400',
        text: (
          <>
            restauró <b className="text-slate-200">{e.cardTitle}</b>
          </>
        ),
      };
    case 'card_deleted':
      return {
        icon: '🗑️',
        color: 'text-red-400',
        text: (
          <>
            eliminó <b className="text-slate-200">{e.cardTitle}</b>
          </>
        ),
      };
    case 'card_renamed':
      return {
        icon: '✎',
        color: 'text-amber-400',
        text: (
          <>
            renombró{' '}
            <span className="text-slate-500 line-through">{e.extra}</span> a{' '}
            <b className="text-slate-200">{e.cardTitle}</b>
          </>
        ),
      };
    case 'comment_added':
      return {
        icon: '💬',
        color: 'text-amber-400',
        text: (
          <>
            comentó en <b className="text-slate-200">{e.cardTitle}</b>
            {e.extra && (
              <div className="text-[11px] text-slate-500 mt-0.5 italic truncate">
                "{e.extra}"
              </div>
            )}
          </>
        ),
      };
    case 'template_applied':
      return {
        icon: '📄',
        color: 'text-fuchsia-400',
        text: (
          <>
            creó <b className="text-slate-200">{e.cardTitle}</b> desde{' '}
            <span className="text-slate-400">{e.extra}</span>
          </>
        ),
      };
    case 'attachment_added':
      return {
        icon: '📎',
        color: 'text-blue-400',
        text: (
          <>
            adjuntó <span className="text-slate-400">{e.extra}</span> a{' '}
            <b className="text-slate-200">{e.cardTitle}</b>
          </>
        ),
      };
    case 'assignee_added':
      return {
        icon: '👤',
        color: 'text-emerald-400',
        text: (
          <>
            asignó a alguien en <b className="text-slate-200">{e.cardTitle}</b>
          </>
        ),
      };
    case 'assignee_removed':
      return {
        icon: '👤',
        color: 'text-slate-400',
        text: (
          <>
            quitó asignado en <b className="text-slate-200">{e.cardTitle}</b>
          </>
        ),
      };
    default:
      return {
        icon: '•',
        color: 'text-slate-500',
        text: <span>actividad</span>,
      };
  }
}

export function ActivityPanel({ activity, onOpenCard, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open && !isMobile) {
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }
  }, [open, isMobile]);

  // Contenido reutilizable
  const Content = ({ compact }: { compact: boolean }) => (
    <>
      <div
        className={`border-b border-slate-800 flex items-center justify-between ${
          compact ? 'px-3 py-2' : 'px-4 py-3'
        }`}
      >
        <div className="text-xs font-medium text-slate-100 flex items-center gap-2">
          <span>Historial</span>
          {activity.length > 0 && (
            <span className="text-slate-500">({activity.length})</span>
          )}
        </div>
        {activity.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('¿Vaciar el historial?')) onClear();
            }}
            className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
          >
            Vaciar
          </button>
        )}
      </div>

      {activity.length === 0 ? (
        <div className={`text-center text-slate-500 text-xs ${compact ? 'p-8' : 'p-12'}`}>
          <div className="text-3xl mb-2 opacity-40">📜</div>
          Sin actividad todavía.
          <br />
          Los cambios en tus tarjetas aparecerán aquí.
        </div>
      ) : (
        <div className={`overflow-y-auto ${compact ? 'max-h-96' : 'max-h-[60vh]'} p-1.5`}>
          {activity.map((e) => {
            const { icon, color, text } = describeEvent(e);
            const clickable = !!e.cardId;
            return (
              <div
                key={e.id}
                onClick={() => {
                  if (clickable && e.cardId) {
                    onOpenCard(e.cardId);
                    setOpen(false);
                  }
                }}
                className={`flex gap-2.5 px-2 py-2 rounded-md transition-colors ${
                  clickable ? 'cursor-pointer hover:bg-slate-800' : ''
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-center text-xs shrink-0 ${color}`}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-400 leading-snug">
                    {text}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {relativeTime(e.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <>
      <div ref={ref} className="relative shrink-0">
        <button
          onClick={() => setOpen((o) => !o)}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg p-2 h-9 w-9 sm:w-auto sm:px-2.5 flex items-center justify-center gap-1.5 transition-colors shrink-0"
          title="Historial de actividad"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-500"
          >
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <span className="hidden sm:inline text-xs text-slate-400">
            Actividad
          </span>
        </button>

        {/* Dropdown (solo desktop) */}
        {open && !isMobile && (
          <div className="absolute right-0 mt-1.5 w-96 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden">
            <Content compact />
          </div>
        )}
      </div>

      {/* Modal móvil (centrado, grande) */}
      {open && isMobile && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-400"
                  >
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-100">
                    Actividad
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {activity.length} evento{activity.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-slate-200 p-1.5 rounded transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Content compact={false} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}