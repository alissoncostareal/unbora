'use client';

import { useState } from 'react';

export function UsersAreaChart({
  dailyActive,
  dailyRegistered,
  dayLabels,
}: {
  dailyActive?: number[];
  dailyRegistered?: number[];
  dayLabels?: string[];
}) {
  const [metric, setMetric] = useState<'active' | 'registered'>('active');

  const defaultDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const labels = dayLabels && dayLabels.length === 7 ? dayLabels : defaultDays;
  const activeSeries = dailyActive && dailyActive.length === 7 ? dailyActive : [0, 0, 0, 0, 0, 0, 0];
  const registeredSeries = dailyRegistered && dailyRegistered.length === 7 ? dailyRegistered : [0, 0, 0, 0, 0, 0, 0];

  const currentValues = metric === 'active' ? activeSeries : registeredSeries;
  const max = Math.max(...currentValues, 1);
  const width = 400;
  const height = 150;
  const padX = 18;
  const padY = 16;

  const points = currentValues.map((v, i) => {
    const x = padX + (i / Math.max(currentValues.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - (v / max) * (height - padY * 2);
    return { x, y, v };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z` : '';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1c1917]">
            {metric === 'active' ? 'Atividade Recente' : 'Novos Cadastros'}
          </h2>
          <p className="text-xs text-[#8a8178]">Últimos 7 dias (tempo real)</p>
        </div>
        <div className="inline-flex rounded-none bg-[#f6f2ec] p-0.5 text-xs border border-[#e8e0d7]">
          <button
            type="button"
            onClick={() => setMetric('active')}
            className={`rounded-none px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all ${
              metric === 'active' ? 'bg-white text-[#1c1917] shadow-2xs' : 'text-[#8a8178] hover:text-[#1c1917]'
            }`}
          >
            Ativos
          </button>
          <button
            type="button"
            onClick={() => setMetric('registered')}
            className={`rounded-none px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all ${
              metric === 'registered' ? 'bg-white text-[#1c1917] shadow-2xs' : 'text-[#8a8178] hover:text-[#1c1917]'
            }`}
          >
            Cadastros
          </button>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full" aria-hidden>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9a4632" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#9a4632" stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaPath ? <path d={areaPath} fill="url(#areaGrad)" /> : null}
        {linePath ? (
          <path d={linePath} fill="none" stroke="#9a4632" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#9a4632" strokeWidth="2" />
            {p.v > 0 ? (
              <text x={p.x} y={Math.max(p.y - 8, 12)} textAnchor="middle" className="fill-[#1c1917] text-[10px] font-semibold">
                {p.v}
              </text>
            ) : null}
          </g>
        ))}
        {labels.map((day, i) => (
          <text
            key={day + i}
            x={points[i]?.x ?? padX}
            y={height + 18}
            textAnchor="middle"
            className="fill-[#8a8178] text-[11px] font-medium"
          >
            {day}
          </text>
        ))}
      </svg>
    </div>
  );
}
