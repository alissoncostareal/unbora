import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export const inputClassName =
  'w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-heading placeholder:text-muted/60 outline-none transition focus:border-heading focus:ring-4 focus:ring-black/5';

export const textareaClassName =
  'w-full resize-y rounded-xl border border-border bg-surface px-4 py-2.5 text-heading placeholder:text-muted/60 outline-none transition focus:border-heading focus:ring-4 focus:ring-black/5';

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('grid gap-2', className)}>
      <span className="text-sm font-semibold text-heading">{label}</span>
      {children}
    </label>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded accent-accent"
      />
      {label}
    </label>
  );
}
