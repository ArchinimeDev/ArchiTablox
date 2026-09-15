'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

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

function getColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface Props {
  boardId: string;
  onOpenShare?: () => void;
}

export function MembersAvatars({ boardId, onOpenShare }: Props) {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .rpc('get_board_members', { p_board_id: boardId })
      .then(({ data }) => {
        if (data) setMembers(data as Member[]);
      });
  }, [boardId]);

  if (members.length === 0) return null;

  const maxVisible = 3;
  const visible = members.slice(0, maxVisible);
  const extra = members.length - maxVisible;

  return (
    <button
      onClick={onOpenShare}
      className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 h-9 transition-colors group shrink-0"
      title={`${members.length} miembro${members.length === 1 ? '' : 's'} · Click para gestionar`}
    >
      <div className="flex -space-x-1.5">
        {visible.map((m) => (
          <div
            key={m.user_id}
            className={`w-5 h-5 rounded-full ${getColor(m.email)} flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-slate-900 group-hover:ring-slate-800 transition-colors`}
            title={m.email}
          >
            {m.email.charAt(0).toUpperCase()}
          </div>
        ))}
        {extra > 0 && (
          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300 ring-2 ring-slate-900 group-hover:ring-slate-800 transition-colors">
            +{extra}
          </div>
        )}
      </div>
      {members.length > 1 && (
        <span className="text-[10px] text-slate-500 font-medium">
          {members.length}
        </span>
      )}
    </button>
  );
}