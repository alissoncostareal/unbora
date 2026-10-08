import { cn } from '@/lib/cn';

export function DataTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[#e8e0d7] bg-[#fbf9f5]/80 text-left">{children}</tr>
    </thead>
  );
}

export function DataTableHeaderCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        'px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#746c64]',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function DataTableRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        'border-b border-[#f0e9e1] transition-colors hover:bg-[#faf8f5]',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function DataTableCell({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={cn('px-6 py-4 align-middle text-sm text-[#55433e]', className)} colSpan={colSpan}>
      {children}
    </td>
  );
}

export function DataTableEmpty({ children, colSpan }: { children: React.ReactNode; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-sm text-[#8a8178]">
        {children}
      </td>
    </tr>
  );
}

export function DataTableLoading({ children }: { children: React.ReactNode }) {
  return <p className="px-6 py-8 text-center text-sm text-[#8a8178]">{children}</p>;
}
