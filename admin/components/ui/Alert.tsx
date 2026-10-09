import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type AlertVariant = 'error' | 'info' | 'warning' | 'success';

const variants: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50/80 text-red-800',
  info: 'border-[#ebd8d0] bg-[#faf2ee] text-[#7c2f1d]',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

export function Alert({
  children,
  variant = 'error',
  className,
}: {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-6 rounded-none border px-4 py-3.5 text-xs font-medium leading-relaxed shadow-2xs',
        variants[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
