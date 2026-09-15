'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function TestSupabase() {
  const [status, setStatus] = useState('Probando conexión...');

  useEffect(() => {
    const test = async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.getSession();
        if (error) {
          setStatus('❌ Error: ' + error.message);
        } else {
          setStatus('✅ ¡Conexión a Supabase exitosa!');
        }
      } catch (err: any) {
        setStatus('❌ Error: ' + err.message);
      }
    };
    test();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Kanban Quest</h1>
        <p className="text-slate-400">{status}</p>
      </div>
    </main>
  );
}