'use client';

import { useState } from 'react';

import { PeriodToggle } from '@/components/ui/PeriodToggle';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function HighlightsBarChart({ values }: { values: number[] }) {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const max = Math.max(...values, 1);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-semibold text-heading">Destaques por dia</h2>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>
      <div className="flex items-end justify-between gap-3" style={{ height: 160 }}>
        {values.map((v, i) => (
          <div key={DAYS[i]} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="tabela-bar-stripe w-full rounded-t-lg transition-all"
              style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 8 : 0 }}
            />
            <span className="text-[11px] text-muted">{DAYS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
