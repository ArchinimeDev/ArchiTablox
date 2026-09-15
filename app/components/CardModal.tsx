'use client';

import { useEffect, useState, useRef } from 'react';
import type { Card, Label, Priority, Attachment } from '@/types';
import { RARITY_LABEL } from '@/lib/gamification';
import { LABEL_COLORS, hexWithAlpha } from '@/lib/labels';
import { toDateInput, fromDateInput } from '@/lib/dateUtils';
import { createClient } from '@/utils/supabase/client';

interface Props {
  card: Card;
  labels: Label[];
  onClose: () => void;
  onSave: (patch: Partial<Card>) => void;
  onArchive: () => void;
  onAddSubtask: (title: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onUpdateSubtask: (subtaskId: string, title: string) => void;
  onToggleLabel: (labelId: string) => void;
  onCreateAndAssignLabel: (name: string, color: string) => void;
  onDeleteLabel: (labelId: string) => void;
  onAddComment: (text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onAddAttachment: (
    attachment: Omit<Attachment, 'id' | 'createdAt'>
  ) => void;
  onDeleteAttachment: (attachmentId: string) => void;
}

function renderCommentText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:text-amber-300 underline underline-offset-2 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(ts).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(type: string) {
  return type.startsWith('image/');
}

export function CardModal({
  card,
  labels,
  onClose,
  onSave,
  onArchive,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateSubtask,
  onToggleLabel,
  onCreateAndAssignLabel,
  onDeleteLabel,
  onAddComment,
  onDeleteComment,
  onAddAttachment,
  onDeleteAttachment,
}: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [priority, setPriority] = useState<Priority>(card.priority);
  const [dueDate, setDueDate] = useState(toDateInput(card.dueDate));
  const [newSubtask, setNewSubtask] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [showNewLabel, setShowNewLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subtasks = card.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const total = subtasks.length;
  const cardLabelIds = card.labelIds ?? [];
  const comments = card.comments ?? [];
  const attachments = card.attachments ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: fromDateInput(dueDate),
    });
    onClose();
  };

  const handleAddSubtask = () => {
    const t = newSubtask.trim();
    if (!t) return;
    onAddSubtask(t);
    setNewSubtask('');
  };

  const startEditSubtask = (id: string, currentTitle: string) => {
    setEditingSubtaskId(id);
    setSubtaskDraft(currentTitle);
  };

  const commitEditSubtask = () => {
    if (!editingSubtaskId) return;
    const t = subtaskDraft.trim();
    if (t) onUpdateSubtask(editingSubtaskId, t);
    setEditingSubtaskId(null);
    setSubtaskDraft('');
  };

  const handleCreateLabel = () => {
    const t = newLabelName.trim();
    if (!t) return;
    onCreateAndAssignLabel(t, newLabelColor);
    setNewLabelName('');
    setShowNewLabel(false);
  };

  const handleAddComment = () => {
    const t = newComment.trim();
    if (!t) return;
    onAddComment(t);
    setNewComment('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('El archivo supera el límite de 10 MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();

      const ext = file.name.split('.').pop() ?? '';
      const timestamp = Date.now();
      const random = Math.random().toString(36).slice(2, 8);
      const filename = `${timestamp}_${random}.${ext}`;
      const path = `${card.id}/${filename}`;

      const { error: uploadErr } = await supabase.storage
        .from('card-attachments')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadErr) {
        setUploadError(uploadErr.message);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const { data: urlData } = supabase.storage
        .from('card-attachments')
        .getPublicUrl(path);

      onAddAttachment({
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type || 'application/octet-stream',
      });

      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadError(err.message ?? 'Error al subir el archivo');
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
              Editar tarjeta
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

          <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            Título
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 mb-4 focus:outline-none focus:border-slate-700 transition-colors"
          />

          <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Detalles, links..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 mb-4 resize-none focus:outline-none focus:border-slate-700 transition-colors placeholder:text-slate-600"
          />

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-slate-700 cursor-pointer"
              >
                {(Object.keys(RARITY_LABEL) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {RARITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
                Fecha límite
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-slate-700 cursor-pointer"
              />
            </div>
          </div>

          {/* ETIQUETAS */}
          <div className="mb-5 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Etiquetas
              </label>
              <button
                type="button"
                onClick={() => setShowNewLabel((s) => !s)}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showNewLabel ? 'Cancelar' : '+ Nueva'}
              </button>
            </div>

            {showNewLabel && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-2.5">
                <input
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateLabel()}
                  placeholder="Nombre..."
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs mb-2 text-slate-100 focus:outline-none focus:border-slate-700"
                />
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-wrap">
                    {LABEL_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewLabelColor(c)}
                        className={`w-5 h-5 rounded-full transition-all ${
                          newLabelColor === c
                            ? 'ring-2 ring-slate-400 ring-offset-1 ring-offset-slate-950'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateLabel}
                    className="ml-auto bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded px-3 py-1 transition-colors"
                  >
                    Crear
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {labels.length === 0 && !showNewLabel && (
                <p className="text-xs text-slate-600 italic">
                  Sin etiquetas todavía.
                </p>
              )}
              {labels.map((label) => {
                const active = cardLabelIds.includes(label.id);
                return (
                  <span
                    key={label.id}
                    className="group inline-flex items-center gap-0.5 text-xs rounded-md border overflow-hidden transition-colors"
                    style={{
                      backgroundColor: active
                        ? hexWithAlpha(label.color, 0.15)
                        : 'transparent',
                      color: label.color,
                      borderColor: hexWithAlpha(label.color, active ? 0.5 : 0.2),
                      opacity: active ? 1 : 0.55,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleLabel(label.id)}
                      className="px-1.5 py-0.5 hover:brightness-125 transition"
                    >
                      {label.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(`¿Eliminar etiqueta "${label.name}"?`)
                        )
                          onDeleteLabel(label.id);
                      }}
                      className="pr-1.5 pl-0.5 py-0.5 opacity-0 group-hover:opacity-100 hover:text-red-400 transition text-[10px]"
                      title="Eliminar etiqueta"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          {/* ADJUNTOS */}
          <div className="mb-5 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-[11px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-2">
                📎 Adjuntos
                {attachments.length > 0 && (
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded">
                    {attachments.length}
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs text-amber-400 hover:text-amber-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                {uploading ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
                    </svg>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Subir archivo
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {uploadError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-400 mb-3">
                {uploadError}
              </div>
            )}

            {attachments.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-lg p-5 text-center cursor-pointer transition-colors"
              >
                <div className="text-2xl mb-1 opacity-40">📎</div>
                <p className="text-xs text-slate-500">
                  Arrastra o haz click para subir imágenes y archivos
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Máximo 10 MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="group bg-slate-950/60 border border-slate-800 rounded-lg overflow-hidden hover:border-slate-700 transition-colors"
                  >
                    {isImage(att.type) ? (
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-full max-h-40 object-cover"
                          loading="lazy"
                        />
                      </a>
                    ) : null}

                    <div className="flex items-center gap-2 p-2.5">
                      {!isImage(att.type) && (
                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0">
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
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-slate-200 truncate hover:text-amber-400 transition-colors"
                          title={att.name}
                        >
                          {att.name}
                        </a>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{formatFileSize(att.size)}</span>
                          <span className="text-slate-700">·</span>
                          <span>{relativeTime(att.createdAt)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `¿Eliminar adjunto "${att.name}"?`
                            )
                          )
                            onDeleteAttachment(att.id);
                        }}
                        className="text-slate-600 hover:text-red-400 p-1.5 opacity-0 group-hover:opacity-100 transition text-xs shrink-0"
                        title="Eliminar adjunto"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SUBTAREAS */}
          <div className="pt-4 border-t border-slate-800 mb-5">
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Subtareas
              </label>
              {total > 0 && (
                <span className="text-[11px] font-mono text-slate-500">
                  {doneCount}/{total}
                </span>
              )}
            </div>

            {total > 0 && (
              <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${total > 0 ? (doneCount / total) * 100 : 0}%`,
                  }}
                />
              </div>
            )}

            <div className="space-y-1 mb-2.5">
              {subtasks.map((s) => (
                <div
                  key={s.id}
                  className="group flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1"
                >
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={() => onToggleSubtask(s.id)}
                    className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer shrink-0"
                  />

                  {editingSubtaskId === s.id ? (
                    <input
                      value={subtaskDraft}
                      onChange={(e) => setSubtaskDraft(e.target.value)}
                      onBlur={commitEditSubtask}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEditSubtask();
                        if (e.key === 'Escape') {
                          setEditingSubtaskId(null);
                          setSubtaskDraft('');
                        }
                      }}
                      autoFocus
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-100 focus:outline-none"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => startEditSubtask(s.id, s.title)}
                      className={`flex-1 text-xs cursor-pointer ${
                        s.done
                          ? 'line-through text-slate-600'
                          : 'text-slate-300'
                      }`}
                      title="Doble click para editar"
                    >
                      {s.title}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteSubtask(s.id)}
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs shrink-0"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-1.5">
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Nueva subtarea..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-slate-700 placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="bg-slate-800 hover:bg-slate-700 rounded-md px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors"
              >
                Añadir
              </button>
            </div>
          </div>

          {/* COMENTARIOS */}
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-400"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-100">
                  Comentarios
                </span>
                {comments.length > 0 && (
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full">
                    {comments.length}
                  </span>
                )}
              </div>
            </div>

            <div className="p-3">
              {comments.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2 opacity-40">💬</div>
                  <p className="text-xs text-slate-500">
                    Aún no hay comentarios. Sé el primero en escribir uno.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mb-3">
                  {[...comments]
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((comment) => (
                      <div
                        key={comment.id}
                        className="group bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 transition-colors"
                      >
                        <div className="flex justify-between items-center gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
                            <span className="text-[10px] text-slate-500 font-medium">
                              {relativeTime(comment.createdAt)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('¿Eliminar comentario?'))
                                onDeleteComment(comment.id);
                            }}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs shrink-0"
                            title="Eliminar comentario"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="text-xs text-slate-300 whitespace-pre-wrap break-words leading-relaxed pl-3">
                          {renderCommentText(comment.text)}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-lg focus-within:border-amber-500/50 transition-colors">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  rows={2}
                  placeholder="Escribe un comentario... (Enter para enviar)"
                  className="w-full bg-transparent border-0 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none resize-none"
                />
                <div className="flex justify-between items-center px-2 py-1.5 border-t border-slate-800">
                  <span className="text-[10px] text-slate-600">
                    Shift+Enter para salto de línea
                  </span>
                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-medium rounded px-3 py-1 text-xs transition-colors"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 border-t border-slate-800 flex flex-wrap gap-2 justify-between items-center shrink-0 bg-slate-900">
          <button
            onClick={() => {
              if (
                window.confirm(
                  '¿Archivar esta tarjeta? Podrás recuperarla desde Archivados.'
                )
              ) {
                onArchive();
                onClose();
              }
            }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Archivar tarjeta
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}