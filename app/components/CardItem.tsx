'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card, Label } from '@/types';
import { RARITY_DOT, RARITY_LABEL } from '@/lib/gamification';
import { hexWithAlpha } from '@/lib/labels';

interface Member {
  user_id: string;
  email: string;
  role: string;
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

function getAvatarColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
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

interface Props {
  card: Card;
  labels: Label[];
  members?: Member[];
  onArchive: (id: string) => void;
  onOpen: (id: string) => void;
  isOverlay?: boolean;
}

export function CardItem({
  card,
  labels,
  members = [],
  onArchive,
  onOpen,
  isOverlay,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    opacity: isDragging ? 0.35 : 1,
    touchAction: 'manipulation' as const,
  };

  const isOverdue =
    card.dueDate && !card.completedAt && Date.now() > card.dueDate;

  const dueLabel = card.dueDate
    ? new Date(card.dueDate).toLocaleDateString('es', {
        day: '2-digit',
        month: 'short',
      })
    : null;

  const subtasks = card.subtasks ?? [];
  const doneSubtasks = subtasks.filter((s) => s.done).length;
  const hasSubtasks = subtasks.length > 0;
  const commentCount = card.comments?.length ?? 0;
  const attachmentCount = card.attachments?.length ?? 0;

  const cardLabels = (card.labelIds ?? [])
    .map((id) => labels.find((l) => l.id === id))
    .filter((l): l is Label => l !== undefined);

  const assignees = (card.assigneeIds ?? [])
    .map((id) => members.find((m) => m.user_id === id))
    .filter((m): m is Member => !!m);

  const coverStyle = getCoverStyle(card.cover);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen(card.id);
      }}
      className={`
        group relative bg-slate-900 border border-slate-800 rounded-lg overflow-hidden
        drag-cursor select-none touch-manipulation
        ${isOverlay
          ? 'shadow-2xl border-slate-600 ring-2 ring-amber-500/30 scale-[1.03] rotate-[0.5deg]'
          : 'hover-lift hover:border-slate-700'
        }
        ${isDragging ? 'cursor-grabbing' : ''}
      `}
    >
      {/* Portada */}
      {coverStyle && <div className="h-16 w-full" style={coverStyle} />}

      <div className="p-2.5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${RARITY_DOT[card.priority]} group-hover:animate-breathe`}
              title={`Prioridad ${RARITY_LABEL[card.priority]}`}
            />
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              {RARITY_LABEL[card.priority]}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onOpen(card.id);
              }}
              className="interactive text-slate-500 hover:text-slate-200 p-1 rounded-md md:opacity-0 md:group-hover:opacity-100"
              title="Editar"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onArchive(card.id);
              }}
              className="interactive text-slate-500 hover:text-slate-200 p-1 rounded-md md:opacity-0 md:group-hover:opacity-100"
              title="Archivar"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="5" rx="1" />
                <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                <path d="M10 12h4" />
              </svg>
            </button>
          </div>
        </div>

        {cardLabels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {cardLabels.map((label) => (
              <span
                key={label.id}
                className="text-[10px] px-1.5 py-0.5 rounded font-medium border transition-transform hover:scale-105"
                style={{
                  backgroundColor: hexWithAlpha(label.color, 0.12),
                  color: label.color,
                  borderColor: hexWithAlpha(label.color, 0.3),
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        <p className="text-sm text-slate-100 leading-snug break-words">
          {card.title}
        </p>

        {card.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {card.description}
          </p>
        )}

        {(hasSubtasks ||
          dueLabel ||
          commentCount > 0 ||
          attachmentCount > 0 ||
          assignees.length > 0) && (
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/70">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
              {hasSubtasks && (
                <div className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <span className="font-mono">
                    {doneSubtasks}/{subtasks.length}
                  </span>
                </div>
              )}

              {commentCount > 0 && (
                <div
                  className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 text-amber-400 px-1.5 py-0.5 rounded-md font-semibold"
                  title={`${commentCount} comentario${commentCount === 1 ? '' : 's'}`}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="font-mono text-[10px] leading-none">
                    {commentCount}
                  </span>
                </div>
              )}

              {attachmentCount > 0 && (
                <div
                  className="flex items-center gap-1 bg-blue-500/15 border border-blue-500/40 text-blue-400 px-1.5 py-0.5 rounded-md font-semibold"
                  title={`${attachmentCount} adjunto${attachmentCount === 1 ? '' : 's'}`}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <span className="font-mono text-[10px] leading-none">
                    {attachmentCount}
                  </span>
                </div>
              )}

              {assignees.length > 0 && (
                <div
                  className="flex -space-x-1"
                  title={`${assignees.length} asignado${assignees.length === 1 ? '' : 's'}`}
                >
                  {assignees.slice(0, 3).map((m) => (
                    <div
                      key={m.user_id}
                      className={`w-4 h-4 rounded-full ${getAvatarColor(m.email)} flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-slate-900 transition-transform hover:scale-110 hover:z-10`}
                      title={m.email}
                    >
                      {m.email.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {assignees.length > 3 && (
                    <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-300 ring-2 ring-slate-900">
                      +{assignees.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>

            {dueLabel && (
              <span
                className={`text-[10px] flex items-center gap-1 font-medium shrink-0 ${
                  isOverdue ? 'text-red-400' : 'text-slate-500'
                }`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {dueLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}