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
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<ExportFile | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open && !isMobile) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
  }, [open, isMobile]);

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
      `architablox-backup-${timestamp()}.json`
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
      `architablox-${active.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp()}.json`
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

  // Contenido reutilizable de las 3 opciones
  const OptionsContent = ({ compact }: { compact: boolean }) => (
    <>
      <button
        onClick={exportAll}
        className={`w-full text-left rounded-lg transition-colors flex items-center gap-3 ${
          compact
            ? 'px-2.5 py-2 hover:bg-slate-800'
            : 'p-3 bg-slate-950/60 border border-slate-800 hover:bg-slate-950 hover:border-slate-700'
        }`}
      >
        <div
          className={`shrink-0 flex items-center justify-center ${
            compact
              ? 'w-8 h-8 rounded-lg bg-slate-800/80'
              : 'w-10 h-10 rounded-lg bg-amber-500/15'
          }`}
        >
          <svg
            width={compact ? 14 : 16}
            height={compact ? 14 : 16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={compact ? 'text-slate-400' : 'text-amber-400'}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`font-medium ${compact ? 'text-sm text-slate-200' : 'text-sm text-slate-100'}`}
          >
            Exportar todo
          </div>
          <div
            className={`${compact ? 'text-[10px] text-slate-500' : 'text-xs text-slate-400'} mt-0.5`}
          >
            Todos los tableros en un archivo JSON
          </div>
        </div>
      </button>

      <button
        onClick={exportActive}
        className={`w-full text-left rounded-lg transition-colors flex items-center gap-3 ${
          compact
            ? 'px-2.5 py-2 hover:bg-slate-800'
            : 'p-3 bg-slate-950/60 border border-slate-800 hover:bg-slate-950 hover:border-slate-700'
        }`}
      >
        <div
          className={`shrink-0 flex items-center justify-center ${
            compact
              ? 'w-8 h-8 rounded-lg bg-slate-800/80'
              : 'w-10 h-10 rounded-lg bg-amber-500/15'
          }`}
        >
          <svg
            width={compact ? 14 : 16}
            height={compact ? 14 : 16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={compact ? 'text-slate-400' : 'text-amber-400'}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`font-medium ${compact ? 'text-sm text-slate-200' : 'text-sm text-slate-100'}`}
          >
            Exportar tablero actual
          </div>
          <div
            className={`${compact ? 'text-[10px] text-slate-500' : 'text-xs text-slate-400'} mt-0.5`}
          >
            Solo el tablero activo
          </div>
        </div>
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className={`w-full text-left rounded-lg transition-colors flex items-center gap-3 ${
          compact
            ? 'px-2.5 py-2 hover:bg-slate-800'
            : 'p-3 bg-slate-950/60 border border-slate-800 hover:bg-slate-950 hover:border-slate-700'
        }`}
      >
        <div
          className={`shrink-0 flex items-center justify-center ${
            compact
              ? 'w-8 h-8 rounded-lg bg-slate-800/80'
              : 'w-10 h-10 rounded-lg bg-blue-500/15'
          }`}
        >
          <svg
            width={compact ? 14 : 16}
            height={compact ? 14 : 16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={compact ? 'text-slate-400' : 'text-blue-400'}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`font-medium ${compact ? 'text-sm text-slate-200' : 'text-sm text-slate-100'}`}
          >
            Importar desde JSON
          </div>
          <div
            className={`${compact ? 'text-[10px] text-slate-500' : 'text-xs text-slate-400'} mt-0.5`}
          >
            Cargar desde un archivo
          </div>
        </div>
      </button>
    </>
  );

  return (
    <>
      <div ref={ref} className="relative shrink-0">
        <button
          onClick={() => setOpen((o) => !o)}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg p-2 h-9 w-9 sm:w-auto sm:px-2.5 flex items-center justify-center gap-1.5 transition-colors shrink-0"
          title="Datos"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="hidden sm:inline text-xs text-slate-400">
            Datos
          </span>
        </button>

        {/* Dropdown (solo desktop) */}
        {open && !isMobile && (
          <div className="absolute right-0 mt-1.5 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden p-1.5">
            <OptionsContent compact />
          </div>
        )}
      </div>

      {/* Modal móvil (centrado, grande) */}
      {open && isMobile && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-400"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-100">
                    Datos
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Exportar / Importar
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-slate-200 p-1.5 rounded transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3 space-y-2">
              <OptionsContent compact={false} />
            </div>
          </div>
        </div>
      )}

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Modal de confirmación de import */}
      {showImportModal && pendingImport && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4"
          onClick={() => {
            setShowImportModal(false);
            setPendingImport(null);
          }}
        >
          <div
            className="bg-slate-900 border-slate-700 sm:border sm:rounded-2xl rounded-none w-full max-w-md sm:my-8 p-5 sm:p-6 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-3">Importar datos</h2>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-5 text-sm">
              <p className="text-slate-300 mb-2">
                <b>{pendingImport.boards.length}</b>{' '}
                {pendingImport.boards.length === 1 ? 'tablero' : 'tableros'}:
              </p>
              <ul className="space-y-1">
                {pendingImport.boards.map((b, i) => (
                  <li key={i} className="text-xs text-slate-400 flex gap-2">
                    <span className="text-slate-600">•</span>
                    <span className="truncate">{b.name}</span>
                    <span className="text-slate-600 shrink-0">
                      ({Object.keys(b.cards).length} tarjetas)
                    </span>
                  </li>
                ))}
              </ul>
              {pendingImport.exportedAt && (
                <p className="text-[10px] text-slate-600 mt-3 pt-2 border-t border-slate-800">
                  Exportado:{' '}
                  {new Date(pendingImport.exportedAt).toLocaleString('es')}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-3">
              ¿Cómo quieres importar?
            </p>

            <div className="space-y-2 mb-5">
              <button
                onClick={() => confirmImport('merge')}
                className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition border border-slate-700"
              >
                <div className="font-semibold text-sm">
                  ➕ Añadir a mis tableros
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Conserva lo que ya tienes y añade los nuevos
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
                className="w-full text-left p-3 rounded-lg bg-red-950/40 hover:bg-red-950/60 transition border border-red-900/60"
              >
                <div className="font-semibold text-sm text-red-300">
                  ⚠️ Reemplazar todo
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
              className="w-full py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}