'use client';

import { useState } from 'react';

import { PeriodToggle } from '@/components/ui/PeriodToggle';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const VALUES = [42, 58, 45, 72, 65, 80, 55];

export function UsersAreaChart() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const max = Math.max(...VALUES);
  const width = 400;
  const height = 160;
  const padX = 8;
  const padY = 16;

  const points = VALUES.map((v, i) => {
    const x = padX + (i / (VALUES.length - 1)) * (width - padX * 2);
    const y = height - padY - (v / max) * (height - padY * 2);
    return { x, y, v };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-heading">Usuários ativos</h2>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>
      <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full" aria-hidden>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#a78bfa" strokeWidth="2" />
        ))}
        {DAYS.map((day, i) => (
          <text
            key={day}
            x={points[i].x}
            y={height + 18}
            textAnchor="middle"
            className="fill-muted text-[10px]"
          >
            {day}
          </text>
        ))}
      </svg>
    </div>
  );
}
