'use client';

import { useState, useRef, useEffect } from 'react';
import type { CardTemplate } from '@/types';

interface Props {
  templates: CardTemplate[];
  onApply: (templateId: string) => void;
  onEdit: (template: CardTemplate) => void;
  onCreate: () => void;
}

export function TemplatesMenu({
  templates,
  onApply,
  onEdit,
  onCreate,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 h-9 text-xs flex items-center gap-1.5 transition-colors text-slate-300 shrink-0"
        title="Plantillas"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <span className="hidden sm:inline">Plantillas</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-[calc(100vw-1.5rem)] max-w-72 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-medium border-b border-slate-800 flex items-center justify-between">
            <span>Plantillas ({templates.length})</span>
            <button
              onClick={() => {
                onCreate();
                setOpen(false);
              }}
              className="text-amber-400 hover:text-amber-300 normal-case tracking-normal text-xs"
            >
              + Nueva
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-1">
            {templates.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                No hay plantillas. Crea una con "+ Nueva".
              </div>
            )}

            {templates.map((t) => (
              <div
                key={t.id}
                className="group flex items-center gap-1 rounded-md hover:bg-slate-800 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => {
                    onApply(t.id);
                    setOpen(false);
                  }}
                  className="flex-1 text-left px-2 py-2 text-sm truncate flex items-center gap-2.5 min-w-0"
                  title={`Crear tarjeta desde "${t.name}"`}
                >
                  <span className="text-lg shrink-0">{t.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-slate-200 truncate">{t.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {t.title || '(sin título)'}
                      {t.subtasks.length > 0 &&
                        ` · ${t.subtasks.length} subtarea${
                          t.subtasks.length === 1 ? '' : 's'
                        }`}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(t);
                    setOpen(false);
                  }}
                  className="text-slate-500 hover:text-slate-200 p-1.5 mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Editar"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}