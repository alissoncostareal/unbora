import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export const inputClassName =
  'w-full rounded-xl border border-[#e8e0d7] bg-white px-3.5 py-2.5 text-[14px] text-[#1c1917] placeholder:text-[#a89f91] outline-none transition focus:border-[#9a4632] focus:ring-4 focus:ring-[#9a4632]/10 disabled:bg-[#fbf9f5] disabled:text-[#8a8178]';

export const textareaClassName =
  'w-full resize-y rounded-xl border border-[#e8e0d7] bg-white px-3.5 py-2.5 text-[14px] text-[#1c1917] placeholder:text-[#a89f91] outline-none transition focus:border-[#9a4632] focus:ring-4 focus:ring-[#9a4632]/10 disabled:bg-[#fbf9f5] disabled:text-[#8a8178]';

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('grid gap-1.5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[#55433e]">{label}</span>
        {hint ? <span className="text-[11px] text-[#8a8178]">{hint}</span> : null}
      </div>
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
    <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] font-medium text-[#55433e] select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded accent-[#9a4632] border-[#e8e0d7] focus:ring-[#9a4632]/20"
      />
      {label}
    </label>
  );
}
