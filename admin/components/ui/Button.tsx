import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'danger' | 'outline' | 'dark';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-sidebar hover:bg-accent-dark disabled:opacity-60',
  dark: 'bg-sidebar text-white hover:bg-sidebar-dark disabled:opacity-60',
  danger: 'border border-danger/30 bg-danger-light text-danger hover:bg-danger/10',
  outline: 'border border-border bg-surface text-muted hover:border-heading hover:text-heading',
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
        'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30 disabled:cursor-wait',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
