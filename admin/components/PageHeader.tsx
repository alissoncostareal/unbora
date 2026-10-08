import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {title ? (
          <h2 className="text-xl font-semibold tracking-tight text-[#1c1917] sm:text-2xl">{title}</h2>
        ) : null}
        <p className="mt-1 text-sm text-[#746c64] max-w-2xl leading-relaxed">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
