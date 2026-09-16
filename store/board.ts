// store/board.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ActivityEvent,
  ActivityType,
  Attachment,
  Board,
  Card,
  CardTemplate,
  Column,
  Comment,
  NotificationSettings,
  Priority,
  Subtask,
  Label,
} from '@/types';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/lib/notifications';

const RARITY_DAMAGE: Record<Priority, number> = {
  low: 1,
  medium: 3,
  high: 5,
  urgent: 10,
};

const LABEL_COLOR_POOL = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

const MAX_ACTIVITY = 200;

/**
 * Genera un UUID v4 válido (compatible con Supabase).
 */
const uid = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (s: unknown): s is string =>
  typeof s === 'string' && UUID_REGEX.test(s);

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice();
  newArray.splice(
    to < 0 ? newArray.length + to : to,
    0,
    newArray.splice(from, 1)[0]
  );
  return newArray;
}

const DEFAULT_TEMPLATES: CardTemplate[] = [
  {
    id: 'tpl_bug',
    name: 'Bug',
    icon: '🐛',
    title: 'Bug: ',
    description:
      '## Descripción\n\n## Pasos para reproducir\n\n1. \n\n## Resultado esperado\n\n## Resultado actual',
    priority: 'high',
    labelNames: ['bug'],
    subtasks: ['Reproducir', 'Diagnosticar', 'Corregir', 'Verificar'],
  },
  {
    id: 'tpl_feature',
    name: 'Feature',
    icon: '✨',
    title: 'Feature: ',
    description: '## Descripción\n\n## Criterios de aceptación\n\n- ',
    priority: 'medium',
    labelNames: ['feature'],
    subtasks: ['Diseño', 'Implementación', 'Testing'],
  },
  {
    id: 'tpl_meeting',
    name: 'Reunión',
    icon: '📅',
    title: 'Reunión: ',
    description: '## Agenda\n\n1. \n\n## Notas\n\n## Acciones',
    priority: 'medium',
    labelNames: ['reunión'],
    subtasks: [],
  },
  {
    id: 'tpl_note',
    name: 'Nota',
    icon: '📝',
    title: '',
    priority: 'low',
    labelNames: [],
    subtasks: [],
  },
];

function createInitialBoard(name: string): Board {
  return {
    id: uid(),
    name,
    columns: [
      { id: uid(), title: 'Por hacer', cardIds: [] },
      { id: uid(), title: 'En progreso', cardIds: [], wipLimit: 3 },
      { id: uid(), title: 'Hecho', cardIds: [], isDone: true },
    ],
    cards: {},
    labels: [],
    notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
    templates: DEFAULT_TEMPLATES.map((t) => ({ ...t })),
    activity: [],
  };
}

function regenerateBoardIds(board: Board): Board {
  const columnIdMap: Record<string, string> = {};

  const newColumns: Column[] = board.columns.map((c) => {
    const newId = uid();
    columnIdMap[c.id] = newId;
    const newCol: Column = { ...c, id: newId, cardIds: [] };
    return newCol;
  });

  const newCards: Record<string, Card> = {};
  for (const card of Object.values(board.cards)) {
    const newCardId = uid();
    const newColumnId = columnIdMap[card.columnId] ?? card.columnId;
    newCards[newCardId] = {
      ...card,
      id: newCardId,
      columnId: newColumnId,
      subtasks: card.subtasks?.map((s) => ({ ...s, id: uid() })) ?? [],
      comments: card.comments?.map((c) => ({ ...c, id: uid() })) ?? [],
      attachments:
        card.attachments?.map((a) => ({ ...a, id: uid() })) ?? [],
      assigneeIds: card.assigneeIds ?? [],
    };
    if (!card.archived) {
      const col = newColumns.find((c) => c.id === newColumnId);
      if (col) col.cardIds.push(newCardId);
    }
  }

  const newLabelMap: Record<string, string> = {};
  const newLabels = board.labels.map((l) => {
    const newId = uid();
    newLabelMap[l.id] = newId;
    return { ...l, id: newId };
  });

  for (const card of Object.values(newCards)) {
    if (card.labelIds) {
      card.labelIds = card.labelIds
        .map((id) => newLabelMap[id])
        .filter((id): id is string => !!id);
    }
  }

  return {
    id: uid(),
    name: board.name,
    columns: newColumns,
    cards: newCards,
    labels: newLabels,
    notificationSettings: board.notificationSettings ?? {
      ...DEFAULT_NOTIFICATION_SETTINGS,
    },
    templates:
      board.templates?.map((t) => ({ ...t, id: uid() })) ??
      DEFAULT_TEMPLATES.map((t) => ({ ...t })),
    activity: [],
  };
}

const firstBoard = createInitialBoard('Mi tablero');

function pushActivity(
  board: Board,
  type: ActivityType,
  data: Partial<Omit<ActivityEvent, 'id' | 'type' | 'timestamp'>>
): ActivityEvent[] {
  const event: ActivityEvent = {
    id: uid(),
    type,
    cardTitle: data.cardTitle ?? '',
    cardId: data.cardId,
    fromColumn: data.fromColumn,
    toColumn: data.toColumn,
    extra: data.extra,
    timestamp: Date.now(),
  };
  const next = [event, ...(board.activity ?? [])];
  return next.slice(0, MAX_ACTIVITY);
}

interface Store {
  boards: Board[];
  activeBoardId: string;

  setBoards: (boards: Board[], activeBoardId: string) => void;

  addCard: (columnId: string, title: string, priority: Priority) => void;
  updateCard: (cardId: string, patch: Partial<Card>) => void;
  deleteCard: (cardId: string) => void;
  archiveCard: (cardId: string) => void;
  restoreCard: (cardId: string) => void;
  emptyArchive: () => void;
  moveCard: (cardId: string, toColumnId: string, toIndex?: number) => boolean;

  addSubtask: (cardId: string, title: string) => void;
  updateSubtask: (cardId: string, subtaskId: string, title: string) => void;
  toggleSubtask: (cardId: string, subtaskId: string) => void;
  deleteSubtask: (cardId: string, subtaskId: string) => void;

  addComment: (cardId: string, text: string) => void;
  deleteComment: (cardId: string, commentId: string) => void;

  addAttachment: (
    cardId: string,
    attachment: Omit<Attachment, 'id' | 'createdAt'>
  ) => void;
  deleteAttachment: (cardId: string, attachmentId: string) => void;

  toggleAssignee: (cardId: string, userId: string) => void;

  addLabel: (name: string, color: string) => void;
  addLabelAndAssign: (cardId: string, name: string, color: string) => void;
  updateLabel: (labelId: string, patch: Partial<Label>) => void;
  deleteLabel: (labelId: string) => void;
  toggleCardLabel: (cardId: string, labelId: string) => void;

  addColumn: (title: string) => void;
  updateColumn: (columnId: string, patch: Partial<Column>) => void;
  deleteColumn: (columnId: string) => void;
  moveColumn: (columnId: string, toIndex: number) => void;

  createBoard: (name: string) => void;
  renameBoard: (boardId: string, name: string) => void;
  duplicateBoard: (boardId: string) => void;
  deleteBoard: (boardId: string) => void;
  switchBoard: (boardId: string) => void;

  updateNotificationSettings: (patch: Partial<NotificationSettings>) => void;

  addTemplate: (data: Omit<CardTemplate, 'id'>) => void;
  updateTemplate: (id: string, patch: Partial<CardTemplate>) => void;
  deleteTemplate: (id: string) => void;
  createCardFromTemplate: (columnId: string, templateId: string) => void;

  clearActivity: () => void;

  importData: (data: { boards: Board[] }, mode: 'replace' | 'merge') => void;

  resetActiveBoard: () => void;
}

function withActiveBoard(
  state: Store,
  fn: (board: Board) => Board
): Partial<Store> {
  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId);
  if (!activeBoard) return {};
  return {
    boards: state.boards.map((b) => (b.id === activeBoard.id ? fn(b) : b)),
  };
}

export const useBoard = create<Store>()(
  persist(
    (set) => ({
      boards: [firstBoard],
      activeBoardId: firstBoard.id,

      setBoards: (boards, activeBoardId) => set({ boards, activeBoardId }),

      addCard: (columnId, title, priority) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const id = uid();
            const card: Card = {
              id,
              title,
              priority,
              damage: RARITY_DAMAGE[priority],
              columnId,
              createdAt: Date.now(),
              subtasks: [],
              labelIds: [],
              comments: [],
              attachments: [],
              assigneeIds: [],
              archived: false,
            };
            const column = board.columns.find((c) => c.id === columnId);
            return {
              ...board,
              cards: { ...board.cards, [id]: card },
              columns: board.columns.map((c) =>
                c.id === columnId ? { ...c, cardIds: [...c.cardIds, id] } : c
              ),
              activity: pushActivity(board, 'card_created', {
                cardId: id,
                cardTitle: title,
                toColumn: column?.title,
              }),
            };
          })
        ),

      updateCard: (cardId, patch) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card) return board;

            const renamed =
              patch.title !== undefined && patch.title !== card.title;

            return {
              ...board,
              cards: { ...board.cards, [cardId]: { ...card, ...patch } },
              activity: renamed
                ? pushActivity(board, 'card_renamed', {
                    cardId,
                    cardTitle: patch.title!,
                    extra: card.title,
                  })
                : board.activity,
            };
          })
        ),

      deleteCard: (cardId) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card) return board;
            const newCards = { ...board.cards };
            delete newCards[cardId];
            return {
              ...board,
              cards: newCards,
              columns: board.columns.map((c) =>
                c.id === card.columnId
                  ? {
                      ...c,
                      cardIds: c.cardIds.filter((id) => id !== cardId),
                    }
                  : c
              ),
              activity: pushActivity(board, 'card_deleted', {
                cardId,
                cardTitle: card.title,
              }),
            };
          })
        ),

      archiveCard: (cardId) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card || card.archived) return board;
            return {
              ...board,
              cards: {
                ...board.cards,
                [cardId]: {
                  ...card,
                  archived: true,
                  archivedAt: Date.now(),
                },
              },
              columns: board.columns.map((c) =>
                c.id === card.columnId
                  ? {
                      ...c,
                      cardIds: c.cardIds.filter((id) => id !== cardId),
                    }
                  : c
              ),
              activity: pushActivity(board, 'card_archived', {
                cardId,
                cardTitle: card.title,
              }),
            };
          })
        ),

      restoreCard: (cardId) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card || !card.archived) return board;

            let targetColId = card.columnId;
            let targetCol = board.columns.find((c) => c.id === targetColId);
            if (!targetCol) {
              targetCol =
                board.columns.find((c) => !c.isDone) ?? board.columns[0];
              if (!targetCol) return board;
              targetColId = targetCol.id;
            }

            return {
              ...board,
              cards: {
                ...board.cards,
                [cardId]: {
                  ...card,
                  archived: false,
                  archivedAt: undefined,
                  columnId: targetColId,
                },
              },
              columns: board.columns.map((c) =>
                c.id === targetColId
                  ? { ...c, cardIds: [...c.cardIds, cardId] }
                  : c
              ),
              activity: pushActivity(board, 'card_restored', {
                cardId,
                cardTitle: card.title,
                toColumn: targetCol.title,
              }),
            };
          })
        ),

      emptyArchive: () =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const newCards: Record<string, Card> = {};
            for (const [id, card] of Object.entries(board.cards)) {
              if (!card.archived) newCards[id] = card;
            }
            return { ...board, cards: newCards };
          })
        ),

      moveCard: (cardId, toColumnId, toIndex) => {
        let blocked = false;
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card || card.archived) return board;

            const sourceCol = board.columns.find(
              (c) => c.id === card.columnId
            );
            const targetCol = board.columns.find((c) => c.id === toColumnId);
            if (!sourceCol || !targetCol) return board;

            const isSame = sourceCol.id === targetCol.id;
            if (
              isSame &&
              (toIndex === undefined ||
                toIndex === sourceCol.cardIds.indexOf(cardId))
            ) {
              return board;
            }

            if (
              !isSame &&
              targetCol.wipLimit &&
              targetCol.cardIds.length >= targetCol.wipLimit
            ) {
              blocked = true;
              return board;
            }

            let newSourceIds: string[];
            let newTargetIds: string[];

            if (isSame) {
              const fromIdx = sourceCol.cardIds.indexOf(cardId);
              if (toIndex === undefined || toIndex === fromIdx) return board;
              newTargetIds = arrayMove(sourceCol.cardIds, fromIdx, toIndex);
              newSourceIds = newTargetIds;
            } else {
              newSourceIds = sourceCol.cardIds.filter((id) => id !== cardId);
              newTargetIds = [...targetCol.cardIds];
              const insertAt =
                toIndex !== undefined
                  ? Math.min(Math.max(toIndex, 0), newTargetIds.length)
                  : newTargetIds.length;
              newTargetIds.splice(insertAt, 0, cardId);
            }

            const isCompleting = !!targetCol.isDone && !sourceCol.isDone;
            const isUncompleting = !targetCol.isDone && !!sourceCol.isDone;

            const updatedCard: Card = {
              ...card,
              columnId: toColumnId,
              completedAt: isCompleting
                ? Date.now()
                : isUncompleting
                ? undefined
                : card.completedAt,
            };

            const newColumns = board.columns.map((c) => {
              if (isSame && c.id === sourceCol.id)
                return { ...c, cardIds: newTargetIds };
              if (c.id === sourceCol.id) return { ...c, cardIds: newSourceIds };
              if (c.id === targetCol.id) return { ...c, cardIds: newTargetIds };
              return c;
            });

            let activity = board.activity ?? [];

            if (!isSame) {
              if (isCompleting) {
                activity = pushActivity(
                  { ...board, activity },
                  'card_completed',
                  {
                    cardId,
                    cardTitle: card.title,
                    toColumn: targetCol.title,
                  }
                );
              } else if (isUncompleting) {
                activity = pushActivity(
                  { ...board, activity },
                  'card_uncompleted',
                  {
                    cardId,
                    cardTitle: card.title,
                    fromColumn: sourceCol.title,
                    toColumn: targetCol.title,
                  }
                );
              } else {
                activity = pushActivity({ ...board, activity }, 'card_moved', {
                  cardId,
                  cardTitle: card.title,
                  fromColumn: sourceCol.title,
                  toColumn: targetCol.title,
                });
              }
            }

            return {
              ...board,
              cards: { ...board.cards, [cardId]: updatedCard },
              columns: newColumns,
              activity,
            };
          })
        );
        return !blocked;
      },

      addSubtask: (cardId, title) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card) return board;
            const newSubtask: Subtask = { id: uid(), title, done: false };
            return {
              ...board,
              cards: {
                ...board.cards,
                [cardId]: {
                  ...card,
                  subtasks: [...(card.subtasks ?? []), newSubtask],
                },
              },
            };
          })
        ),

      updateSubtask: (cardId, subtaskId, title) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card || !card.subtasks) return board;
            return {
              ...board,
              cards: {
                ...board.cards,
                [cardId]: {
                  ...card,
                  subtasks: card.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, title } : s
                  ),
                },
              },
            };
          })
        ),

      toggleSubtask: (cardId, subtaskId) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card || !card.subtasks) return board;
            return {
              ...board,
              cards: {
                ...board.cards,
                [cardId]: {
                  ...card,
                  subtasks: card.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, done: !s.done } : s
                  ),
                },
              },
            };
          })
        ),

      deleteSubtask: (cardId, subtaskId) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card || !card.subtasks) return board;
            return {
              ...board,
              cards: {
                ...board.cards,
                [cardId]: {
                  ...card,
                  subtasks: card.subtasks.filter((s) => s.id !== subtaskId),
                },
              },
            };
          })
        ),

      addComment: (cardId, text) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card || !text.trim()) return board;
            const newComment: Comment = {
              id: uid(),
              text: text.trim(),
              createdAt: Date.now(),
            };
            return {
              ...board,
              cards: {
                ...board.cards,
                [cardId]: {
                  ...card,
                  comments: [...(card.comments ?? []), newComment],
                },
              },
              activity: pushActivity(board, 'comment_added', {
                cardId,
                cardTitle: card.title,
                extra: text.trim().slice(0, 80),
              }),
            };
          })
        ),

      deleteComment: (cardId, commentId) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card || !card.comments) return board;
            return {
              ...board,
              cards: {
                ...board.cards,
                [cardId]: {
                  ...card,
                  comments: card.comments.filter((c) => c.id !== commentId),
                },
              },
            };
          })
        ),

      addAttachment: (cardId, attachment) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card) return board;
            const newAttachment: Attachment = {
              id: uid(),
              createdAt: Date.now(),
              ...attachment,
            };
            return {
              ...board,
              cards: {
                ...board.cards,
                [cardId]: {
                  ...card,
                  attachments: [...(card.attachments ?? []), newAttachment],
                },
              },
              activity: pushActivity(board, 'attachment_added', {
                cardId,
                cardTitle: card.title,
                extra: attachment.name,
              }),
            };
          })
        ),

      deleteAttachment: (cardId, attachmentId) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card || !card.attachments) return board;
            return {
              ...board,
              cards: {
                ...board.cards,
                [cardId]: {
                  ...card,
                  attachments: card.attachments.filter(
                    (a) => a.id !== attachmentId
                  ),
                },
              },
            };
          })
        ),

      toggleAssignee: (cardId, userId) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card) return board;
            const current = card.assigneeIds ?? [];
            const has = current.includes(userId);
            const assigneeIds = has
              ? current.filter((id) => id !== userId)
              : [...current, userId];

            return {
              ...board,
              cards: {
                ...board.cards,
                [cardId]: { ...card, assigneeIds },
              },
              activity: has
                ? pushActivity(board, 'assignee_removed', {
                    cardId,
                    cardTitle: card.title,
                  })
                : pushActivity(board, 'assignee_added', {
                    cardId,
                    cardTitle: card.title,
                  }),
            };
          })
        ),

      addLabel: (name, color) =>
        set((state) =>
          withActiveBoard(state, (board) => ({
            ...board,
            labels: [...board.labels, { id: uid(), name, color }],
          }))
        ),

      addLabelAndAssign: (cardId, name, color) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card) return board;
            const labelId = uid();
            return {
              ...board,
              labels: [...board.labels, { id: labelId, name, color }],
              cards: {
                ...board.cards,
                [cardId]: {
                  ...card,
                  labelIds: [...(card.labelIds ?? []), labelId],
                },
              },
            };
          })
        ),

      updateLabel: (labelId, patch) =>
        set((state) =>
          withActiveBoard(state, (board) => ({
            ...board,
            labels: board.labels.map((l) =>
              l.id === labelId ? { ...l, ...patch } : l
            ),
          }))
        ),

      deleteLabel: (labelId) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const newCards: Record<string, Card> = {};
            for (const [id, card] of Object.entries(board.cards)) {
              if (card.labelIds?.includes(labelId)) {
                newCards[id] = {
                  ...card,
                  labelIds: card.labelIds.filter((l) => l !== labelId),
                };
              } else {
                newCards[id] = card;
              }
            }
            return {
              ...board,
              labels: board.labels.filter((l) => l.id !== labelId),
              cards: newCards,
            };
          })
        ),

      toggleCardLabel: (cardId, labelId) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const card = board.cards[cardId];
            if (!card) return board;
            const current = card.labelIds ?? [];
            const has = current.includes(labelId);
            const labelIds = has
              ? current.filter((l) => l !== labelId)
              : [...current, labelId];
            return {
              ...board,
              cards: { ...board.cards, [cardId]: { ...card, labelIds } },
            };
          })
        ),

      addColumn: (title) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const doneIndex = board.columns.findIndex((c) => c.isDone);
            const newCol: Column = { id: uid(), title, cardIds: [] };
            const newCols: Column[] = [...board.columns];
            if (doneIndex >= 0) newCols.splice(doneIndex, 0, newCol);
            else newCols.push(newCol);
            return { ...board, columns: newCols };
          })
        ),

      updateColumn: (columnId, patch) =>
        set((state) =>
          withActiveBoard(state, (board) => ({
            ...board,
            columns: board.columns.map((c) =>
              c.id === columnId ? { ...c, ...patch } : c
            ),
          }))
        ),

      deleteColumn: (columnId) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const col = board.columns.find((c) => c.id === columnId);
            if (!col || col.isDone) return board;

            const fallback = board.columns.find(
              (c) => c.id !== columnId && !c.isDone
            );
            const newCards = { ...board.cards };
            if (fallback) {
              for (const cardId of col.cardIds) {
                if (newCards[cardId]) {
                  newCards[cardId] = {
                    ...newCards[cardId],
                    columnId: fallback.id,
                  };
                }
              }
            }

            return {
              ...board,
              cards: newCards,
              columns: board.columns
                .filter((c) => c.id !== columnId)
                .map((c) =>
                  c.id === fallback?.id
                    ? { ...c, cardIds: [...c.cardIds, ...col.cardIds] }
                    : c
                ),
            };
          })
        ),

      moveColumn: (columnId, toIndex) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const fromIndex = board.columns.findIndex(
              (c) => c.id === columnId
            );
            if (fromIndex === -1 || fromIndex === toIndex) return board;
            const newCols: Column[] = [...board.columns];
            const [moved] = newCols.splice(fromIndex, 1);
            newCols.splice(toIndex, 0, moved);
            return { ...board, columns: newCols };
          })
        ),

      createBoard: (name) =>
        set((state) => {
          const newBoard = createInitialBoard(name);
          return {
            boards: [...state.boards, newBoard],
            activeBoardId: newBoard.id,
          };
        }),

      renameBoard: (boardId, name) =>
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId ? { ...b, name } : b
          ),
        })),

      duplicateBoard: (boardId) =>
        set((state) => {
          const source = state.boards.find((b) => b.id === boardId);
          if (!source) return state;
          const copy = regenerateBoardIds(source);
          copy.name = `${source.name} (copia)`;
          return {
            boards: [...state.boards, copy],
            activeBoardId: copy.id,
          };
        }),

      deleteBoard: (boardId) =>
        set((state) => {
          if (state.boards.length <= 1) return state;
          const remaining = state.boards.filter((b) => b.id !== boardId);
          const newActiveId =
            state.activeBoardId === boardId
              ? remaining[0].id
              : state.activeBoardId;
          return { boards: remaining, activeBoardId: newActiveId };
        }),

      switchBoard: (boardId) =>
        set((state) => {
          if (!state.boards.find((b) => b.id === boardId)) return state;
          return { activeBoardId: boardId };
        }),

      updateNotificationSettings: (patch) =>
        set((state) =>
          withActiveBoard(state, (board) => ({
            ...board,
            notificationSettings: {
              ...(board.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS),
              ...patch,
            },
          }))
        ),

      addTemplate: (data) =>
        set((state) =>
          withActiveBoard(state, (board) => ({
            ...board,
            templates: [...(board.templates ?? []), { ...data, id: uid() }],
          }))
        ),

      updateTemplate: (id, patch) =>
        set((state) =>
          withActiveBoard(state, (board) => ({
            ...board,
            templates: (board.templates ?? []).map((t) =>
              t.id === id ? { ...t, ...patch } : t
            ),
          }))
        ),

      deleteTemplate: (id) =>
        set((state) =>
          withActiveBoard(state, (board) => ({
            ...board,
            templates: (board.templates ?? []).filter((t) => t.id !== id),
          }))
        ),

      createCardFromTemplate: (columnId, templateId) =>
        set((state) =>
          withActiveBoard(state, (board) => {
            const template = (board.templates ?? []).find(
              (t) => t.id === templateId
            );
            if (!template) return board;

            const column = board.columns.find((c) => c.id === columnId);
            if (!column) return board;

            const newLabels = [...board.labels];
            const labelIds: string[] = [];

            for (const name of template.labelNames) {
              const existing = newLabels.find(
                (l) => l.name.toLowerCase() === name.toLowerCase()
              );
              if (existing) {
                labelIds.push(existing.id);
              } else {
                const color =
                  LABEL_COLOR_POOL[newLabels.length % LABEL_COLOR_POOL.length];
                const id = uid();
                newLabels.push({ id, name, color });
                labelIds.push(id);
              }
            }

            const cardId = uid();
            const card: Card = {
              id: cardId,
              title: template.title,
              description: template.description,
              priority: template.priority,
              damage: RARITY_DAMAGE[template.priority],
              columnId,
              createdAt: Date.now(),
              subtasks: template.subtasks.map((s) => ({
                id: uid(),
                title: s,
                done: false,
              })),
              labelIds,
              comments: [],
              attachments: [],
              assigneeIds: [],
              archived: false,
            };

            return {
              ...board,
              labels: newLabels,
              cards: { ...board.cards, [cardId]: card },
              columns: board.columns.map((c) =>
                c.id === columnId
                  ? { ...c, cardIds: [...c.cardIds, cardId] }
                  : c
              ),
              activity: pushActivity(board, 'template_applied', {
                cardId,
                cardTitle: template.title || template.name,
                toColumn: column.title,
                extra: `${template.icon} ${template.name}`,
              }),
            };
          })
        ),

      clearActivity: () =>
        set((state) =>
          withActiveBoard(state, (board) => ({
            ...board,
            activity: [],
          }))
        ),

      importData: (data, mode) =>
        set((state) => {
          if (!data.boards || data.boards.length === 0) return state;
          const newBoards = data.boards.map(regenerateBoardIds);
          if (mode === 'replace') {
            return { boards: newBoards, activeBoardId: newBoards[0].id };
          }
          return {
            boards: [...state.boards, ...newBoards],
            activeBoardId: newBoards[0].id,
          };
        }),

      resetActiveBoard: () =>
        set((state) =>
          withActiveBoard(state, (board) => ({
            ...board,
            columns: [
              { id: uid(), title: 'Por hacer', cardIds: [] },
              { id: uid(), title: 'En progreso', cardIds: [], wipLimit: 3 },
              { id: uid(), title: 'Hecho', cardIds: [], isDone: true },
            ],
            cards: {},
            labels: [],
            activity: [],
          }))
        ),
    }),
    {
      name: 'kanban-quest-storage',
      version: 22,
      migrate: (persisted: any, version) => {
        if (version < 10 && persisted?.columns) {
          const migratedBoard: Board = {
            id: uid(),
            name: 'Mi tablero',
            columns: persisted.columns,
            cards: persisted.cards ?? {},
            labels: persisted.labels ?? [],
            notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
            templates: DEFAULT_TEMPLATES.map((t) => ({ ...t })),
            activity: [],
          };
          return {
            boards: [migratedBoard],
            activeBoardId: migratedBoard.id,
          };
        }

        if (persisted?.boards && Array.isArray(persisted.boards)) {
          const hasInvalidIds = persisted.boards.some(
            (b: Board) => !isUuid(b.id)
          );

          if (hasInvalidIds) {
            const regenerated: Board[] = persisted.boards.map((b: Board) => {
              if (isUuid(b.id)) {
                return {
                  ...b,
                  notificationSettings:
                    b.notificationSettings ?? {
                      ...DEFAULT_NOTIFICATION_SETTINGS,
                    },
                  templates:
                    b.templates ?? DEFAULT_TEMPLATES.map((t) => ({ ...t })),
                  activity: b.activity ?? [],
                };
              }
              const regen = regenerateBoardIds(b);
              regen.name = b.name;
              return regen;
            });

            return {
              boards: regenerated,
              activeBoardId:
                regenerated[0]?.id ?? persisted.activeBoardId ?? '',
            };
          }

          persisted.boards = persisted.boards.map((b: Board) => ({
            ...b,
            notificationSettings:
              b.notificationSettings ?? { ...DEFAULT_NOTIFICATION_SETTINGS },
            templates:
              b.templates ?? DEFAULT_TEMPLATES.map((t) => ({ ...t })),
            activity: b.activity ?? [],
          }));
        }
        return persisted;
      },
    }
  )
);