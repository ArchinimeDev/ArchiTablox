'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useBoard } from '@/store/board';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/lib/notifications';
import type { Board } from '@/types';

export type SyncStatus = 'idle' | 'loading' | 'synced' | 'saving' | 'error';

interface UseSyncBoardsReturn {
  status: SyncStatus;
  userId: string | null;
  lastSyncAt: number | null;
  reload: () => Promise<void>;
  boardRoles: Record<string, string>;
}

function rowsToBoards(data: any[]): Board[] {
  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    columns: row.data?.columns ?? [],
    cards: row.data?.cards ?? {},
    labels: row.data?.labels ?? [],
    notificationSettings:
      row.data?.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS,
    templates: row.data?.templates ?? [],
    activity: row.data?.activity ?? [],
  }));
}

function boardToInsertRow(board: Board, userId: string) {
  return {
    id: board.id,
    user_id: userId,
    name: board.name,
    data: {
      columns: board.columns,
      cards: board.cards,
      labels: board.labels,
      notificationSettings:
        board.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS,
      templates: board.templates ?? [],
      activity: board.activity ?? [],
    },
  };
}

function boardToUpdateRow(board: Board) {
  return {
    id: board.id,
    name: board.name,
    data: {
      columns: board.columns,
      cards: board.cards,
      labels: board.labels,
      notificationSettings:
        board.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS,
      templates: board.templates ?? [],
      activity: board.activity ?? [],
    },
  };
}

/**
 * ★ NUEVO: elige el mejor board para activar.
 * Prioridad:
 *   1. Si el actual sigue existiendo → mantenerlo
 *   2. Si no, el que tiene MÁS MIEMBROS (compartidos primero)
 *   3. Si empatan, el primero
 */
function pickActiveBoard(
  cloudBoards: Board[],
  currentActiveId: string,
  boardRoles: Record<string, string>
): string {
  if (cloudBoards.length === 0) return '';

  // 1. Mantener el actual si sigue existiendo
  if (cloudBoards.some((b) => b.id === currentActiveId)) {
    return currentActiveId;
  }

  // 2. Contar miembros por board (usando roles como proxy)
  // Los boards compartidos tienen entrada en boardRoles con role !== 'owner'
  const shared = cloudBoards.filter((b) => {
    const role = boardRoles[b.id];
    return role && role !== 'owner';
  });

  if (shared.length > 0) return shared[0].id;

  // 3. Fallback: el primero
  return cloudBoards[0].id;
}

export function useSyncBoards(): UseSyncBoardsReturn {
  const boards = useBoard((s) => s.boards);
  const setBoards = useBoard((s) => s.setBoards);

  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [boardRoles, setBoardRoles] = useState<Record<string, string>>({});

  const hasLoadedRef = useRef(false);
  const isApplyingRemoteRef = useRef(false);
  const editableBoardIdsRef = useRef<Set<string>>(new Set());
  const lastLocalWriteRef = useRef<number>(0);
  const locallyCreatedIdsRef = useRef<Set<string>>(new Set());
  // ★ Ref para acceder a boardRoles desde callbacks sin stale closure
  const boardRolesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    boardRolesRef.current = boardRoles;
  }, [boardRoles]);

  // ============ 1. Escuchar auth ============
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const newId = session?.user?.id ?? null;
        setUserId(newId);
        if (!newId) {
          hasLoadedRef.current = false;
          editableBoardIdsRef.current = new Set();
          locallyCreatedIdsRef.current = new Set();
          setBoardRoles({});
          boardRolesRef.current = {};
          setStatus('idle');
        }
      }
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  // ============ 2. Carga inicial ============
  useEffect(() => {
    if (!userId || hasLoadedRef.current) return;

    const load = async () => {
      setStatus('loading');
      const supabase = createClient();

      // 1. Cargar memberships
      const { data: memberships } = await supabase
        .from('board_members')
        .select('board_id, role')
        .eq('user_id', userId);

      const editableIds = new Set<string>();
      const rolesMap: Record<string, string> = {};
      (memberships ?? []).forEach((m: any) => {
        rolesMap[m.board_id] = m.role;
        if (m.role === 'owner' || m.role === 'editor') {
          editableIds.add(m.board_id);
        }
      });
      editableBoardIdsRef.current = editableIds;
      setBoardRoles(rolesMap);
      boardRolesRef.current = rolesMap;

      // 2. Cargar boards del cloud
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error cargando tableros:', error);
        setStatus('error');
        return;
      }

      isApplyingRemoteRef.current = true;

      if (data.length === 0) {
        // Cloud vacío → crear tablero fresco
        const freshId = crypto.randomUUID();
        const { error: insErr } = await supabase
          .from('boards')
          .insert({
            id: freshId,
            user_id: userId,
            name: 'Mi tablero',
            data: {
              columns: [
                { id: crypto.randomUUID(), title: 'Por hacer', cardIds: [] },
                {
                  id: crypto.randomUUID(),
                  title: 'En progreso',
                  cardIds: [],
                  wipLimit: 3,
                },
                {
                  id: crypto.randomUUID(),
                  title: 'Hecho',
                  cardIds: [],
                  isDone: true,
                },
              ],
              cards: {},
              labels: [],
              notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
              templates: [],
              activity: [],
            },
          });

        if (insErr) {
          console.warn('Error creando tablero inicial:', insErr.message);
        }

        const { data: fresh } = await supabase
          .from('boards')
          .select('*')
          .order('created_at', { ascending: true });

        if (fresh && fresh.length > 0) {
          const cloudBoards = rowsToBoards(fresh);
          const currentActiveId = useBoard.getState().activeBoardId;
          const activeId = pickActiveBoard(
            cloudBoards,
            currentActiveId,
            rolesMap
          );
          setBoards(cloudBoards, activeId);
        }
      } else {
        const cloudBoards = rowsToBoards(data);
        const currentActiveId = useBoard.getState().activeBoardId;
        // ★ AQUÍ EL FIX: elegir el mejor board
        const activeId = pickActiveBoard(
          cloudBoards,
          currentActiveId,
          rolesMap
        );
        setBoards(cloudBoards, activeId);
      }

      hasLoadedRef.current = true;
      setLastSyncAt(Date.now());
      setStatus('synced');

      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 500);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ============ 3. Detectar boards creados por el usuario ============
  useEffect(() => {
    const unsubscribe = useBoard.subscribe((state, prevState) => {
      if (!hasLoadedRef.current) return;
      const prevIds = new Set(prevState.boards.map((b) => b.id));
      for (const b of state.boards) {
        if (!prevIds.has(b.id)) {
          locallyCreatedIdsRef.current.add(b.id);
        }
      }
    });
    return unsubscribe;
  }, []);

  // ============ 4. Guardar cambios ============
  useEffect(() => {
    if (!userId) return;
    if (!hasLoadedRef.current) return;
    if (isApplyingRemoteRef.current) return;

    const timeout = setTimeout(async () => {
      setStatus('saving');
      const supabase = createClient();

      const candidates = boards.filter(
        (b) =>
          editableBoardIdsRef.current.has(b.id) ||
          locallyCreatedIdsRef.current.has(b.id)
      );

      if (candidates.length === 0) {
        setStatus('synced');
        return;
      }

      const { data: existing } = await supabase
        .from('boards')
        .select('id')
        .in('id', candidates.map((b) => b.id));

      const existingIds = new Set((existing ?? []).map((r: any) => r.id));

      const toInsert = candidates
        .filter((b) => !existingIds.has(b.id))
        .map((b) => boardToInsertRow(b, userId));

      const toUpdate = candidates
        .filter((b) => existingIds.has(b.id))
        .map((b) => boardToUpdateRow(b));

      if (toInsert.length > 0) {
        const { error } = await supabase
          .from('boards')
          .upsert(toInsert, { onConflict: 'id', ignoreDuplicates: true });
        if (error) {
          console.warn('Error insertando tableros:', error.message);
        }
        for (const b of toInsert) locallyCreatedIdsRef.current.delete(b.id);
      }

      if (toUpdate.length > 0) {
        const { error } = await supabase
          .from('boards')
          .upsert(toUpdate, { onConflict: 'id' });
        if (error) {
          console.error('Error actualizando tableros:', error.message);
          setStatus('error');
          return;
        }
      }

      const { data: memberships } = await supabase
        .from('board_members')
        .select('board_id, role')
        .eq('user_id', userId);

      const editableIds = new Set<string>();
      const rolesMap: Record<string, string> = {};
      (memberships ?? []).forEach((m: any) => {
        rolesMap[m.board_id] = m.role;
        if (m.role === 'owner' || m.role === 'editor') {
          editableIds.add(m.board_id);
        }
      });
      editableBoardIdsRef.current = editableIds;
      setBoardRoles(rolesMap);
      boardRolesRef.current = rolesMap;

      lastLocalWriteRef.current = Date.now();
      setLastSyncAt(Date.now());
      setStatus('synced');
    }, 1500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards, userId]);

  // ============ 5. Realtime ============
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const reloadFromCloud = async () => {
      if (!hasLoadedRef.current) return;
      if (Date.now() - lastLocalWriteRef.current < 2000) return;

      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data) return;

      const { data: memberships } = await supabase
        .from('board_members')
        .select('board_id, role')
        .eq('user_id', userId);

      const editableIds = new Set<string>();
      const rolesMap: Record<string, string> = {};
      (memberships ?? []).forEach((m: any) => {
        rolesMap[m.board_id] = m.role;
        if (m.role === 'owner' || m.role === 'editor') {
          editableIds.add(m.board_id);
        }
      });
      editableBoardIdsRef.current = editableIds;
      setBoardRoles(rolesMap);
      boardRolesRef.current = rolesMap;

      isApplyingRemoteRef.current = true;

      const cloudBoards = rowsToBoards(data);
      if (cloudBoards.length > 0) {
        const currentActiveId = useBoard.getState().activeBoardId;
        const activeId = pickActiveBoard(
          cloudBoards,
          currentActiveId,
          rolesMap
        );
        setBoards(cloudBoards, activeId);
      }

      setLastSyncAt(Date.now());
      setStatus('synced');

      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 500);
    };

    const channel = supabase
      .channel(`boards-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boards',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          if (isApplyingRemoteRef.current) return;
          reloadFromCloud();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ============ 6. Reload manual ============
  const reload = useCallback(async () => {
    if (!userId) return;

    const supabase = createClient();

    const { data: memberships } = await supabase
      .from('board_members')
      .select('board_id, role')
      .eq('user_id', userId);

    const editableIds = new Set<string>();
    const rolesMap: Record<string, string> = {};
    (memberships ?? []).forEach((m: any) => {
      rolesMap[m.board_id] = m.role;
      if (m.role === 'owner' || m.role === 'editor') {
        editableIds.add(m.board_id);
      }
    });
    editableBoardIdsRef.current = editableIds;
    setBoardRoles(rolesMap);
    boardRolesRef.current = rolesMap;

    const { data } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: true });

    if (!data) return;

    isApplyingRemoteRef.current = true;
    const cloudBoards = rowsToBoards(data);
    if (cloudBoards.length > 0) {
      const currentActiveId = useBoard.getState().activeBoardId;
      const activeId = pickActiveBoard(
        cloudBoards,
        currentActiveId,
        rolesMap
      );
      setBoards(cloudBoards, activeId);
    }
    setLastSyncAt(Date.now());
    setStatus('synced');

    setTimeout(() => {
      isApplyingRemoteRef.current = false;
    }, 500);
  }, [userId, setBoards]);

  return { status, userId, lastSyncAt, reload, boardRoles };
}