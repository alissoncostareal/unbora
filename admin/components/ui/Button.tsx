import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'coral' | 'danger' | 'outline' | 'ghost' | 'dark';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-[#1c1917] text-[#fff8f5] hover:bg-[#7c2f1d] active:scale-[0.98] shadow-xs',
  coral:
    'bg-[#9a4632] text-white hover:bg-[#7c2f1d] active:scale-[0.98] shadow-xs',
  dark:
    'bg-[#1c1917] text-white hover:bg-black active:scale-[0.98]',
  danger:
    'border border-red-200 bg-red-50/80 text-red-700 hover:bg-red-100 hover:border-red-300 active:scale-[0.98]',
  outline:
    'border border-[#e8e0d7] bg-white text-[#1c1917] hover:border-[#1c1917] hover:bg-[#faf8f5] active:scale-[0.98]',
  ghost:
    'text-[#55433e] hover:text-[#1c1917] hover:bg-[#f6f2ec]',
};

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#9a4632]/25 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
