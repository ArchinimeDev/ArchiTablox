'use client';

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
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
import { useAdmin } from '@/store/admin';
import type { Card as CardType, CardTemplate, Priority } from '@/types';
import { RARITY_LABEL } from '@/lib/gamification';
import { dayKey } from '@/lib/dateUtils';
import { createClient } from '@/utils/supabase/client';
import { useSyncBoards } from './hooks/useSyncBoards';
import { useXP } from '@/hooks/useXP';
import { useToast } from './components/Toast';

import { ColumnView } from './components/ColumnView';
import { CardItem } from './components/CardItem';
import { CardModal } from './components/CardModal';
import { ArchiveModal } from './components/ArchiveModal';
import { CalendarView } from './components/CalendarView';
import { DayModal } from './components/DayModal';
import { NotificationsPanel } from './components/NotificationsPanel';
import { TemplatesMenu } from './components/TemplatesMenu';
import { TemplateModal } from './components/TemplateModal';
import { ShareModal } from './components/ShareModal';
import { MembersAvatars } from './components/MembersAvatars';
import { WelcomeInvitesBanner } from './components/WelcomeInvitesBanner';
import { CommandPalette } from './components/CommandPalette';
import { MetricsView } from './components/MetricsView';

import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { MobileHeader } from './components/MobileHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileSearchView } from './components/MobileSearchView';
import { MobileArchiveView } from './components/MobileArchiveView';
import { ProfileView } from './components/ProfileView';

import { sendEmail } from '@/lib/notify';

type ViewMode =
  | 'board'
  | 'calendar'
  | 'search'
  | 'archive'
  | 'profile'
  | 'shop'
  | 'metrics';

interface Member {
  user_id: string;
  email: string;
  role: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

interface UserInfo {
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

function extractAvatarUrl(u: any): string | null {
  const md = u?.user_metadata ?? {};
  const raw = u?.raw_user_meta_data ?? {};
  const identities: any[] = Array.isArray(u?.identities) ? u.identities : [];

  const fromIdentities: string[] = [];
  for (const i of identities) {
    const d = i?.identity_data ?? {};
    const candidates = [
      d.avatar_url,
      d.picture,
      d.avatarUrl,
      d.image,
      d.profile_image_url,
      d.photo,
      d.photoURL,
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.startsWith('http')) {
        fromIdentities.push(c);
      }
    }
  }

  const candidates: (string | undefined | null)[] = [
    md.avatar_url,
    md.picture,
    md.avatarUrl,
    md.image,
    md.profile_image_url,
    md.photo,
    md.photoURL,
    raw.avatar_url,
    raw.picture,
    raw.avatarUrl,
    raw.image,
    raw.profile_image_url,
    raw.photo,
    raw.photoURL,
    ...fromIdentities,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.startsWith('http')) return c;
  }

  return null;
}

function extractName(u: any): string | null {
  const md = u?.user_metadata ?? {};
  const raw = u?.raw_user_meta_data ?? {};

  const candidates = [
    md.full_name,
    md.name,
    md.given_name,
    md.display_name,
    raw.full_name,
    raw.name,
    raw.given_name,
    raw.display_name,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }

  const email = u?.email as string | undefined;
  if (email) {
    const local = email.split('@')[0];
    if (local) return local;
  }
  return null;
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
  const switchBoard = useBoard((s) => s.switchBoard);
  const importData = useBoard((s) => s.importData);
  const updateNotificationSettings = useBoard(
    (s) => s.updateNotificationSettings
  );
  const addTemplate = useBoard((s) => s.addTemplate);
  const updateTemplate = useBoard((s) => s.updateTemplate);
  const deleteTemplate = useBoard((s) => s.deleteTemplate);
  const createCardFromTemplate = useBoard((s) => s.createCardFromTemplate);

  const {
    status: syncStatus,
    userId,
    reload: reloadBoards,
    boardRoles,
  } = useSyncBoards();

  useXP();
  const { toast } = useToast();

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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<number | null>(null);
  const [activeColumnIdx, setActiveColumnIdx] = useState(0);
  const [editingTemplate, setEditingTemplate] = useState<
    CardTemplate | null | undefined
  >(undefined);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [newBoardIds, setNewBoardIds] = useState<string[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showCommand, setShowCommand] = useState(false);
  const [pendingOpen, setPendingOpen] = useState<{
    cardId: string;
    boardId: string;
  } | null>(null);

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
    if (!isMobile && (view === 'search' || view === 'archive')) {
      setView('board');
    }
  }, [isMobile, view]);

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
    if (view === 'board' || view === 'calendar') {
      localStorage.setItem('kanban-view', view);
    }
  }, [view]);

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

  useEffect(() => {
    if (!pendingOpen) return;
    if (pendingOpen.boardId !== activeBoardId) return;
    if (!cards[pendingOpen.cardId]) return;
    setEditingId(pendingOpen.cardId);
    setPendingOpen(null);
  }, [pendingOpen, activeBoardId, cards]);

  // ============ AUTENTICACIÓN + ADMIN ============
  useEffect(() => {
    const supabase = createClient();
    const { setAdmin } = useAdmin.getState();

    const buildUser = (u: any): UserInfo => {
      const avatarUrl = extractAvatarUrl(u);
      const name = extractName(u);
      return {
        email: u?.email ?? '',
        name,
        avatarUrl,
      };
    };

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(buildUser(data.user));
        setAdmin(data.user.email);
      } else {
        setAdmin(null);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(buildUser(session.user));
          setAdmin(session.user.email);
        } else {
          setUser(null);
          setAdmin(null);
        }
      }
    );

    return () => sub.subscription.unsubscribe();
  }, []);
  // ================================================

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    useAdmin.getState().setAdmin(null);
    window.location.reload();
  };

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

      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowCommand((s) => !s);
        return;
      }

      if (e.key === 'Escape') {
        if (showCommand) return setShowCommand(false);
        if (editingId) return setEditingId(null);
        if (showShortcuts) return setShowShortcuts(false);
        if (showArchive) return setShowArchive(false);
        if (showShare) return setShowShare(false);
        if (showMobileMenu) return setShowMobileMenu(false);
        if (dayModalDate !== null) return setDayModalDate(null);
        if (editingTemplate !== undefined) return setEditingTemplate(undefined);
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
        if (view === 'board') newCardInputRef.current?.focus();
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
    view,
  ]);

  const cardMatchesQuery = useCallback(
    (c: CardType, q: string): boolean => {
      if (!q) return true;
      const lowerQ = q.toLowerCase();

      if (c.title.toLowerCase().includes(lowerQ)) return true;
      if ((c.description ?? '').toLowerCase().includes(lowerQ)) return true;

      if (c.comments?.some((cm) => cm.text.toLowerCase().includes(lowerQ))) {
        return true;
      }
      if (c.attachments?.some((a) => a.name.toLowerCase().includes(lowerQ))) {
        return true;
      }
      if (c.subtasks?.some((s) => s.title.toLowerCase().includes(lowerQ))) {
        return true;
      }
      if (
        c.labelIds?.some((id) => {
          const label = labels.find((l) => l.id === id);
          return label?.name.toLowerCase().includes(lowerQ);
        })
      ) {
        return true;
      }
      const assignees = c.assigneeIds ?? [];
      if (
        assignees.some((uid) => {
          const member = members.find((m) => m.user_id === uid);
          return (
            member?.email.toLowerCase().includes(lowerQ) ||
            (member?.full_name ?? '').toLowerCase().includes(lowerQ)
          );
        })
      ) {
        return true;
      }
      return false;
    },
    [labels, members]
  );

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
        if (!cardMatchesQuery(c, q)) return false;
        return true;
      });
    }
    return result;
  }, [columns, cards, search, filterPriority, filterLabel, cardMatchesQuery]);

  const filteredCards = useMemo(() => {
    const q = search.toLowerCase().trim();
    return Object.values(cards).filter((c) => {
      if (c.archived) return false;
      if (filterPriority !== 'all' && c.priority !== filterPriority)
        return false;
      if (filterLabel !== 'all') {
        if (!(c.labelIds ?? []).includes(filterLabel)) return false;
      }
      if (!cardMatchesQuery(c, q)) return false;
      return true;
    });
  }, [cards, search, filterPriority, filterLabel, cardMatchesQuery]);

  const mobileSearchResults = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return [];
    return Object.values(cards).filter((c) => {
      if (c.archived) return false;
      return cardMatchesQuery(c, q);
    });
  }, [cards, search, cardMatchesQuery]);

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
      const ok = moveCard(cardId, overColumn.id);
      if (!ok) {
        toast('La columna destino está llena (límite WIP)', 'error', 2500);
      }
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
      const ok = moveCard(cardId, targetCol.id, insertAt);
      if (!ok) {
        toast('La columna destino está llena (límite WIP)', 'error', 2500);
      }
    }
  };

  const handleAddCommentWithMentions = async (text: string) => {
    if (!editingCard || !activeBoard || !user) {
      if (editingCard) addComment(editingCard.id, text);
      return;
    }

    addComment(editingCard.id, text);

    const mentionRegex = /@([A-Za-z0-9._-]+)/g;
    const matches = text.match(mentionRegex) || [];
    const mentionedLocals = new Set(
      matches.map((m) => m.slice(1).toLowerCase())
    );

    if (mentionedLocals.size === 0) return;

    const mentionedUsers = members.filter((m) => {
      const local = m.email.split('@')[0].toLowerCase();
      const name = (m.full_name ?? '').toLowerCase().replace(/\s/g, '');
      return mentionedLocals.has(local) || mentionedLocals.has(name);
    });

    const toNotify = mentionedUsers.filter((m) => m.email !== user.email);

    if (toNotify.length === 0) return;

    const preview = text.length > 120 ? text.slice(0, 120) + '…' : text;

    for (const m of toNotify) {
      try {
        await sendEmail({
          to: m.email,
          type: 'comment',
          boardId: activeBoard.id,
          data: {
            cardTitle: editingCard.title,
            boardName: activeBoard.name,
            fromUser: user.name || user.email,
            commentText: preview,
          },
        });
      } catch (err) {
        console.warn('[mention] no se pudo enviar email a', m.email, err);
      }
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-gray-950 font-black text-base animate-pulse">
            A
          </div>
          <span className="text-sm text-slate-500">Cargando...</span>
        </div>
      </div>
    );
  }

  const editingCard = editingId ? cards[editingId] : null;
  const hasActiveFilters =
    !!search || filterPriority !== 'all' || filterLabel !== 'all';

  const showBoardToolbar = view === 'board';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Sidebar
        boards={boards}
        activeBoardId={activeBoardId}
        boardRoles={boardRoles}
        newBoardIds={newBoardIds}
        user={user}
        view={view}
        archivedCount={archivedCards.length}
        onSwitchBoard={switchBoard}
        onSetView={setView}
        onCreateBoard={createBoard}
        onOpenShare={() => setShowShare(true)}
        onOpenArchive={() => setShowArchive(true)}
        onOpenCommand={() => setShowCommand(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onLogout={handleLogout}
        onBoardOpened={handleBoardOpened}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Topbar
          board={activeBoard}
          user={user}
          syncStatus={syncStatus}
          onOpenCommand={() => setShowCommand(true)}
          onOpenShare={() => setShowShare(true)}
          onOpenCard={(id) => setEditingId(id)}
          onUpdateNotificationSettings={updateNotificationSettings}
          onInviteAccepted={handleInviteAccepted}
          onOpenProfile={() => setView('profile')}
          onLogout={handleLogout}
        />

        <MobileHeader
          board={activeBoard}
          user={user}
          onOpenMenu={() => setShowMobileMenu(true)}
          onOpenCommand={() => setShowCommand(true)}
          onOpenCard={(id) => setEditingId(id)}
          onUpdateNotificationSettings={updateNotificationSettings}
          onInviteAccepted={handleInviteAccepted}
        />

        {user && (
          <WelcomeInvitesBanner
            userId={userId}
            onAccepted={handleInviteAccepted}
          />
        )}

        <main className="flex-1 px-3 sm:px-4 lg:px-6 py-4 pb-24 lg:pb-6">
          {showBoardToolbar && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 h-10 flex-1 min-w-[240px] focus-within:border-slate-700 transition-colors">
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
                  className="bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 px-1.5 py-1 focus:outline-none focus:border-slate-700 cursor-pointer shrink-0"
                >
                  {(Object.keys(RARITY_LABEL) as Priority[]).map((p) => (
                    <option key={p} value={p}>
                      {RARITY_LABEL[p]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAdd}
                  disabled={!newTitle.trim()}
                  className="interactive bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-gray-950 font-semibold text-xs rounded px-3 py-1.5 shrink-0"
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

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 h-10 flex-1 sm:flex-initial sm:w-56 min-w-[180px] focus-within:border-slate-700 transition-colors">
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
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="interactive text-slate-500 hover:text-slate-200 p-0.5 shrink-0"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={filterPriority}
                  onChange={(e) =>
                    setFilterPriority(e.target.value as Priority | 'all')
                  }
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 h-10 text-xs text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer"
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
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 h-10 text-xs text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer"
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
                    className="interactive text-xs text-slate-500 hover:text-red-400 px-3 h-10 rounded-lg border border-slate-800 hover:border-red-900"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          )}

          {view === 'board' && (
            <>
              {columns.length > 0 && (
                <div className="lg:hidden -mx-3 px-3 mb-3">
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {columns.map((col, idx) => {
                      const isActive = idx === activeColumnIdx;
                      return (
                        <button
                          key={col.id}
                          onClick={() => scrollToColumn(col.id)}
                          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 border ${
                            isActive
                              ? 'bg-slate-800 text-slate-100 border-slate-700'
                              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <span className="truncate max-w-[100px]">
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
                  className="flex gap-4 overflow-x-auto pb-4 items-start snap-x snap-mandatory lg:snap-none scroll-smooth -mx-3 px-3 lg:mx-0 lg:px-0"
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

                  <div className="w-[320px] shrink-0 snap-start">
                    {addingColumn ? (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
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
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-amber-500/60 text-slate-100"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddColumn}
                            className="interactive flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-lg px-3 py-1.5 text-xs"
                          >
                            Crear
                          </button>
                          <button
                            onClick={() => {
                              setAddingColumn(false);
                              setNewColumnName('');
                            }}
                            className="interactive px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingColumn(true)}
                        className="interactive w-full bg-transparent hover:bg-slate-900 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-4 text-sm text-slate-500 hover:text-slate-300 flex items-center justify-center gap-2 h-[60px]"
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

          {view === 'metrics' && <MetricsView board={activeBoard} />}

          {view === 'search' && (
            <MobileSearchView
              search={search}
              onSearchChange={setSearch}
              cards={mobileSearchResults}
              labels={labels}
              onOpenCard={(id) => setEditingId(id)}
            />
          )}

          {view === 'archive' && (
            <MobileArchiveView
              archivedCards={archivedCards}
              columns={columns}
              labels={labels}
              onOpenCard={(id) => setEditingId(id)}
              onRestore={restoreCard}
              onDelete={deleteCard}
              onEmpty={emptyArchive}
            />
          )}

          {(view === 'profile' || view === 'shop') && (
            <ProfileView
              user={user}
              boardsCount={boards.length}
              initialTab={view === 'shop' ? 'shop' : 'profile'}
              onOpenDrawer={() => setShowMobileMenu(true)}
              onOpenShare={() => setShowShare(true)}
              onOpenShortcuts={() => setShowShortcuts(true)}
              onLogout={handleLogout}
            />
          )}
        </main>

        <MobileBottomNav
          board={activeBoard}
          view={view}
          user={user}
          archivedCount={archivedCards.length}
          onSetView={setView}
        />
      </div>

      {isMobile && showMobileMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-3 overflow-y-auto pb-6 animate-fade-in"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-amber-500 flex items-center justify-center text-gray-950 font-black text-sm shrink-0">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    'A'
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate">
                    {user?.name || 'ArchiTablox'}
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
                className="interactive text-slate-500 hover:text-slate-200 p-1.5 rounded"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-2">
              <div className="mb-2">
                <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Mis tableros
                </div>
                {boards.map((b) => {
                  const isActive = b.id === activeBoardId;
                  const isNew = newBoardIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        switchBoard(b.id);
                        handleBoardOpened(b.id);
                        setShowMobileMenu(false);
                      }}
                      className={`interactive w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm ${
                        isActive
                          ? 'bg-slate-800 text-slate-100 font-medium'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
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
                        className={
                          isActive ? 'text-amber-400' : 'text-slate-500'
                        }
                      >
                        <rect x="3" y="3" width="7" height="18" rx="1" />
                        <rect x="14" y="3" width="7" height="18" rx="1" />
                      </svg>
                      <span className="flex-1 text-left truncate">{b.name}</span>
                      {isNew && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    const name = prompt('Nombre del nuevo tablero:');
                    if (name?.trim()) createBoard(name.trim());
                  }}
                  className="interactive w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm text-amber-400 hover:bg-amber-500/10"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="flex-1 text-left">Nuevo tablero</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 mb-2">
                <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Vistas
                </div>
                <div className="grid grid-cols-2 gap-1.5 px-1">
                  <button
                    onClick={() => {
                      setView('board');
                      setShowMobileMenu(false);
                    }}
                    className={`interactive flex items-center gap-2 px-3 h-10 rounded-lg text-sm ${
                      view === 'board'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="18" rx="1" />
                      <rect x="14" y="3" width="7" height="18" rx="1" />
                    </svg>
                    Kanban
                  </button>
                  <button
                    onClick={() => {
                      setView('calendar');
                      setShowMobileMenu(false);
                    }}
                    className={`interactive flex items-center gap-2 px-3 h-10 rounded-lg text-sm ${
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
                  <button
                    onClick={() => {
                      setView('metrics');
                      setShowMobileMenu(false);
                    }}
                    className={`interactive flex items-center gap-2 px-3 h-10 rounded-lg text-sm ${
                      view === 'metrics'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="20" x2="21" y2="20" />
                      <rect x="5" y="12" width="3" height="6" />
                      <rect x="10.5" y="8" width="3" height="10" />
                      <rect x="16" y="4" width="3" height="14" />
                    </svg>
                    Métricas
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowShortcuts(true);
                  }}
                  className="interactive w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                  </svg>
                  <span className="flex-1 text-left">Atajos de teclado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          onAddComment={handleAddCommentWithMentions}
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
        onOpenCard={(cardId, boardId) => {
          if (boardId !== activeBoardId) {
            switchBoard(boardId);
            setPendingOpen({ cardId, boardId });
          } else {
            setEditingId(cardId);
          }
        }}
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-2xl animate-fade-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-slate-100">
                Atajos de teclado
              </h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="interactive text-slate-500 hover:text-slate-200 p-1 rounded"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <ShortcutRow keys={['Ctrl', 'K']} description="Búsqueda global" />
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
    </div>
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