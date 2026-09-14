'use client';

type Period = 'weekly' | 'monthly';

export function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (v: Period) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-canvas p-1">
      <button
        type="button"
        onClick={() => onChange('weekly')}
        className={`tabela-pill ${value === 'weekly' ? 'tabela-pill--active' : 'tabela-pill--idle'}`}
      >
        Semanal
      </button>
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={`tabela-pill ${value === 'monthly' ? 'tabela-pill--active' : 'tabela-pill--idle'}`}
      >
        Mensal
      </button>
    </div>
  );
}
