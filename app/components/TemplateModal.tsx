'use client';

import { useState, useEffect } from 'react';
import type { CardTemplate, Priority } from '@/types';
import { RARITY_LABEL } from '@/lib/gamification';

interface Props {
  template: CardTemplate | null;
  onClose: () => void;
  onSave: (data: Omit<CardTemplate, 'id'>) => void;
  onDelete?: () => void;
}

const EMOJI_OPTIONS = [
  '📝',
  '🐛',
  '✨',
  '📅',
  '🚀',
  '💡',
  '🔧',
  '📊',
  '🎯',
  '⚙️',
  '📌',
  '🔥',
];

export function TemplateModal({ template, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState(template?.name ?? '');
  const [icon, setIcon] = useState(template?.icon ?? '📝');
  const [title, setTitle] = useState(template?.title ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [priority, setPriority] = useState<Priority>(
    template?.priority ?? 'medium'
  );
  const [labelNamesText, setLabelNamesText] = useState(
    (template?.labelNames ?? []).join(', ')
  );
  const [subtasksText, setSubtasksText] = useState(
    (template?.subtasks ?? []).join('\n')
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleSave = () => {
    if (!name.trim()) return;

    const labelNames = labelNamesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const subtasks = subtasksText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      name: name.trim(),
      icon,
      title: title,
      description: description.trim() || undefined,
      priority,
      labelNames,
      subtasks,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 sm:border border-slate-800 sm:rounded-xl rounded-none w-full max-w-lg shadow-2xl flex flex-col h-screen sm:h-auto sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-slate-100">
              {template ? 'Editar plantilla' : 'Nueva plantilla'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-200 p-1 rounded transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Icono */}
          <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            Icono
          </label>
          <div className="flex gap-1 flex-wrap mb-4">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                className={`w-8 h-8 rounded-md text-lg flex items-center justify-center transition-all ${
                  icon === e
                    ? 'bg-slate-800 ring-2 ring-amber-500/60'
                    : 'hover:bg-slate-800/60'
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Nombre */}
          <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            Nombre de la plantilla
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Bug, Feature, Reunión..."
            autoFocus
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 mb-4 focus:outline-none focus:border-slate-700"
          />

          {/* Título por defecto */}
          <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            Título de la tarjeta
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Bug: "
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 mb-4 focus:outline-none focus:border-slate-700"
          />

          {/* Descripción */}
          <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Descripción por defecto..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 mb-4 resize-none focus:outline-none focus:border-slate-700 placeholder:text-slate-600"
          />

          {/* Prioridad */}
          <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            Prioridad
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 mb-4 focus:outline-none focus:border-slate-700 cursor-pointer"
          >
            {(Object.keys(RARITY_LABEL) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {RARITY_LABEL[p]}
              </option>
            ))}
          </select>

          {/* Etiquetas */}
          <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            Etiquetas{' '}
            <span className="text-slate-600 normal-case tracking-normal font-normal">
              (separadas por coma)
            </span>
          </label>
          <input
            value={labelNamesText}
            onChange={(e) => setLabelNamesText(e.target.value)}
            placeholder="bug, urgente, backend"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 mb-4 focus:outline-none focus:border-slate-700 placeholder:text-slate-600"
          />
          <p className="text-[10px] text-slate-500 -mt-3 mb-4">
            Si la etiqueta no existe, se crea automáticamente con un color
            aleatorio.
          </p>

          {/* Subtareas */}
          <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            Subtareas{' '}
            <span className="text-slate-600 normal-case tracking-normal font-normal">
              (una por línea)
            </span>
          </label>
          <textarea
            value={subtasksText}
            onChange={(e) => setSubtasksText(e.target.value)}
            rows={4}
            placeholder={'Diseño\nImplementación\nTesting'}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 mb-4 resize-none focus:outline-none focus:border-slate-700 placeholder:text-slate-600 font-mono"
          />
        </div>

        <div className="p-3 sm:p-4 border-t border-slate-800 flex flex-wrap gap-2 justify-between items-center shrink-0 bg-slate-900">
          {template && onDelete ? (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `¿Eliminar la plantilla "${template.name}"?`
                  )
                ) {
                  onDelete();
                  onClose();
                }
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Eliminar
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="px-4 py-1.5 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {template ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}