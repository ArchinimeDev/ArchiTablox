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

// INSERT (incluye user_id, solo se usa para crear)
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

// UPDATE (NO incluye user_id: la fila conserva su dueño original)
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

// Genera un tablero fresco (para usuarios nuevos sin boards en cloud)
function makeFreshBoardData() {
  return {
    columns: [
      { id: crypto.randomUUID(), title: 'Por hacer', cardIds: [] },
      {
        id: crypto.randomUUID(),
        title: 'En progreso',
        cardIds: [],
        wipLimit: 3,
      },
      { id: crypto.randomUUID(), title: 'Hecho', cardIds: [], isDone: true },
    ],
    cards: {},
    labels: [],
    notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
    templates: [],
    activity: [],
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
  // IDs de tableros que el usuario creó DESPUÉS de la carga inicial.
  // Sirve para saber cuáles intentar insertar aunque no estén aún en memberships.
  const locallyCreatedIdsRef = useRef<Set<string>>(new Set());

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
          setStatus('idle');
        }
      }
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  // ============ 2. Carga inicial (FIX PRINCIPAL) ============
  useEffect(() => {
    if (!userId || hasLoadedRef.current) return;

    const load = async () => {
      setStatus('loading');
      const supabase = createClient();

      // 1. Cargar memberships del usuario
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
        // ★ Cloud vacío → crear UN tablero fresco server-side
        // (NO intentamos subir los locales huérfanos: pueden tener IDs
        //  que ya existen en cloud y pertenecen a otro usuario → 409)
        const freshId = crypto.randomUUID();
        const { error: insErr } = await supabase
          .from('boards')
          .insert({
            id: freshId,
            user_id: userId,
            name: 'Mi tablero',
            data: makeFreshBoardData(),
          });

        if (insErr) {
          console.warn('Error creando tablero inicial:', insErr.message);
        }

        // Refetch para traer el board recién creado (y confirmar el trigger de owner)
        const { data: fresh } = await supabase
          .from('boards')
          .select('*')
          .order('created_at', { ascending: true });

        if (fresh && fresh.length > 0) {
          const cloudBoards = rowsToBoards(fresh);
          setBoards(cloudBoards, cloudBoards[0].id);
        }
      } else {
        // ★ Cloud tiene boards → REEMPLAZAR todo lo local con cloud.
        // Esto descarta tableros huérfanos del localStorage
        // (los que se generaban con crypto.randomUUID sin haber estado en cloud).
        const cloudBoards = rowsToBoards(data);
        setBoards(cloudBoards, cloudBoards[0].id);
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

  // ============ 3. Guardar cambios ============
  useEffect(() => {
    if (!userId) return;
    if (!hasLoadedRef.current) return;
    if (isApplyingRemoteRef.current) return;

    const timeout = setTimeout(async () => {
      setStatus('saving');
      const supabase = createClient();

      // Filtrar:
      // - boards editables (owner/editor según memberships)
      // - O boards creados localmente en esta sesión (recién insertados)
      const candidates = boards.filter(
        (b) =>
          editableBoardIdsRef.current.has(b.id) ||
          locallyCreatedIdsRef.current.has(b.id)
      );

      if (candidates.length === 0) {
        setStatus('synced');
        return;
      }

      // ¿Cuáles ya existen en cloud?
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
        // ★ upsert con ignoreDuplicates: si el id existe con otro dueño,
        // no rompe con 409, simplemente lo ignora.
        const { error } = await supabase
          .from('boards')
          .upsert(toInsert, { onConflict: 'id', ignoreDuplicates: true });
        if (error) {
          console.warn('Error insertando tableros:', error.message);
        } else {
          for (const b of toInsert) locallyCreatedIdsRef.current.delete(b.id);
        }
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

      // Refetch memberships (por si el trigger de owner agregó filas nuevas)
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

      lastLocalWriteRef.current = Date.now();
      setLastSyncAt(Date.now());
      setStatus('synced');
    }, 1500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards, userId]);

  // ============ 3.b Detectar boards creados localmente ============
  // Se suscribe al store para saber cuándo aparece un board nuevo.
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

  // ============ 4. Realtime ============
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