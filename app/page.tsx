'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useBoard } from '@/store/board';
import type { Card as CardType, CardTemplate, Priority } from '@/types';
import { RARITY_LABEL } from '@/lib/gamification';
import { dayKey } from '@/lib/dateUtils';
import { createClient } from '@/utils/supabase/client';
import { useSyncBoards } from './hooks/useSyncBoards';
import { ColumnView } from './components/ColumnView';
import { CardItem } from './components/CardItem';
import { CardModal } from './components/CardModal';
import { BoardBar } from './components/BoardBar';
import { DataMenu } from './components/DataMenu';
import { ArchiveModal } from './components/ArchiveModal';
import { CalendarView } from './components/CalendarView';
import { DayModal } from './components/DayModal';
import { NotificationsPanel } from './components/NotificationsPanel';
import { TemplatesMenu } from './components/TemplatesMenu';
import { TemplateModal } from './components/TemplateModal';
import { ActivityPanel } from './components/ActivityPanel';
import { ShareModal } from './components/ShareModal';
import { MembersAvatars } from './components/MembersAvatars';
import { WelcomeInvitesBanner } from './components/WelcomeInvitesBanner';
import { ThemeToggle } from './components/ThemeToggle';
import { CommandPalette } from './components/CommandPalette';

type ViewMode = 'board' | 'calendar';

interface Member {
  user_id: string;
  email: string;
  role: string;
}

export default function Home() {
  const boards = useBoard((s) => s.boards);
  const activeBoardId = useBoard((s) => s.activeBoardId);
  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const columns = activeBoard?.columns ?? [];
  const cards = activeBoard?.cards ?? {};
  const labels = activeBoard?.labels ?? [];
  const templates = activeBoard?.templates ?? [];

  const addCard = useBoard((s) => s.addCard);
  const updateCard = useBoard((s) => s.updateCard);
  const deleteCard = useBoard((s) => s.deleteCard);
  const archiveCard = useBoard((s) => s.archiveCard);
  const restoreCard = useBoard((s) => s.restoreCard);
  const emptyArchive = useBoard((s) => s.emptyArchive);
  const moveCard = useBoard((s) => s.moveCard);
  const addSubtask = useBoard((s) => s.addSubtask);
  const updateSubtask = useBoard((s) => s.updateSubtask);
  const toggleSubtask = useBoard((s) => s.toggleSubtask);
  const deleteSubtask = useBoard((s) => s.deleteSubtask);
  const addComment = useBoard((s) => s.addComment);
  const deleteComment = useBoard((s) => s.deleteComment);
  const addAttachment = useBoard((s) => s.addAttachment);
  const deleteAttachment = useBoard((s) => s.deleteAttachment);
  const toggleAssignee = useBoard((s) => s.toggleAssignee);
  const addLabel = useBoard((s) => s.addLabel);
  const addLabelAndAssign = useBoard((s) => s.addLabelAndAssign);
  const deleteLabel = useBoard((s) => s.deleteLabel);
  const toggleCardLabel = useBoard((s) => s.toggleCardLabel);
  const addColumn = useBoard((s) => s.addColumn);
  const updateColumn = useBoard((s) => s.updateColumn);
  const deleteColumn = useBoard((s) => s.deleteColumn);
  const createBoard = useBoard((s) => s.createBoard);
  const renameBoard = useBoard((s) => s.renameBoard);
  const duplicateBoard = useBoard((s) => s.duplicateBoard);
  const deleteBoard = useBoard((s) => s.deleteBoard);
  const switchBoard = useBoard((s) => s.switchBoard);
  const resetActiveBoard = useBoard((s) => s.resetActiveBoard);
  const importData = useBoard((s) => s.importData);
  const updateNotificationSettings = useBoard(
    (s) => s.updateNotificationSettings
  );
  const addTemplate = useBoard((s) => s.addTemplate);
  const updateTemplate = useBoard((s) => s.updateTemplate);
  const deleteTemplate = useBoard((s) => s.deleteTemplate);
  const createCardFromTemplate = useBoard((s) => s.createCardFromTemplate);
  const clearActivity = useBoard((s) => s.clearActivity);

  const {
    status: syncStatus,
    userId,
    reload: reloadBoards,
    boardRoles,
  } = useSyncBoards();

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<ViewMode>('board');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterLabel, setFilterLabel] = useState<string | 'all'>('all');
  const [newColumnName, setNewColumnName] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<number | null>(null);
  const [activeColumnIdx, setActiveColumnIdx] = useState(0);
  const [editingTemplate, setEditingTemplate] = useState<
    CardTemplate | null | undefined
  >(undefined);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [newBoardIds, setNewBoardIds] = useState<string[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showCommand, setShowCommand] = useState(false);

  const newCardInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const boardScrollRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 12 },
    })
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setSearch('');
    setFilterPriority('all');
    setFilterLabel('all');
    setEditingId(null);
  }, [activeBoardId]);

  useEffect(() => {
    const saved = localStorage.getItem('kanban-view');
    if (saved === 'calendar' || saved === 'board') setView(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('kanban-view', view);
  }, [view]);

  // Cargar miembros del tablero activo
  useEffect(() => {
    if (!activeBoardId || !userId) return;

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        activeBoardId
      );
    if (!isUuid) {
      setMembers([]);
      return;
    }

    const supabase = createClient();
    supabase
      .rpc('get_board_members', { p_board_id: activeBoardId })
      .then(({ data, error }) => {
        if (error) {
          setMembers([]);
          return;
        }
        setMembers((data as Member[]) ?? []);
      });
  }, [activeBoardId, userId]);

  // ============ AUTENTICACIÓN ============
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ email: data.user.email ?? '' });
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) setUser({ email: session.user.email ?? '' });
        else setUser(null);
      }
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  };
  // ======================================

  const handleInviteAccepted = async () => {
    const previousIds = new Set(boards.map((b) => b.id));

    await reloadBoards();

    const after = useBoard.getState().boards;
    const added = after
      .filter((b) => !previousIds.has(b.id))
      .map((b) => b.id);

    if (added.length > 0) {
      setNewBoardIds((prev) => [...new Set([...prev, ...added])]);
    }
  };

  const handleBoardOpened = (id: string) => {
    setNewBoardIds((prev) => prev.filter((x) => x !== id));
  };

  useEffect(() => {
    const container = boardScrollRef.current;
    if (!container) return;

    const onScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      let closest = 0;
      let minDist = Infinity;
      columns.forEach((col, idx) => {
        const el = document.getElementById(`col-${col.id}`);
        if (el) {
          const elRect = el.getBoundingClientRect();
          const elCenter = elRect.left + elRect.width / 2;
          const dist = Math.abs(elCenter - containerCenter);
          if (dist < minDist) {
            minDist = dist;
            closest = idx;
          }
        }
      });
      setActiveColumnIdx(closest);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => container.removeEventListener('scroll', onScroll);
  }, [columns, view]);

  const scrollToColumn = (columnId: string) => {
    const container = boardScrollRef.current;
    const target = document.getElementById(`col-${columnId}`);
    if (!container || !target) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const newScrollLeft =
      container.scrollLeft + (targetRect.left - containerRect.left);
    container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  };

  // ============ ATAJOS DE TECLADO ============
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Ctrl+K / Cmd+K → abrir paleta de comandos
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowCommand((s) => !s);
        return;
      }

      if (e.key === 'Escape') {
        if (editingId) return setEditingId(null);
        if (showShortcuts) return setShowShortcuts(false);
        if (showArchive) return setShowArchive(false);
        if (showShare) return setShowShare(false);
        if (showMobileMenu) return setShowMobileMenu(false);
        if (dayModalDate !== null) return setDayModalDate(null);
        if (editingTemplate !== undefined)
          return setEditingTemplate(undefined);
        if (addingColumn) {
          setAddingColumn(false);
          setNewColumnName('');
          return;
        }
        if (isTyping) {
          (target as HTMLInputElement).blur();
          return;
        }
        if (search || filterPriority !== 'all' || filterLabel !== 'all') {
          setSearch('');
          setFilterPriority('all');
          setFilterLabel('all');
        }
        return;
      }

      if (isTyping) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        newCardInputRef.current?.focus();
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts((s) => !s);
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setView((v) => (v === 'board' ? 'calendar' : 'board'));
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    editingId,
    showShortcuts,
    showArchive,
    showShare,
    showMobileMenu,
    dayModalDate,
    editingTemplate,
    addingColumn,
    search,
    filterPriority,
    filterLabel,
    showCommand,
  ]);
  // ==========================================

  const filteredByColumn = useMemo(() => {
    const q = search.toLowerCase().trim();
    const result: Record<string, string[]> = {};
    for (const col of columns) {
      result[col.id] = col.cardIds.filter((id) => {
        const c = cards[id];
        if (!c || c.archived) return false;
        if (filterPriority !== 'all' && c.priority !== filterPriority)
          return false;
        if (filterLabel !== 'all') {
          if (!(c.labelIds ?? []).includes(filterLabel)) return false;
        }
        if (q) {
          const hay =
            c.title.toLowerCase().includes(q) ||
            (c.description ?? '').toLowerCase().includes(q);
          if (!hay) return false;
        }
        return true;
      });
    }
    return result;
  }, [columns, cards, search, filterPriority, filterLabel]);

  const filteredCards = useMemo(() => {
    const q = search.toLowerCase().trim();
    return Object.values(cards).filter((c) => {
      if (c.archived) return false;
      if (filterPriority !== 'all' && c.priority !== filterPriority)
        return false;
      if (filterLabel !== 'all') {
        if (!(c.labelIds ?? []).includes(filterLabel)) return false;
      }
      if (q) {
        const hay =
          c.title.toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q);
        if (!hay) return false;
      }
      return true;
    });
  }, [cards, search, filterPriority, filterLabel]);

  const archivedCards = useMemo(
    () => Object.values(cards).filter((c) => c.archived),
    [cards]
  );

  const handleAdd = () => {
    const firstCol = columns.find((c) => !c.isDone) ?? columns[0];
    if (!newTitle.trim() || !firstCol) return;
    addCard(firstCol.id, newTitle.trim(), newPriority);
    setNewTitle('');
    newCardInputRef.current?.focus();
  };

  const handleAddColumn = () => {
    const t = newColumnName.trim();
    if (!t) return;
    addColumn(t);
    setNewColumnName('');
    setAddingColumn(false);
  };

  const handleDragStart = (e: DragStartEvent) => {
    const id = e.active.id as string;
    setActiveCard(cards[id] ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = e;
    if (!over) return;

    const cardId = active.id as string;
    const overId = over.id as string;
    if (cardId === overId) return;

    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn) {
      const currentCol = cards[cardId]?.columnId;
      if (currentCol === overColumn.id) return;
      moveCard(cardId, overColumn.id);
      return;
    }

    const overCard = cards[overId];
    if (!overCard) return;

    const targetCol = columns.find((c) => c.id === overCard.columnId);
    if (!targetCol) return;

    const overIndex = targetCol.cardIds.indexOf(overId);
    const currentColId = cards[cardId]?.columnId;
    const isSameColumn = currentColId === targetCol.id;

    const activeRect = active.rect.current.translated;
    const overRect = over.rect;
    let insertBefore = true;

    if (activeRect && overRect) {
      const activeCenterY = activeRect.top + activeRect.height / 2;
      const overCenterY = overRect.top + overRect.height / 2;
      insertBefore = activeCenterY < overCenterY;
    }

    if (isSameColumn) {
      const fromIdx = targetCol.cardIds.indexOf(cardId);
      if (fromIdx === -1) return;
      const finalIdx = insertBefore
        ? overIndex - (fromIdx < overIndex ? 1 : 0)
        : overIndex + (fromIdx < overIndex ? 0 : 1);
      if (finalIdx === fromIdx) return;
      moveCard(cardId, targetCol.id, finalIdx);
    } else {
      const insertAt = insertBefore ? overIndex : overIndex + 1;
      moveCard(cardId, targetCol.id, insertAt);
    }
  };

  const handleCreateAndAssignLabel = (name: string, color: string) => {
    if (editingId) {
      addLabelAndAssign(editingId, name, color);
    } else {
      addLabel(name, color);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const firstCol = columns.find((c) => !c.isDone) ?? columns[0];
    if (!firstCol) return;
    createCardFromTemplate(firstCol.id, templateId);
  };

  const handleSaveTemplate = (data: Omit<CardTemplate, 'id'>) => {
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, data);
    } else {
      addTemplate(data);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400 text-sm">Cargando...</p>
      </main>
    );
  }

  const editingCard = editingId ? cards[editingId] : null;
  const hasActiveFilters =
    !!search || filterPriority !== 'all' || filterLabel !== 'all';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* ============ HEADER ESCRITORIO ============ */}
      {!isMobile && (
        <header className="border-b border-slate-900 bg-slate-950/95 backdrop-blur sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-sm shrink-0">
                A
              </div>

              <BoardBar
                boards={boards}
                activeBoardId={activeBoardId}
                boardRoles={boardRoles}
                newBoardIds={newBoardIds}
                onOpened={() => {}}
                onBoardOpened={handleBoardOpened}
                onSwitch={switchBoard}
                onCreate={createBoard}
                onRename={renameBoard}
                onDuplicate={duplicateBoard}
                onDelete={deleteBoard}
              />

              {user && activeBoard && (
                <>
                  <div className="w-px h-5 bg-slate-800 shrink-0" />
                  <MembersAvatars
                    boardId={activeBoard.id}
                    onOpenShare={() => setShowShare(true)}
                  />
                  <button
                    onClick={() => setShowShare(true)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5 transition-colors h-8 shrink-0"
                    title="Compartir tablero"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    <span className="hidden lg:inline text-slate-400">
                      Compartir
                    </span>
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Botón de búsqueda global (abre CommandPalette) */}
              <button
                onClick={() => setShowCommand(true)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg h-8 px-2.5 flex items-center gap-2 transition-colors shrink-0 text-xs text-slate-400"
                title="Buscar (Ctrl+K)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span className="hidden xl:inline">Buscar...</span>
                <kbd className="hidden xl:inline font-mono text-[10px] text-slate-500 bg-slate-950 border border-slate-800 rounded px-1 py-0.5">
                  Ctrl K
                </kbd>
              </button>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex items-center h-8">
                <button
                  onClick={() => setView('board')}
                  className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors h-7 ${
                    view === 'board'
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Vista tablero (C)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="18" rx="1" />
                    <rect x="14" y="3" width="7" height="18" rx="1" />
                  </svg>
                  <span className="hidden xl:inline">Tablero</span>
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors h-7 ${
                    view === 'calendar'
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Vista calendario (C)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <span className="hidden xl:inline">Calendario</span>
                </button>
              </div>

              <div className="w-px h-5 bg-slate-800 shrink-0" />

              <div className="flex items-center gap-1.5">
                {activeBoard && (
                  <NotificationsPanel
                    board={activeBoard}
                    onOpenCard={(id) => setEditingId(id)}
                    onUpdateSettings={updateNotificationSettings}
                    onInviteAccepted={handleInviteAccepted}
                  />
                )}

                <button
                  onClick={() => setShowArchive(true)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg w-8 h-8 flex items-center justify-center transition-colors shrink-0 relative"
                  title="Archivados"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                    <rect x="2" y="3" width="20" height="5" rx="1" />
                    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                  </svg>
                  {archivedCards.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-slate-700 text-slate-200 text-[9px] font-mono px-1 rounded-full min-w-[16px] h-4 flex items-center justify-center">
                      {archivedCards.length > 9 ? '9+' : archivedCards.length}
                    </span>
                  )}
                </button>

                <DataMenu
                  boards={boards}
                  activeBoardId={activeBoardId}
                  onImport={importData}
                />

                {activeBoard && (
                  <ActivityPanel
                    activity={activeBoard.activity ?? []}
                    onOpenCard={(id) => setEditingId(id)}
                    onClear={clearActivity}
                  />
                )}
              </div>

              <div className="w-px h-5 bg-slate-800 shrink-0" />

              {user && (
                <div
                  className="hidden md:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 h-8"
                  title={
                    syncStatus === 'synced'
                      ? 'Sincronizado con la nube'
                      : syncStatus === 'saving'
                      ? 'Guardando...'
                      : syncStatus === 'loading'
                      ? 'Cargando...'
                      : syncStatus === 'error'
                      ? 'Error de sincronización'
                      : ''
                  }
                >
                  {syncStatus === 'saving' || syncStatus === 'loading' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
                    </svg>
                  ) : syncStatus === 'error' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                  <span className="text-[10px] text-slate-500">
                    {syncStatus === 'synced'
                      ? 'Nube'
                      : syncStatus === 'saving'
                      ? 'Guardando'
                      : syncStatus === 'loading'
                      ? 'Cargando'
                      : syncStatus === 'error'
                      ? 'Error'
                      : ''}
                  </span>
                </div>
              )}

              {user ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg pl-1 pr-3 h-8">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px] font-bold text-amber-400 shrink-0">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-400 max-w-[110px] truncate">
                      {user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-900 rounded-lg px-2.5 h-8 text-xs transition-colors"
                    title="Cerrar sesión"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <a
                  href="/login"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded-lg px-3 h-8 flex items-center text-xs transition-colors shrink-0"
                >
                  Iniciar sesión
                </a>
              )}

              <ThemeToggle variant="header" />

              <button
                onClick={() => setShowShortcuts(true)}
                className="text-slate-500 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg w-8 h-8 flex items-center justify-center transition-colors text-xs font-bold shrink-0"
                title="Atajos (?)"
              >
                ?
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ============ HEADER MÓVIL ============ */}
      {isMobile && (
        <header className="border-b border-slate-900 bg-slate-950/95 backdrop-blur sticky top-0 z-30">
          <div className="px-3 py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="w-9 h-9 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-sm shrink-0 transition-colors relative"
                title="Menú"
              >
                A
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-slate-950 border border-amber-500 flex items-center justify-center">
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>

              <div className="flex-1 min-w-0">
                <BoardBar
                  boards={boards}
                  activeBoardId={activeBoardId}
                  boardRoles={boardRoles}
                  newBoardIds={newBoardIds}
                  onOpened={() => {}}
                  onBoardOpened={handleBoardOpened}
                  onSwitch={switchBoard}
                  onCreate={createBoard}
                  onRename={renameBoard}
                  onDuplicate={duplicateBoard}
                  onDelete={deleteBoard}
                />
              </div>

              {user ? (
                <>
                  {activeBoard && (
                    <NotificationsPanel
                      board={activeBoard}
                      onOpenCard={(id) => setEditingId(id)}
                      onUpdateSettings={updateNotificationSettings}
                      onInviteAccepted={handleInviteAccepted}
                    />
                  )}
                  <div
                    className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0"
                    title={user.email}
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px] font-bold text-amber-400">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </>
              ) : (
                <a
                  href="/login"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg px-3 h-9 flex items-center text-xs transition-colors shrink-0"
                >
                  Entrar
                </a>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ============ MENÚ MÓVIL (drawer) ============ */}
      {isMobile && showMobileMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-3 overflow-y-auto pb-6"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-sm shrink-0">
                  A
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100">
                    ArchiTablox
                  </div>
                  {user && (
                    <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="text-slate-500 hover:text-slate-200 p-1.5 rounded transition-colors shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-2">
              <div className="mb-2">
                <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                  Vista
                </div>
                <div className="grid grid-cols-2 gap-1.5 px-1">
                  <button
                    onClick={() => {
                      setView('board');
                      setShowMobileMenu(false);
                    }}
                    className={`flex items-center gap-2 px-3 h-10 rounded-lg text-sm transition-colors ${
                      view === 'board'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="18" rx="1" />
                      <rect x="14" y="3" width="7" height="18" rx="1" />
                    </svg>
                    Tablero
                  </button>
                  <button
                    onClick={() => {
                      setView('calendar');
                      setShowMobileMenu(false);
                    }}
                    className={`flex items-center gap-2 px-3 h-10 rounded-lg text-sm transition-colors ${
                      view === 'calendar'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    Calendario
                  </button>
                </div>
              </div>

              {user && activeBoard && (
                <div className="mb-2 pt-2 border-t border-slate-800">
                  <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    Tablero actual
                  </div>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowShare(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 h-11 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    <span className="flex-1 text-left">Compartir tablero</span>
                  </button>
                  <div className="px-3 pt-1">
                    <MembersAvatars
                      boardId={activeBoard.id}
                      onOpenShare={() => {
                        setShowMobileMenu(false);
                        setShowShare(true);
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mb-2 pt-2 border-t border-slate-800">
                <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                  Herramientas
                </div>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setEditingTemplate(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 h-11 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <span className="flex-1 text-left">Plantillas</span>
                  <span className="text-[10px] text-slate-600 font-mono">
                    {templates.length}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowArchive(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 h-11 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                    <rect x="2" y="3" width="20" height="5" rx="1" />
                    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                  </svg>
                  <span className="flex-1 text-left">Archivados</span>
                  {archivedCards.length > 0 && (
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
                      {archivedCards.length}
                    </span>
                  )}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setView('board');
                  }}
                  className="w-full flex items-center gap-3 px-3 h-11 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span className="flex-1 text-left">Buscar y filtrar</span>
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowShortcuts(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 h-11 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                  </svg>
                  <span className="flex-1 text-left">Atajos de teclado</span>
                </button>
                <ThemeToggle
                  variant="menu"
                  onToggle={() => setShowMobileMenu(false)}
                />
              </div>

              {activeBoard && (
                <div className="mb-2 pt-2 border-t border-slate-800">
                  <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    Otros
                  </div>
                  <div className="px-1 flex gap-1.5">
                    <div className="flex-1">
                      <DataMenu
                        boards={boards}
                        activeBoardId={activeBoardId}
                        onImport={importData}
                      />
                    </div>
                    <div className="flex-1">
                      <ActivityPanel
                        activity={activeBoard.activity ?? []}
                        onOpenCard={(id) => {
                          setShowMobileMenu(false);
                          setEditingId(id);
                        }}
                        onClear={clearActivity}
                      />
                    </div>
                  </div>
                </div>
              )}

              {user && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 h-11 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="flex-1 text-left">Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Banner de invitaciones pendientes */}
      {user && (
        <WelcomeInvitesBanner
          userId={userId}
          onAccepted={handleInviteAccepted}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* ============ TOOLBAR ============ */}
        {isMobile ? (
          <div className="mb-3 space-y-2">
            {view === 'board' && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 h-9 flex-1 min-w-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <input
                    ref={newCardInputRef}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Nueva tarjeta..."
                    className="flex-1 bg-transparent border-0 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none min-w-0"
                  />
                </div>
                <button
                  onClick={handleAdd}
                  disabled={!newTitle.trim()}
                  className="bg-amber-500 hover:bg-amber-400 active:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-lg w-9 h-9 flex items-center justify-center shrink-0 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                <TemplatesMenu
                  templates={templates}
                  onApply={handleApplyTemplate}
                  onEdit={(t) => setEditingTemplate(t)}
                  onCreate={() => setEditingTemplate(null)}
                />
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 h-9 flex-1 min-w-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="flex-1 bg-transparent border-0 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none min-w-0"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="text-slate-500 hover:text-slate-200 p-0.5"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters((s) => !s)}
                className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                  hasActiveFilters || showFilters
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filtros
                {hasActiveFilters && (
                  <span className="bg-amber-500 text-slate-950 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {(filterPriority !== 'all' ? 1 : 0) +
                      (filterLabel !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium shrink-0 w-16">
                    Prioridad
                  </span>
                  <select
                    value={filterPriority}
                    onChange={(e) =>
                      setFilterPriority(e.target.value as Priority | 'all')
                    }
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer"
                  >
                    <option value="all">Todas</option>
                    {(Object.keys(RARITY_LABEL) as Priority[]).map((p) => (
                      <option key={p} value={p}>
                        {RARITY_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </div>

                {labels.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium shrink-0 w-16">
                      Etiqueta
                    </span>
                    <select
                      value={filterLabel}
                      onChange={(e) => setFilterLabel(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer"
                    >
                      <option value="all">Todas</option>
                      {labels.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setFilterPriority('all');
                      setFilterLabel('all');
                    }}
                    className="w-full text-xs text-slate-400 hover:text-red-400 py-1.5 rounded-lg border border-slate-800 hover:border-red-900 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {view === 'board' && (
              <>
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 focus-within:border-slate-700 transition-colors flex-1 min-w-[280px]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <input
                    ref={newCardInputRef}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Añadir tarjeta... (N)"
                    className="flex-1 bg-transparent border-0 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none min-w-0"
                  />
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 px-1.5 py-0.5 focus:outline-none focus:border-slate-700 cursor-pointer"
                  >
                    {(Object.keys(RARITY_LABEL) as Priority[]).map((p) => (
                      <option key={p} value={p}>
                        {RARITY_LABEL[p]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="bg-amber-500 hover:bg-amber-400 active:bg-amber-500 text-slate-950 font-medium text-xs rounded px-3 py-1 transition-colors shrink-0"
                  >
                    Añadir
                  </button>
                </div>

                <TemplatesMenu
                  templates={templates}
                  onApply={handleApplyTemplate}
                  onEdit={(t) => setEditingTemplate(t)}
                  onCreate={() => setEditingTemplate(null)}
                />
              </>
            )}

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 focus-within:border-slate-700 transition-colors flex-1 sm:flex-initial sm:w-44 min-w-[160px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 shrink-0">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar... (/)"
                className="flex-1 bg-transparent border-0 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none min-w-0"
              />
            </div>

            <select
              value={filterPriority}
              onChange={(e) =>
                setFilterPriority(e.target.value as Priority | 'all')
              }
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer"
            >
              <option value="all">Prioridad</option>
              {(Object.keys(RARITY_LABEL) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {RARITY_LABEL[p]}
                </option>
              ))}
            </select>

            {labels.length > 0 && (
              <select
                value={filterLabel}
                onChange={(e) => setFilterLabel(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer"
              >
                <option value="all">Etiqueta</option>
                {labels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterPriority('all');
                  setFilterLabel('all');
                }}
                className="text-xs text-slate-500 hover:text-slate-200 px-2 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        )}

        {view === 'board' && (
          <>
            {columns.length > 0 && (
              <div className="lg:hidden -mx-4 px-4 mb-3">
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {columns.map((col, idx) => {
                    const isActive = idx === activeColumnIdx;
                    return (
                      <button
                        key={col.id}
                        onClick={() => scrollToColumn(col.id)}
                        className={`
                          shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1.5 border
                          ${
                            isActive
                              ? 'bg-slate-800 text-slate-100 border-slate-700'
                              : 'bg-transparent text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                          }
                        `}
                      >
                        <span className="truncate max-w-[80px]">
                          {col.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {col.cardIds.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div
                ref={boardScrollRef}
                className="flex gap-3 overflow-x-auto pb-4 items-start snap-x snap-mandatory lg:snap-none scroll-smooth"
              >
                {columns.map((col) => (
                  <ColumnView
                    key={col.id}
                    column={col}
                    cards={cards}
                    cardOrder={filteredByColumn[col.id] ?? []}
                    labels={labels}
                    members={members}
                    onArchive={archiveCard}
                    onOpen={setEditingId}
                    onUpdateColumn={updateColumn}
                    onDeleteColumn={deleteColumn}
                  />
                ))}

                <div className="w-72 shrink-0 snap-start">
                  {addingColumn ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                      <input
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddColumn();
                          if (e.key === 'Escape') {
                            setAddingColumn(false);
                            setNewColumnName('');
                          }
                        }}
                        placeholder="Nombre de columna..."
                        autoFocus
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-sm mb-2 focus:outline-none focus:border-amber-500/60"
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={handleAddColumn}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded px-2.5 py-1 text-xs transition-colors"
                        >
                          Crear
                        </button>
                        <button
                          onClick={() => {
                            setAddingColumn(false);
                            setNewColumnName('');
                          }}
                          className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingColumn(true)}
                      className="w-full bg-transparent hover:bg-slate-900 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-3 text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Añadir columna
                    </button>
                  )}
                </div>
              </div>

              <DragOverlay dropAnimation={{ duration: 180 }}>
                {activeCard ? (
                  <CardItem
                    card={activeCard}
                    labels={labels}
                    members={members}
                    onArchive={() => {}}
                    onOpen={() => {}}
                    isOverlay
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}

        {view === 'calendar' && (
          <CalendarView
            cards={filteredCards}
            labels={labels}
            onOpen={setEditingId}
            onOpenDay={(ts) => setDayModalDate(ts)}
          />
        )}
      </div>

      {editingCard && (
        <CardModal
          card={editingCard}
          boardId={activeBoardId}
          labels={labels}
          onClose={() => setEditingId(null)}
          onSave={(patch) => updateCard(editingCard.id, patch)}
          onArchive={() => archiveCard(editingCard.id)}
          onAddSubtask={(title) => addSubtask(editingCard.id, title)}
          onToggleSubtask={(subtaskId) =>
            toggleSubtask(editingCard.id, subtaskId)
          }
          onDeleteSubtask={(subtaskId) =>
            deleteSubtask(editingCard.id, subtaskId)
          }
          onUpdateSubtask={(subtaskId, title) =>
            updateSubtask(editingCard.id, subtaskId, title)
          }
          onToggleLabel={(labelId) => toggleCardLabel(editingCard.id, labelId)}
          onCreateAndAssignLabel={handleCreateAndAssignLabel}
          onDeleteLabel={(labelId) => deleteLabel(labelId)}
          onAddComment={(text) => addComment(editingCard.id, text)}
          onDeleteComment={(commentId) =>
            deleteComment(editingCard.id, commentId)
          }
          onAddAttachment={(att) => addAttachment(editingCard.id, att)}
          onDeleteAttachment={(attId) =>
            deleteAttachment(editingCard.id, attId)
          }
          onToggleAssignee={(userId) =>
            toggleAssignee(editingCard.id, userId)
          }
        />
      )}

      {showArchive && (
        <ArchiveModal
          archivedCards={archivedCards}
          columns={columns}
          labels={labels}
          onClose={() => setShowArchive(false)}
          onRestore={restoreCard}
          onDelete={deleteCard}
          onEmpty={emptyArchive}
        />
      )}

      {showShare && activeBoard && (
        <ShareModal
          board={activeBoard}
          currentUserId={userId}
          onClose={() => setShowShare(false)}
        />
      )}

      <CommandPalette
        open={showCommand}
        onClose={() => setShowCommand(false)}
        boards={boards}
        activeBoardId={activeBoardId}
        onOpenCard={(cardId) => setEditingId(cardId)}
        onSwitchBoard={switchBoard}
      />

      {dayModalDate !== null && (
        <DayModal
          date={dayModalDate}
          cards={filteredCards.filter(
            (c) => c.dueDate && dayKey(c.dueDate) === dayKey(dayModalDate)
          )}
          labels={labels}
          onClose={() => setDayModalDate(null)}
          onOpenCard={(id) => {
            setDayModalDate(null);
            setEditingId(id);
          }}
        />
      )}

      {editingTemplate !== undefined && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(undefined)}
          onSave={handleSaveTemplate}
          onDelete={
            editingTemplate
              ? () => deleteTemplate(editingTemplate.id)
              : undefined
          }
        />
      )}

      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-slate-100">
                Atajos de teclado
              </h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-slate-500 hover:text-slate-200 p-1 rounded transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <ShortcutRow
                keys={['Ctrl', 'K']}
                description="Búsqueda global"
              />
              <ShortcutRow keys={['N']} description="Nueva tarjeta" />
              <ShortcutRow keys={['/']} description="Buscar en tablero" />
              <ShortcutRow
                keys={['C']}
                description="Cambiar entre tablero y calendario"
              />
              <ShortcutRow
                keys={['Esc']}
                description="Cerrar · Limpiar filtros · Quitar foco"
              />
              <ShortcutRow keys={['?']} description="Ver esta ayuda" />
              <ShortcutRow
                keys={['Doble click']}
                description="Editar tarjeta o renombrar columna"
              />
              <ShortcutRow
                keys={['Long press']}
                description="Arrastrar en móvil (~200ms)"
              />
            </div>

            <p className="text-[11px] text-slate-500 mt-4 text-center">
              Los atajos no se activan mientras escribes.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function ShortcutRow({
  keys,
  description,
}: {
  keys: string[];
  description: string;
}) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-slate-400 text-xs">{description}</span>
      <div className="flex gap-1 shrink-0">
        {keys.map((k) => (
          <kbd
            key={k}
            className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-400"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}