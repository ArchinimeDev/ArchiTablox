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

// ★ INSERT (incluye user_id, solo se usa para crear)
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

// ★ UPDATE (NO incluye user_id: la fila conserva su dueño original)
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
          setBoardRoles({});
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

      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error cargando tableros:', error);
        setStatus('error');
        return;
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

      isApplyingRemoteRef.current = true;

      if (data.length === 0) {
        if (boards.length > 0) {
          const rows = boards.map((b) => boardToInsertRow(b, userId));
          const { error: insErr } = await supabase
            .from('boards')
            .insert(rows);
          if (insErr) {
            console.error('Error subiendo tableros locales:', insErr);
            setStatus('error');
          } else {
            setLastSyncAt(Date.now());
            setStatus('synced');
          }
        } else {
          setStatus('synced');
        }
      } else {
        const cloudBoards = rowsToBoards(data);
        setBoards(cloudBoards, cloudBoards[0].id);
        setLastSyncAt(Date.now());
        setStatus('synced');
      }

      hasLoadedRef.current = true;

      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 300);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ============ 3. Guardar cambios ============
  useEffect(() => {
    if (!userId) return;
    if (!hasLoadedRef.current) return;
    if (isApplyingRemoteRef.current) return;

    const timeout = setTimeout(async () => {
      setStatus('saving');
      const supabase = createClient();

      const editable = boards.filter((b) =>
        editableBoardIdsRef.current.has(b.id)
      );

      if (editable.length === 0) {
        setStatus('synced');
        return;
      }

      // ★ Separar inserts de updates para no tocar user_id en updates
      const { data: existing } = await supabase
        .from('boards')
        .select('id')
        .in('id', editable.map((b) => b.id));

      const existingIds = new Set((existing ?? []).map((r: any) => r.id));

      const toInsert = editable
        .filter((b) => !existingIds.has(b.id))
        .map((b) => boardToInsertRow(b, userId));

      const toUpdate = editable
        .filter((b) => existingIds.has(b.id))
        .map((b) => boardToUpdateRow(b));

      if (toInsert.length > 0) {
        const { error } = await supabase.from('boards').insert(toInsert);
        if (error) {
          console.error('Error insertando tableros:', error);
          setStatus('error');
          return;
        }
      }

      if (toUpdate.length > 0) {
        const { error } = await supabase
          .from('boards')
          .upsert(toUpdate, { onConflict: 'id' });
        if (error) {
          console.error('Error actualizando tableros:', error);
          setStatus('error');
          return;
        }
      }

      lastLocalWriteRef.current = Date.now();
      setLastSyncAt(Date.now());
      setStatus('synced');
    }, 1500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards, userId]);

  // ============ 4. Realtime ============
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const reloadFromCloud = async () => {
      if (!hasLoadedRef.current) return;

      // ★ Ignorar ecos de nuestra propia escritura reciente
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

      isApplyingRemoteRef.current = true;

      const cloudBoards = rowsToBoards(data);
      if (cloudBoards.length > 0) {
        const currentActiveId = useBoard.getState().activeBoardId;
        const activeExists = cloudBoards.some((b) => b.id === currentActiveId);
        setBoards(
          cloudBoards,
          activeExists ? currentActiveId : cloudBoards[0].id
        );
      }

      setLastSyncAt(Date.now());
      setStatus('synced');

      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 500);
    };

    // ★ Filtro por user_id para no escuchar toda la tabla
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

  // ============ 5. Reload manual ============
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

    const { data } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: true });

    if (!data) return;

    isApplyingRemoteRef.current = true;
    const cloudBoards = rowsToBoards(data);
    if (cloudBoards.length > 0) {
      const currentActiveId = useBoard.getState().activeBoardId;
      const activeExists = cloudBoards.some((b) => b.id === currentActiveId);
      setBoards(
        cloudBoards,
        activeExists ? currentActiveId : cloudBoards[0].id
      );
    }
    setLastSyncAt(Date.now());
    setStatus('synced');

    setTimeout(() => {
      isApplyingRemoteRef.current = false;
    }, 500);
  }, [userId, setBoards]);

  return { status, userId, lastSyncAt, reload, boardRoles };
}