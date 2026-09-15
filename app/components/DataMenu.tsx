'use client';

import { useRef, useState, useEffect } from 'react';
import type { Board } from '@/types';

interface Props {
  boards: Board[];
  activeBoardId: string;
  onImport: (
    data: { boards: Board[] },
    mode: 'replace' | 'merge'
  ) => void;
}

interface ExportFile {
  version: number;
  exportedAt: string;
  boards: Board[];
}

export function DataMenu({ boards, activeBoardId, onImport }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<ExportFile | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
  }, [open]);

  const downloadJson = (data: ExportFile, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const timestamp = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
      d.getHours()
    )}-${pad(d.getMinutes())}`;
  };

  const exportAll = () => {
    downloadJson(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        boards,
      },
      `kanban-backup-${timestamp()}.json`
    );
    setOpen(false);
  };

  const exportActive = () => {
    const active = boards.find((b) => b.id === activeBoardId);
    if (!active) return;
    downloadJson(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        boards: [active],
      },
      `kanban-${active.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp()}.json`
    );
    setOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as ExportFile;
        if (!parsed.boards || !Array.isArray(parsed.boards)) {
          alert('El archivo no tiene el formato correcto.');
          return;
        }
        setPendingImport(parsed);
        setShowImportModal(true);
      } catch {
        alert('El archivo no es un JSON válido.');
      }
    };
    reader.readAsText(file);

    e.target.value = '';
    setOpen(false);
  };

  const confirmImport = (mode: 'replace' | 'merge') => {
    if (pendingImport) {
      onImport({ boards: pendingImport.boards }, mode);
    }
    setPendingImport(null);
    setShowImportModal(false);
  };

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg p-1.5 transition-colors"
          title="Datos"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-1.5 w-[calc(100vw-1.5rem)] max-w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden p-1">
            <button
              onClick={exportAll}
              className="w-full text-left px-2.5 py-2 text-sm rounded-md hover:bg-slate-800 transition-colors"
            >
              <div className="font-medium text-slate-200">Exportar todo</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Todos los tableros en un archivo JSON
              </div>
            </button>
            <button
              onClick={exportActive}
              className="w-full text-left px-2.5 py-2 text-sm rounded-md hover:bg-slate-800 transition-colors"
            >
              <div className="font-medium text-slate-200">
                Exportar tablero actual
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Solo el tablero activo
              </div>
            </button>
            <div className="border-t border-slate-800 my-1" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-left px-2.5 py-2 text-sm rounded-md hover:bg-slate-800 transition-colors"
            >
              <div className="font-medium text-slate-200">
                Importar desde JSON
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Cargar desde un archivo
              </div>
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {showImportModal && pendingImport && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4"
          onClick={() => {
            setShowImportModal(false);
            setPendingImport(null);
          }}
        >
          <div
            className="bg-slate-900 sm:border border-slate-800 sm:rounded-xl rounded-none w-full max-w-md sm:my-8 p-5 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold mb-4 text-slate-100">
              Importar datos
            </h2>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-4 text-sm">
              <p className="text-slate-300 mb-2 text-xs">
                <span className="font-semibold">{pendingImport.boards.length}</span>{' '}
                {pendingImport.boards.length === 1 ? 'tablero' : 'tableros'}:
              </p>
              <ul className="space-y-1">
                {pendingImport.boards.map((b, i) => (
                  <li
                    key={i}
                    className="text-xs text-slate-400 flex gap-2 items-center"
                  >
                    <span className="text-slate-600">•</span>
                    <span className="truncate flex-1">{b.name}</span>
                    <span className="text-slate-600 shrink-0 text-[10px]">
                      {Object.keys(b.cards).length} tarjetas
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 mb-4">
              <button
                onClick={() => confirmImport('merge')}
                className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors border border-slate-700"
              >
                <div className="font-medium text-sm text-slate-100">
                  Añadir a mis tableros
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Conserva lo que tienes y añade lo nuevo
                </div>
              </button>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      '¿Reemplazar TODOS tus tableros actuales? Se perderán los que tienes ahora.'
                    )
                  )
                    confirmImport('replace');
                }}
                className="w-full text-left p-3 rounded-lg bg-red-500/10 hover:bg-red-500/15 transition-colors border border-red-500/30"
              >
                <div className="font-medium text-sm text-red-400">
                  Reemplazar todo
                </div>
                <div className="text-xs text-red-400/80 mt-0.5">
                  Borra tus tableros actuales y deja solo los importados
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                setShowImportModal(false);
                setPendingImport(null);
              }}
              className="w-full py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors text-slate-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}