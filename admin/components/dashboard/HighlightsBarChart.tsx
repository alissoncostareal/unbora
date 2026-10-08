'use client';

import { useState } from 'react';

export function HighlightsBarChart({
  cityData,
  tagData,
}: {
  cityData: { label: string; count: number }[];
  tagData: { label: string; count: number }[];
}) {
  const [view, setView] = useState<'city' | 'tag'>('city');
  const activeList = view === 'city' ? cityData : tagData;
  const items = activeList.length > 0 ? activeList : [{ label: 'Nenhum', count: 0 }];
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1c1917]">Distribuição de Destaques</h2>
          <p className="text-xs text-[#8a8178]">
            {view === 'city' ? 'Destaques por localidade' : 'Destaques por categoria'}
          </p>
        </div>
        <div className="inline-flex rounded-xl bg-[#f6f2ec] p-1 text-xs">
          <button
            type="button"
            onClick={() => setView('city')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              view === 'city' ? 'bg-white text-[#1c1917] shadow-2xs' : 'text-[#8a8178] hover:text-[#1c1917]'
            }`}
          >
            Por Cidade
          </button>
          <button
            type="button"
            onClick={() => setView('tag')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              view === 'tag' ? 'bg-white text-[#1c1917] shadow-2xs' : 'text-[#8a8178] hover:text-[#1c1917]'
            }`}
          >
            Por Tag
          </button>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 pt-2" style={{ height: 160 }}>
        {items.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold text-[#1c1917]">{item.count}</span>
            <div
              className="w-full rounded-t-lg bg-[#9a4632]/85 hover:bg-[#9a4632] transition-all"
              style={{
                height: `${(item.count / max) * 100}%`,
                minHeight: item.count > 0 ? 8 : 4,
              }}
            />
            <span className="truncate w-full text-center text-[11px] text-[#8a8178]" title={item.label}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
