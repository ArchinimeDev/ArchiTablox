'use client';

import { useMemo, useState } from 'react';
import type { Board } from '@/types';
import { sounds } from '@/lib/sounds';
import { COLUMN_COLORS } from '@/lib/labels';
import {
  getAverageLeadTime,
  getMedianLeadTime,
  getCurrentWip,
  getThroughput,
  getCfd,
  getCurrentDistribution,
  getCompletedCount,
  getCardsCreatedInRange,
  formatDuration,
  type TimeSeriesPoint,
  type CfdPoint,
} from '@/lib/metrics';

interface Props {
  board: Board | undefined;
}

const RANGES = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

export function MetricsView({ board }: Props) {
  const [rangeDays, setRangeDays] = useState(30);

  const leadTime = useMemo(
    () => (board ? getAverageLeadTime(board.cards) : null),
    [board]
  );
  const medianLead = useMemo(
    () => (board ? getMedianLeadTime(board.cards) : null),
    [board]
  );
  const wip = useMemo(
    () => (board ? getCurrentWip(board.cards) : 0),
    [board]
  );
  const throughput = useMemo(
    () => (board ? getThroughput(board.cards, rangeDays) : []),
    [board, rangeDays]
  );
  const cfd = useMemo(
    () =>
      board ? getCfd(board.cards, board.columns, board.activity, rangeDays) : [],
    [board, rangeDays]
  );
  const distribution = useMemo(
    () =>
      board ? getCurrentDistribution(board.cards, board.columns) : {},
    [board]
  );
  const completedCount = useMemo(
    () => (board ? getCompletedCount(board.cards) : 0),
    [board]
  );
  const createdInRange = useMemo(
    () => (board ? getCardsCreatedInRange(board.cards, rangeDays) : 0),
    [board, rangeDays]
  );

  if (!board) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm">
        No hay tablero activo.
      </div>
    );
  }

  const totalThroughput = throughput.reduce((s, p) => s + p.value, 0);
  const avgThroughput =
    rangeDays > 0 ? totalThroughput / (rangeDays / 7) : 0;
  const totalCards = Object.values(distribution).reduce((s, v) => s + v, 0);

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-4">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Métricas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Análisis de flujo del tablero · <b>{board.name}</b>
          </p>
        </div>

        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => {
                sounds.click();
                setRangeDays(r.value);
              }}
              className={`interactive px-3 h-7 rounded-md text-xs font-medium transition-colors ${
                rangeDays === r.value
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon="⏱"
          label="Lead Time promedio"
          value={leadTime ? formatDuration(leadTime) : '—'}
          hint={
            medianLead
              ? `Mediana: ${formatDuration(medianLead)}`
              : 'Sin datos aún'
          }
          accent
        />
        <KpiCard
          icon="📈"
          label="Throughput"
          value={avgThroughput.toFixed(1)}
          hint={`Tarjetas/semana · ${totalThroughput} en ${rangeDays}d`}
        />
        <KpiCard
          icon="🔄"
          label="WIP actual"
          value={String(wip)}
          hint="Tarjetas activas ahora"
        />
        <KpiCard
          icon="✅"
          label="Completadas"
          value={String(completedCount)}
          hint={`${createdInRange} creadas en ${rangeDays}d`}
        />
      </div>

      {/* THROUGHPUT CHART */}
      <ChartCard
        title="Throughput"
        subtitle={`Tarjetas completadas por día · últimos ${rangeDays} días`}
      >
        <ThroughputChart data={throughput} />
      </ChartCard>

      {/* CFD */}
      <ChartCard
        title="Diagrama de Flujo Acumulado (CFD)"
        subtitle={`Distribución de tarjetas por columna · últimos ${rangeDays} días`}
      >
        <CfdChart data={cfd} columns={board.columns} />
      </ChartCard>

      {/* DISTRIBUCIÓN ACTUAL */}
      <ChartCard
        title="Distribución actual"
        subtitle={`${totalCards} tarjeta${totalCards === 1 ? '' : 's'} activa${totalCards === 1 ? '' : 's'}`}
      >
        <DistributionChart
          columns={board.columns}
          counts={distribution}
          total={totalCards}
        />
      </ChartCard>
    </div>
  );
}

// ============================================================
// KPI CARD
// ============================================================

function KpiCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base leading-none">{icon}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          {label}
        </span>
      </div>
      <div
        className={`text-2xl font-bold font-mono tabular-nums leading-none ${
          accent ? 'text-amber-400' : 'text-slate-100'
        }`}
      >
        {value}
      </div>
      {hint && (
        <div className="text-[10px] text-slate-500 mt-1.5 leading-snug">
          {hint}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CHART CARD
// ============================================================

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {subtitle && (
          <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ============================================================
// THROUGHPUT CHART (SVG barras)
// ============================================================

function ThroughputChart({ data }: { data: TimeSeriesPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-slate-500">
        Sin datos
      </div>
    );
  }

  const width = 100;
  const height = 40;
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const barWidth = width / data.length;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-32"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((p) => (
          <line
            key={p}
            x1={0}
            x2={width}
            y1={height * p}
            y2={height * p}
            stroke="rgba(148, 163, 184, 0.08)"
            strokeWidth={0.1}
          />
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * (height - 2);
          return (
            <rect
              key={i}
              x={i * barWidth + barWidth * 0.1}
              y={height - barHeight}
              width={barWidth * 0.8}
              height={barHeight || 0.05}
              fill="url(#throughputGradient)"
              rx={0.2}
            >
              <title>
                {new Date(d.date).toLocaleDateString('es', {
                  day: '2-digit',
                  month: 'short',
                })}
                : {d.value} tarjeta{d.value === 1 ? '' : 's'}
              </title>
            </rect>
          );
        })}

        <defs>
          <linearGradient id="throughputGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5">
        <span>
          {new Date(data[0].date).toLocaleDateString('es', {
            day: '2-digit',
            month: 'short',
          })}
        </span>
        <span className="font-mono tabular-nums">
          máx: {maxValue} / día
        </span>
        <span>
          {new Date(data[data.length - 1].date).toLocaleDateString('es', {
            day: '2-digit',
            month: 'short',
          })}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// CFD CHART (área apilada)
// ============================================================

function CfdChart({
  data,
  columns,
}: {
  data: CfdPoint[];
  columns: Board['columns'];
}) {
  if (data.length === 0 || columns.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-slate-500">
        Sin datos suficientes
      </div>
    );
  }

  const width = 100;
  const height = 40;
  const xStep = data.length > 1 ? width / (data.length - 1) : width;

  // Total por día
  const totals = data.map((d) =>
    Object.values(d.counts).reduce((s, v) => s + v, 0)
  );
  const maxTotal = Math.max(1, ...totals);

  // Construir paths apilados de abajo hacia arriba
  const layers: { color: string; label: string; d: string }[] = [];
  const cumulativeBottom = new Array(data.length).fill(0);

  for (let ci = 0; ci < columns.length; ci++) {
    const col = columns[ci];
    const color = col.color ?? COLUMN_COLORS[ci % COLUMN_COLORS.length];

    const topPoints: string[] = [];
    const bottomPoints: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const x = i * xStep;
      const bottomVal = cumulativeBottom[i];
      const count = data[i].counts[col.id] ?? 0;
      const topVal = bottomVal + count;

      const yBottom = height - (bottomVal / maxTotal) * height;
      const yTop = height - (topVal / maxTotal) * height;

      topPoints.push(`${x.toFixed(2)},${yTop.toFixed(2)}`);
      bottomPoints.unshift(`${x.toFixed(2)},${yBottom.toFixed(2)}`);

      cumulativeBottom[i] = topVal;
    }

    layers.push({
      color,
      label: col.title,
      d: `M ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`,
    });
  }

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-40"
        preserveAspectRatio="none"
      >
        {layers.map((layer, i) => (
          <path
            key={i}
            d={layer.d}
            fill={layer.color}
            fillOpacity={0.55}
            stroke={layer.color}
            strokeWidth={0.2}
          >
            <title>{layer.label}</title>
          </path>
        ))}
      </svg>

      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5">
        <span>
          {new Date(data[0].date).toLocaleDateString('es', {
            day: '2-digit',
            month: 'short',
          })}
        </span>
        <span className="font-mono tabular-nums">máx: {maxTotal}</span>
        <span>
          {new Date(data[data.length - 1].date).toLocaleDateString('es', {
            day: '2-digit',
            month: 'short',
          })}
        </span>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mt-2.5">
        {layers.map((layer, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 text-[10px] text-slate-400"
          >
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: layer.color }}
            />
            <span className="truncate max-w-[120px]">{layer.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// DISTRIBUCIÓN
// ============================================================

function DistributionChart({
  columns,
  counts,
  total,
}: {
  columns: Board['columns'];
  counts: Record<string, number>;
  total: number;
}) {
  if (columns.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-500">
        Sin columnas
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {columns.map((col, i) => {
        const count = counts[col.id] ?? 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        const color = col.color ?? COLUMN_COLORS[i % COLUMN_COLORS.length];

        return (
          <div key={col.id}>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-300 truncate">{col.title}</span>
              </div>
              <span className="text-slate-500 font-mono tabular-nums shrink-0 ml-2">
                {count} · {pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}