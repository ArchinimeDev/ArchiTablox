'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import type { Card, Label, Priority, Attachment } from '@/types';
import { RARITY_LABEL } from '@/lib/gamification';
import { LABEL_COLORS, hexWithAlpha } from '@/lib/labels';
import { toDateInput, fromDateInput } from '@/lib/dateUtils';
import { createClient } from '@/utils/supabase/client';

interface Member {
  user_id: string;
  email: string;
  role: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

const AVATAR_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-pink-500',
];

const COVER_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
];

function getAvatarColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface Props {
  card: Card;
  boardId: string;
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
  onAddAttachment: (attachment: Omit<Attachment, 'id' | 'createdAt'>) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onToggleAssignee: (userId: string) => void;
}

function renderCommentText(text: string) {
  const urlSplit = /(https?:\/\/[^\s]+)/g;
  const urlTest = /^https?:\/\/[^\s]+$/;
  const parts = text.split(urlSplit);

  return parts.flatMap((part, i) => {
    if (urlTest.test(part)) {
      return (
        <a
          key={`url-${i}`}
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

    const mentionSplit = /(@[A-Za-z0-9._-]+)/g;
    const mentionTest = /^@[A-Za-z0-9._-]+$/;
    const subParts = part.split(mentionSplit);

    return subParts.map((sub, j) => {
      if (mentionTest.test(sub)) {
        return (
          <span
            key={`mention-${i}-${j}`}
            className="inline-flex items-center align-baseline bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded px-1 py-0.5 font-medium mx-0.5"
          >
            {sub}
          </span>
        );
      }
      return <span key={`text-${i}-${j}`}>{sub}</span>;
    });
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

function getCoverStyle(cover: Card['cover']): React.CSSProperties | null {
  if (!cover) return null;
  if (cover.type === 'image') {
    return {
      backgroundImage: `url(${cover.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  if (cover.type === 'gradient') {
    return { background: cover.value };
  }
  return { backgroundColor: cover.value };
}

export function CardModal({
  card,
  boardId,
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
  onToggleAssignee,
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
  const [members, setMembers] = useState<Member[]>([]);
  // ★ NUEVO: distinguir "cargando" de "vacío"
  const [membersLoaded, setMembersLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionMenu, setMentionMenu] = useState<{
    open: boolean;
    query: string;
    startIdx: number;
    selectedIdx: number;
  }>({ open: false, query: '', startIdx: -1, selectedIdx: 0 });

  const subtasks = card.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const total = subtasks.length;
  const cardLabelIds = card.labelIds ?? [];
  const comments = card.comments ?? [];
  const attachments = card.attachments ?? [];
  const assigneeIds = card.assigneeIds ?? [];

  // ★ FIX: setear membersLoaded en todos los paths
  useEffect(() => {
    if (!boardId) {
      setMembersLoaded(true);
      return;
    }

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        boardId
      );
    if (!isUuid) {
      setMembersLoaded(true);
      return;
    }

    const supabase = createClient();
    supabase
      .rpc('get_board_members', { p_board_id: boardId })
      .then(({ data, error }) => {
        if (error) {
          console.warn('[CardModal]', error.message);
        } else if (data) {
          setMembers(data as Member[]);
        }
        setMembersLoaded(true);
      });
  }, [boardId]);

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

  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey))
        handleSaveRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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

  const setCover = (type: 'color' | 'gradient' | 'image', value: string) => {
    onSave({ cover: { type, value } });
    setShowCoverPicker(false);
  };

  const removeCover = () => {
    onSave({ cover: undefined });
    setShowCoverPicker(false);
  };

  const applyImageUrl = () => {
    const url = coverImageUrl.trim();
    if (!url) return;
    setCover('image', url);
    setCoverImageUrl('');
  };

  const filteredMembers = useMemo(() => {
    if (!mentionMenu.open) return [];
    const q = mentionMenu.query.toLowerCase();
    return members
      .filter((m) => {
        const local = m.email.split('@')[0].toLowerCase();
        const name = (m.full_name ?? '').toLowerCase().replace(/\s/g, '');
        return (
          m.email.toLowerCase().includes(q) ||
          local.includes(q) ||
          name.includes(q.replace(/\s/g, ''))
        );
      })
      .slice(0, 6);
  }, [mentionMenu.open, mentionMenu.query, members]);

  const detectMention = (text: string, cursorPos: number) => {
    let i = cursorPos - 1;
    while (i >= 0) {
      const ch = text[i];
      if (ch === '@') {
        if (i === 0 || /\s/.test(text[i - 1])) {
          const query = text.slice(i + 1, cursorPos);
          if (!/\s/.test(query) && query.length <= 30) {
            return { startIdx: i, query };
          }
        }
        return null;
      }
      if (/\s/.test(ch)) return null;
      if (i < cursorPos - 30) return null;
      i--;
    }
    return null;
  };

  const handleCommentChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const text = e.target.value;
    setNewComment(text);
    const cursor = e.target.selectionStart ?? 0;
    const mention = detectMention(text, cursor);
    if (mention) {
      setMentionMenu({
        open: true,
        query: mention.query,
        startIdx: mention.startIdx,
        selectedIdx: 0,
      });
    } else if (mentionMenu.open) {
      setMentionMenu((m) => ({ ...m, open: false }));
    }
  };

  const insertMention = (member: Member) => {
    const local = member.email.split('@')[0];
    const before = newComment.slice(0, mentionMenu.startIdx);
    const after = newComment.slice(
      mentionMenu.startIdx + mentionMenu.query.length + 1
    );
    const inserted = `@${local} `;
    const next = before + inserted + after;
    setNewComment(next);
    setMentionMenu({ open: false, query: '', startIdx: -1, selectedIdx: 0 });
    setTimeout(() => {
      const pos = (before + inserted).length;
      commentTextareaRef.current?.focus();
      commentTextareaRef.current?.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleCommentKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (mentionMenu.open && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionMenu((m) => ({
          ...m,
          selectedIdx: Math.min(m.selectedIdx + 1, filteredMembers.length - 1),
        }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionMenu((m) => ({
          ...m,
          selectedIdx: Math.max(m.selectedIdx - 1, 0),
        }));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const m = filteredMembers[mentionMenu.selectedIdx];
        if (m) insertMention(m);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionMenu((m) => ({ ...m, open: false }));
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
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

  const coverStyle = getCoverStyle(card.cover);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 sm:border border-slate-800 sm:rounded-xl rounded-none w-full max-w-lg shadow-2xl flex flex-col h-screen sm:h-auto sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {coverStyle && (
          <div
            className="h-24 sm:h-28 w-full rounded-t-none sm:rounded-t-xl relative shrink-0"
            style={coverStyle}
          >
            <button
              type="button"
              onClick={removeCover}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
              title="Quitar portada"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

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

          {!coverStyle && (
            <button
              type="button"
              onClick={() => setShowCoverPicker((s) => !s)}
              className="text-xs text-slate-400 hover:text-slate-200 mb-3 flex items-center gap-1.5 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              Añadir portada
            </button>
          )}

          {showCoverPicker && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-4">
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
                  Colores
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {COVER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCover('color', c)}
                      className="w-7 h-7 rounded-md hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
                  Gradientes
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {COVER_GRADIENTS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setCover('gradient', g)}
                      className="w-10 h-7 rounded-md hover:scale-110 transition-transform"
                      style={{ background: g }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
                  Imagen (URL)
                </div>
                <div className="flex gap-1.5">
                  <input
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyImageUrl();
                      }
                    }}
                    placeholder="https://..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-slate-700 placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={applyImageUrl}
                    disabled={!coverImageUrl.trim()}
                    className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-gray-950 font-medium rounded px-3 py-1 text-xs transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-1">
                  Pega la URL de una imagen (jpg, png, webp...)
                </p>
              </div>
            </div>
          )}

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
                      borderColor: hexWithAlpha(
                        label.color,
                        active ? 0.5 : 0.2
                      ),
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

          <div className="mb-5 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-[11px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-2">
                👥 Asignados
                {assigneeIds.length > 0 && (
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded">
                    {assigneeIds.length}
                  </span>
                )}
              </label>
            </div>

            {/* ★ FIX: distinguir cargando de vacío */}
            {!membersLoaded ? (
              <p className="text-xs text-slate-600 italic">
                Cargando miembros...
              </p>
            ) : members.length === 0 ? (
              <p className="text-xs text-slate-600 italic">
                Este tablero no tiene miembros. Compártelo para asignar tareas.
              </p>
            ) : (
              <div className="space-y-1.5">
                {members.map((m) => {
                  const active = assigneeIds.includes(m.user_id);
                  const displayName = m.full_name || m.email.split('@')[0];
                  return (
                    <button
                      key={m.user_id}
                      type="button"
                      onClick={() => onToggleAssignee(m.user_id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all ${
                        active
                          ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/15'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                        {m.avatar_url ? (
                          <img
                            src={m.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div
                            className={`w-full h-full ${getAvatarColor(
                              m.email
                            )} flex items-center justify-center text-[11px] font-bold text-white`}
                          >
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div
                          className={`text-xs truncate ${
                            active ? 'text-slate-100' : 'text-slate-300'
                          }`}
                        >
                          {displayName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {m.email}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          active
                            ? 'bg-amber-500 border-amber-500'
                            : 'border-slate-700'
                        }`}
                      >
                        {active && (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-950"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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
                            window.confirm(`¿Eliminar adjunto "${att.name}"?`)
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

              <div className="relative bg-slate-900 border border-slate-800 rounded-lg focus-within:border-amber-500/50 transition-colors">
                {mentionMenu.open && filteredMembers.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50">
                    <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-medium border-b border-slate-800">
                      Mencionar a
                    </div>
                    {filteredMembers.map((m, idx) => {
                      const isSelected = idx === mentionMenu.selectedIdx;
                      const local = m.email.split('@')[0];
                      const displayName = m.full_name || local;
                      return (
                        <button
                          key={m.user_id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            insertMention(m);
                          }}
                          onMouseEnter={() =>
                            setMentionMenu((prev) => ({
                              ...prev,
                              selectedIdx: idx,
                            }))
                          }
                          className={`w-full text-left px-2.5 py-2 flex items-center gap-2 transition-colors ${
                            isSelected
                              ? 'bg-slate-800'
                              : 'hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                            {m.avatar_url ? (
                              <img
                                src={m.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-slate-100 truncate flex-1">
                            {displayName}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate">
                            {m.email}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <textarea
                  ref={commentTextareaRef}
                  value={newComment}
                  onChange={handleCommentChange}
                  onKeyDown={handleCommentKeyDown}
                  rows={2}
                  placeholder="Escribe un comentario... (@ para mencionar)"
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
                    className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-gray-950 font-medium rounded px-3 py-1 text-xs transition-colors"
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
              className="px-4 py-1.5 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 font-medium transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}